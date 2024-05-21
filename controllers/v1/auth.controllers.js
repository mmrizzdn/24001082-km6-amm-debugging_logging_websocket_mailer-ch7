const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { PrismaClient } = require('@prisma/client');

require('dotenv').config();
const { getHTML, sendMail } = require('../../libs/nodemailer');

const prisma = new PrismaClient();
const { JWT_SECRET } = process.env;

module.exports = {
	daftar: async (req, res, next) => {
		try {
			const { io } = require('../../app');

			let { nama, email, kata_sandi } = req.body;
			if (!nama || !email || !kata_sandi) {
				return res.status(400).json({
					status: false,
					message: 'name, email, dan kata sandi nggak boleh kosong!',
					data: null
				});
			}

			let emailTerpakai = await prisma.pengguna.findFirst({
				where: { email }
			});

			if (emailTerpakai) {
				return res.status(400).json({
					status: false,
					message: 'email udah dipake!',
					data: null
				});
			}

			let terenkripsi = await bcrypt.hash(kata_sandi, 10);

			let dataPengguna = {
				nama,
				email,
				kata_sandi: terenkripsi
			};

			let pengguna = await prisma.pengguna.create({ data: dataPengguna });
			delete pengguna.kata_sandi;

			let subjek = 'Pendaftaran Akun';
			let pesan = 'Penadftaran akun kamu berhasil!';

			let dataNotifikasi = {
				subjek,
				pesan,
				id_pengguna: pengguna.id
			};

			let notifikasi = await prisma.notifikasi.create({
				data: dataNotifikasi
			});

			io.emit(`pengguna-${pengguna.id}`, { notifikasi });

			return res.status(201).json({
				status: true,
				message: 'OK',
				data: { pengguna, notifikasi }
			});
		} catch (error) {
			next(error);
		}
	},

	masuk: async (req, res, next) => {
		try {
			let { email, kata_sandi } = req.body;
			if (!email || !kata_sandi) {
				return res.status(400).json({
					status: false,
					message: 'email dan kata sandi ngga boleh kosong!',
					data: null
				});
			}

			let pengguna = await prisma.pengguna.findFirst({
				where: { email }
			});

			if (!pengguna) {
				return res.status(400).json({
					status: false,
					message: 'email atau kata sandi nggak valid!',
					data: null
				});
			}

			let kataSandiBenar = await bcrypt.compare(
				kata_sandi,
				pengguna.kata_sandi
			);

			if (!kataSandiBenar) {
				return res.status(400).json({
					status: false,
					message: 'email atau kata sandi nggak valid!',
					data: null
				});
			}

			delete pengguna.kata_sandi;

			let token = jwt.sign({ id: pengguna.id }, JWT_SECRET);

			return res.json({
				status: true,
				message: 'OK',
				data: { ...pengguna, token }
			});
		} catch (error) {
			next(error);
		}
	},

	verifikasiEmail: async (req, res, next) => {
		try {
			const { token } = req.query;
			jwt.verify(token, JWT_SECRET, async (err, data) => {
				if (err) {
					return res.send('<h1>Gagal Verifikasi</h1>');
				}

				await prisma.pengguna.update({
					data: { terverifikasi: true },
					where: { id: data.id }
				});

				res.send('<h1>Verifikasi Berhasil</h1>');
			});
		} catch (error) {
			next(error);
		}
	},

	mintaVerifikasiEmail: async (req, res, next) => {
		try {
			let token = jwt.sign({ id: req.pengguna.id }, JWT_SECRET);
			let url = `${req.protocol}://${req.get(
				'host'
			)}/api/v1/verifikasi-email?token=${token}`;

			let html = await getHTML('email.ejs', {
				judul: 'Silakan Verifikasi Emailmu',
				nama: req.pengguna.nama,
				pesan1: 'Kami ngirimin email ini sebagai tanggapan atas permintaanmu buat verifikasi emailmu.',
				pesan2: 'Untuk melakukan verifikasi emailmu, silakan klik tautan di bawah ini:',
				pesan3: 'Abaikan email ini jika kamu sudah terverifikasi.',
				tombol: 'Verifikasi Email',
				url
			});

			await sendMail(req.pengguna.email, 'Verifikasi Email', html);
			return res.json({
				status: true,
				message: 'sukses',
				data: null
			});
		} catch (error) {
			next(error);
		}
	},

	resetKataSandi: async (req, res, next) => {
		try {
			const { io } = require('../../app');

			let { token } = req.query;

			jwt.verify(token, JWT_SECRET, async (err, data) => {
				if (err) {
					return res.send('<h1>Reset Kata Sandi Gagal</h1>');
				}

				let { kata_sandi_baru, konfirmasi_kata_sandi } = req.body;

				if (!kata_sandi_baru || !konfirmasi_kata_sandi) {
					return res.status(400).json({
						status: false,
						message: 'kata sandi nggak boleh kosong!',
						data: null
					});
				}

				if (kata_sandi_baru == data.kata_sandi) {
					return res.status(400).json({
						status: false,
						message:
							'kata sandi baru nggak boleh sama dengan kata sandi lama!',
						data: null
					});
				}

				if (kata_sandi_baru !== konfirmasi_kata_sandi) {
					return res.status(400).json({
						status: false,
						message: 'kata sandi tidak sama!',
						data: null
					});
				}

				let terenkripsi = await bcrypt.hash(kata_sandi_baru, 10);

				await prisma.pengguna.update({
					data: { kata_sandi: terenkripsi },
					where: { id: data.id }
				});

				let subjek = 'Reset Kata Sandi';
				let pesan = 'Reset kata sandi kamu berhasil!';

				let dataNotifikasi = {
					subjek,
					pesan,
					id_pengguna: data.id
				};

				let notifikasi = await prisma.notifikasi.create({
					data: dataNotifikasi
				});

				io.emit(`pengguna-${data.id}`, { notifikasi });

				res.send('<h1>Reset Kata Sandi Beres</h1>');
			});
		} catch (error) {
			next(error);
		}
	},

	mintaResetKataSandi: async (req, res, next) => {
		try {			
			let { email } = req.body;

			if (!email) {
				return res.status(400).json({
					status: false,
					message: 'email nggak boleh kosong!',
					data: null
				});
			}

			let pengguna = await prisma.pengguna.findFirst({
				where: {
					email,
					terverifikasi: true
				}
			});

			if (!pengguna) {
				return res.status(400).json({
					status: false,
					message: 'email nggak valid!',
					data: null
				});
			}

			let token = jwt.sign({ id: pengguna.id }, JWT_SECRET);

			let url = `${req.protocol}://${req.get(
				'host'
			)}/api/v1/reset-kata-sandi?token=${token}`;

			let html = await getHTML('email.ejs', {
				judul: 'Silakan Atur Ulang Kata Sandimu',
				nama: pengguna.nama,
				pesan1: 'Kami ngirimin email ini sebagai tanggapan atas permintaanmu buat reset kata sandimu.',
				pesan2: 'Untuk reset kata sandimu, silakan klik tautan di bawah ini:',
				pesan3: 'Abaikan email ini jika kamu nggak minta buat reset kata sandi.',
				tombol: 'Reset Kata Sandi',
				url
			});

			await sendMail(pengguna.email, 'Reset Kata Sandi', html);

			return res.json({
				status: true,
				message: 'sukses',
				data: null
			});
		} catch (error) {
			next(error);
		}
	},

	welcome: async (req, res, next) => {
		try {
			if (req.pengguna.terverifikasi == false) {
				return res.status(401).json({
					status: false,
					message: 'email kamu belum terverifikasi!',
					data: null
				});
			}

			let notifikasi = await prisma.notifikasi.findMany({
				where: {
					id_pengguna: req.pengguna.id
				}
			});

			return res.render('welcome', {
				pengguna: req.pengguna,
				notifikasi
			});
		} catch (error) {
			next(error);
		}
	}
};
