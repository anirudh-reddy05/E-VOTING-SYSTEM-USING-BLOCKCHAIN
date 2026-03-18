const next = require('next');
const express = require('express');
const voter = require('./routes/voter');
const company = require('./routes/company');
const candidate = require('./routes/candidate');
const bodyParser = require('body-parser');
const mongoose = require('./config/database');

const exp = express();

require('dotenv').config({ path: __dirname + '/.env' });

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

exp.use(bodyParser.urlencoded({ extended: true }));
exp.use(bodyParser.json());

exp.use('/company', company);
exp.use('/voter', voter);
exp.use('/candidate', candidate);

const app = next({
	dev: process.env.NODE_ENV !== 'production',
});

const routes = require('./routes');
const handler = routes.getRequestHandler(app);

app.prepare().then(() => {
	const PORT = process.env.PORT || 3000;

	exp.use(handler).listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
});