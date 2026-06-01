const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const path = require('path');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('short'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - uploaded avatars
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404
app.use((req, res) => {
  res.status(404).json({ code: 404, msg: '接口不存在' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
