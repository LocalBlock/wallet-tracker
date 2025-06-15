/*
  Warnings:

  - You are about to drop the `ContractData` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "_AddressWalletToUser" ADD CONSTRAINT "_AddressWalletToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AddressWalletToUser_AB_unique";

-- DropTable
DROP TABLE "ContractData";
