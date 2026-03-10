// "?"? DATA "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
const CUR = {
    E: [
        { n: 1, t: "Proses Bisnis Industri Ketenagalistrikan", s: "Proses Bisnis", jp: 8, sem: "Agt-Des" },
        { n: 2, t: "Perkembangan Teknologi dan Isu Global", s: "Teknologi & Isu Global", jp: 8, sem: "Agt-Des" },
        { n: 3, t: "Profesi dan Kewirausahaan", s: "Profesi & Wirausaha", jp: 8, sem: "Agt-Des" },
        { n: 4, t: "Teknik Dasar Proses Kerja dan Teknologi", s: "Teknik Dasar Kerja", jp: 4, sem: "Jan-Jul" },
        { n: 5, t: "Keselamatan dan Kesehatan Kerja (K3LH)", s: "K3LH", jp: 4, sem: "Jan-Jul" },
        { n: 6, t: "Teori Dasar Listrik dan Bahan", s: "Teori Dasar Listrik", jp: 4, sem: "Jan-Jul" },
        { n: 7, t: "Alat Tangan dan Alat Kerja Kelistrikan", s: "Alat Tangan & Kerja", jp: 8, sem: "Agt-Des" },
        { n: 8, t: "Alat Ukur dan Alat Uji Kelistrikan", s: "Alat Ukur & Uji", jp: 7, sem: "Jan-Jul" },
        { n: 9, t: "Perangkat Lunak Gambar Teknik Listrik", s: "Gambar Teknik", jp: 5, sem: "Jan-Jul" },
    ],
    F: [
        { n: 10, t: "Standar dan Peraturan", s: "Standar & Peraturan", jp: 5, sem: "Agt-Des" },
        { n: 11, t: "Sistem Kendali (PLC & Smart)", s: "Sistem Kendali", jp: 6, sem: "Jan-Jul" },
        { n: 12, t: "Instalasi Penerangan Listrik", s: "Instalasi Penerangan", jp: 8, sem: "Agt-Des" },
        { n: 13, t: "Instalasi Tenaga Listrik", s: "Instalasi Tenaga", jp: 5, sem: "Jan-Jul" },
        { n: 14, t: "Instalasi Motor Listrik", s: "Instalasi Motor", jp: 8, sem: "Agt-Des" },
        { n: 15, t: "Perbaikan Peralatan Listrik", s: "Perbaikan Peralatan", jp: 6, sem: "Jan-Jul" },
        { n: 16, t: "Perawatan Dan Perbaikan Instalasi", s: "Perawatan Instalasi", jp: 6, sem: "Jan-Jul" },
    ]
};
const ALL = [...CUR.E, ...CUR.F];

// "?"? STATE "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
// Multi-API load balancing
let apiConfigs = JSON.parse(localStorage.getItem('smk_apis') || '[]'); // [{name,provider,model,apiKey}]
let rrIndex = 0; // round-robin pointer
// Legacy single cfg support
let cfg = JSON.parse(localStorage.getItem('smk_cfg') || '{}');
if (cfg.apiKey && !apiConfigs.length) {
    apiConfigs = [{ name: cfg.provider || 'API 1', provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey }];
}
// Teacher names (configurable)
let teachers = JSON.parse(localStorage.getItem('smk_teachers') || '["Guru 1","Guru 2","Guru 3"]');
let prog = JSON.parse(localStorage.getItem('smk_prog') || '{}');
let logs = JSON.parse(localStorage.getItem('smk_logs') || '[]');
let cur_teacher = parseInt(localStorage.getItem('smk_teacher') || '0');
let hist = [];
let loading = false;

const MODELS = {
    gemini: ["gemini-2.0-flash-exp", "gemini-2.0-flash", "gemini-2.0-pro-exp", "gemini-1.5-flash", "gemini-1.5-pro"],
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    openrouter: [
        "google/gemini-2.0-flash-exp:free",
        "google/gemini-2.0-pro-exp-02-05:free",
        "deepseek/deepseek-r1:free",
        "deepseek/deepseek-chat:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwq-32b:free",
        "mistralai/mistral-7b-instruct:free",
        "microsoft/phi-4:free",
        "openai/gpt-4o-mini",
        "anthropic/claude-3-haiku"
    ],
    groq: [
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        "llama-3.1-8b-instant",
        "llama3-70b-8192",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
        "deepseek-r1-distill-llama-70b"
    ],
    cerebras: [
        "llama-3.3-70b",
        "llama-3.1-70b",
        "llama-3.1-8b",
        "llama3.1-8b",
        "llama3.1-70b"
    ],
    deepseek: [
        "deepseek-chat",
        "deepseek-reasoner"
    ],
    chutes: [
        "deepseek-ai/DeepSeek-R1",
        "deepseek-ai/DeepSeek-V3-0324",
        "meta-llama/Llama-3.3-70B-Instruct",
        "Qwen/QwQ-32B",
        "mistralai/Mistral-Small-3.1-24B-Instruct-2503"
    ],
    together: ["meta-llama/Llama-3-70b-chat-hf", "mistralai/Mixtral-8x7B-Instruct-v0.1"]
};

