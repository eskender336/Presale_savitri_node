# Как перевести токены в ICO контракт

## 📍 Ответ

**НЕТ, не нужно вызывать функцию в ICO контракте!**

Вы просто вызываете стандартную функцию `transfer()` из контракта **SavitriCoin**, и токены переводятся на адрес ICO контракта.

## 🔍 Как это работает

### TokenICO не имеет функции для получения токенов

ICO контракт - это обычный ERC20 получатель. Он просто хранит токены на своем балансе и отправляет их покупателям при покупке.

### Процесс перевода:

```javascript
// 1. У вас есть токены на вашем кошельке (после деплоя SavitriCoin)
const yourBalance = await savitriToken.balanceOf(yourAddress);
// yourBalance = 600,000,000 * 10^18

// 2. Вы просто переводите токены на адрес ICO контракта
await savitriToken.transfer(tokenICO.address, ethers.utils.parseEther("500000000"));
// ✅ Готово! Токены теперь на балансе ICO контракта
```

## 📝 Полный процесс настройки

### Шаг 1: Деплой контрактов

```javascript
// Деплой SavitriCoin
const savitriToken = await SavitriCoin.deploy();
// Все токены на вашем кошельке (или Safe)

// Деплой TokenICO
const tokenICO = await TokenICO.deploy();
// ICO контракт пустой (баланс = 0)
```

### Шаг 2: Перевести токены в ICO

```javascript
// Просто transfer из SavitriCoin
const tokensForICO = ethers.utils.parseEther("500000000"); // 500M токенов
await savitriToken.transfer(tokenICO.address, tokensForICO);

// Проверка
const icoBalance = await savitriToken.balanceOf(tokenICO.address);
console.log("ICO balance:", ethers.utils.formatEther(icoBalance));
// Output: ICO balance: 500000000.0
```

### Шаг 3: Настроить ICO

```javascript
// Установить sale token
await tokenICO.setSaleToken(savitriToken.address);

// Разрешить ICO переводить токены покупателям
await savitriToken.setAllowedSender(tokenICO.address, true);

// Настроить price feed, sale start time и т.д.
```

## 🎯 Пример из реального кода

Посмотрите на `deploy.mocks.js`:

```javascript
// 6) Fund ICO with SAV inventory to sell
console.log(`[${now()}] STEP 6: Fund ICO with SAV`);
const SALE_INVENTORY = process.env.SALE_INVENTORY || "500000";
await waitFor(
  sav.transfer(ico.address, ethers.utils.parseUnits(SALE_INVENTORY, 18), ov(plan[4].gas)),
  `SAV.transfer(ICO, ${SALE_INVENTORY})`
);
console.log(`✅ ICO funded with ${SALE_INVENTORY} SAV`);
```

**Видите?** Просто `sav.transfer(ico.address, amount)` - никаких функций в ICO!

## ⚠️ Важно!

### После перевода токенов нужно:

1. **Разрешить ICO переводить токены**:
   ```javascript
   await savitriToken.setAllowedSender(tokenICO.address, true);
   ```
   Без этого ICO не сможет отправлять токены покупателям!

2. **Установить sale token в ICO**:
   ```javascript
   await tokenICO.setSaleToken(savitriToken.address);
   ```

3. **Настроить ICO** (price feeds, sale start time и т.д.)

## 🔐 Если используете Gnosis Safe

Если вы деплоили через Safe, то перевод токенов тоже нужно делать через Safe:

1. **В Safe интерфейсе**: Создать транзакцию
2. **To**: Адрес SavitriCoin контракта
3. **Function**: `transfer(address to, uint256 amount)`
4. **Parameters**:
   - `to`: Адрес TokenICO контракта
   - `amount`: Количество токенов (в wei)
5. **Подписать** транзакцию (3 из 5 подписей)
6. **Выполнить** транзакцию

## 📊 Схема процесса

```
1. Деплой SavitriCoin
   └─> Все токены на вашем кошельке (или Safe)

2. Деплой TokenICO
   └─> ICO контракт пустой (баланс = 0)

3. Вызываете savitriToken.transfer(ico.address, amount)
   └─> Токены переводятся на баланс ICO контракта
   └─> ✅ Готово! ICO теперь может продавать токены

4. Настройка ICO
   └─> setSaleToken()
   └─> setAllowedSender(ico.address, true)
   └─> setBNBPriceFeed()
   └─> setSaleStartTime()
```

## 💡 Итог

- ✅ **Используйте**: `savitriToken.transfer(tokenICO.address, amount)`
- ❌ **НЕ используйте**: Функции в ICO контракте (их нет!)
- ✅ **После перевода**: Настройте ICO (setSaleToken, setAllowedSender и т.д.)

**ICO контракт просто хранит токены на своем балансе и отправляет их покупателям при покупке.**

