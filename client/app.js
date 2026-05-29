// ==================== Magnesium Design MVP — 三阶段工作流 ====================

const API_BASE = window.API_BASE || '';

let session = { token: '', provider: 'deepseek', model: '', prompt: '', direction: null, outline: null, mode: 'content' };

// ========== 模式切换 ==========
document.querySelectorAll('.mode-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    session.mode = btn.dataset.mode;
    if (session.mode === 'animation') {
      document.getElementById('startBtn').textContent = '生成动画';
      stepLabel.textContent = '动画模式：输入需求，直接生成 MP4';
    } else {
      document.getElementById('startBtn').textContent = '开始';
      stepLabel.textContent = 'Step 1: 输入需求';
    }
  });
});

// ========== DOM ==========
const steps = ['input', 'directions', 'context', 'outline', 'result'].reduce((acc, id) => {
  acc[id] = document.getElementById('step-' + id);
  return acc;
}, {});

const stepLabel = document.getElementById('stepLabel');
const errorArea = document.getElementById('errorArea');
let lastContent = '';

// Step 1
document.getElementById('configForm').addEventListener('submit', e => { e.preventDefault(); startAdvisor(); });
document.getElementById('toggleToken').addEventListener('click', () => {
  const el = document.getElementById('token');
  const isPwd = el.type === 'password';
  el.type = isPwd ? 'text' : 'password';
  document.getElementById('toggleToken').textContent = isPwd ? 'hide' : 'show';
});

// ========== 阶段流转 ==========
function apiConfig() {
  return { provider: session.provider, token: session.token, model: session.model };
}

function collectConfig() {
  session.token = document.getElementById('token').value.trim();
  session.provider = document.getElementById('provider').value;
  session.model = document.getElementById('model') ? document.getElementById('model').value.trim() : '';
  session.prompt = document.getElementById('prompt').value.trim();
  if (!session.token) { showErr('请输入 API Token'); return false; }
  if (!session.prompt) { showErr('请输入需求描述'); return false; }
  return true;
}

// ========== Phase 1: 方向顾问 ==========

async function startAdvisor() {
  if (!collectConfig()) return;
  if (session.mode === 'animation') { startAnimation(); return; }
  goStep('directions');
  document.getElementById('directionList').innerHTML = '<div class="loading">分析需求中...</div>';
  document.getElementById('btnDirections').disabled = true;

  try {
    const res = await fetch(API_BASE + '/api/advisor', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...apiConfig(), prompt: session.prompt }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '请求失败');

    renderDirections(data);
  } catch (err) {
    showErr(err.message);
  }
}

function renderDirections(data) {
  const dirs = data.directions || [];
  const list = document.getElementById('directionList');
  list.innerHTML = dirs.map((d, i) => `
    <div class="dir-card" data-idx="${i}">
      ${d.demoImage ? '<img class="dir-demo" src="' + d.demoImage + '" alt="' + d.name + '风格演示">' : ''}
      <div class="dir-name">${d.name}</div>
      <div class="dir-detail"><span class="dir-tag">角度</span> ${d.angle || '-'}</div>
      <div class="dir-detail"><span class="dir-tag">语气</span> ${d.tone || '-'}</div>
      <div class="dir-detail"><span class="dir-tag">结构</span> ${d.structure || '-'}</div>
      <div class="dir-detail dir-why">${d.why || ''}</div>
    </div>
  `).join('');

  document.querySelectorAll('.dir-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.dir-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      session.direction = dirs[parseInt(card.dataset.idx)];
      document.getElementById('btnDirections').disabled = false;
    });
  });

  document.getElementById('btnDirections').onclick = () => startContext();
}

// ========== Phase 2: 上下文协议 ==========

async function startContext() {
  goStep('context');
  document.getElementById('contextForm').innerHTML = '<div class="loading">收集上下文中...</div>';

  try {
    const res = await fetch(API_BASE + '/api/context', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...apiConfig(), prompt: session.prompt, direction: session.direction }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '请求失败');

    renderContext(data);
  } catch (err) {
    showErr(err.message);
  }
}

function renderContext(data) {
  const questions = data.questions || [];
  const form = document.getElementById('contextForm');
  form.onsubmit = null;
  form.innerHTML = questions.map(q => `
    <div class="field">
      <label>${q.dimension}</label>
      <input class="input" data-qid="${q.id}" placeholder="${q.question}">
    </div>
  `).join('') + '<button type="submit" class="btn-primary">下一步</button>';

  form.addEventListener('submit', e => {
    e.preventDefault();
    const answers = {};
    form.querySelectorAll('[data-qid]').forEach(el => {
      answers[el.dataset.qid] = el.value.trim();
    });
    startOutline(answers);
  });
}

