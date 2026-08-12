# 🛡️ Hantakyro — أقوى بوت حماية لديسكورد

بوت حماية شامل بأوامر سلايش (`/`) + داشبورد ويب احترافي.
أي شخص يحاول يبند، يطرد، يحذف رومات/رتب، يضيف بوت، يسوي ريد أو سكام → **يتبند تلقائياً**، والمستخدم المحمي (whitelist) ما يتأثر أبداً.

---

## ✨ المميزات

### 🛡️ الحماية
| الموديول | الوظيفة |
|---|---|
| Anti-Ban | يوقف أي عملية بان غير مصرّح لها، يفك البان للضحية ويلزم الفاعل |
| Anti-Kick | يوقف أي كيك غير مصرّح، يلزم الفاعل |
| Anti-Bot-Add | أي شخص يضيف بوت → البوت ينطرد والفاعل يتبند |
| Anti-Channel | حماية من إنشاء/حذف/تعديل الرومات |
| Anti-Role | حماية من إنشاء/حذف/تعديل الرتب + إعطاء رتبة Administrator |
| Anti-Webhook | يمنع إنشاء Webhooks |
| Anti-Guild | يحمي إعدادات السيرفر (الاسم، الأيقونة...) |
| Anti-Emoji | يحمي الإيموجي |
| Auto-Restore | يرجّع الرومات والرتب المحذوفة تلقائياً (Anti-Nuke) |
| Anti-Owner-Transfer | أي محاولة أخذ ملكية السيرفر → عقاب فوري |
| Anti-Raid | لو دخلوا 5+ أعضاء خلال 10 ثواني → قفل تلقائي + طرد المهاجمين |
| Anti-Spam | 5+ رسائل خلال 4 ثواني → تايم أوت 10 دقائق |
| Anti-Everyone | منشن @everyone → تايم أوت ساعة |

### 👥 قائمة الأمان (Whitelist)
- `/list @user` → يدخل قائمة الأمان، **مستحيل** يتبند أو يتعاقب.
- `/unlist @user` → يسحبه من القائمة.

### 📊 الداشبورد (http://localhost:3000)
- تشغيل/إيقاف الحماية (Master switch).
- تفعيل كل موديول على حدة.
- إدارة قائمة الأمان.
- معاقبة أي مستخدم بكبسة.
- سجل كامل بكل أحداث الحماية.

---

## 📦 الأوامر

| الأمر | الوظيفة |
|---|---|
| `/en_safe` | تفعيل الحماية الكاملة |
| `/status` | حالة الحماية |
| `/protection <module> <on/off>` | تفعيل/إيقاف موديول |
| `/punish <ban/kick/strip>` | طريقة العقاب |
| `/log_channel <#channel>` | قناة السجلات |
| `/list @user` | إضافة لقائمة الأمان |
| `/unlist @user` | إزالة من قائمة الأمان |
| `/lockdown <on/off>` | قفل/فتح السيرفر أثناء الريد |
| `/purge <1-100>` | حذف رسائل |
| `/unban @user` | فك بان |
| `/logs` | آخر أحداث الحماية |
| `/help` | كل الأوامر |

---

## 🚀 التشغيل محلياً

### 1) أنشئ البوت
1. ادخل https://discord.com/developers/applications
2. **New Application** → اسمه `Hantakyro`.
3. تبويب **Bot** → **Reset Token** → انسخ التوكن.
4. شغّل **Server Members Intent** و **Message Content Intent** (مهم جداً للحماية).
5. تبويب **OAuth2 → URL Generator**:
   - Scope: `bot` + `applications.commands`
   - Permissions: **Administrator** (رقم 8)
   - انسخ الرابط وادعُ البوت لسيرفرك.

### 2) التجهيز
```bash
cd Hantakyro
npm install
```
افتح `config.json` وضع:
- `token` → توكن البوت.
- `clientId` → Application ID (من نفس الصفحة، تحت General Information).
- `owners` → ضع آيدي حسابك (اختياري).
- `dashboard.password` → كلمة مرور الداشبورد.

### 3) التشغيل
```bash
npm start
```
النتيجة:
```
Hantakyro is ONLINE!
Registered 12 slash commands globally.
Hantakyro Dashboard: http://localhost:3000
```

