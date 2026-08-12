const fs = require('fs');
const path = require('path');
const readline = require('readline');

const configPath = path.join(__dirname, 'config.json');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let queue = [];
let waiting = null;

rl.on('line', (l) => {
  if (waiting) {
    const w = waiting;
    waiting = null;
    w(l);
  } else {
    queue.push(l);
  }
});

function ask(prompt) {
  process.stdout.write(prompt);
  return new Promise((resolve) => {
    if (queue.length) return resolve(queue.shift());
    waiting = resolve;
  });
}

function load() {
  try {
    let txt = fs.readFileSync(configPath, 'utf8');
    txt = txt.replace(/^\uFEFF/, '');
    return JSON.parse(txt);
  } catch {
    return {};
  }
}

(async () => {
  console.log('==============================================');
  console.log('   Hantakyro - الإعداد (مرة واحدة فقط)');
  console.log('==============================================');
  const cfg = load();
  const hasToken = cfg.token && !cfg.token.includes('PUT_YOUR');

  if (hasToken) {
    const again = await ask('التوكن موجود بالفعل. تبي تغيّره؟ اكتب y وتوافق (اضغط Enter للتخطي): ');
    if (again.toLowerCase() !== 'y') {
      console.log('\n[OK] كل شي جاهز! شغّل البوت:  npm start  (أو افتح start.bat)');
      rl.close();
      return;
    }
  }

  const token = (await ask('\n1) الصق توكن البوت (Bot Token) هنا ثم اضغط Enter:\n> ')).trim();
  if (!token) {
    console.log('\n[x] ما كتبت التوكن. ارجع شغّل setup.js مرة ثانية.');
    rl.close();
    return;
  }

  const clientId = (await ask('\n2) الصق الـ Client ID (Application ID) هنا ثم اضغط Enter:\n> ')).trim();
  const pass = (await ask('\n3) اكتب كلمة مرور الداشبورد (أي كلمة تختارها):\n> ')).trim() || 'Hantakyro2024';

  cfg.token = token;
  cfg.clientId = clientId;
  cfg.dashboard = cfg.dashboard || {};
  cfg.dashboard.password = pass;

  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
  console.log('\n==============================================');
  console.log('   [OK] تم الحفظ في ملف config.json');
  console.log('   شغّل البوت:  npm start  (أو افتح start.bat)');
  console.log('==============================================');
  rl.close();
})();
