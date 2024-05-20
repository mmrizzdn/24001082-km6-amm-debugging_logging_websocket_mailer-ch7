const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

const auth = require('../../controllers/v1/auth.controllers');
const { token } = require('morgan');

const router = express.Router();
const prisma = new PrismaClient();
const { JWT_SECRET } = process.env;

let restrict = (req, res, next) => {
	let { authorization } = req.headers;
	if (!authorization || !authorization.split(' ')[1]) {
		return res.status(401).json({
			status: false,
			message: 'token not provided!',
			data: null
		});
	}

	let token = authorization.split(' ')[1];
	jwt.verify(token, JWT_SECRET, async (err, data) => {
		if (err) {
			return res.status(401).json({
				status: false,
				message: err.message,
				data: null
			});
		}

		let pengguna = await prisma.pengguna.findFirst({
			where: { id: data.id }
		});

		if (!pengguna) {
			return res.status(404).json({
				status: false,
				message: 'pengguna ngga ada!',
				data: null
			});
		}

		delete pengguna.password;
		req.pengguna = pengguna;
		next();
	});
};

router.post('/daftar', auth.daftar);
router.get('/masuk', (req, res) => res.render('masuk.ejs'));
router.post('/masuk', auth.masuk);

router.get('/minta-verifikasi-email', restrict, auth.mintaVerifikasiEmail);
router.get('/verifikasi-email', auth.verifikasiEmail);

router.get('/lupa-kata-sandi', (req, res) =>
	res.render('kataSandi/lupa-kata-sandi.ejs')
);
router.post('/lupa-kata-sandi', auth.mintaResetKataSandi);

router.get('/reset-kata-sandi', (req, res) =>
	res.render('kataSandi/reset-kata-sandi.ejs', { token: req.query.token })
);
router.post('/reset-kata-sandi', auth.resetKataSandi);

// router.get('/whoami', restrict, auth.whoami);

module.exports = router;
