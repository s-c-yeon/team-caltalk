const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const teamsRoutes = require('./routes/teams.routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler.middleware');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
