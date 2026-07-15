const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const SUBJECTS_DIR = path.join(__dirname, '.subjects');
const RENDU_DIR = path.join(__dirname, 'rendu');
const TRACES_DIR = path.join(__dirname, 'traces');
const SUCCESS_FILE = path.join(__dirname, 'success', 'success_ex');
const GRADING_DIR = path.join(__dirname, '.system', 'grading');

[path.join(__dirname, 'success'), RENDU_DIR, TRACES_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

app.get('/api/exercises', (req, res) => {
  const exercises = [];
  const seen = new Set();
  ['STUD_PART', 'PISCINE_PART'].forEach(part => {
    const pp = path.join(SUBJECTS_DIR, part);
    if (!fs.existsSync(pp)) return;
    fs.readdirSync(pp).filter(d => d.startsWith('exam_')).forEach(exam => {
      fs.readdirSync(path.join(pp, exam)).filter(d => /^\d+$/.test(d)).forEach(level => {
        fs.readdirSync(path.join(pp, exam, level)).forEach(exName => {
          const ep = path.join(pp, exam, level, exName);
          if (!fs.statSync(ep).isDirectory()) return;
          if (seen.has(exName)) return;
          seen.add(exName);
          const sf = path.join(ep, 'attachment', 'subject.en.txt');
          const hasTester = fs.existsSync(path.join(ep, 'tester.sh'));
          const hasSubject = fs.existsSync(sf);
          exercises.push({
            id: `${part}/${exam}/${level}/${exName}`,
            name: exName, exam, level: parseInt(level), part,
            subject: hasSubject ? fs.readFileSync(sf, 'utf-8') : '',
            hasTester,
            incomplete: !hasSubject || !hasTester
          });
        });
      });
    });
  });
  res.json(exercises);
});

app.get('/api/exercise/:part/:exam/:level/:exName', (req, res) => {
  const { part, exam, level, exName } = req.params;
  const ep = path.join(SUBJECTS_DIR, part, exam, level, exName);
  if (!fs.existsSync(ep)) return res.status(404).json({ error: 'Not found' });

  const sf = path.join(ep, 'attachment', 'subject.en.txt');
  const solf = path.join(ep, `${exName}.c`);
  const mf = path.join(ep, 'main.c');
  const tf = path.join(ep, 'tester.sh');

  let ucf = path.join(RENDU_DIR, exName, `${exName}.c`);
  const traces = [];
  if (fs.existsSync(TRACES_DIR))
    fs.readdirSync(TRACES_DIR).filter(f => f.endsWith(`_${exName}.trace`)).forEach(f =>
      traces.push({ file: f, content: fs.readFileSync(path.join(TRACES_DIR, f), 'utf-8') }));

  res.json({
    id: `${part}/${exam}/${level}/${exName}`, name: exName,
    subject: fs.existsSync(sf) ? fs.readFileSync(sf, 'utf-8') : '',
    solution: '', // non mostriamo la soluzione
    mainCode: fs.existsSync(mf) ? fs.readFileSync(mf, 'utf-8') : '',
    tester: fs.existsSync(tf) ? fs.readFileSync(tf, 'utf-8') : '',
    userCode: fs.existsSync(ucf) ? fs.readFileSync(ucf, 'utf-8') : '',
    traces, part, exam, level
  });
});



app.post('/api/save-output/:exName', (req, res) => {
  const { exName } = req.params;
  const dir = path.join(RENDU_DIR, exName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '.last_output'), req.body.output || '', 'utf-8');
  res.json({ success: true });
});

app.get('/api/get-output/:exName', (req, res) => {
  const { exName } = req.params;
  const f = path.join(RENDU_DIR, exName, '.last_output');
  const output = fs.existsSync(f) ? fs.readFileSync(f, 'utf-8') : '';
  res.json({ output });
});

