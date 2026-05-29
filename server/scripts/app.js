// Vercel serverless entry — wraps Express
const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRoutes = require('./api');
const { getSkillStatus } = require('../assets/skills');
const { serveOutput } = require('./render');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
serveOutput(app);
app.use('/api', apiRoutes);
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;
