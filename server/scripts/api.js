// ==================== API 路由 ====================

const express = require('express');
const router = express.Router();

const { getProvider } = require('../assets/providers');
const { getSkillStatus } = require('../assets/skills');
const pipeline = require('./pipeline');
const { exportToPptx } = require('./pptx-export');
const { saveHtml, screenshot, renderVideo } = require('./render');

function checkToken(req, res) {
  const { provider, token } = req.body;
  const prov = getProvider(provider || 'deepseek');
  if (prov.requiresToken && !token) {
    res.status(400).json({ error: '该供应商需要 API Token' });
    return null;
  }
  return { provider: provider || 'deepseek', token, model: req.body.model };
}

// ==================== Phase 1: 方向顾问 ====================

router.post('/advisor', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: '请输入需求' });

    const cfg = checkToken(req, res);
    if (!cfg) return;

    const result = await pipeline.recommendDirections(cfg, prompt);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Phase 2: 上下文协议 ====================

router.post('/context', async (req, res) => {
  try {
    const { prompt, direction } = req.body;
    if (!prompt || !direction) return res.status(400).json({ error: '缺少 prompt 或 direction' });

    const cfg = checkToken(req, res);
    if (!cfg) return;

    const result = await pipeline.gatherContext(cfg, prompt, direction);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Phase 3a: 大纲 ====================

router.post('/outline', async (req, res) => {
  try {
    const { prompt, direction, answers } = req.body;
    if (!prompt || !direction) return res.status(400).json({ error: '缺少 prompt 或 direction' });

    const cfg = checkToken(req, res);
    if (!cfg) return;

    const result = await pipeline.generateOutline(cfg, prompt, direction, answers);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Phase 3b: 全文生成 ====================

router.post('/generate', async (req, res) => {
  try {
    const { prompt, direction, outline } = req.body;
    if (!prompt || !direction || !outline) {
      return res.status(400).json({ error: '缺少 prompt / direction / outline' });
    }

    const cfg = checkToken(req, res);
    if (!cfg) return;

    const content = await pipeline.generateFullContent(cfg, prompt, direction, outline);

    // 保存 HTML 到 output/ 目录，返回可访问 URL
    const htmlId = Date.now().toString(36);
    const htmlUrl = saveHtml(content, htmlId + '.html');
    const pngUrl = await screenshot(htmlId + '.html');

    const { parseSlides, slideStats } = require('../assets/pptx-format');
    const slides = parseSlides(content);
    const stats = slideStats(slides);

    res.json({ success: true, content, htmlUrl, imageUrl: pngUrl, slides, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/animation
 * 动画生成：AI 出带动画 HTML → Playwright 录 MP4
 */
router.post('/animation', async (req, res) => {
  try {
    const { prompt, token, provider, model, duration } = req.body;
    if (!prompt) return res.status(400).json({ error: '请输入需求' });

    const prov = getProvider(provider || 'deepseek');
    if (prov.requiresToken && !token) {
      return res.status(400).json({ error: '该供应商需要 API Token' });
    }

    const { ANIMATION_FORMAT } = require('../assets/animation-format');
    const { generate } = require('./llm-client');
    const { loadSkillMain } = require('../assets/skills');

    const sys = loadSkillMain() + '\n\n---\n' + ANIMATION_FORMAT;
    const html = await generate({
      provider: provider || 'deepseek', token, model,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
    });

    const id = Date.now().toString(36);
    const htmlUrl = saveHtml(html, id + '.html');
    const videoUrl = await renderVideo(id + '.html', { duration: duration || 15 });

    res.json({ success: true, htmlUrl, videoUrl, content: html });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/export/pptx
 */
router.post('/export/pptx', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: '缺少 content' });

    const pptxBuffer = await exportToPptx(content);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', 'attachment; filename=output.pptx');
    res.send(pptxBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/providers
 * 获取供应商列表
 */
router.get('/providers', (req, res) => {
  const { PROVIDERS, PROVIDER_KEYS } = require('../assets/providers');
  const list = PROVIDER_KEYS.map(k => ({
    key: k,
    name: PROVIDERS[k].name,
    defaultModel: PROVIDERS[k].defaultModel,
    requiresToken: PROVIDERS[k].requiresToken,
  }));
  res.json({ providers: list });
});

/**
 * GET /api/skill-status
 * 获取技能加载状态
 */
router.get('/skill-status', (req, res) => {
  res.json(getSkillStatus());
});

module.exports = router;
