// ==================== 技能文件加载器 ====================

const fs = require('fs');
const path = require('path');

// SKILL.md 所在目录（指向 magnesium-design 仓库）
const MAGNESIUM_DIR = path.resolve(__dirname, '..');

// 兜底 prompt：当 SKILL.md 不存在时使用
const FALLBACK_PROMPT = `你是一位资深的全栈设计师。请根据用户的需求，生成高质量的设计方案。

核心要求：
1. 输出结构清晰，包含设计思路和具体方案
2. 注意排版细节，使用合适的视觉语言
3. 提供可落地的设计建议`;

/**
 * 加载 SKILL.md 主文件
 */
function loadSkillMain() {
  const skillPath = path.join(MAGNESIUM_DIR, 'SKILL.md');
  try {
    const content = fs.readFileSync(skillPath, 'utf8');
    return content;
  } catch (e) {
    console.warn('[skills] 未找到 SKILL.md，使用兜底 prompt');
    return FALLBACK_PROMPT;
  }
}

/**
 * 加载 references 目录下的参考文档
 */
function loadReferences() {
  const refDir = path.join(MAGNESIUM_DIR, 'references');
  const docs = {};

  try {
    const files = fs.readdirSync(refDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const key = file.replace('.md', '');
        const content = fs.readFileSync(path.join(refDir, file), 'utf8');
        docs[key] = content;
      }
    }
    console.log('[skills] 已加载 ' + Object.keys(docs).length + ' 份参考文档');
  } catch (e) {
    console.warn('[skills] 未找到 references 目录');
  }

  return docs;
}

/**
 * 按任务类型加载相关参考文档
 * @param {string} taskType - design / slide / animation / infographic / critique
 */
function loadTaskReferences(taskType) {
  const allDocs = loadReferences();
  const taskMap = {
    design: ['design-styles', 'design-context', 'content-guidelines'],
    slide: ['slide-decks', 'editable-pptx', 'design-styles'],
    animation: ['animations', 'animation-pitfalls', 'animation-best-practices', 'cinematic-patterns'],
    infographic: ['design-styles', 'content-guidelines'],
    critique: ['critique-guide'],
    general: [],
  };

  const keys = taskMap[taskType] || taskMap.general;
  const result = {};
  for (const key of keys) {
    if (allDocs[key]) {
      result[key] = allDocs[key];
    }
  }
  return result;
}

/**
 * 获取技能状态
 */
function getSkillStatus() {
  const skillPath = path.join(MAGNESIUM_DIR, 'SKILL.md');
  const exists = fs.existsSync(skillPath);
  return {
    loaded: exists,
    skillPath: skillPath,
    mainLength: exists ? fs.statSync(skillPath).size : 0,
  };
}

module.exports = {
  MAGNESIUM_DIR,
  loadSkillMain,
  loadReferences,
  loadTaskReferences,
  getSkillStatus,
};