// "?"? SYSTEM PROMPT "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
function sysPrompt() {
    const done = ALL.filter(t => prog[t.n]?.status === 'done').map(t => `${t.n}.${t.t}`).join(', ') || 'Belum ada';
    const wip = ALL.filter(t => prog[t.n]?.status === 'wip').map(t => `${t.n}.${t.t}`).join(', ') || 'Belum ada';
    const none = ALL.filter(t => !prog[t.n] || prog[t.n].status === 'none').map(t => `${t.n}.${t.t}`).join(', ');
    const lastLogs = logs.slice(-5).map(l => `[${l.date}] ${l.teacher} mengajar "${l.topic}" ?" ${l.notes}`).join('\n') || 'Belum ada';
    return `Kamu adalah Asisten AI Pembelajaran untuk 3 guru SMK jurusan Teknik Instalasi Tenaga Listrik.

GURU AKTIF SEKARANG: Guru ${cur_teacher}

KURIKULUM (16 topik):
Fase E Kelas 1: ${CUR.E.map(t => `${t.n}.${t.t}(${t.jp}JP)`).join(', ')}
Fase F Kelas 2&3: ${CUR.F.map(t => `${t.n}.${t.t}(${t.jp}JP)`).join(', ')}

STATUS PROGRESS SAAT INI:
o. Selesai: ${done}
Y"" Sedang Berjalan: ${wip}
o Belum Mulai: ${none}

CATATAN HANDOVER TERAKHIR (5 sesi terakhir):
${lastLogs}

TOTAL PROGRESS: ${ALL.filter(t => prog[t.n]?.status === 'done').length}/16 topik selesai

PANDUAN:
- Jawab bahasa Indonesia yang hangat dan jelas
- Gunakan data progress di atas saat memberi rekomendasi topik selanjutnya
- Saat guru selesai mengajar, bantu buat handover summary yang jelas
- Perhatikan urutan prasyarat: K3LH & Teori Dasar Listrik harus sebelum instalasi
- Rekomendasi urutan: Proses Bisnis ?' Kewirausahaan ?' K3LH ?' Teori Dasar ?' Alat ?' Alat Ukur ?' Gambar Teknik ?' Standar ?' Instalasi Penerangan ?' Instalasi Tenaga ?' Motor ?' Kendali ?' Perbaikan ?' Perawatan
- Gunakan emoji untuk memperjelas jawaban`;
}

// "?"? RENDER SIDEBAR "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
function renderSidebar() {
    ['E', 'F'].forEach(ph => {
        const el = document.getElementById('list' + ph);
        el.innerHTML = '';
        CUR[ph].forEach(t => {
            const st = prog[t.n]?.status || 'none';
            const d = document.createElement('div');
            d.className = `ti ${ph.toLowerCase()}`;
            d.id = `ti${t.n}`;
            d.onclick = () => selectTopic(t.t);
            d.innerHTML = `<div class="tn">${t.n}</div><div style="flex:1"><div class="ti-title">${t.s}</div><div class="ti-meta">${t.jp} JP · ${t.sem}</div></div><div class="ts ${st}"></div>`;
            el.appendChild(d);
        });
    });
}

// "?"? PROGRESS BANNER "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
function updateBanner() {
    const done = ALL.filter(t => prog[t.n]?.status === 'done').length;
    const pct = Math.round(done / 16 * 100);
    document.getElementById('pText').textContent = `${done} dari 16 topik selesai (${pct}%)`;
    document.getElementById('pfill').style.width = pct + '%';
    const tname = teachers[cur_teacher] || `Guru ${cur_teacher + 1}`;
    document.getElementById('pTeacherInfo').textContent = `${tname} aktif`;
}

// "?"? TEACHER SELECTOR "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
function renderTeacherBtns() {
    const c = document.getElementById('teacherBtns');
    c.innerHTML = '';
    teachers.forEach((name, i) => {
        const b = document.createElement('button');
        b.className = 't-btn' + (i === cur_teacher ? ' active' : '');
        b.textContent = name;
        b.onclick = () => setTeacher(i);
        c.appendChild(b);
    });
}

function setTeacher(idx) {
    if (idx === cur_teacher) return;

    // Pengingat Wajib: Tanya catatan sebelum pindah guru
    const tname = teachers[cur_teacher] || `Guru ${cur_teacher + 1}`;
    if (confirm(`Apakah ${tname} ingin mengisi catatan handover (Selesai Mengajar) sebelum berganti guru?`)) {
        openHandover();
        return; // Batalkan perpindahan sampai mereka mengisi (atau tutup modal baru pindah)
    }

    cur_teacher = idx;
    localStorage.setItem('smk_teacher', idx);
    renderTeacherBtns();
    updateBanner();
    const newName = teachers[idx] || `Guru ${idx + 1}`;
    const tip = getHandoverTip(newName);
    addAI(`👋 **${newName} aktif!**\n\nKonteks sudah diperbarui. ${tip}`);
}

