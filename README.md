# Multi-Currency ICO, Staking & Referral System Dapp Using Next.js, Solidity & Wagmi

Build & Deploy Multi-Currency ICO, Staking & Referral System Dapp | Next.js, Solidity & Wagmi | EVM Blockchain

In this tutorial, we'll build and deploy a Multi-Currency ICO, Staking, and Referral System Dapp using Next.js, Solidity, and Wagmi on the EVM blockchain. You'll learn how to:

✅ Set up a multi-token ICO smart contract
✅ Implement a staking mechanism for passive rewards
✅ Build a referral system to incentivize users
✅ Integrate Wagmi for seamless Web3 interactions
✅ Deploy the smart contract and frontend

Perfect for Web3 developers looking to create an advanced crypto fundraising and staking platform. Don't forget to like, subscribe, and hit the bell icon for more blockchain development content! 🚀💰

## Project Overview

![alt text](https://www.daulathussain.com/wp-content/uploads/2025/03/Build-Deploy-Multi-Currency-ICO-Staking-Referral-System-Dapp.jpg)

## Instruction

Kindly follow the following Instructions to run the project in your system and install the necessary requirements

- [Final Source Code](https://www.theblockchaincoders.com/sourceCode/multi-currency-ico-dapp-using-next.js-solidity-and-wagmi)

#### Setup Video

- [Final Code Setup video](https://youtu.be/-T_qIfAt5c8?si=SAkBhgW5uorOo7pP)

#### Deploying Dapp

```
  WATCH: Hostinger
  Get : Discount 50%
  URL: https://www.hostg.xyz/aff_c?offer_id=6&aff_id=139422
```

```
  WATCH: Setup & Demo Of Project
  Code: https://www.theblockchaincoders.com/sourceCode/multi-currency-ico-dapp-using-next.js-solidity-and-wagmi
  URL: https://youtu.be/j8NO8ea5zVo?si=jCmvfXmpmefwjhO5
```

#### Install Vs Code Editor

```
  GET: VsCode Editor
  URL: https://code.visualstudio.com/download
```

#### NodeJs & NPM Version

```
  NodeJs: v18.17.1 / LATEST
  NPM: 8.19.2
  URL: https://nodejs.org/en/download
  Video: https://youtu.be/PIR0oBVowXU?si=9eNdR29u37F2ujJJ
```

#### Clone Starter File

```
  GET: Project Starter File Download
  URL: https://www.theblockchaincoders.com/SourceCode
```

All you need to follow the complete project and follow the instructions which are explained in the tutorial by Daulat

## Final Code Instruction

If you download the final source code then you can follow the following instructions to run the Dapp successfully

#### Setup Video

```
  WATCH: Setup & Demo Of Project
  URL: https://www.theblockchaincoders.com/sourceCode/multi-currency-ico-dapp-using-next.js-solidity-and-wagmi
  Video: https://youtu.be/-T_qIfAt5c8?si=SAkBhgW5uorOo7pP
```

#### Final Source Code

```
  Download the Final Source Code
  URL: https://www.theblockchaincoders.com/sourceCode/multi-currency-ico-dapp-using-next.js-solidity-and-wagmi
```

#### Install Vs Code Editor

```
  GET: VsCode Editor
  URL: https://code.visualstudio.com/download
```

#### PINATA IPFS

```
  OPEN: PINATA.CLOUD
  URL:https://pinata.cloud/
```

#### reown

```
  OPEN: WALLET CONNECT
  URL: https://docs.reown.com/cloud/relay
```

#### FORMSPREE

```
  OPEN: FORMSPREE
  URL: https://formspree.io/
```

#### ALCHEMY

```
  OPEN: ALCHEMY.COM
  URL: https://www.alchemy.com/
```

## Environment Setup

Copy `.env.local.example` to `.env.local` in the project root and
`web3/.env.example` to `web3/.env`:

```bash
cp .env.local.example .env.local
cp web3/.env.example web3/.env
```

Then update the newly created files with your own credentials.

## Telegram Notifier (PM2)

Run the purchase notifications bot with PM2 so it stays alive after SSH closes:

```bash
cd web3
pm2 start scripts/telegram-notifier.js --name presale-notifier --time
```

Make sure `web3/.env` (or `web3/.env.main`) includes `NETWORK_RPC_URL`/`RPC_WS_URL`, `CONTRACT_ADDRESS` (or `NEXT_PUBLIC_TOKEN_ICO_ADDRESS`), `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID`.

## Important Links

- [Get Pro Blockchain Developer Course](https://www.theblockchaincoders.com/pro-nft-marketplace)
- [Support Creator](https://bit.ly/Support-Creator)
- [All Projects Source Code](https://www.theblockchaincoders.com/SourceCode)

## Authors

- [@theblockchaincoders.com](https://www.theblockchaincoders.com/)
- [@consultancy](https://www.theblockchaincoders.com/consultancy)
- [@youtube](https://www.youtube.com/@daulathussain)
## Contact

- Email: eskender.k@prometeochain.io
- Telegram: https://t.me/your_channel
- Response window: We reply within 24 hours, Mon–Fri.
- Scope: Purchases, wallet issues, KYC, listing and general questions.
- Security: Never share your seed phrase or private keys.

Link formats:

- Telegram group/channel: https://t.me/your_group_or_channel
- Telegram direct: https://t.me/your_username
- Email: mailto:support@yourdomain.com?subject=Support%20Request
- GitHub issues (optional): https://github.com/yourorg/yourrepo/issues

Configuration via environment variables:

- `NEXT_PUBLIC_SUPPORT_EMAIL` (default: eskender.k@prometeochain.io)
- `NEXT_PUBLIC_SUPPORT_TELEGRAM` (default: https://t.me/your_channel)

UI placements:

- Homepage hero: small "Contact Support" block
- Dashboard: link block at bottom of the page
