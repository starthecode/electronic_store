/*
  Warnings:

  - You are about to drop the column `type` on the `Setting` table. All the data in the column will be lost.
  - Added the required column `category` to the `Setting` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `value` on the `Setting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SettingCategory" AS ENUM ('GENERAL', 'STORE', 'CURRENCY', 'TAX', 'SHIPPING', 'ORDERS', 'INVENTORY', 'PAYMENTS', 'AFFILIATE', 'NOTIFICATIONS', 'SYSTEM');

-- AlterTable
ALTER TABLE "Setting" DROP COLUMN "type",
ADD COLUMN     "category" "SettingCategory" NOT NULL,
ADD COLUMN     "isSensitive" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "value",
ADD COLUMN     "value" JSONB NOT NULL;

-- CreateIndex
CREATE INDEX "Setting_category_idx" ON "Setting"("category");

-- CreateIndex
CREATE INDEX "Setting_isSensitive_idx" ON "Setting"("isSensitive");