function getHandoverTip(tname) {
    const curName = tname || teachers[cur_teacher];
    const last = logs.filter(l => l.teacher !== curName).slice(-1)[0];
    if (!last) return 'Belum ada catatan handover dari guru sebelumnya.';
    return `Catatan terakhir dari **${last.teacher}** (${last.date}):\n> "${last.notes}"\n\nTopik: **${last.topic}** ?" Status: ${last.status === 'done' ? 'o. Selesai' : 'Y"" Masih berlanjut'}`;
}

// "?"? PROGRESS MODAL "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
function openProgress() {
    const grid = document.getElementById('tpGrid');
    grid.innerHTML = '';
    ALL.forEach(t => {
        const st = prog[t.n]?.status || 'none';
        const d = document.createElement('div');
        d.className = `tp-card ${st}`;
        d.onclick = () => cycleStatus(t.n);
        const tag = t.n <= 9 ? 'Y"~ E' : 'Y"- F';
        d.innerHTML = `<div class="tc-num" style="color:${t.n <= 9 ? 'var(--a2)' : 'var(--a3)'}">${tag}-${t.n}</div><div class="tc-t">${t.t}</div>`;
        grid.appendChild(d);
    });
    renderHandoverLog();
    document.getElementById('mProgress').classList.remove('h');
}

function cycleStatus(n) {
    const cur = prog[n]?.status || 'none';
    const next = { none: 'wip', wip: 'done', done: 'none' }[cur];
    const tName = teachers[cur_teacher] || `Guru ${cur_teacher + 1}`;
    const topicName = ALL.find(x => x.n === n)?.t || `Topik ${n}`;

    if (!prog[n]) prog[n] = {};
    prog[n].status = next;
    prog[n].teacher = tName;
    prog[n].updated = new Date().toLocaleDateString('id-ID');

    logs.push({
        teacher: tName,
        topic: topicName,
        status: next,
        notes: `(Otomatis) Mengubah status menjadi ${next === 'done' ? 'Selesai' : next === 'wip' ? 'Sedang Berjalan' : 'Belum Mulai'}`,
        date: new Date().toLocaleDateString('id-ID')
    });

    save();
    renderSidebar();
    updateBanner();
    openProgress();

    if (next === 'wip') {
        addAIOptions(`💡 **Status Diperbarui:** ${tName} mulai mengajarkan **${topicName}**. Apakah ingin memulai Pretest?`, [
            { label: "⚡ Mulai Pretest", cmd: `startQuiz('pre')` }
        ]);
    } else if (next === 'done') {
        addAIOptions(`✅ **Status Diperbarui:** ${tName} telah menyelesaikan **${topicName}**. Mari lakukan evaluasi akhir!`, [
            { label: "📊 Mulai Post-test", cmd: `startQuiz('post')` }
        ]);
    }
}

const TEACHER_COLORS = ['#79c0ff', '#56d364', '#d2a8ff', '#f78166', '#e3b341', '#a5d6ff'];
function teacherColor(name) {
    const idx = teachers.indexOf(name);
    return TEACHER_COLORS[idx >= 0 ? idx : teachers.length % TEACHER_COLORS.length];
}

function renderHandoverLog() {
    const v = document.getElementById('hlogView');
    const em = document.getElementById('emptyLog');
    v.innerHTML = '';
    if (!logs.length) { em.style.display = ''; return; }
    em.style.display = 'none';
    [...logs].reverse().forEach(l => {
        const d = document.createElement('div');
        d.className = 'hlog-item';
        const col = teacherColor(l.teacher);
        d.innerHTML = `<div class="hi"><span class="ht" style="background:${col}22;color:${col}">${l.teacher}</span><span class="hd">Y". ${l.date}</span><span class="hd">Y"- ${l.topic}</span><span class="hd">${l.status === 'done' ? 'o.' : 'Y""'}</span></div><p>${l.notes || '(tidak ada catatan)'}</p>`;
        v.appendChild(d);
    });
}

// "?"? HANDOVER MODAL "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
function openHandover() {
    const sel = document.getElementById('hTeacher');
    sel.innerHTML = teachers.map(n => `<option value="${n}">${n}</option>`).join('');
    sel.value = teachers[cur_teacher] || teachers[0];
    const topicSel = document.getElementById('hTopic');
    topicSel.innerHTML = '<option value="">-- Pilih topik --</option>';
    ALL.forEach(t => { const o = document.createElement('option'); o.value = t.t; o.textContent = `${t.n}. ${t.t}`; topicSel.appendChild(o); });
    document.getElementById('mHandover').classList.remove('h');
}

