// ==================== 三阶段管道 + 视觉 Demo ====================
// 复刻 magnesium-design 生产管线
// Phase 1: 方向顾问 → 3 方向 + 3 个视觉 Demo HTML
// Phase 2: 上下文协议 → 收集上下文
// Phase 3: Junior Designer → 大纲 → 全文 HTML

const { generate } = require('./llm-client');
const { saveHtml, screenshot } = require('./render');

// ==================== Phase 1: 方向顾问 + 可视化 Demo ====================

async function recommendDirections(apiConfig, userPrompt) {
  const sys = `你是一位内容方向顾问。
分析用户需求，推荐 3 个差异化创作方向。

输出 JSON（不要其他文字）：
{
  "analysis": "需求分析（50字内）",
  "directions": [
    {
      "name": "方向名",
      "angle": "切入角度",
      "tone": "语气基调", 
      "structure": "建议结构",
      "why": "为什么合适",
      "demo": "一个简短的视觉 Demo HTML，展示该方向的风格（完整HTML，有视觉设计）"
    }
  ]
}

Demo HTML 要求：
- 每个 demo 是独立的视觉展示页，不是 PPT
- 包含排版、配色、字号层次、留白
- 展示该方向的核心视觉特征
- 纯色，不用渐变
- 宽 960pt，高约 400pt（小样，非全尺寸）`;

  const result = await generate({
    ...apiConfig,
    messages: [{ role: 'system', content: sys }, { role: 'user', content: userPrompt }],
    temperature: 0.9,
  });

  let parsed;
  try { parsed = JSON.parse(extractJSON(result)); } catch (e) { return { parseError: true, raw: result }; }

  // 为每个方向保存 Demo HTML 并截图
  for (const d of (parsed.directions || [])) {
    if (d.demo) {
      const htmlId = 'demo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6) + '.html';
      d.demoUrl = saveHtml(d.demo, htmlId);
      d.demoImage = await screenshot(htmlId);
    }
  }

  return parsed;
}

// ==================== Phase 2: 上下文协议（不变） ====================

async function gatherContext(apiConfig, userPrompt, chosenDirection) {
  const sys = `你是一位内容策划师。用户已选定方向，请生成问题清单帮助明确上下文。
输出 JSON：
{
  "directionSummary": "方向简述",
  "questions": [
    { "id": "q1", "dimension": "维度名", "question": "具体问题" }
  ]
}
最多 5 个问题。`;

  const result = await generate({
    ...apiConfig,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `需求：${userPrompt}\n方向：${JSON.stringify(chosenDirection)}` },
    ],
  });

  try { return JSON.parse(extractJSON(result)); } catch (e) { return { parseError: true, raw: result }; }
}

// ==================== Phase 3a: 大纲 ====================

async function generateOutline(apiConfig, userPrompt, direction, answers) {
  const ctx = answers ? Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join('\n') : '';

  const sys = `你是一位内容架构师。根据以下信息生成大纲。

方向：${direction}
上下文：${ctx}

输出 JSON：
{
  "title": "总标题",
  "sections": [ { "title": "章节标题", "purpose": "目的" } ]
}
5-8 章。`;

  const result = await generate({
    ...apiConfig,
    messages: [{ role: 'system', content: sys }, { role: 'user', content: `需求：${userPrompt}` }],
  });

  try { return JSON.parse(extractJSON(result)); } catch (e) { return { parseError: true, raw: result }; }
}

// ==================== Phase 3b: 全文 HTML 生成 ====================

async function generateFullContent(apiConfig, userPrompt, direction, outline) {
  const { buildMessages } = require('./context-builder');
  const sectionsText = (outline.sections || [])
    .map((s, i) => `${i + 1}. ${s.title} — ${s.purpose}`)
    .join('\n');

  const fullPrompt = `创作需求：${userPrompt}

选定方向：${direction.angle || direction.name}
语气：${direction.tone}
结构：${direction.structure || outline.title}

大纲：
${sectionsText}

请按大纲生成完整的视觉 HTML 页面（不是 markdown，是带视觉设计的完整网页）。`;

  const messages = buildMessages({ taskType: 'general', userPrompt: fullPrompt });
  const content = await generate({ ...apiConfig, messages });
  return content;
}

// ==================== 辅助 ====================

function extractJSON(text) {
  if (!text) return '{}';
  let t = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = t.indexOf('{'), end = t.lastIndexOf('}');
  return (start >= 0 && end > start) ? t.substring(start, end + 1) : t;
}

module.exports = { recommendDirections, gatherContext, generateOutline, generateFullContent };
