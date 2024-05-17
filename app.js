require('./libs/sentry');

var express = require('express');
var logger = require('morgan');
const Sentry = require('@sentry/node');
const path = require('path');

var indexRouter = require('./routes/v1/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// view engine setup
app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('./templates/verifikasi.ejs'));
app.use('/api/v1', indexRouter);

Sentry.setupExpressErrorHandler(app);

// 500 error handler
app.use((err, req, res, next) => {
	console.log(err);
	res.status(500).json({
		status: false,
		message: err.message,
		data: null
	});
});

// 404 error handler
app.use((req, res, next) => {
	res.status(404).json({
		status: false,
		message: `are you lost? ${req.method} ${req.url} is not registered!`,
		data: null
	});
});
module.exports = app;
