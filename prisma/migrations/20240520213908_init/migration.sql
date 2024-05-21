-- CreateTable
CREATE TABLE "pengguna" (
    "id" SERIAL NOT NULL,
    "nama" TEXT,
    "email" TEXT NOT NULL,
    "kata_sandi" TEXT NOT NULL,
    "terverifikasi" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifikasi" (
    "id" SERIAL NOT NULL,
    "subjek" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "id_pengguna" INTEGER NOT NULL,

    CONSTRAINT "notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_email_key" ON "pengguna"("email");

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_id_pengguna_fkey" FOREIGN KEY ("id_pengguna") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
