/* ============ داده و وضعیت ============ */
const state = {
  step: 1,
  totalSteps: 10,
  answers: JSON.parse(localStorage.getItem('planner_answers') || '{}'),
  subjects: JSON.parse(localStorage.getItem('planner_subjects') || '[]'),
  levels: JSON.parse(localStorage.getItem('planner_levels') || '{}'),
  plan: JSON.parse(localStorage.getItem('planner_plan') || 'null'),
  points: parseInt(localStorage.getItem('planner_points') || '0')
};

const DAYS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];

/* ============ تم ============ */
const themeToggle = document.getElementById('themeToggle');
function applyTheme(){
  const dark = localStorage.getItem('planner_theme') === 'dark';
  document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeToggle.textContent = dark ? '☀️' : '🌙';
}
themeToggle.addEventListener('click', () => {
  const dark = document.body.getAttribute('data-theme') === 'dark';
  localStorage.setItem('planner_theme', dark ? 'light' : 'dark');
  applyTheme();
});
applyTheme();

/* ============ انتخاب گزینه‌های کارتی ============ */
document.querySelectorAll('.grid-options').forEach(group => {
  const field = group.dataset.field;
  const multi = group.classList.contains('multi');
  group.querySelectorAll('.opt-card').forEach(card => {
    // بازیابی انتخاب قبلی
    const saved = state.answers[field];
    if (multi && Array.isArray(saved) && saved.includes(card.dataset.value)) card.classList.add('selected');
    if (!multi && saved === card.dataset.value) card.classList.add('selected');

    card.addEventListener('click', () => {
      if (multi) {
        card.classList.toggle('selected');
        const values = [...group.querySelectorAll('.opt-card.selected')].map(c => c.dataset.value);
        state.answers[field] = values;
      } else {
        group.querySelectorAll('.opt-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.answers[field] = card.dataset.value;
      }
      saveAnswers();
      if (field === 'colorTheme') document.body.setAttribute('data-color', state.answers.colorTheme);
    });
  });
});
if (state.answers.colorTheme) document.body.setAttribute('data-color', state.answers.colorTheme);

/* ============ فیلدهای متنی مرحله ۶ ============ */
const daysLeftInput = document.getElementById('daysLeft');
const targetDateInput = document.getElementById('targetDate');
daysLeftInput.value = state.answers.daysLeft || '';
targetDateInput.value = state.answers.targetDate || '';
daysLeftInput.addEventListener('input', () => { state.answers.daysLeft = daysLeftInput.value; saveAnswers(); });
targetDateInput.addEventListener('input', () => { state.answers.targetDate = targetDateInput.value; saveAnswers(); });

/* ============ مدیریت دروس (مرحله ۲) ============ */
const subjectList = document.getElementById('subjectList');
const subjectName = document.getElementById('subjectName');
const subjectPriority = document.getElementById('subjectPriority');

function renderSubjects(){
  subjectList.innerHTML = '';
  state.subjects.forEach((s, i) => {
    const li = document.createElement('li');
    const pLabel = s.priority == 3 ? 'بالا' : s.priority == 2 ? 'متوسط' : 'پایین';
    li.innerHTML = `<span>${s.name} — اولویت ${pLabel}</span><button data-i="${i}">حذف</button>`;
    subjectList.appendChild(li);
  });
  subjectList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.subjects.splice(parseInt(btn.dataset.i), 1);
      saveSubjects(); renderSubjects(); renderLevels();
    });
  });
}

document.getElementById('addSubjectBtn').addEventListener('click', () => {
  const name = subjectName.value.trim();
  if (!name) return;
  state.subjects.push({ name, priority: parseInt(subjectPriority.value) });
  subjectName.value = '';
  saveSubjects();
  renderSubjects();
  renderLevels();
});