افتح `http://localhost:3000` وأدخل كلمة مرور الداشبورد، ثم في الديسكورد اكتب `/en_safe`.

---

## 🌐 الاستضافة المجانية (بدون ما يخلص الاستخدام)

> يعني "تشغيل دائم مجاناً بدون وقت انتهاء".
> البوت **والداشبورد** نفس المشروع — استضافة واحدة تشغّلهم معاً.

### 🚀 الطريقة الأسهل للحصول على لينك للموقع: Render.com
البوت + الداشبورد يشتغلون ببروسيس واحد، ورندر يعطيك **لينك عام** للداشبورد مثل:
`https://hantakyro.onrender.com`

1. ارفع مجلد `Hantakyro` على GitHub (بدون `config.json` وبدون `node_modules`).
2. في https://render.com → **New** → **Web Service** → اربط المستودع.
3. **Build Command:** `npm install` — **Start Command:** `npm start`.
4. من تبويب **Environment** أضف:
   - `TOKEN` = توكن البوت
   - `CLIENT_ID` = الـ Client ID
   - `DASH_PASSWORD` = كلمة مرور الداشبورد
   - (اختياري) `OWNERS` = آيدي حسابك
5. **Deploy** → بعد دقيقتين يشتغل البوت ويصير عندك لينك الداشبورد.
   افتح اللينك وأدخل كلمة المرور.

> ⚠️ الخطة المجانية في Render تنام بعد 15 دقيقة خمول وتصحى أول ما يفتح أحد اللينك (عادي، الحماية تشتغل لما يستدعيها أحد). لو تبي **نوم أبدي مجاني** → Oracle أدناه.

### الخيار 1 — جهازك الشخصي (الأفضل والمجاني للأبد)
شغّل `npm start` على جهازك وشغّل الجهاز 24/7. سريع وسهل ومجاني نهائياً.
(لو جهازك ينام، غيّر Power Settings → Never sleep.)
الداشبورد = `http://localhost:3000` وتفتحه تلقائياً من `start.bat` على جوجل كروم.

### الخيار 2 — Oracle Cloud (مجاني للأبد + لينك عام) ⭐
1. سجّل في https://www.oracle.com/cloud/free/ (يطلب بطاقة للتوثيق فقط، ما يخصمون شيء).
2. أنشئ **Always Free** VM → Ubuntu 22.04.
3. وصل بالـ SSH:
```bash
sudo apt update && sudo apt install -y nodejs npm git
git clone <رابط مشروعك> && cd Hantakyro
npm install
TOKEN=توكنك CLIENT_ID=ايديك DASH_PASSWORD=كلمتك nohup npm start &
```
4. افتح المنفذ 3000 من Security List (Ingress Rules) → الداشبورد يصير برابط عام `http://IP-جهازك:3000`.
هذا الخيار **مضمون "بدون ما يخلص"** لأنه Always Free، والموقع يشتغل 24/7.

### الخيار 4 — Fly.io
مجاني ضمن الـ Allowance الشهرية، جيد للأبد مع حدود معقولة.

> ❌ تجنب: Replit (ينام)، Railway trial (ينتهي)، Heroku المجاني (أُلغي).
> 💡 أسهل وأضمن حل "يشتغل للأبد بلا ما يخلص": **جهازك** أو **Oracle Always Free**.

---

## 🔑 الأمان
- غيّر كلمة مرور الداشبورد من `config.json` (أو متغير `DASH_PASSWORD` على الهوست).
- لا تعطي التوكن لأحد.
- اعمل `git clone` لمشروعك في مجلد خاص ولا ترفع `config.json` (مضاف في `.gitignore`).
- على الهوست استخدم متغيرات البيئة `TOKEN`, `CLIENT_ID`, `DASH_PASSWORD` بدل ملف `config.json`.

---

## ⚠️ ملاحظة
البوت يحتاج صلاحية **Administrator** أو صلاحيات: Ban Members, Kick Members, Manage Channels, Manage Roles, Manage Webhooks, Manage Messages, View Audit Log.
بدونها الحماية المبنية على سجل التدقيق ما راح تشتغل.
