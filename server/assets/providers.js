// ==================== 供应商配置 ====================

const PROVIDERS = {
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-v4-flash',
    useHttps: true,
    requiresToken: true,
  },
  qwen: {
    name: 'Qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    useHttps: true,
    requiresToken: true,
  },
  minimax: {
    name: 'Minimax',
    baseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'MiniMax-M2.1',
    useHttps: true,
    requiresToken: true,
  },
  glm: {
    name: 'GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4',
    useHttps: true,
    requiresToken: true,
  },
  kimi: {
    name: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    useHttps: true,
    requiresToken: true,
  },
};

const PROVIDER_KEYS = Object.keys(PROVIDERS);

/**
 * 获取供应商配置
 */
function getProvider(key) {
  return PROVIDERS[key] || PROVIDERS.deepseek;
}

/**
 * 验证供应商是否存在
 */
function isValidProvider(key) {
  return !!PROVIDERS[key];
}

module.exports = {
  PROVIDERS,
  PROVIDER_KEYS,
  getProvider,
  isValidProvider,
};