function saveHandover() {
    const teacher = document.getElementById('hTeacher').value;
    const topic = document.getElementById('hTopic').value;
    const status = document.getElementById('hStatus').value;
    const notes = document.getElementById('hNotes').value.trim();
    if (!topic) { alert('Pilih topik yang diajarkan!'); return; }
    const t = ALL.find(x => x.t === topic);
    if (t) { if (!prog[t.n]) prog[t.n] = {}; prog[t.n].status = status; prog[t.n].teacher = teacher; prog[t.n].updated = new Date().toLocaleDateString('id-ID'); }
    logs.push({ teacher, topic, status, notes, date: new Date().toLocaleDateString('id-ID') });
    save();
    cls('mHandover');
    renderSidebar();
    updateBanner();
    document.getElementById('hNotes').value = '';
    addAI(`o. **Catatan handover tersimpan dari ${teacher}!**\n\nTopik: **${topic}**\nStatus: ${status === 'done' ? 'o. Selesai' : 'Y"" Masih berlanjut'}\nCatatan: "${notes || '-'}"\n\nY"O Guru selanjutnya bisa melanjutkan dari sini. Saya siap membantu merencanakan kelanjutan materi.`);
}

// "?"? MULTI-API SETTINGS "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
function onProv() {
    const p = document.getElementById('newProv').value;
    const m = document.getElementById('newMdl');
    m.innerHTML = MODELS[p].map(x => `<option value="${x}">${x}</option>`).join('');
}

function renderApiList() {
    const c = document.getElementById('apiList');
    c.innerHTML = '';
    if (!apiConfigs.length) { c.innerHTML = '<p style="font-size:11px;color:var(--tx3);text-align:center;padding:10px">Belum ada API yang ditambahkan</p>'; return; }
    apiConfigs.forEach((a, i) => {
        const d = document.createElement('div');
        d.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;margin-bottom:6px';
        d.innerHTML = `<span style="font-size:18px">${provIcon(a.provider)}</span><div style="flex:1"><div style="font-size:12px;font-weight:600">${a.name}</div><div style="font-size:10px;color:var(--tx3)">${a.provider} · ${a.model.split('/').pop()}</div></div><span style="font-size:10px;padding:2px 7px;border-radius:4px;background:rgba(86,211,100,.15);color:var(--a3)">LB ${i + 1}</span><button onclick="removeApi(${i})" style="background:transparent;border:none;color:var(--a1);cursor:pointer;font-size:14px">o.</button>`;
        c.appendChild(d);
    });
}

function provIcon(p) { return { gemini: 'Y"', openai: 'YY', openrouter: 'YY', groq: 'YY', cerebras: 's', deepseek: 'Y<', chutes: '~️', together: 'Y' }[p] || 'Y-'; }

function addApiCfg() {
    const name = document.getElementById('newName').value.trim() || `API ${apiConfigs.length + 1}`;
    const provider = document.getElementById('newProv').value;
    const model = document.getElementById('newMdl').value;
    const apiKey = document.getElementById('newKey').value.trim();
    if (!apiKey) { alert('API Key wajib diisi!'); return; }
    apiConfigs.push({ name, provider, model, apiKey });
    saveApis();
    renderApiList();
    document.getElementById('newKey').value = '';
    document.getElementById('newName').value = '';
    updateStatusDot();
}

function removeApi(i) {
    apiConfigs.splice(i, 1);
    saveApis();
    renderApiList();
    updateStatusDot();
}

function saveApis() {
    localStorage.setItem('smk_apis', JSON.stringify(apiConfigs));
    rrIndex = 0;
}

function updateStatusDot() {
    const dot = document.getElementById('sdot');
    const txt = document.getElementById('stext');
    if (apiConfigs.length) {
        dot.classList.add('on');
        txt.textContent = `${apiConfigs.length} API aktif (LB)`;
    } else {
        dot.classList.remove('on');
        txt.textContent = 'Belum ada API';
    }
}

function openSettings() {
    renderApiList();
    onProv();
    document.getElementById('mSettings').classList.remove('h');
}

// "?"? API CALL (LOAD BALANCED) "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
const EP = {
    openai: 'https://api.openai.com/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    cerebras: 'https://api.cerebras.ai/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/v1/chat/completions',
    chutes: 'https://llm.chutes.ai/v1/chat/completions',
    together: 'https://api.together.xyz/v1/chat/completions'
};

