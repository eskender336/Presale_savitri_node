# Private Sale System - Документация

## Обзор

Система Private Sale позволяет прозрачно распределять токены списку участников через смарт-контракт с использованием мультиподписи.

### Преимущества:
- ✅ **Прозрачность**: Все распределения видны в блокчейне
- ✅ **Безопасность**: Мультиподпись (3 из 5) для всех операций
- ✅ **Экономичность**: Не храним весь список onchain, только лимиты
- ✅ **Гибкость**: Легко обновлять CSV без транзакций

## Процесс работы

### Шаг 1: Подготовка CSV

Формат `data/token-balances.csv`:
```
address,balance
0x1234567890123456789012345678901234567890,1000
0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,500
```

### Шаг 2: Установка лимитов (один раз)

```bash
node web3/scripts/set-private-sale-allocations.js
```

Что происходит:
1. Читает CSV
2. Создает предложения для установки лимитов каждого участника
3. Нужно 3 одобрения от мультиподписантов
4. После одобрений - выполнить предложения

### Шаг 3: Распределение токенов

```bash
# Проверка (dry-run)
node web3/scripts/distribute-private-sale.js --dry-run

# Реальное распределение
node web3/scripts/distribute-private-sale.js
```

Что происходит:
1. Читает CSV
2. Проверяет лимиты для каждого участника
3. Создает предложения для распределения токенов
4. Нужно 3 одобрения от мультиподписантов
5. После одобрений - выполнить предложения

### Шаг 4: Проверка статуса

```bash
# Проверить конкретные адреса
node web3/scripts/check-private-sale-status.js 0xAddress1 0xAddress2

# Проверить все из CSV
node web3/scripts/check-private-sale-status.js --csv
```

## Переменные окружения

В `web3/.env`:
```bash
NEXT_PUBLIC_TOKEN_ICO_ADDRESS=0x...  # Адрес контракта TokenICO
CSV_PATH=../../data/token-balances.csv  # Путь к CSV (опционально)
BATCH_SIZE=50  # Размер батча для распределения (опционально)
```

## Работа с мультиподписью

### Создание предложения
```javascript
const proposalId = await ico.setPrivateSaleAllocations(recipients, amounts);
```

### Одобрение предложения
```javascript
await ico.approveProposal(proposalId);  // Нужно 3 одобрения всего
```

### Выполнение предложения
```javascript
await ico.executeProposal(proposalId);  // После 3 одобрений
```

## Функции контракта

### Установка лимитов
```solidity
function setPrivateSaleAllocations(
    address[] calldata recipients,
    uint256[] calldata amounts
) external onlyMultisigOwner returns (uint256);
```

### Распределение токенов
```solidity
function distributePrivateSaleBatch(
    address[] calldata recipients,
    uint256[] calldata amounts,
    string[] calldata reasons
) external onlyMultisigOwner returns (uint256);
```

### Проверка статуса
```solidity
function getPrivateSaleInfo(address participant) external view returns (
    uint256 allocation,
    uint256 distributed,
    uint256 remaining
);
```

## Безопасность

1. **Мультиподпись**: Все операции требуют 3 из 5 подписей
2. **Проверка лимитов**: Нельзя распределить больше, чем установлено
3. **Проверка баланса**: Контракт проверяет достаточность токенов
4. **Прозрачность**: Все транзакции видны в блокчейне

## Примеры использования

### Пример 1: Установка лимитов для 100 участников

```bash
# CSV содержит 100 адресов
node web3/scripts/set-private-sale-allocations.js

# Создаст 1-2 предложения (в зависимости от BATCH_SIZE)
# Нужно одобрить и выполнить каждое
```

### Пример 2: Распределение токенов

```bash
# Сначала проверка
node web3/scripts/distribute-private-sale.js --dry-run

# Если все ок - распределяем
node web3/scripts/distribute-private-sale.js

# Создаст предложения, нужно одобрить и выполнить
```

### Пример 3: Проверка конкретного участника

```bash
node web3/scripts/check-private-sale-status.js 0x1234...
```

## Troubleshooting

### Ошибка: "Exceeds allocation"
- Участник уже получил свой лимит
- Проверьте: `getPrivateSaleInfo(address)`

### Ошибка: "Insufficient balance"
- В контракте недостаточно токенов
- Пополните баланс контракта

### Ошибка: "Not a multisig owner"
- Deployer не является мультиподписантом
- Используйте адрес из списка мультиподписантов

## Важные замечания

1. **CSV формат**: `address,balance` (один адрес на строку)
2. **Batch размер**: Меньше = больше транзакций, но безопаснее
3. **Мультиподпись**: Каждое предложение требует 3 одобрения
4. **Газ**: Batch операции экономят газ по сравнению с отдельными транзакциями


