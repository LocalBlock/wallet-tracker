-- CreateTable
CREATE TABLE "User" (
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "selectedChains" TEXT[] DEFAULT ARRAY['ethereum', 'polygon-pos']::TEXT[],
    "selectedWalletId" TEXT,
    "selectedGroupId" TEXT,
    "notificationsEnable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "timeCreated" TIMESTAMP(3) NOT NULL,
    "signingKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "addresses" TEXT[],

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "isSent" BOOLEAN NOT NULL,
    "hash" TEXT NOT NULL,
    "transfer" JSONB NOT NULL,
    "sent" JSONB NOT NULL,
    "received" JSONB NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressWallet" (
    "address" TEXT NOT NULL,
    "ens" TEXT,
    "lastfetch" TIMESTAMP(3) NOT NULL,
    "nativeTokens" JSONB NOT NULL DEFAULT '[]',
    "tokens" JSONB NOT NULL DEFAULT '[]',
    "defi" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "AddressWallet_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "CustomWallet" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "lastfetch" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "coins" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "CustomWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "walletIds" TEXT[],

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinList" (
    "id" SERIAL NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "list" JSONB NOT NULL,

    CONSTRAINT "CoinList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinData" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3),
    "sparkline_in_7d" JSONB NOT NULL,
    "price" JSONB NOT NULL,

    CONSTRAINT "CoinData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractData" (
    "id" SERIAL NOT NULL,
    "chainId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "decimals" INTEGER,
    "name" TEXT,
    "symbol" TEXT,

    CONSTRAINT "ContractData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AddressWalletToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AddressWalletToUser_AB_unique" ON "_AddressWalletToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_AddressWalletToUser_B_index" ON "_AddressWalletToUser"("B");

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomWallet" ADD CONSTRAINT "CustomWallet_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AddressWalletToUser" ADD CONSTRAINT "_AddressWalletToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "AddressWallet"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AddressWalletToUser" ADD CONSTRAINT "_AddressWalletToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("address") ON DELETE CASCADE ON UPDATE CASCADE;
