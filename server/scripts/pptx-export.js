// ==================== PPTX 导出（Playwright 渲染管线）====================
// 完全复刻 magnesium-design html2pptx.js 思路：
// HTML → Playwright 真实浏览器 → computedStyle → pptxgenjs

let PptxGenJS;
try { PptxGenJS = require('pptxgenjs'); } catch (e) {}

const fs = require('fs');
const path = require('path');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');

async function exportToPptx(htmlContent) {
  if (!PptxGenJS) throw new Error('pptxgenjs 未安装');

  // 1. 保存 HTML 到临时文件
  const id = Date.now().toString(36);
  const htmlPath = path.join(OUTPUT_DIR, id + '_pptx.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  const SLIDE_W = 13.333;
  const SLIDE_H = 7.5;
  const PX_PER_IN = 96;
  const PT_PER_PX = 0.75;
  const INCH_PER_PT = 1 / 72;

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(500);

    // 2. 从浏览器提取每个 section 的元素和 computedStyle
    const slidesData = await page.evaluate(() => {
      const sections = document.querySelectorAll('section');
      const result = [];

      sections.forEach(section => {
        const elements = [];
        const walker = document.createTreeWalker(section, NodeFilter.SHOW_ELEMENT);
        let node;
        while ((node = walker.nextNode())) {
          if (['H1','H2','H3','H4','H5','H6','P'].includes(node.tagName)) {
            const rect = node.getBoundingClientRect();
            const sectionRect = section.getBoundingClientRect();
            const style = window.getComputedStyle(node);
            elements.push({
              tag: node.tagName,
              text: node.textContent.trim(),
              x: rect.left - sectionRect.left,
              y: rect.top - sectionRect.top,
              w: rect.width,
              h: rect.height,
              fontSize: parseFloat(style.fontSize),
              color: style.color,
              fontWeight: style.fontWeight,
              textAlign: style.textAlign,
              fontFamily: style.fontFamily,
              lineHeight: style.lineHeight,
              backgroundColor: style.backgroundColor,
            });
          }
        }

        // 提取 section 背景色
        const secStyle = window.getComputedStyle(section);
        result.push({
          bg: secStyle.backgroundColor,
          elements,
        });
      });

      return result;
    });

    await browser.close();

    // 3. 翻译成 pptxgenjs
    for (const sdata of slidesData) {
      const slide = pres.addSlide();
      if (sdata.bg && sdata.bg !== 'rgba(0, 0, 0, 0)' && sdata.bg !== 'transparent') {
        slide.background = { color: rgbToHex(sdata.bg) };
      }

      for (const el of sdata.elements) {
        if (!el.text) continue;
        const x = (el.x / PX_PER_IN) + 0.3;
        const y = (el.y / PX_PER_IN);
        const w = Math.min(el.w / PX_PER_IN, SLIDE_W - 1);
        const h = Math.min(el.h / PX_PER_IN, 4);

        if (x < 0 || y < 0 || w <= 0 || h <= 0) continue;

        const fontSize = el.fontSize * PT_PER_PX;
        const color = rgbToHex(el.color);
        const bold = parseInt(el.fontWeight) >= 600;

        slide.addText(el.text, {
          x, y, w, h,
          fontSize, color: color || '1E293B',
          fontFace: el.fontFamily.split(',')[0].replace(/"/g, ''),
          bold, align: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'right' : 'left',
          valign: 'top',
        });
      }
    }
  } finally {
    // 清理临时文件
    try { fs.unlinkSync(htmlPath); } catch (e) {}
  }

  return pres.stream();
}

function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent') return null;
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) {
    return parseInt(m[1]).toString(16).padStart(2,'0')
         + parseInt(m[2]).toString(16).padStart(2,'0')
         + parseInt(m[3]).toString(16).padStart(2,'0');
  }
  return null;
}

module.exports = { exportToPptx };