/* ============ سطح دروس (مرحله ۳) ============ */
const levelContainer = document.getElementById('levelContainer');
function renderLevels(){
  levelContainer.innerHTML = '';
  if (state.subjects.length === 0){
    levelContainer.innerHTML = '<p class="hint">ابتدا در مرحله ۲ درس اضافه کنید.</p>';
    return;
  }
  state.subjects.forEach(s => {
    const row = document.createElement('div');
    row.className = 'level-row';
    const current = state.levels[s.name] || 'motevaset';
    row.innerHTML = `
      <span>${s.name}</span>
      <select data-subject="${s.name}">
        <option value="zaif" ${current==='zaif'?'selected':''}>ضعیف</option>
        <option value="motevaset" ${current==='motevaset'?'selected':''}>متوسط</option>
        <option value="ghavi" ${current==='ghavi'?'selected':''}>قوی</option>
      </select>`;
    levelContainer.appendChild(row);
  });
  levelContainer.querySelectorAll('select').forEach(sel => {
    sel.addEventListener('change', () => {
      state.levels[sel.dataset.subject] = sel.value;
      saveLevels();
    });
  });
}

function saveAnswers(){ localStorage.setItem('planner_answers', JSON.stringify(state.answers)); }
function saveSubjects(){ localStorage.setItem('planner_subjects', JSON.stringify(state.subjects)); }
function saveLevels(){ localStorage.setItem('planner_levels', JSON.stringify(state.levels)); }

renderSubjects();
renderLevels();

/* ============ ناوبری ویزارد ============ */
const steps = document.querySelectorAll('.step');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const generateBtn = document.getElementById('generateBtn');