async function callSingle(acfg, sys) {
    const { provider: p, apiKey: k, model: m } = acfg;
    if (p === 'gemini') {
        const contents = hist.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ system_instruction: { parts: [{ text: sys }] }, contents, generationConfig: { temperature: .7, maxOutputTokens: 2048 } })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error?.message || 'Gemini error');
        return d.candidates[0].content.parts[0].text;
    }
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` };
    if (p === 'openrouter') { headers['HTTP-Referer'] = 'https://smk-ai.local'; headers['X-Title'] = 'SMK AI'; }
    const msgs = [{ role: 'system', content: sys }, ...hist.map(h => ({ role: h.role, content: h.content }))];
    const r = await fetch(EP[p], { method: 'POST', headers, body: JSON.stringify({ model: m, messages: msgs, temperature: .7, max_tokens: 2048 }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || `${p} error`);
    return d.choices[0].message.content;
}

async function callAPI(msg) {
    if (!apiConfigs.length) throw new Error('Belum ada API Key. Klik sT️ Multi-API untuk menambahkan.');
    hist.push({ role: 'user', content: msg });
    const sys = sysPrompt();
    // Round-robin load balancing with fallback
    const startIdx = rrIndex;
    let lastErr;
    for (let attempt = 0; attempt < apiConfigs.length; attempt++) {
        const idx = (startIdx + attempt) % apiConfigs.length;
        const acfg = apiConfigs[idx];
        try {
            const result = await callSingle(acfg, sys);
            rrIndex = (idx + 1) % apiConfigs.length; // advance pointer for next call
            // Show which provider was used (small annotation)
            const usedLabel = `\n\n<span style="font-size:10px;color:var(--tx3);opacity:.7">${provIcon(acfg.provider)} ${acfg.name} · ${acfg.model.split('/').pop()}</span>`;
            return result + usedLabel;
        } catch (e) {
            lastErr = e;
            console.warn(`API ${acfg.name} gagal:`, e.message);
        }
    }
    throw lastErr || new Error('Semua API gagal');
}

// "?"? CHAT "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
function rmWelcome() { const w = document.getElementById('wc'); if (w) w.remove(); }
function scrollBot() { const m = document.getElementById('msgs'); m.scrollTop = m.scrollHeight; }

function addAI(txt) {
    rmWelcome();
    const d = document.createElement('div'); d.className = 'msg ai';
    d.innerHTML = `<div class="av ai">⚡</div><div class="bub">${fmt(txt)}</div>`;
    document.getElementById('msgs').appendChild(d);
    scrollBot();
}

function addAIOptions(txt, options = []) {
    rmWelcome();
    const d = document.createElement('div'); d.className = 'msg ai';
    let opts = options.map(o => `<button class="chip" style="margin:5px 5px 0 0;border-color:var(--a2);color:var(--a2)" onclick="${o.cmd}">${o.label}</button>`).join('');
    d.innerHTML = `<div class="av ai">⚡</div><div class="bub">${fmt(txt)}<div style="margin-top:10px">${opts}</div></div>`;
    document.getElementById('msgs').appendChild(d);
    scrollBot();
}
function addUser(txt) {
    rmWelcome();
    const d = document.createElement('div'); d.className = 'msg u';
    d.innerHTML = `<div class="av u">Y'</div><div class="bub">${esc(txt)}</div>`;
    document.getElementById('msgs').appendChild(d);
    scrollBot();
}
function addTyping() {
    rmWelcome();
    const d = document.createElement('div'); d.className = 'msg ai'; d.id = 'typ';
    d.innerHTML = `<div class="av ai">s</div><div class="bub"><div class="tdots"><div class="td"></div><div class="td"></div><div class="td"></div></div></div>`;
    document.getElementById('msgs').appendChild(d);
    scrollBot();
}
function rmTyping() { const t = document.getElementById('typ'); if (t) t.remove(); }

function fmt(t) {
    return t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^#{1,3} (.*?)$/gm, '<h3>$1</h3>')
        .replace(/^> (.*?)$/gm, '<blockquote style="border-left:3px solid var(--a2);padding-left:10px;color:var(--tx2);margin:6px 0">$1</blockquote>')
        .replace(/\n/g, '<br>');
}
function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

async function send() {
    const inp = document.getElementById('inp');
    const txt = inp.value.trim();
    if (!txt || loading) return;
    if (!apiConfigs.length) { openSettings(); return; }
    inp.value = ''; ar(inp); loading = true;
    document.getElementById('sbtn').disabled = true;
    addUser(txt); addTyping();
    try {
        const rep = await callAPI(txt);
        rmTyping();
        hist.push({ role: 'assistant', content: rep });
        addAI(rep);
    } catch (e) {
        rmTyping(); hist.pop();
        addAI(`❌ **Error:** ${e.message}\n\nPeriksa API Key atau koneksi internet.`);
    }
    loading = false; document.getElementById('sbtn').disabled = false;
}

function selectTopic(tTitle) {
    qa(`Jelaskan topik "${tTitle}" dan posisinya dalam urutan pembelajaran`);
    setTimeout(() => {
        addAIOptions(`📝 **Opsi Kuis untuk Topik Ini:**\nIngin melakukan uji pengetahuan sekarang?`, [
            { label: "⚡ Pretest (Uji Awal)", cmd: `startQuiz('pre')` },
            { label: "📊 Post-test (Uji Akhir)", cmd: `startQuiz('post')` }
        ]);
    }, 1000);
}

function qa(t) { document.getElementById('inp').value = t; send(); }
function hk(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }
function ar(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; }
function cls(id) { document.getElementById(id).classList.add('h'); }

// "?"? EXPORT "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
function exportData() {
    const data = { progress: prog, logs, exportDate: new Date().toISOString() };
    const a = document.createElement('a');
    a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(data, null, 2));
    a.download = 'smk-progress-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
}

// "?"? TEACHER MANAGEMENT "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
function openTeachers() {
    renderTeacherList();
    document.getElementById('mTeachers').classList.remove('h');
}

