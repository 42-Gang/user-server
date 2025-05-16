/*
  Warnings:

  - You are about to drop the column `two_factor_enabled` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `two_factor_enabled`,
    ADD COLUMN `two_factor_auth` BOOLEAN NOT NULL DEFAULT false;