function showStep(n){
  steps.forEach(s => s.classList.toggle('active', parseInt(s.dataset.step) === n));
  progressFill.style.width = (n / state.totalSteps * 100) + '%';
  progressLabel.textContent = `مرحله ${toFa(n)} از ${toFa(state.totalSteps)}`;
  prevBtn.style.visibility = n === 1 ? 'hidden' : 'visible';
  nextBtn.classList.toggle('hidden', n === state.totalSteps);
  generateBtn.classList.toggle('hidden', n !== state.totalSteps);
}
function toFa(num){
  return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

nextBtn.addEventListener('click', () => {
  if (state.step < state.totalSteps){ state.step++; showStep(state.step); }
});
prevBtn.addEventListener('click', () => {
  if (state.step > 1){ state.step--; showStep(state.step); }
});
showStep(state.step);

/* ============ تولید برنامه ============ */
generateBtn.addEventListener('click', () => {
  if (state.subjects.length === 0){
    alert('لطفاً حداقل یک درس در مرحله ۲ اضافه کنید.');
    return;
  }
  state.plan = buildPlan();
  localStorage.setItem('planner_plan', JSON.stringify(state.plan));
  document.getElementById('wizard').classList.add('hidden');
  document.getElementById('progressWrap').classList.add('hidden');
  document.getElementById('resultArea').classList.remove('hidden');
  renderTab('weekly');
});

document.getElementById('editBtn').addEventListener('click', () => {
  document.getElementById('resultArea').classList.add('hidden');
  document.getElementById('wizard').classList.remove('hidden');
  document.getElementById('progressWrap').classList.remove('hidden');
  state.step = 1; showStep(1);
});
document.getElementById('printBtn').addEventListener('click', () => window.print());

/* اگر قبلاً برنامه ساخته شده، مستقیم نتیجه را نشان بده */
if (state.plan){
  document.getElementById('wizard').classList.add('hidden');
  document.getElementById('progressWrap').classList.add('hidden');
  document.getElementById('resultArea').classList.remove('hidden');
}

/* ============ منطق اصلی برنامه‌ریزی ============ */
function buildPlan(){
  const hoursPerDay = parseInt(state.answers.hoursPerDay || 2);
  const subjects = state.subjects.map(s => {
    const level = state.levels[s.name] || 'motevaset';
    const levelWeight = level === 'zaif' ? 3 : level === 'motevaset' ? 2 : 1;
    return { ...s, level, weight: s.priority * levelWeight };
  });
  const totalWeight = subjects.reduce((a,b) => a + b.weight, 0);

  // ساخت جدول هفتگی
  const weekly = DAYS.map(day => {
    const dayHours = hoursPerDay;
    let remaining = dayHours * 60; // دقیقه
    const blocks = [];
    const sorted = [...subjects].sort((a,b) => b.weight - a.weight);
    let idx = 0;
    while (remaining > 20 && sorted.length){
      const subj = sorted[idx % sorted.length];
      const share = Math.max(20, Math.round((subj.weight/totalWeight) * dayHours * 60 / 2));
      const dur = Math.min(share, remaining, 60);
      blocks.push({ subject: subj.name, minutes: dur });
      remaining -= dur;
      idx++;
      if (idx > 12) break;
    }
    return { day, blocks };
  });

  return { subjects, weekly, hoursPerDay, generatedAt: new Date().toISOString() };
}

/* ============ تب‌ها ============ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTab(btn.dataset.tab);
  });
});

const tabContent = document.getElementById('tabContent');

function renderTab(tab){
  if (!state.plan) return;
  const renderers = {
    weekly: renderWeekly,
    monthly: renderMonthly,
    charts: renderCharts,
    priority: renderPriority,
    pomodoro: renderPomodoro,
    spaced: renderSpaced,
    checklist: renderChecklist,
    analysis: renderAnalysis,
    resources: renderResources,
    examnight: renderExamNight,
    holiday: renderHoliday,
    pie: renderPie,
    gamify: renderGamify,
    notes: renderNotes,
    alerts: renderAlerts,
    report: renderReport
  };
  tabContent.innerHTML = '';
  (renderers[tab] || renderWeekly)();
}

/* ۱. جدول هفتگی */
function renderWeekly(){
  let html = '<table><tr><th>روز</th><th>برنامه</th></tr>';
  state.plan.weekly.forEach(d => {
    const cell = d.blocks.map(b => `${b.subject} (${toFa(b.minutes)} دقیقه)`).join(' | ') || '—';
    html += `<tr><td>${d.day}</td><td>${cell}</td></tr>`;
  });
  html += '</table>';
  tabContent.innerHTML = html;
}

/* ۲. تقویم ماهانه */
function renderMonthly(){
  const days = state.answers.daysLeft ? parseInt(state.answers.daysLeft) : 30;
  let html = `<div class="card-box"><p>تعداد روز باقی‌مانده تا هدف: <b>${toFa(days)}</b> روز</p></div>`;
  html += '<div class="grid-options">';
  for (let i=1;i<=Math.min(days,30);i++){
    const dayName = DAYS[(i-1)%7];
    const isRest = dayName === 'جمعه';
    html += `<div class="card-box" style="text-align:center;">روز ${toFa(i)}<br><small>${dayName}</small><br>${isRest ? '🌿 استراحت' : '📖 مطالعه'}</div>`;
  }
  html += '</div>';
  tabContent.innerHTML = html;
}

/* ۳. نمودارها (میله‌ای ساده با CSS) */
function renderCharts(){
  let html = '<div class="card-box"><h3>زمان اختصاص یافته هفتگی به هر درس (دقیقه)</h3>';
  const totals = {};
  state.plan.weekly.forEach(d => d.blocks.forEach(b => totals[b.subject] = (totals[b.subject]||0) + b.minutes));
  const max = Math.max(...Object.values(totals), 1);
  Object.entries(totals).forEach(([name, mins]) => {
    const pct = Math.round(mins/max*100);
    html += `<div style="margin-bottom:10px;"><div style="display:flex; justify-content:space-between;"><span>${name}</span><span>${toFa(mins)} دقیقه</span></div>
    <div class="progress-mini"><div class="progress-mini-fill" style="width:${pct}%;"></div></div></div>`;
  });
  html += '</div>';
  tabContent.innerHTML = html;
}

/* ۴. اولویت دروس */
function renderPriority(){
  const sorted = [...state.plan.subjects].sort((a,b) => b.weight - a.weight);
  let html = '<table><tr><th>درس</th><th>سطح</th><th>اولویت نهایی</th></tr>';
  sorted.forEach(s => {
    const levelFa = s.level==='zaif'?'ضعیف':s.level==='ghavi'?'قوی':'متوسط';
    const badge = s.weight >= 5 ? 'high' : s.weight >=3 ? 'mid' : 'low';
    const badgeText = s.weight >= 5 ? 'بحرانی' : s.weight >=3 ? 'مهم' : 'عادی';
    html += `<tr><td>${s.name}</td><td>${levelFa}</td><td><span class="badge ${badge}">${badgeText}</span></td></tr>`;
  });
  html += '</table>';
  tabContent.innerHTML = html;
}

/* ۵. پومودورو */
function renderPomodoro(){
  const method = state.answers.reviewMethod;
  let cycle = method === 'block' ? '۹۰ دقیقه مطالعه + ۱۵ دقیقه استراحت' : '۲۵ دقیقه مطالعه + ۵ دقیقه استراحت';
  let html = `<div class="card-box"><h3>روش مرور: ${cycle}</h3>
  <p class="hint">بعد از هر ۴ سیکل، یک استراحت ۲۰ تا ۳۰ دقیقه‌ای داشته باشید.</p></div>`;
  state.plan.subjects.forEach(s => {
    const cycles = s.weight >= 5 ? 4 : s.weight >= 3 ? 3 : 2;
    html += `<div class="card-box">${s.name}: پیشنهاد <b>${toFa(cycles)}</b> سیکل در هفته</div>`;
  });
  tabContent.innerHTML = html;
}

/* ۶. مرور فاصله‌دار */
function renderSpaced(){
  const intervals = [1,3,7,14,30];
  let html = '<table><tr><th>درس</th>' + intervals.map(i=>`<th>روز ${toFa(i)}</th>`).join('') + '</tr>';
  state.plan.subjects.forEach(s => {
    html += `<tr><td>${s.name}</td>` + intervals.map(()=> '<td>✔️ مرور</td>').join('') + '</tr>';
  });
  html += '</table>';
  tabContent.innerHTML = html;
}

/* ۷. چک‌لیست روزانه */
function renderChecklist(){
  let html = '<div class="card-box"><h3>چک‌لیست امروز</h3>';
  const today = state.plan.weekly[0];
  today.blocks.forEach((b,i) => {
    html += `<div><label><input type="checkbox" id="chk${i}"> ${b.subject} — ${toFa(b.minutes)} دقیقه</label></div>`;
  });
  html += `<div><label><input type="checkbox"> مرور خلاصه‌های دیروز</label></div>
  <div><label><input type="checkbox"> ۸ ساعت خواب کافی</label></div></div>`;
  tabContent.innerHTML = html;
  tabContent.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked){ state.points += 5; localStorage.setItem('planner_points', state.points); }
    });
  });
}