function renderTeacherList() {
    const c = document.getElementById('teacherList');
    c.innerHTML = '';
    teachers.forEach((name, i) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px';
        const col = TEACHER_COLORS[i % TEACHER_COLORS.length];
        row.innerHTML = `<div style="width:10px;height:10px;border-radius:50%;background:${col};flex-shrink:0"></div>
                    <input type="text" value="${name}" id="tname_${i}"
                        style="flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:7px;padding:7px 10px;color:var(--tx);font-family:inherit;font-size:12px;outline:none"
                        onchange="updateTeacherName(${i}, this.value)"/>
                    ${teachers.length > 1 ? `<button onclick="removeTeacher(${i})" style="background:transparent;border:none;color:var(--a1);cursor:pointer;font-size:14px">o.</button>` : ''}`;
        c.appendChild(row);
    });
}

function updateTeacherName(i, val) {
    if (!val.trim()) return;
    const old = teachers[i];
    teachers[i] = val.trim();
    saveTeachers();
    // Update logs references
    logs.forEach(l => { if (l.teacher === old) l.teacher = val.trim(); });
    Object.values(prog).forEach(p => { if (p.teacher === old) p.teacher = val.trim(); });
    save();
}

function addTeacher() {
    teachers.push(`Guru ${teachers.length + 1}`);
    saveTeachers();
    renderTeacherBtns();
    renderTeacherList();
}

function removeTeacher(i) {
    if (teachers.length <= 1) { alert('Minimal 1 guru diperlukan'); return; }
    teachers.splice(i, 1);
    if (cur_teacher >= teachers.length) cur_teacher = teachers.length - 1;
    saveTeachers();
    renderTeacherBtns();
    updateBanner();
    renderTeacherList();
}

function applyTeachers() {
    // save any inline edits
    teachers.forEach((_, i) => {
        const el = document.getElementById(`tname_${i}`);
        if (el) teachers[i] = el.value.trim() || teachers[i];
    });
    saveTeachers();
    renderTeacherBtns();
    updateBanner();
    cls('mTeachers');
    addAI(`o. **Pengaturan guru disimpan!** Guru aktif: ${teachers.join(', ')}`);
}

function saveTeachers() {
    localStorage.setItem('smk_teachers', JSON.stringify(teachers));
}

// -- SUPABASE SYNC --------------------------------
let sbClient = null;
const DEFAULT_SB = {
    url: "https://iynuakvizkbznjheuwzm.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bnVha3Zpemtiem5qaGV1d3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTAzMDYsImV4cCI6MjA4ODY2NjMwNn0.W2-tyA77V-2zncyDiSH7ZBac_TI1fp-fwt8OOFxCrMA"
};
let sbConfig = JSON.parse(localStorage.getItem("smk_supabase") || JSON.stringify(DEFAULT_SB));

function initSupabase() {
    if (!sbConfig || !sbConfig.url || !sbConfig.key) return;
    try {
        sbClient = supabase.createClient(sbConfig.url, sbConfig.key);
        console.log("Supabase connected");
    } catch (e) { console.warn("Supabase init failed:", e); sbClient = null; }
}

function openSupabase() {
    const u = document.getElementById("sbUrl");
    const k = document.getElementById("sbKey");
    const st = document.getElementById("sbSyncStatus");
    if (sbConfig) { u.value = sbConfig.url || ""; k.value = sbConfig.key || ""; }
    st.innerHTML = sbClient
        ? '<div style="background:rgba(86,211,100,.12);border:1px solid rgba(86,211,100,.3);border-radius:8px;padding:10px;margin-bottom:14px;font-size:12px;color:var(--a3)">&#9989; Terhubung ke Supabase</div>'
        : '<div style="background:rgba(247,129,102,.1);border:1px solid rgba(247,129,102,.3);border-radius:8px;padding:10px;margin-bottom:14px;font-size:12px;color:var(--a1)">&#9888;&#65039; Belum terhubung. Masukkan URL dan Key dari Supabase Dashboard &rarr; Settings &rarr; API</div>';
    document.getElementById("mSupabase").classList.remove("h");
}

async function connectSupabase() {
    const url = document.getElementById("sbUrl").value.trim();
    const key = document.getElementById("sbKey").value.trim();
    if (!url || !key) { alert("URL dan Key wajib diisi!"); return; }
    sbConfig = { url, key };
    localStorage.setItem("smk_supabase", JSON.stringify(sbConfig));
    initSupabase();
    if (!sbClient) { alert("Gagal terhubung. Periksa URL dan Key."); return; }
    cls("mSupabase");
    addAI("&#9889; **Supabase terhubung!** Memulai sinkronisasi...");
    await pullFromSupabase();
    await pushToSupabase();
    renderSidebar(); updateBanner(); renderTeacherBtns();
    addAI("&#9989; **Sync selesai!** Data sudah tersinkronisasi dengan cloud. Setiap perubahan akan otomatis di-sync.");
}

