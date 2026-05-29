// ==================== 上下文组装器 ====================

const { loadSkillMain, loadTaskReferences } = require('../assets/skills');
const { HTML_FORMAT } = require('../assets/pptx-format');

/**
 * 组装完整的请求消息列表
 * @param {Object} opts
 * @param {string} opts.taskType  - 'design' | 'slide' | 'animation' | 'infographic' | 'critique' | 'general'
 * @param {string} opts.userPrompt - 用户输入的需求
 * @param {Array}  opts.extraRefs  - 额外的参考文档 key 列表
 * @returns {Array} messages - [{role, content}, ...]
 */
function buildMessages(opts) {
  const { taskType, userPrompt } = opts;
  const systemPrompt = buildSystemPrompt(taskType);
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * 构建 system prompt
 */
function buildSystemPrompt(taskType) {
  const mainSkill = loadSkillMain();
  const refs = loadTaskReferences(taskType || 'general');
  const parts = [mainSkill];

  // 追加相关参考文档
  const refKeys = Object.keys(refs);
  if (refKeys.length > 0) {
    parts.push('\n\n---\n## 参考资料\n');
    for (const key of refKeys) {
      parts.push(`\n### ${key}\n${refs[key]}`);
    }
  }

  // 注入输出格式指令（HTML 而非 markdown）
  parts.push(HTML_FORMAT);

  return parts.join('\n\n');
}

/**
 * 生成方向推荐的消息（magnesium-design 设计方向顾问模式）
 */
function buildDirectionMessages(userPrompt) {
  const mainSkill = loadSkillMain();
  const refs = loadTaskReferences('design');
  const designStyles = refs['design-styles'] || '';

  const directionPrompt = `${mainSkill}

---

## 参考资料
${designStyles}

---

## 你的任务

用户提出了一个设计需求。请从 5 种设计流派（现代主义、后现代主义、极简主义、参数化设计、系统化设计）中，推荐 3 个最适合该需求的差异化方向。

对于每个方向，输出：
1. 方向名称
2. 核心设计哲学（一句话）
3. 为什么会适应用户的需求
4. 一个简短的视觉描述（配色、字体、布局特征）

用户需求：
${userPrompt}`;

  return [
    { role: 'system', content: '你是一位设计方向顾问，擅长从多流派中推荐适合的设计方向。' },
    { role: 'user', content: directionPrompt },
  ];
}

module.exports = {
  buildMessages,
  buildSystemPrompt,
  buildDirectionMessages,
};