/* ۸. تحلیل قوت و ضعف */
function renderAnalysis(){
  const weak = state.plan.subjects.filter(s => s.level === 'zaif');
  const strong = state.plan.subjects.filter(s => s.level === 'ghavi');
  let html = `<div class="card-box"><h3>نقاط ضعف</h3>${weak.length? weak.map(s=>`<p>🔴 ${s.name}</p>`).join('') : '<p>موردی ثبت نشده</p>'}</div>
  <div class="card-box"><h3>نقاط قوت</h3>${strong.length? strong.map(s=>`<p>🟢 ${s.name}</p>`).join('') : '<p>موردی ثبت نشده</p>'}</div>
  <div class="card-box"><p>💡 پیشنهاد: زمان بیشتری (حدود ۴۰٪) به دروس ضعیف اختصاص دهید و دروس قوی را فقط مرور کنید.</p></div>`;
  tabContent.innerHTML = html;
}

/* ۹. منابع پیشنهادی */
function renderResources(){
  const style = state.answers.learningStyle;
  const map = {
    basari: 'ویدیوهای آموزشی و نقشه‌های ذهنی (Mind Map)',
    shenidari: 'پادکست‌های آموزشی و توضیح صوتی مباحث',
    amali: 'بانک تست و کتاب‌های کار (تمرین محور)',
    khandan: 'کتاب‌های درسی و خلاصه‌نویسی دست‌نویس'
  };
  let html = `<div class="card-box"><h3>پیشنهاد بر اساس سبک یادگیری شما</h3><p>${map[style] || 'ترکیبی از منابع متنوع'}</p></div>`;
  state.plan.subjects.forEach(s => {
    html += `<div class="card-box">${s.name}: کتاب درسی + جزوه معلم + حل نمونه سوالات سال‌های قبل</div>`;
  });
  tabContent.innerHTML = html;
}

/* ۱۰. شب امتحان */
function renderExamNight(){
  let html = `<div class="card-box"><h3>برنامه شب قبل از امتحان</h3>
  <p>۱. مرور خلاصه‌ها (نه مطالب جدید)</p>
  <p>۲. حل ۱۰ تست مروری از هر مبحث مهم</p>
  <p>۳. خواب کافی حداقل ۷ ساعت</p>
  <p>۴. آماده‌سازی وسایل امتحان</p>
  <p>۵. اجتناب از استرس و مطالعه فشرده لحظه آخر</p></div>`;
  tabContent.innerHTML = html;
}

