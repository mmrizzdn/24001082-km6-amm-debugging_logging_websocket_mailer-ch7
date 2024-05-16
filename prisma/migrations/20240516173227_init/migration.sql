-- CreateTable
CREATE TABLE "pengguna" (
    "id" SERIAL NOT NULL,
    "nama" TEXT,
    "email" TEXT NOT NULL,
    "kataSandi" TEXT NOT NULL,
    "terverifikasi" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_email_key" ON "pengguna"("email");
