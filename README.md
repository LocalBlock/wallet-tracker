# Wallet Tracker
A simple wallet tracker web application to display current balance and prices from ethereum addresses or custom wallets.

### Built With

[![Next-badge]][Next-url]
[![Postgresql-badge]][Postgresql-url]
[![Wagmi-badge]][Wagmi-url]
[![Alchemy-badge]][Alchemy-url]
[![Chakra-badge]][Chakra-url]
[![Recharts-badge]][Recharts-url]

<img src="doc/screenshot.png">

## Features

* Sign-in with Ethereum : log in with your ethereum address. Your keys, your identifier
* Supported chains : Ethereum and Polygon.
* Supported DeFi protocols : Aave V2/V3 and Beefy.
* ENS name.
* Custom wallet : Create a cutom wallet and add  coin/token manualy, useful if you want to track off chain assets.
* Groups : Regroup wallet address to display the total balance of grouped wallets.
* Notifications : Receive a notification when there is activity on addresses.

## Demo version

[Wallet Tracker](https://wallet.localblock.dev)

## Intallation

Choose witch method you prefer :
- Run application in local developpment server.
- Use builded docker image with docker-compose.

### Pre-requisites
You need an **[APIKEY](https://docs.alchemy.com/docs/alchemy-quickstart-guide#1key-create-an-alchemy-key)** from Alchemy for fetching balance from blockchains and also an **[Auth Token](https://docs.alchemy.com/reference/notify-api-faq#where-do-i-find-my-alchemy-auth-token)** for notifications feature.

If you want WalletConnect feature especially for login on mobile phone, create a **[Project ID](https://cloud.walletconnect.com)**

### Local developement server
1. Download or clone this repo.

2. Create `.env` file at root application for your API keys.
```dotenv
DATABASE_URL="postgresql://wallet-tracker:YOUR_DATABASE_PASSWWORD@localhost:5432/wallet-tracker?schema=public"

ALCHEMY_APIKEY=YOUR_APIKEY
ALCHEMY_AUTHTOKEN=YOUR_AUTHTOKEN

# WalletConnect - Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECTID=YOUR_PROJECTID

# Iron Session - Private key used to encrypt the cookie. It has to be at least 32 characters long
SESSION_PASSWORD=YOUR_SESSION_PASSWORD
```
3. Install an run database

You can use PostgreSQL or MySQL, provide correct database URL in `.env` file

4. Install and run server.

```shell
# Install all dependencies
yarn
# Run a local developement server
yarn dev
```

## Use Docker (docker-compose)

```yaml
version: "3"
services:
  web:
    image: ghcr.io/localblock/wallet-tracker
    environment:
      - DATABASE_URL=YOUR_DATABASE_URL # postgresql://wallet-tracker:YOUR_DATABASE_PASSWWORD@database:5432/wallet-tracker?schema=public
      - SESSION_PASSWORD=YOUR_SESSION_PASSWORD # Iron Session - Private key used to encrypt the cookie. It has to be at least 32 characters long
      - ALCHEMY_APIKEY=YOUR_APIKEY # From Alchemy dashboard
      - ALCHEMY_AUTHTOKEN=YOUR_AUTHTOKEN # From Alchemy dashboard
      - NEXT_PUBLIC_WALLETCONNECT_PROJECTID=YOUR_PROJECTID # Optional, from https://cloud.walletconnect.com/
    restart: always
    ports:
      - 3000:3000

  database:
    image: postgres
    restart: always
    ports:
      - 5432:5432
    environment:
      - POSTGRES_PASSWORD=YOUR_DATABASE_PASSWWORD # Same password than wallet-tracker container
      - POSTGRES_USER=wallet-tracker # Create a database with same username
    volumes:
      - pgdata:/var/lib/postgresql/data

```

## License
Distributed under the MIT License. See [LICENSE.md](./LICENCE.md) for more information.

<!-- Links -->
[Next-badge]:https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]:https://nextjs.org/
[Wagmi-badge]:https://img.shields.io/badge/Wagmi-000000?style=for-the-badge&logo=wagmi&logoColor=white
[Wagmi-url]:https://wagmi.sh/
[Alchemy-badge]:https://img.shields.io/badge/Alchemy-363ff9?style=for-the-badge&logo=alchemy&logoColor=white
[Alchemy-url]:https://alchemy.com/
[Chakra-badge]:https://img.shields.io/badge/chakra-4ED1C5?style=for-the-badge&logo=chakraui&logoColor=white
[Chakra-url]:https://chakra-ui.com/
[Recharts-badge]:https://img.shields.io/badge/recharts-22b5bf?style=for-the-badge
[Recharts-url]:https://recharts.org/en-US
[Postgresql-badge]:https://img.shields.io/badge/postgresql-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[Postgresql-url]:https://www.postgresql.org/