/* ۱۱. برنامه تعطیلات */
function renderHoliday(){
  let html = '<div class="card-box"><h3>برنامه روزهای تعطیل (جمعه‌ها)</h3>';
  html += '<p>صبح: مرور جمع‌بندی هفته</p><p>ظهر: استراحت و تفریح</p><p>عصر: حل تست ترکیبی از دروس ضعیف</p></div>';
  tabContent.innerHTML = html;
}

/* ۱۲. نمودار دایره‌ای سهم دروس */
function renderPie(){
  const totals = {};
  state.plan.weekly.forEach(d => d.blocks.forEach(b => totals[b.subject] = (totals[b.subject]||0) + b.minutes));
  const total = Object.values(totals).reduce((a,b)=>a+b,0) || 1;
  const colors = ['#4f6df5','#f97316','#16a34a','#8b5cf6','#ef4444','#0ea5e9','#f59e0b'];
  let gradient = '', legend = '', acc = 0;
  Object.entries(totals).forEach(([name, mins], i) => {
    const pct = mins/total*100;
    const color = colors[i % colors.length];
    gradient += `${color} ${acc}% ${acc+pct}%, `;
    acc += pct;
    legend += `<span><span class="dot" style="background:${color}"></span>${name} (${Math.round(pct)}٪)</span>`;
  });
  gradient = gradient.slice(0,-2);
  tabContent.innerHTML = `<div class="card-box" style="text-align:center;">
  <div style="width:220px;height:220px;border-radius:50%;margin:0 auto;background:conic-gradient(${gradient});"></div>
  <div class="pie-legend" style="justify-content:center;">${legend}</div></div>`;
}

/* ۱۳. گیمیفیکیشن */
function renderGamify(){
  const level = Math.floor(state.points / 50) + 1;
  tabContent.innerHTML = `<div class="card-box"><h3>امتیاز شما: ${toFa(state.points)}</h3>
  <p>سطح فعلی: ${toFa(level)}</p>
  <div class="progress-mini"><div class="progress-mini-fill" style="width:${(state.points%50)*2}%;"></div></div>
  <p class="hint">با تیک زدن چک‌لیست روزانه، امتیاز کسب کنید!</p></div>`;
}

/* ۱۴. یادداشت‌ها */
function renderNotes(){
  const saved = localStorage.getItem('planner_notes') || '';
  tabContent.innerHTML = `<div class="card-box"><h3>یادداشت‌های شخصی</h3>
  <textarea id="notesArea" placeholder="یادداشت‌های خود را اینجا بنویسید...">${saved}</textarea></div>`;
  document.getElementById('notesArea').addEventListener('input', e => {
    localStorage.setItem('planner_notes', e.target.value);
  });
}

/* ۱۵. هشدار عقب‌ماندگی */
function renderAlerts(){
  const weak = state.plan.subjects.filter(s => s.level === 'zaif');
  let html = '<div class="card-box"><h3>هشدارها</h3>';
  if (weak.length){
    weak.forEach(s => html += `<p>⚠️ درس <b>${s.name}</b> نیاز به توجه فوری دارد.</p>`);
  } else {
    html += '<p>✅ در حال حاضر هشداری ثبت نشده است.</p>';
  }
  const days = parseInt(state.answers.daysLeft || 999);
  if (days < 14) html += '<p>⏰ کمتر از ۲ هفته تا هدف باقی مانده — تمرکز روی مرور و تست بگذارید.</p>';
  html += '</div>';
  tabContent.innerHTML = html;
}

/* ۱۶. گزارش نهایی */
function renderReport(){
  const totalMinutes = state.plan.weekly.reduce((sum,d)=> sum + d.blocks.reduce((s,b)=>s+b.minutes,0), 0);
  let html = `<div class="card-box"><h3>گزارش هفتگی</h3>
  <p>مجموع زمان مطالعه پیشنهادی: ${toFa(Math.round(totalMinutes/60))} ساعت</p>
  <p>تعداد دروس: ${toFa(state.plan.subjects.length)}</p>
  <p>روش مرور: ${state.answers.reviewMethod || '—'}</p>
  <p>توصیه بعدی: هر یکشنبه پیشرفت خود را با این گزارش مقایسه کنید.</p></div>`;
  tabContent.innerHTML = html;
}
