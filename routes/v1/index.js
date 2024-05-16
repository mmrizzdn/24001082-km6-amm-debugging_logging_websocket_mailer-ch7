const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

const auth = require('../../controllers/v1/auth.controllers');

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
			})
		}

		delete pengguna.password;
		req.pengguna = pengguna;
		next();
	});
};

router.post('/daftar', auth.daftar);
router.post('/masuk', auth.masuk);
router.get('/whoami', restrict, auth.whoami);

router.get('/verify', auth.verifyEmail);
router.get('/minta-verifikasi', restrict, auth.mintaVerifikasiEmail);

module.exports = router;