// ========== Phase 3a: 大纲 ==========

async function startOutline(answers) {
  goStep('outline');
  document.getElementById('outlineContent').innerHTML = '<div class="loading">生成大纲中...</div>';

  try {
    const res = await fetch(API_BASE + '/api/outline', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...apiConfig(), prompt: session.prompt, direction: session.direction, answers }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '请求失败');

    session.outline = { title: data.title, sections: data.sections };
    renderOutline(data);
  } catch (err) {
    showErr(err.message);
  }
}

function renderOutline(data) {
  document.getElementById('outlineContent').innerHTML = `
    <h2 class="outline-title">${data.title || '大纲'}</h2>
    <ol class="outline-list">
      ${(data.sections || []).map(s => `<li><strong>${s.title}</strong> <span class="dim">— ${s.purpose}</span></li>`).join('')}
    </ol>
  `;

  document.getElementById('btnApprove').onclick = () => startGenerate();
  document.getElementById('btnFeedback').onclick = () => startContext(); // 回到上下文
}

// ========== Phase 3b: 全文生成 ==========

async function startGenerate() {
  goStep('result');
  document.getElementById('resultContent').innerHTML = '<div class="loading">生成全文...</div>';

  try {
    const res = await fetch(API_BASE + '/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...apiConfig(), prompt: session.prompt, direction: session.direction, outline: session.outline }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '请求失败');

    lastContent = data.content;
    document.getElementById('resultContent').textContent = data.content;
    const viewBtn = document.getElementById('viewHtmlBtn');
    viewBtn.href = data.htmlUrl || '#';
    viewBtn.textContent = data.htmlUrl ? '打开 HTML' : '(无预览)';

    if (data.imageUrl) {
      const img = document.getElementById('resultImage');
      img.src = data.imageUrl;
      img.style.display = '';
    }
  } catch (err) {
    showErr(err.message);
  }
}

// ========== 结果操作 ==========

document.getElementById('copyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(lastContent).then(() => {
    document.getElementById('copyBtn').textContent = '已复制';
    setTimeout(() => { document.getElementById('copyBtn').textContent = '复制'; }, 1500);
  });
});

document.getElementById('downloadPptxBtn').addEventListener('click', async () => {
  if (!lastContent) return showErr('请先生成内容');
  const btn = document.getElementById('downloadPptxBtn');
  btn.textContent = '生成中...'; btn.disabled = true;
  try {
    const res = await fetch(API_BASE + '/api/export/pptx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: lastContent }),
    });
    if (!res.ok) throw new Error('导出失败');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'output-' + Date.now() + '.pptx'; a.click();
    URL.revokeObjectURL(url);
  } catch (err) { showErr('PPTX 导出失败: ' + err.message); }
  finally { btn.textContent = '下载 PPTX'; btn.disabled = false; }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  session = { token: session.token, provider: session.provider, model: session.model, prompt: '', direction: null, outline: null };
  lastContent = '';
  document.getElementById('resultImage').style.display = 'none';
  goStep('input');
});

// ========== UI 辅助 ==========

// ========== 动画模式 ==========

async function startAnimation() {
  goStep('result');
  document.getElementById('resultContent').innerHTML = '<div class="loading">生成动画中...</div>';

  try {
    const res = await fetch(API_BASE + '/api/animation', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...apiConfig(), prompt: session.prompt }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '请求失败');

    lastContent = data.content;
    const viewBtn = document.getElementById('viewHtmlBtn');
    viewBtn.href = data.htmlUrl || '#';
    viewBtn.textContent = '打开 HTML';

    if (data.videoUrl) {
      document.getElementById('resultContent').innerHTML =
        '<video controls style="max-width:100%;border-radius:8px;" src="' + data.videoUrl + '"></video>';
    } else {
      document.getElementById('resultContent').textContent = data.content.substring(0, 500) + '...';
    }
  } catch (err) { showErr(err.message); }
}

function showErr(msg) {
  errorArea.textContent = msg;
  errorArea.style.display = '';
}

function goStep(name) {
  Object.values(steps).forEach(s => s.style.display = 'none');
  if (steps[name]) steps[name].style.display = '';
  const labels = { input: 'Step 1: 输入需求', directions: 'Step 2: 选择方向', context: 'Step 3: 确认上下文', outline: 'Step 4: 确认大纲', result: 'Step 5: 生成结果' };
  stepLabel.textContent = labels[name] || '';
  errorArea.style.display = 'none';
}
