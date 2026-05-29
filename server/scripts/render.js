// ==================== HTML 渲染管线 ====================
// 真正复刻 magnesium-design 的核心：
// AI 产出完整 HTML → 它就是设计本身 → 可以看、可以截、可以录

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * 保存 AI 生成的 HTML 到输出目录
 * @returns {string} 文件访问 URL
 */
function saveHtml(content, filename) {
  const name = filename || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + '.html');
  const filePath = path.join(OUTPUT_DIR, name);
  fs.writeFileSync(filePath, content, 'utf8');
  return '/output/' + name;
}

/**
 * 用 Playwright 截图
 * @returns {string} 截图文件 URL
 */
async function screenshot(htmlFile, opts) {
  opts = opts || {};
  try {
    const { chromium } = require('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.setViewportSize({
      width: opts.width || 1920,
      height: opts.height || 1080,
    });

    const filePath = path.join(OUTPUT_DIR, htmlFile);
    await page.goto('file://' + filePath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const screenshotId = htmlFile.replace('.html', '.png');
    const screenshotPath = path.join(OUTPUT_DIR, screenshotId);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await browser.close();

    return '/output/' + screenshotId;
  } catch (e) {
    console.error('[render] 截图失败:', e.message);
    return null;
  }
}

/**
 * 提供 output 目录的静态访问
 */
function serveOutput(app) {
  app.use('/output', require('express').static(OUTPUT_DIR));
}

/**
 * HTML 动画 → MP4 视频
 */
async function renderVideo(htmlFile, opts) {
  opts = opts || {};
  try {
    const { chromium } = require('playwright');
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: opts.width || 1920, height: opts.height || 1080 },
      recordVideo: { dir: OUTPUT_DIR, size: { width: opts.width || 1920, height: opts.height || 1080 } },
    });
    const page = await context.newPage();

    const filePath = path.join(OUTPUT_DIR, htmlFile);
    await page.goto('file://' + filePath, { waitUntil: 'networkidle', timeout: 15000 });

    // 等 __ready 信号或超时 3s
    try {
      await page.waitForFunction('window.__ready === true', { timeout: 3000 });
    } catch (e) {}

    const duration = Math.min(parseFloat(opts.duration) || 15, 30);
    await page.waitForTimeout(duration * 1000);

    await context.close();
    await browser.close();

    // Playwright 生成的视频文件在临时目录，找到最新的 webm
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
    if (files.length > 0) {
      const latest = files.sort().pop();
      const videoId = htmlFile.replace('.html', '.mp4');
      const webmPath = path.join(OUTPUT_DIR, latest);
      const mp4Path = path.join(OUTPUT_DIR, videoId);

      // 尝试用 ffmpeg 转 mp4，失败就用 webm
      try {
        const { execSync } = require('child_process');
        execSync('ffmpeg -y -i "' + webmPath + '" -c:v libx264 -preset fast "' + mp4Path + '"', { timeout: 30000, stdio: 'pipe' });
        fs.unlinkSync(webmPath);
        return '/output/' + videoId;
      } catch (e) {
        const webmUrl = '/output/' + htmlFile.replace('.html', '.webm');
        try { fs.renameSync(webmPath, path.join(OUTPUT_DIR, htmlFile.replace('.html', '.webm'))); } catch (e2) {}
        return webmUrl;
      }
    }
    return null;
  } catch (e) {
    console.error('[render] 视频渲染失败:', e.message);
    return null;
  }
}

module.exports = {
  saveHtml,
  screenshot,
  renderVideo,
  serveOutput,
};
