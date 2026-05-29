// ==================== 统一 LLM 调用客户端 ====================

const https = require('https');
const http = require('http');
const { getProvider } = require('../assets/providers');

/**
 * 调用 LLM API，返回完整结果
 */
function generate(apiConfig) {
  const { provider, token, model, messages, maxTokens, temperature } = apiConfig;
  const prov = getProvider(provider);
  const url = prov.baseUrl + '/chat/completions';
  const modelName = model || prov.defaultModel;

  const body = JSON.stringify({
    model: modelName,
    messages: messages,
    max_tokens: maxTokens || 8192,
    temperature: temperature ?? 0.8,
    stream: false,
  });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const httpMod = prov.useHttps ? https : http;

    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (prov.useHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers,
      timeout: 120000,
    };

    const req = httpMod.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.choices && json.choices[0] && json.choices[0].message) {
            resolve(json.choices[0].message.content);
          } else {
            reject(new Error((json.error && json.error.message) || 'API 返回异常'));
          }
        } catch (e) {
          reject(new Error('解析响应失败'));
        }
      });
    });

    req.on('error', (e) => reject(new Error('网络错误: ' + e.message)));
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
    req.write(body);
    req.end();
  });
}

/**
 * 流式调用 LLM API
 * @param {Object} apiConfig - 同 generate
 * @param {Object} handlers - { onData(content), onDone(), onError(err) }
 */
function generateStream(apiConfig, handlers) {
  const { provider, token, model, messages, maxTokens, temperature } = apiConfig;
  const prov = getProvider(provider);
  const url = prov.baseUrl + '/chat/completions';
  const modelName = model || prov.defaultModel;

  const body = JSON.stringify({
    model: modelName,
    messages: messages,
    max_tokens: maxTokens || 8192,
    temperature: temperature ?? 0.8,
    stream: true,
  });

  const urlObj = new URL(url);
  const httpMod = prov.useHttps ? https : http;

  const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (prov.useHttps ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method: 'POST',
    headers,
    timeout: 120000,
  };

  const req = httpMod.request(options, (res) => {
    let buffer = '';

    res.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            if (json.choices && json.choices[0] && json.choices[0].delta) {
              const content = json.choices[0].delta.content || '';
              if (content) handlers.onData(content);
            }
          } catch (e) { /* 跳过解析失败的行 */ }
        }
      }
    });

    res.on('end', () => handlers.onDone());
  });

  req.on('error', (e) => handlers.onError(new Error('网络错误: ' + e.message)));
  req.on('timeout', () => { req.destroy(); handlers.onError(new Error('请求超时')); });
  req.write(body);
  req.end();
}

module.exports = {
  generate,
  generateStream,
};
