/*
  Warnings:

  - You are about to drop the column `body` on the `notifikasi` table. All the data in the column will be lost.
  - Added the required column `pesan` to the `notifikasi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "notifikasi" DROP COLUMN "body",
ADD COLUMN     "pesan" TEXT NOT NULL;
