# Валидация Price Feed: Зачем и Как

## Что такое Price Feed?

Price Feed (источник цены) — это оракул (например, Chainlink), который предоставляет актуальные цены криптовалют. В вашем контракте используется для расчета, сколько токенов дать за BNB, ETH, BTC, SOL.

## Текущая реализация

```solidity
function _tokensFromPayment(
    uint256 amount,
    AggregatorV3Interface feed,
    uint8 paymentDecimals,
    address buyer
) internal view returns (uint256) {
    require(address(feed) != address(0), "Feed not set");
    
    // ❌ ПРОБЛЕМА: Нет валидации данных!
    (, int256 answer,,,) = feed.latestRoundData();
    
    // Используем answer напрямую без проверок
    uint256 priceInUSD = uint256(answer);
    // ... расчет токенов
}
```

## Проблемы без валидации

### 1. ⚠️ **Stale Data (Устаревшие данные)**

**Что это?**
- Price feed может не обновляться долгое время
- Оракул может быть сломан или недоступен
- Цена может быть устаревшей на несколько часов/дней

**Пример атаки:**
```
Текущая цена BNB: $400
Последнее обновление feed: 2 дня назад (цена была $300)
Покупатель платит $300 за токены, но должен платить $400
→ Покупатель получает больше токенов, чем должен!
```

**Код:**
```solidity
// ❌ БЕЗ ВАЛИДАЦИИ
(, int256 answer, , uint256 updatedAt, ) = feed.latestRoundData();
// updatedAt = 2 дня назад, но мы не проверяем!

// Покупатель получает токены по старой цене
```

### 2. ⚠️ **Negative Values (Отрицательные значения)**

**Что это?**
- Иногда price feed может вернуть отрицательное значение
- Это может быть ошибка оракула или специальное значение
- При конвертации `int256` → `uint256` отрицательное число станет огромным!

**Пример:**
```solidity
int256 answer = -1; // Ошибка оракула
uint256 priceInUSD = uint256(answer); // = 2^256 - 1 (огромное число!)

// Расчет токенов:
uint256 tokenAmount = (paymentAmount * 1e18) / priceInUSD;
// priceInUSD огромное → tokenAmount = 0 или очень маленькое
// → Покупатель получает почти бесплатные токены!
```

### 3. ⚠️ **Zero Values (Нулевые значения)**

**Что это?**
- Price feed может вернуть 0 (ошибка или инициализация)
- Деление на 0 вызовет revert, но лучше проверить заранее

**Пример:**
```solidity
int256 answer = 0; // Ошибка оракула
uint256 priceInUSD = uint256(answer); // = 0

// Расчет:
uint256 tokenAmount = (paymentAmount * 1e18) / priceInUSD;
// ❌ Division by zero → revert
```

### 4. ⚠️ **Round ID Mismatch (Несоответствие Round ID)**

**Что это?**
- Chainlink возвращает `roundId` и `answeredInRound`
- Они должны совпадать, иначе данные могут быть неполными

**Пример:**
```solidity
(uint80 roundId, int256 answer, , , uint80 answeredInRound) = feed.latestRoundData();

// Если roundId != answeredInRound, данные могут быть некорректными
```

## Решение: Добавить валидацию

```solidity
function _tokensFromPayment(
    uint256 amount,
    AggregatorV3Interface feed,
    uint8 paymentDecimals,
    address buyer
) internal view returns (uint256) {
    require(address(feed) != address(0), "Feed not set");
    
    // ✅ Получаем все данные
    (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) = feed.latestRoundData();
    
    // ✅ ВАЛИДАЦИЯ 1: Проверка на отрицательные значения
    require(answer > 0, "Invalid price: negative or zero");
    
    // ✅ ВАЛИДАЦИЯ 2: Проверка на устаревшие данные (stale)
    // Максимум 1 час (3600 секунд) с последнего обновления
    require(
        block.timestamp - updatedAt <= 3600,
        "Price feed stale"
    );
    
    // ✅ ВАЛИДАЦИЯ 3: Проверка roundId (данные должны быть полными)
    require(answeredInRound >= roundId, "Incomplete round");
    
    // ✅ ВАЛИДАЦИЯ 4: Проверка на разумность цены
    // Например, BNB не должен стоить меньше $1 или больше $10,000
    uint256 priceInUSD = uint256(answer);
    require(priceInUSD >= 1e8, "Price too low"); // Минимум $1 (8 decimals)
    require(priceInUSD <= 10000e8, "Price too high"); // Максимум $10,000
    
    // Теперь безопасно использовать priceInUSD
    // ... остальной расчет
}
```

## Детальное объяснение валидаций

### 1. `answer > 0`
```solidity
require(answer > 0, "Invalid price: negative or zero");
```
**Зачем:** Защита от отрицательных и нулевых значений

### 2. `block.timestamp - updatedAt <= 3600`
```solidity
require(block.timestamp - updatedAt <= 3600, "Price feed stale");
```
**Зачем:** Гарантия, что цена обновлялась не более часа назад

