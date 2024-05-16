const Sentry = require('@sentry/node');
const express = require('express');

const app = express();

require('dotenv').config();

const { SENTRY_DSN, DEV_ENV } = process.env;

Sentry.init({
	environment: DEV_ENV,
	dsn: SENTRY_DSN,
	integrations: [
		Sentry.httpIntegration({ tracing: true }),
		Sentry.expressIntegration({ app })
	],
	
	tracesSampleRate: 1.0
});

module.exports = Sentry;
