const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const { getHTML, sendMail } = require('../../libs/nodemailer');

require('dotenv').config();

const prisma = new PrismaClient();
const { JWT_SECRET } = process.env;

module.exports = {
	daftar: async (req, res, next) => {
		try {
			let { nama, email, kataSandi } = req.body;
			if (!nama || !email || !kataSandi) {
				return res.status(400).json({
					status: false,
					message: 'name, email, dan kata sandi ngga boleh kosong!',
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

			let terenkripsi = await bcrypt.hash(kataSandi, 10);

			let dataPengguna = {
				nama,
				email,
				kataSandi: terenkripsi
			};

			let pengguna = await prisma.pengguna.create({ data: dataPengguna });
			delete pengguna.kataSandi;

			return res.status(201).json({
				status: true,
				message: 'OK',
				data: pengguna
			});
		} catch (error) {
			next(error);
		}
	},

	masuk: async (req, res, next) => {
		try {
			let { email, kataSandi } = req.body;
			if (!email || !kataSandi) {
				return res.status(400).json({
					status: false,
					message: 'email dan kata sandi ngga boleh kosong!',
					data: null
				});
			}

			let pengguna = await prisma.pengguna.findFirst({
				where: { email }
			});

			console.log(pengguna);

			if (!pengguna) {
				return res.status(400).json({
					status: false,
					message: 'email atau kata sandi tidak valid!',
					data: null
				});
			}

			let kataSandibenar = await bcrypt.compare(
				kataSandi,
				pengguna.kataSandi
			);
			if (!kataSandibenar) {
				return res.status(400).json({
					status: false,
					message: 'email atau kata sandi tidak valid!',
					data: null
				});
			}

			delete pengguna.kataSandi;

			let token = jwt.sign({ id: pengguna.id }, JWT_SECRET);

			res.json({
				status: true,
				message: 'OK',
				data: { ...pengguna, token }
			});
		} catch (error) {
			next(error);
		}
	},

	whoami: async (req, res, next) => {
		try {
			res.json({
				status: true,
				message: 'OK',
				data: req.pengguna
			});
		} catch (error) {
			next(error);
		}
	},

	verifyEmail: async (req, res, next) => {
		try {
			const { token } = req.query;
			jwt.verify(token, JWT_SECRET, async (err, data) => {
				if (err) {
					return res.send('<h1>Gagal Verifikasi</h1>');
				}
				await prisma.pengguna.update({
					data: { is_verified: true },
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
			)}/api/v1/verify?token=${token}`;
			let html = await getHTML('email.ejs', {
				judul: 'Silakan Verifikasi Emailmu',
				nama: req.pengguna.nama,
				pesan1: 'Kami ngirimin email ini sebagai tanggapan atas permintaanmu buat verifikasi emailmu.',
				pesan2: 'Untuk melakukan verifikasi emailmu, silakan klik tautan di bawah ini:',
				pesan3: 'Abaikan email ini jika kamu nggak minta perubahan kata sandi.',
				tombol: 'Verifikasi Email',
				url_verifikasi: url
			});

			await sendMail(req.pengguna.email, 'Verification Email', html);
			return res.json({
				status: true,
				message: 'sukses',
				data: null
			});
		} catch (error) {
			next(error);
		}
	}
};
