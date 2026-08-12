# 🚀 رفع Hantakyro على Render.com (بدون بطاقة — مجاني + HTTPS)

هذا الدليل يوصل البوت **والداشبورد** معاً على رابط حلو و HTTPS:
**`https://hantakyro.onrender.com`** (رابط الداشبورد، والبوت يشتغل بنفس الوقت).

> مدة كل شي: **5 دقائق**. المطلوب منك فقط: حساب GitHub (بريد إلكتروني) + حساب Render (بريد إلكتروني) — **بدون بطاقة ائتمانية**.

---

## الخطوة 1 — أنشئ حساب GitHub
1. افتح https://github.com/signup
2. اكتب بريدك وكلمة سرك واضغط **Create account**
3. أكّد البريد من الإيميل.

## الخطوة 2 — أنشئ مستودع (Repo) جديد
1. افتح https://github.com/new
2. **Repository name:** اكتب `hantakyro`
3. خليها **Public** (أسهل) أو Private — كلها تشتغل.
4. اضغط **Create repository** (ما تنشئ أي ملف README — خليه فاضي).

## الخطوة 3 — ارفع ملفات المشروع
1. فك ضغط ملف **`Hantakyro-deploy.zip`** عندك في المجلد (يحتوي: `commands`, `handlers`, `dashboard`, `index.js`, `package.json`, `render.yaml`...).
2. داخل صفحة المستودع الجديد اضغط **uploading an existing file**.
3. اسحب كل الملفات والمجلدات اللي في داخل ملف الـ zip إلى نافذة الأوبلود.
4. اضغط **Commit changes**.

## الخطوة 4 — أنشئ حساب Render
1. افتح https://render.com/register وسجّل ببريدك (أو "Sign in with GitHub" — أسهل).
2. من لوحة التحكم: **New +** → **Blueprint** → **Public Git repository**
3. الصق رابط المستودع: `https://github.com/<اسمك>/hantakyro`
4. اضغط **Apply** → Render حيقرأ ملف `render.yaml` تلقائياً.

### ⭐ خطوة إضافية مهمة — تفعيل تسجيل الدخول بـ Discord (OAuth2)
1. افتح https://discord.com/developers/applications → بوتك → تبويب **OAuth2**
2. تحت **Redirects** أضف هذين الرابطين:
   - `https://hantakyro.onrender.com/auth/callback`
   - `http://localhost:3000/auth/callback`
3. انسخ **Client Secret** من نفس الصفحة (زر Copy).
4. هذا الـ Secret حتحطه في Render (مفصل بالخطوة 5) — بدونه **كل شخص لازم يسجل دخول بـ Discord** ما بيشتغل.

## الخطوة 5 — حط أسرار البوت
حيطلب منك تعبئة المتغيرات (حط قيم حقيقية):
- `TOKEN` → توكن البوت (من Discord Developer Portal → Bot → Reset Token)
- `CLIENT_ID` → الـ Application ID (من General Information)
- `DASH_PASSWORD` → (اختياري الآن) كلمة مرور قديمة — الداشبورد صار بـ Discord login
- `DISCORD_CLIENT_SECRET` → الـ Client Secret من تبويب OAuth2 ✅
- `OWNERS` → (اختياري) آيدي حسابك

> ⚠️ تأكد إنك فعّلت **Server Members Intent** و **Message Content Intent** في صفحة البوت.

## الخطوة 6 — Deploy 🎉
1. اضغط **Deploy Blueprint** (أو **Manual Deploy → Deploy latest commit**).
2. انتظر دقيقة أو دقيقتين، وراح يظهر رابطك:
   - الداشبورد: `https://hantakyro.onrender.com`
   - البوت يشتغل تلقائياً في نفس الخدمة.

## ⏰ عشان ما يطفى (Keep-Alive)
الخطة المجانية في Render تنام بعد 15 دقيقة خمول. للحل:
1. سجل مجاناً في https://uptimerobot.com
2. **Add New Monitor** → نوع **HTTP(s)**
3. الرابط: `https://hantakyro.onrender.com/api/health`
4. Interval: كل **5 دقائق**
→ بهذا يزور UptimeRobot موقعك كل 5 دقائق فما ينام أبداً.

---

## 🔧 ملاحظات
- بعد ما ترفع أي تحديث من عندك: افتح المستودع وارفعه مرة ثانية، ثم في Render اضغط **Manual Deploy → Deploy latest commit**.
- الرابط حلو فيصير: **https://hantakyro.onrender.com** — HTTPS مضمون من Render.
- لو تبين أسم أحلى مثل `hantakyro.com` تحتاج دومين (يُدفع) — أخبرني إذا حبيت هذا الخيار.