function disconnectSupabase() {
    sbClient = null; sbConfig = null;
    localStorage.removeItem("smk_supabase");
    cls("mSupabase");
    addAI("&#10060; **Supabase diputus.** Data hanya tersimpan lokal (localStorage).");
}

async function pullFromSupabase() {
    if (!sbClient) return;
    try {
        const { data: pd } = await sbClient.from("progress").select();
        if (pd && pd.length) { prog = {}; pd.forEach(p => { prog[p.id] = { status: p.status, teacher: p.teacher, updated: p.updated_at }; }); }
        const { data: ld } = await sbClient.from("logs").select().order("created_at", { ascending: true });
        if (ld) logs = ld.map(l => ({ teacher: l.teacher, topic: l.topic_id, status: l.status, notes: l.note, date: new Date(l.created_at).toLocaleDateString("id-ID") }));
        const { data: td } = await sbClient.from("teachers").select().order("sort_order", { ascending: true });
        if (td && td.length) teachers = td.map(t => t.name);
        const { data: ad } = await sbClient.from("apis").select();
        if (ad && ad.length) apiConfigs = ad.map(a => ({ name: a.label, provider: a.provider, model: a.model, apiKey: a.key }));
        // Save locally as backup
        localStorage.setItem("smk_prog", JSON.stringify(prog));
        localStorage.setItem("smk_logs", JSON.stringify(logs));
        localStorage.setItem("smk_teachers", JSON.stringify(teachers));
        localStorage.setItem("smk_apis", JSON.stringify(apiConfigs));
    } catch (e) { console.warn("Pull failed:", e); }
}

async function pushToSupabase() {
    if (!sbClient) return;
    try {
        // Progress - upsert
        for (const [tid, info] of Object.entries(prog)) {
            await sbClient.from("progress").upsert({ id: String(tid), topic_id: String(tid), status: info.status || "none", teacher: info.teacher || "", updated_at: new Date().toISOString() });
        }
        // Logs - clear and re-insert to avoid duplicates
        await sbClient.from("logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (logs.length) {
            const rows = logs.map(l => ({ topic_id: l.topic, teacher: l.teacher, status: l.status, note: l.notes || "", created_at: new Date().toISOString() }));
            await sbClient.from("logs").insert(rows);
        }
        // Teachers - replace all
        await sbClient.from("teachers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (teachers.length) {
            const rows = teachers.map((n, i) => ({ name: n, sort_order: i }));
            await sbClient.from("teachers").insert(rows);
        }
        // APIs - replace all
        await sbClient.from("apis").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (apiConfigs.length) {
            const rows = apiConfigs.map(a => ({ label: a.name, provider: a.provider, model: a.model, key: a.apiKey }));
            await sbClient.from("apis").insert(rows);
        }
    } catch (e) { console.warn("Push failed:", e); }
}

// -- SIDEBAR TOGGLE (mobile) ----------------------
function toggleSidebar() {
    const sb = document.getElementById("sidebarEl");
    const ov = document.getElementById("sidebarOverlay");
    sb.classList.toggle("open");
    ov.classList.toggle("show");
}

// "?"? PERSIST "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
function save() {
    localStorage.setItem('smk_prog', JSON.stringify(prog));
    localStorage.setItem('smk_logs', JSON.stringify(logs));
    // Async push to Supabase (non-blocking)
    if (sbClient) pushToSupabase().catch(e => console.warn('Sync push failed:', e));
}