app.post('/api/save-code/:part/:exam/:level/:exName', (req, res) => {
  const { exName } = req.params;
  const dir = path.join(RENDU_DIR, exName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${exName}.c`), req.body.code, 'utf-8');
  res.json({ success: true });
});

app.post('/api/run-test/:part/:exam/:level/:exName', (req, res) => {
  const { part, exam, level, exName } = req.params;
  const ep = path.join(SUBJECTS_DIR, part, exam, level, exName);
  if (!fs.existsSync(path.join(ep, 'tester.sh')))
    return res.status(400).json({ error: 'No tester available' });

  if (fs.existsSync(GRADING_DIR)) { execSync(`rm -rf "${GRADING_DIR}"`, { stdio: "pipe" }); fs.mkdirSync(GRADING_DIR, { recursive: true }); }
  else fs.mkdirSync(GRADING_DIR, { recursive: true });

  execSync(`cp "${path.join(ep, '.').replace(/ /g,'\\ ')}/"* "${GRADING_DIR}/" 2>/dev/null || true`, { stdio: 'pipe', shell: '/bin/bash' });
  const ad = path.join(ep, 'attachment');
  if (fs.existsSync(ad)) execSync(`cp -r "${path.join(ad, '.').replace(/ /g,'\\ ')}/"* "${GRADING_DIR}/" 2>/dev/null || true`, { stdio: 'pipe', shell: '/bin/bash' });

  const start = Date.now();
  try {
    execSync(`cd "${__dirname}" && bash "${GRADING_DIR}/tester.sh" 2>&1`, { timeout: 15000, stdio: 'pipe' });
    const passed = fs.existsSync(path.join(GRADING_DIR, 'passed'));
    let tb = '';
    const tbf = path.join(GRADING_DIR, 'traceback');
    if (fs.existsSync(tbf)) tb = fs.readFileSync(tbf, 'utf-8');
    const rtb = path.join(__dirname, 'traceback');
    if (fs.existsSync(rtb) && !tb) tb = fs.readFileSync(rtb, 'utf-8');
    if (tb) { if (!fs.existsSync(TRACES_DIR)) fs.mkdirSync(TRACES_DIR, { recursive: true }); fs.writeFileSync(path.join(TRACES_DIR, `${level}-0_${exName}.trace`), tb); }
    if (passed) {
      const successes = fs.existsSync(SUCCESS_FILE) ? fs.readFileSync(SUCCESS_FILE, 'utf-8').split('\n').filter(l => l.trim()) : [];
      if (!successes.includes(exName)) fs.appendFileSync(SUCCESS_FILE, exName + '\n', 'utf-8');
      const uf = path.join(RENDU_DIR, exName, `${exName}.c`);
      if (fs.existsSync(uf)) execSync(`cp "${uf}" "${path.join(__dirname, 'success')}/${exName}.c" 2>/dev/null`, { stdio: 'pipe' });
    }
    res.json({ passed, traceback: tb, output: '', elapsed: Date.now() - start });
  } catch (e) {
    let tb = '';
    const tbf = path.join(GRADING_DIR, 'traceback');
    if (fs.existsSync(tbf)) tb = fs.readFileSync(tbf, 'utf-8');
    const rtb = path.join(__dirname, 'traceback');
    if (fs.existsSync(rtb) && !tb) tb = fs.readFileSync(rtb, 'utf-8');
    const passed = fs.existsSync(path.join(GRADING_DIR, 'passed'));
    if (tb) { if (!fs.existsSync(TRACES_DIR)) fs.mkdirSync(TRACES_DIR, { recursive: true }); fs.writeFileSync(path.join(TRACES_DIR, `${level}-0_${exName}.trace`), tb); }
    if (passed) {
      const successes = fs.existsSync(SUCCESS_FILE) ? fs.readFileSync(SUCCESS_FILE, 'utf-8').split('\n').filter(l => l.trim()) : [];
      if (!successes.includes(exName)) fs.appendFileSync(SUCCESS_FILE, exName + '\n', 'utf-8');
    }
    res.json({ passed, traceback: tb, output: e.stdout ? e.stdout.toString() : '', elapsed: Date.now() - start, error: e.message });
  }
});

app.get('/api/progress', (req, res) => {
  const s = fs.existsSync(SUCCESS_FILE) ? fs.readFileSync(SUCCESS_FILE, 'utf-8').split('\n').filter(l => l.trim()) : [];
  res.json({ done: s });
});

app.post('/api/reset/:exName', (req, res) => {
  const { exName } = req.params;
  if (fs.existsSync(SUCCESS_FILE)) {
    const s = fs.readFileSync(SUCCESS_FILE, 'utf-8').split('\n').filter(l => l.trim() && l !== exName);
    fs.writeFileSync(SUCCESS_FILE, s.join('\n') + (s.length ? '\n' : ''), 'utf-8');
  }
  const ud = path.join(RENDU_DIR, exName);
  if (fs.existsSync(ud)) execSync(`rm -rf "${ud}"`, { stdio: 'pipe' });
  res.json({ success: true });
});

app.post('/api/reset-all', (req, res) => {
  if (fs.existsSync(SUCCESS_FILE)) fs.writeFileSync(SUCCESS_FILE, '', 'utf-8');
  if (fs.existsSync(RENDU_DIR)) execSync(`rm -rf "${RENDU_DIR}/*"`, { stdio: 'pipe' });
  res.json({ success: true });
});

const PORT = 4242;
app.listen(PORT, () => console.log(`🚀 42 Exam Web IDE at http://localhost:${PORT}`));
