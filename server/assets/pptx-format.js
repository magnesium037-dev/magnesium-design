// ==================== HTML 视觉输出格式 ====================
//
// AI 不输出 markdown，不输出 PPTX 片段。
// AI 输出完整的、有视觉设计的 HTML 页面。
// 这就是花叔的本质：HTML 就是画。

const HTML_FORMAT = `
## 输出格式：完整的 HTML 视觉页面

你是一位视觉设计师。请输出一个完整的、美观的 HTML 文件。

规则：
1. 这是一个独立可看的页面，不是 PPTX 片段
2. 必须有视觉设计——颜色搭配、字号层次、留白、分割线、对比
3. 内容用 <h1>-<h6> 和 <p> 包裹，背景/装饰用 <div>
4. 总宽度不超过 960pt，可以用多"页"（每"页"一个 section）
5. 不要用渐变，用纯色。字体用 Microsoft YaHei 或 system-ui
6. 禁止 AI slop：不要紫渐变、不要 emoji 装饰、不要圆角左 accent

结构示例：
<html>
<body style="background:#F8FAFC; font-family:Microsoft YaHei,sans-serif; max-width:960pt; margin:0 auto;">
  <!-- 封面 -->
  <section style="background:#1E293B; padding:80pt 60pt; min-height:540pt; display:flex; flex-direction:column; justify-content:center;">
    <h1 style="color:#FFFFFF; font-size:42pt; font-weight:700; margin:0 0 16pt 0;">标题</h1>
    <p style="color:#94A3B8; font-size:20pt; margin:0;">副标题</p>
  </section>

  <!-- 内容页 -->
  <section style="background:#FFFFFF; padding:60pt 80pt; min-height:540pt;">
    <h2 style="color:#1E293B; font-size:28pt; margin:0 0 8pt 0;">章节标题</h2>
    <div style="background:#3B82F6; height:3pt; width:40pt; margin-bottom:24pt;"></div>
    <p style="color:#475569; font-size:15pt; line-height:2;">正文内容...</p>
  </section>

  <!-- 可重复多个 section -->
</body>
</html>

每页 section 之间要有明显的视觉节奏变化（底色、字号层次、留白量）。

## 反 AI slop 规则（必须遵守）

以下元素禁止使用：
- 紫色渐变或紫蓝色渐变背景
- CSS 渐变（用纯色）
- 圆角卡片 + 左侧彩色 accent border
- Inter / Roboto / Arial 字体做 display
- 赛博霓虹色 / GitHub dark #0D1117 背景
- 装饰性无意义 emoji 或 SVG 图标

建议使用：
- 有温度的底色（暖灰、米白、浅墨绿）配合单个 accent 色
- serif 字体做标题（如 Georgia、Noto Serif SC）
- text-wrap: pretty
- CSS Grid 精准分栏
- oklch() 或品牌色，不凭空发明颜色
`;

function parseSlides(html) {
  const slides = [];
  const re = /<section[^>]*>([\s\S]*?)<\/section>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    slides.push({ html: m[1].trim() });
  }
  if (slides.length === 0 && html.trim()) slides.push({ html });
  return slides;
}

function slideStats(slides) {
  return { total: slides.length, chars: slides.reduce((s, sl) => s + sl.html.length, 0) };
}

module.exports = { HTML_FORMAT, parseSlides, slideStats };
