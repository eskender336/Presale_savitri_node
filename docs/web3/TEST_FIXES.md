# Исправления тестов

## Проблема

При запуске `npx hardhat test` возникала ошибка:
```
SyntaxError: Identifier 'multisigOwners' has already been declared
```

## Причина

Старые тестовые файлы использовали устаревший API с встроенной мультиподписью, который был удален из контрактов. В этих файлах переменная `multisigOwners` объявлялась дважды в одной функции.

## Исправленные файлы

1. ✅ `test/blockedPurchase.test.js` - Убрано дублирование, обновлен API
2. ✅ `test/blocklist.test.js` - Убрано дублирование, обновлен API
3. ✅ `test/bnbRatio.test.js` - Убрано дублирование, обновлен API
4. ✅ `test/usdtPurchaseUnits.test.js` - Убрано дублирование, обновлен API
5. ✅ `test/dynamicPricing.test.js` - Убрано дублирование (4 места), обновлен API
6. ✅ `test/tokenICOv2Voucher.test.js` - Убрано дублирование, обновлен API
7. ✅ `test/delegationAndSweeper.test.js` - Убрано дублирование, удален старый multisig API

## Изменения

### До (старый код):
```javascript
const multisigOwners = [owner.address, owner.address, owner.address, owner.address, owner.address];
const Token = await Token.deploy(multisigOwners);

const multisigOwners = [owner.address, owner.address, owner.address, owner.address, owner.address]; // ❌ Дублирование!
const ICO = await ICO.deploy(multisigOwners);
```

### После (новый код):
```javascript
// Deploy contracts (no multisig needed - using simple owner)
const Token = await Token.deploy();
const ICO = await ICO.deploy();
```

## Результат

✅ Все синтаксические ошибки исправлены
✅ Тесты теперь используют упрощенный API без встроенной мультиподписи
✅ Контракты деплоятся без параметров multisig

## Примечание

В production мультиподпись будет реализована через внешний Gnosis Safe, который будет использоваться как owner контрактов. Для локального тестирования достаточно простого owner.