// "?"? INIT "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
document.addEventListener('DOMContentLoaded', async () => {
    renderSidebar();
    renderTeacherBtns();
    updateBanner();
    onProv();
    updateStatusDot();

    // -- QUIZ GAME LOGIC ------------------------------
    window.currentQuiz = { questions: [], index: 0, score: 0 };

    window.startQuiz = async function (type) {
        let targetTopic;
        let promptType = "";

        if (type === 'pre') {
            // Pretest: Cari topik yang belum mulai
            targetTopic = ALL.find(t => !prog[t.n] || prog[t.n].status === 'none') || ALL[0];
            promptType = "PRETEST (Uji Awal): Fokus pada konsep dasar, definisi, dan prasyarat dasar.";
        } else {
            // Post-test: Cari topik yang sedang jalan atau sudah selesai
            targetTopic = ALL.find(t => prog[t.n]?.status === 'wip') || ALL.find(t => prog[t.n]?.status === 'done') || ALL[0];
            promptType = "POST-TEST (Uji Akhir): Fokus pada penerapan teknis, pemecahan masalah, dan pencapaian materi.";
        }

        const topicTitle = targetTopic.t;
        const modalTitle = type === 'pre' ? "⚡ Pretest: Knowledge Check" : "🏆 Post-test: Mastery Check";

        document.getElementById('mQuiz').querySelector('h2').textContent = modalTitle;
        document.getElementById('mQuiz').classList.remove('h');
        document.getElementById('quizGame').innerHTML = `<div style="padding:40px;text-align:center"><div class="tdots"><div class="td"></div><div class="td"></div><div class="td"></div></div><p style="margin-top:15px;color:var(--tx3)">AI sedang merancang soal ${type} untukmu...</p></div>`;

        const prompt = `Buat 5 pertanyaan kuis pilihan ganda tentang topik: "${topicTitle}". 
        Tujuan: ${promptType}
        Format harus JSON murni seperti ini: 
        [{"q": "Pertanyaan?", "a": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"], "c": 0}] 
        (c adalah indeks jawaban yang benar 0-3). MURNI JSON, jangan ada teks lain.`;

        try {
            const response = await callAPI(prompt);
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            window.currentQuiz = { questions: JSON.parse(cleanJson), index: 0, score: 0, type: type, topic: topicTitle };
            renderQuestion();
        } catch (e) {
            document.getElementById('quizGame').innerHTML = `<p style="color:var(--a1)">Gagal memuat soal. Periksa API Key.</p>`;
        }
    }

    function renderQuestion() {
        const q = window.currentQuiz.questions[window.currentQuiz.index];
        const cont = document.getElementById('quizGame');
        const rewards = [100000, 500000, 1000000, 5000000, 10000000];

        cont.innerHTML = `
            <div class="quiz-container">
                <div class="quiz-header">
                    <div class="quiz-reward">Rp ${rewards[window.currentQuiz.index].toLocaleString()}</div>
                    <div class="quiz-q">${q.q}</div>
                </div>
                <div class="quiz-options">
                    ${q.a.map((opt, i) => `
                        <div class="q-opt" onclick="selectOpt(${i}, this)">
                            <span style="font-weight:700;color:var(--a2)">${String.fromCharCode(65 + i)}</span> ${opt}
                        </div>
                    `).join('')}
                </div>
                <div class="quiz-stat">
                    <span>Soal ${window.currentQuiz.index + 1} / 5</span>
                    <span>Poin: ${window.currentQuiz.score}</span>
                </div>
            </div>
        `;
    }

    window.selectOpt = function (idx, el) {
        if (el.parentNode.classList.contains('locked')) return;
        el.parentNode.classList.add('locked');

        const q = window.currentQuiz.questions[window.currentQuiz.index];
        const opts = el.parentNode.children;
        const correctIdx = q.c;

        if (idx === correctIdx) {
            el.classList.add('correct');
            window.currentQuiz.score += 20;
        } else {
            el.classList.add('wrong');
            opts[correctIdx].classList.add('correct');
        }

        setTimeout(() => {
            window.currentQuiz.index++;
            if (window.currentQuiz.index < window.currentQuiz.questions.length) renderQuestion();
            else finishQuiz();
        }, 1500);
    }

    function finishQuiz() {
        const cont = document.getElementById('quizGame');
        const qz = window.currentQuiz;
        const total = qz.questions.length * 20; // 5 soal x 20 poin = 100
        const isPre = qz.type === 'pre';

        let feedback = "";
        if (isPre) {
            feedback = qz.score >= 60
                ? "Bagus! Kamu sudah punya dasar yang kuat untuk materi ini."
                : "Sepertinya materi ini baru bagimu. Mari kita mulai belajar dari dasar.";
        } else {
            feedback = qz.score >= 80
                ? "Luar biasa! Kamu telah menguasai materi ini dengan sangat baik."
                : "Masih ada beberapa hal yang perlu diulas. Jangan menyerah!";
        }

        cont.innerHTML = `
            <div style="padding:40px;text-align:center">
                <div style="font-size:48px;margin-bottom:15px">${qz.score >= 60 ? '🏆' : '📚'}</div>
                <h3>${isPre ? 'Pretest' : 'Post-test'} Selesai!</h3>
                <div class="quiz-reward" style="color:${isPre ? 'var(--a2)' : 'var(--a4)'}">Skor: ${qz.score} / ${total}</div>
                <p style="color:var(--tx2);margin-bottom:20px">${feedback}</p>
                <button class="btn-p" style="width:100%" onclick="cls('mQuiz')">Lanjut Belajar</button>
            </div>
        `;
        addAI(`🏁 **${isPre ? 'Pretest' : 'Post-test'} Selesai!** Skor kamu: **${qz.score}**. ${feedback}`);
    }

    // Initialize Supabase if configured
    initSupabase();
    if (sbClient) {
        try { await pullFromSupabase(); renderSidebar(); updateBanner(); renderTeacherBtns(); updateStatusDot(); } catch (e) { console.warn('Initial pull failed:', e); }
    }
    // close on overlay click
    ['mSettings', 'mProgress', 'mHandover', 'mTeachers', 'mSupabase', 'mQuiz'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', e => { if (e.target.id === id) cls(id); });
    });
    // Show welcome hint based on state
    if (!apiConfigs.length) {
        setTimeout(() => addAI('\ud83d\udc4b **Selamat datang!** Klik **\u2699\ufe0f Multi-API** untuk menambah API Key, lalu klik **\u2601\ufe0f Sync** untuk aktifkan cloud sync.'), 500);
    }
});