**Почему 1 час?**
- Chainlink обновляет цены каждые несколько минут
- 1 час — разумный запас на случай временных проблем
- Можно настроить под ваши нужды (например, 15 минут для более строгой проверки)

### 3. `answeredInRound >= roundId`
```solidity
require(answeredInRound >= roundId, "Incomplete round");
```
**Зачем:** Убедиться, что данные полные и корректные

### 4. Price bounds (границы цены)
```solidity
require(priceInUSD >= 1e8, "Price too low");
require(priceInUSD <= 10000e8, "Price too high");
```
**Зачем:** Защита от явно некорректных цен (например, BNB за $0.01 или $1,000,000)

**Как выбрать границы?**
- Минимум: разумная нижняя граница (например, $1 для BNB)
- Максимум: разумная верхняя граница (например, $10,000 для BNB)
- Настраивается под каждую валюту

## Полный пример исправленной функции

```solidity
function _tokensFromPayment(
    uint256 amount,
    AggregatorV3Interface feed,
    uint8 paymentDecimals,
    address buyer
) internal view returns (uint256) {
    require(address(feed) != address(0), "Feed not set");
    
    // Получаем данные из price feed
    (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) = feed.latestRoundData();
    
    // ✅ ВАЛИДАЦИЯ: Отрицательные или нулевые значения
    require(answer > 0, "Invalid price: negative or zero");
    
    // ✅ ВАЛИДАЦИЯ: Устаревшие данные (stale)
    require(
        updatedAt > 0 && block.timestamp - updatedAt <= 3600,
        "Price feed stale"
    );
    
    // ✅ ВАЛИДАЦИЯ: Полнота данных
    require(answeredInRound >= roundId, "Incomplete round");
    
    // Конвертируем в uint256
    uint256 priceInUSD = uint256(answer);
    
    // ✅ ВАЛИДАЦИЯ: Разумность цены (опционально, зависит от валюты)
    // Для BNB: минимум $1, максимум $10,000
    require(priceInUSD >= 1e8 && priceInUSD <= 10000e8, "Price out of bounds");
    
    // Теперь безопасно используем priceInUSD для расчетов
    uint256 price = getCurrentPrice(buyer);
    
    // Конвертируем payment amount в USD
    uint256 paymentInSmallestUnit = amount * 10**paymentDecimals;
    uint256 paymentInUSD = (paymentInSmallestUnit * priceInUSD) / 10**paymentDecimals;
    
    // Рассчитываем количество токенов
    uint256 tokenAmount = (paymentInUSD * 1e18) / price;
    
    return tokenAmount;
}
```

## Настройка для разных валют

Можно сделать разные границы для разных валют:

```solidity
function _validatePriceBounds(uint256 priceInUSD, address feed) internal view {
    // BNB: $1 - $10,000
    if (feed == bnbPriceFeed) {
        require(priceInUSD >= 1e8 && priceInUSD <= 10000e8, "BNB price out of bounds");
    }
    // ETH: $100 - $10,000
    else if (feed == ethPriceFeed) {
        require(priceInUSD >= 100e8 && priceInUSD <= 10000e8, "ETH price out of bounds");
    }
    // BTC: $1,000 - $200,000
    else if (feed == btcPriceFeed) {
        require(priceInUSD >= 1000e8 && priceInUSD <= 200000e8, "BTC price out of bounds");
    }
    // SOL: $1 - $1,000
    else if (feed == solPriceFeed) {
        require(priceInUSD >= 1e8 && priceInUSD <= 1000e8, "SOL price out of bounds");
    }
}
```

## Что произойдет без валидации?

### Сценарий 1: Stale Data
```
1. BNB стоит $400
2. Price feed не обновлялся 2 дня (последняя цена: $300)
3. Покупатель платит 1 BNB
4. Контракт считает по старой цене $300
5. Покупатель получает токены на $300 вместо $400
6. ✅ Покупатель в выигрыше (получил больше токенов)
7. ❌ Проект теряет деньги
```

### Сценарий 2: Negative Value
```
1. Price feed возвращает -1 (ошибка)
2. Конвертация: uint256(-1) = 2^256 - 1 (огромное число)
3. Расчет: tokenAmount = payment / огромное_число = почти 0
4. Покупатель платит, но получает почти ничего
5. ❌ Покупатель теряет деньги
```

### Сценарий 3: Zero Value
```
1. Price feed возвращает 0
2. Расчет: tokenAmount = payment / 0
3. ❌ Division by zero → revert
4. Транзакция не выполняется
5. ⚠️ Покупатель не может купить (но и не теряет деньги)
```

## Итог

**Валидация price feed нужна для:**

1. ✅ **Защита от устаревших цен** (stale data) — покупатели не получат токены по старым ценам
2. ✅ **Защита от отрицательных значений** — предотвращает ошибки расчета
3. ✅ **Защита от нулевых значений** — предотвращает division by zero
4. ✅ **Защита от некорректных данных** — проверка roundId
5. ✅ **Защита от явно неверных цен** — границы разумности

**Без валидации:** Высокий риск потери средств из-за некорректных цен

**С валидацией:** Безопасные покупки с проверенными ценами

