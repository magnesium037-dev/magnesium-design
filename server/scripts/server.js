// ==================== Magnesium Design MVP — 入口 ====================

const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRoutes = require('./api');
const { getSkillStatus } = require('../assets/skills');
const { serveOutput } = require('./render');

const app = express();
const PORT = process.env.PORT || 3721;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', '..', 'client')));

// 输出目录（AI 生成的 HTML 文件）
serveOutput(app);

// API 路由
app.use('/api', apiRoutes);

// 前端页面兜底（SPA）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'client', 'index.html'));
});

// 启动
const status = getSkillStatus();
console.log('');
console.log('  Magnesium Design MVP');
console.log('  ─────────────────');
console.log('  地址:    http://localhost:' + PORT);
console.log('  状态:    http://localhost:' + PORT + '/api/skill-status');
console.log('  供应商:  http://localhost:' + PORT + '/api/providers');
console.log('  技能加载: ' + (status.loaded ? 'SKILL.md (' + status.mainLength + ' bytes)' : '未加载（使用兜底）'));
console.log('');

app.listen(PORT);
