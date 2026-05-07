# 🔐 تقرير الأمان الشامل — مشروع Life Care
**تاريخ الفحص:** 2026-05-07 | **المفحوص بواسطة:** Claude AI (Antigravity)

---

> [!CAUTION]
> هذا التقرير يحتوي على ثغرات **خطيرة وحرجة** يجب معالجتها قبل النشر في بيئة الإنتاج، خاصةً أن التطبيق يتعامل مع بيانات طبية حساسة للغاية.

---

## 📊 ملخص تنفيذي

| الفئة | عدد المشاكل | أعلى خطورة |
|---|---|---|
| 🔴 حرجة (Critical) | 6 | كلمة مرور ثابتة في كود + كلمات مرور بالنص الصريح |
| 🟠 عالية (High) | 7 | CORS مفتوح + تسريب بيانات خادم + رمز OTP ثابت |
| 🟡 متوسطة (Medium) | 6 | لا يوجد Rate Limiting كافٍ + ملفات مرفوعة عامة |
| 🟢 منخفضة (Low) | 4 | مشاكل بناء كود + بيانات Mock في الإنتاج |

---

## 🔴 الثغرات الحرجة (Critical)

### 1. رمز OTP ثابت `123456` — **خطر حرج جداً**

**الملفات:**
- `backend/routes/auth.js` السطر 77
- `src/pages/Welcome.jsx` السطر 237 و 250

```js
// backend/routes/auth.js - السطر 77
const otp = "123456"; // ← رمز ثابت دائماً!
const otpExpires = new Date(Date.now() + 60 * 60000); // ساعة كاملة (طويل جداً)

// Welcome.jsx - السطر 250
if (formData.otp === '123456') { // ← أي شخص يعرف OTP الثابت!
```

**الخطر:** أي شخص يعلم بهذا يستطيع تأكيد أي حساب دون الوصول للبريد الإلكتروني. نظام التحقق بالكامل معطّل فعلياً.

**الحل:**
```js
const otp = crypto.randomInt(100000, 999999).toString();
const otpExpires = new Date(Date.now() + 10 * 60000); // 10 دقائق فقط
```

---

### 2. كلمات المرور بالنص الصريح في MockUser — **خطر حرج**

**الملف:** `backend/models/MockUser.js` السطر 25-29

```js
async comparePassword(candidatePassword) {
    // In this mock, we are just comparing raw text...
    return this.password_hash === candidatePassword; // ← مقارنة بالنص الصريح!
}
```

**الخطر:** نموذج `MockUser` يُخزن ويقارن كلمات المرور بدون تشفير. وبما أن `authMiddleware.js` يستخدم `MockUser` (السطر 2) وليس `User`، فإن **كل تدفق المصادقة الحقيقي** يمر عبر هذا النموذج غير الآمن. كلمات المرور مخزنة كنص واضح في الذاكرة.

**الحل:** استخدم نموذج `User.js` الحقيقي الذي يحتوي على bcrypt، أو أضف bcrypt إلى MockUser:
```js
const bcrypt = require('bcryptjs');
async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
}
async save() {
    if (this._isPasswordModified) {
        this.password_hash = await bcrypt.hash(this.password_hash, 10);
    }
    // ...
}
```

---

### 3. JWT Secret ضعيف مكشوف في `.env` — **خطر حرج**

**الملف:** `backend/.env` السطر 3

```env
JWT_SECRET=supersecure_jwt_secret_key_123!  ← ضعيف ومكشوف
```

**الملف:** `backend/routes/auth.js` السطر 197

```js
process.env.JWT_SECRET || 'fallback_secret_key'  // ← fallback بدون تشفير!
```

**الخطر المزدوج:**
1. السر قصير وقابل للتخمين بسهولة
2. عند غياب المتغير البيئي، يُستخدم `fallback_secret_key` وهو ثابت معروف في الكود

**الحل:**
```bash
# توليد سر قوي (256-bit)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
```js
// auth.js - لا تستخدم fallback أبداً
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET environment variable is required!');
const token = jwt.sign({ id, role }, secret, { expiresIn: '7d' }); // 30 يوم طويل جداً
```

---

### 4. ملف `.env` غير مدرج في `.gitignore` — **خطر حرج**

**الملف:** `.gitignore`

```
# الملف الحالي لا يحتوي على:
# backend/.env
# *.env
```

**الخطر:** إذا تم رفع المشروع على GitHub، سيُكشف `JWT_SECRET` وبيانات قاعدة البيانات وكلمة مرور البريد الإلكتروني للعموم.

**الحل:** أضف فوراً إلى `.gitignore`:
```
backend/.env
.env
.env.*
!.env.example
```

---

### 5. مصادقة المتحكمين (authMiddleware) تستخدم MockUser — **خطر حرج**

**الملف:** `backend/middleware/authMiddleware.js` السطر 2

```js
const User = require('../models/MockUser'); // ← MockUser وليس User الحقيقي!
```

**الخطر:** طبقة المصادقة كلها تعتمد على قاعدة بيانات وهمية في الذاكرة (in-memory array). عند إعادة تشغيل الخادم، **تُحذف جميع بيانات المستخدمين** وتُصبح جميع التوكنات المنتهية صلاحيتها صالحة من الناحية التقنية مرة أخرى (لعدم وجود تحقق فعلي من قاعدة البيانات).

**الحل:**
```js
const User = require('../models/User'); // النموذج الحقيقي مع MongoDB
```

---

### 6. صلاحية JWT تمتد لـ 30 يوماً — **خطر عالٍ/حرج**

**الملف:** `backend/routes/auth.js` السطر 198

```js
{ expiresIn: '30d' } // ← 30 يوم طويل جداً لتطبيق طبي حساس
```

**الخطر:** في حالة سرقة التوكن، يبقى المهاجم متصلاً لمدة شهر كامل.

**الحل:** استخدم نظام Refresh Token:
```js
// Access token قصير
{ expiresIn: '15m' }
// Refresh token أطول مع تخزين آمن
{ expiresIn: '7d' } // مخزن في httpOnly cookie
```

---

## 🟠 الثغرات العالية (High)

### 7. CORS مفتوح بالكامل بدون قيود

**الملف:** `backend/server.js` السطر 24

```js
app.use(cors()); // ← يسمح لأي نطاق بالوصول
```

**الخطر:** أي موقع إلكتروني على الإنترنت يستطيع إرسال طلبات إلى API الخاص بك وقراءة البيانات الطبية الحساسة.

**الحل:**
```js
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 8. تعطيل جميع إضافات الأمان (XSS, NoSQL Injection, HPP)

**الملف:** `backend/server.js` السطر 18-20

```js
// app.use(xss());          ← معطّل! (XSS attacks)
// app.use(mongoSanitize()); ← معطّل! (NoSQL Injection)
// app.use(hpp());           ← معطّل! (HTTP Parameter Pollution)
```

**الخطر:** التطبيق مفتوح لهجمات:
- **XSS:** حقن سكريبتات خبيثة عبر حقول الإدخال
- **NoSQL Injection:** `{ "$gt": "" }` في حقول البريد الإلكتروني
- **HPP:** إرسال معاملات HTTP مكررة

**السبب المذكور:** "Express 5 incompatibility" — هذه المبررة غير كافية لتعطيل الأمان. يمكن استبدالها بمكتبات متوافقة.

**الحل البديل:**
```js
const { escape } = require('validator');
// تنظيف يدوي أو استخدام express-validator بدلاً من xss-clean
```

---

### 9. الملفات الطبية المرفوعة عامة بدون مصادقة

**الملف:** `backend/server.js` السطر 14

```js
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// ← أي شخص يعرف اسم الملف يمكنه الوصول إليه مباشرةً!
```

**الخطر:** ملفات المرضى الطبية (PDF، صور) متاحة علناً بمجرد معرفة اسم الملف. لا يوجد أي تحقق من الهوية للوصول إلى الملفات.

**الحل:**
```js
// احذف السطر العام وأنشئ endpoint محمياً
router.get('/file/:filename', protect, async (req, res) => {
    const file = await MedicalFile.findOne({ 
        file_name: req.params.filename, 
        patient_id: req.user._id // فقط صاحب الملف
    });
    if (!file) return res.status(403).json({ error: 'Access denied' });
    res.sendFile(path.join(__dirname, '../uploads', req.params.filename));
});
```

---

### 10. تسريب تفاصيل الأخطاء الداخلية للعميل

**الملفات:** `backend/routes/auth.js` السطر 139، 172، 212، 253

```js
res.status(500).json({ 
    error: 'حدث خطأ داخلي',
    debug: err.message  // ← تسريب معلومات الخادم الداخلية!
});
```

**الخطر:** رسائل الخطأ قد تكشف معلومات عن:
- بنية قاعدة البيانات
- مسارات الملفات
- إصدارات المكتبات (للاستغلال في هجمات معروفة)

**الحل:**
```js
// في الإنتاج
if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
} else {
    res.status(500).json({ error: err.message }); // فقط في التطوير
}
```

---

### 11. بيانات Login Mock مضمّنة في الكود (Hardcoded Backdoor)

**الملف:** `src/pages/Welcome.jsx` السطر 193-196

```js
} else if (formData.email === 'test@test.com' || formData.email === 'admin@admin.com') {
    localStorage.setItem('token', 'mock_token_admin');
    setRole('doctor');  // ← أي شخص يعرف هذا يحصل على صلاحية طبيب!
    navigate('/dashboard');
}
```

**الخطر:** هذا يُعدّ **Backdoor** حقيقي. أي مستخدم يستطيع الدخول بأي كلمة مرور إذا استخدم `test@test.com` أو `admin@admin.com`.

**الحل:** احذف هذه الأسطر تماماً قبل النشر.

---

### 12. JWT Token مخزن في localStorage — عرضة لهجمات XSS

**الملفات:** `src/pages/Welcome.jsx` السطر 190، `src/pages/Profile.jsx` السطر 29

```js
localStorage.setItem('token', 'mock_token_' + Date.now()); // ← خطر XSS
const token = localStorage.getItem('token'); // ← يمكن سرقته بأي سكريبت
```

**الخطر:** إذا نجح هجوم XSS (وهو ممكن لأن XSS protection معطّل)، يمكن سرقة التوكن.

**الحل:** استخدم `httpOnly cookies` بدلاً من localStorage:
```js
// الخادم
res.cookie('token', jwtToken, { 
    httpOnly: true, 
    secure: true, 
    sameSite: 'Strict',
    maxAge: 15 * 60 * 1000 // 15 دقيقة
});
```

---

### 13. إشعارات يمكن إرسالها لأي مستخدم بدون تحقق

**الملف:** `backend/routes/notifications.js` السطر 26-60

```js
router.post('/send', protect, async (req, res) => {
    const { recipient_id, type, title, message } = req.body;
    // ← لا يوجد تحقق من أن المُرسِل مصرح له بإرسال لهذا المستلم!
```

**الخطر:** أي مستخدم مسجل (مريض، طبيب، مرافق) يستطيع إرسال إشعارات لأي مستخدم آخر في النظام.

---

## 🟡 الثغرات المتوسطة (Medium)

### 14. صور الملف الشخصي تُحفظ كـ Base64 في قاعدة البيانات

**الملف:** `src/pages/Profile.jsx` السطر 91-99

```js
reader.readAsDataURL(file); // ← Base64 كاملة ترسل للخادم
```

**المشكلة:** Base64 لصور كبيرة يمكن أن يصل لـ 5-10 MB ويُخزّن في MongoDB بدون حد، مما يؤدي لـ:
- استنزاف ذاكرة قاعدة البيانات
- بطء الأداء
- لا يوجد تحقق من نوع الصورة في الفرونتيند

---

### 15. لا يوجد Rate Limiting على نقاط نهاية حساسة

```js
// لا يوجد rate limiting على:
router.post('/register', ...) // ← يمكن إنشاء آلاف الحسابات
router.post('/forgot-password', ...) // ← يمكن إغراق البريد الإلكتروني
router.post('/verify-otp', ...) // ← يمكن تخمين OTP بالقوة
```

يوجد Rate Limiting فقط على `/login` (10 محاولات/15 دقيقة).

---

### 16. بيانات Forgot Password تكشف وجود المستخدم (User Enumeration)

**الملف:** `backend/routes/auth.js` السطر 222

```js
if (!user) return res.status(400).json({ error: 'لا يوجد حساب بهذا البريد الإلكتروني.' });
// ← يؤكد للمهاجم أن هذا البريد غير مسجل!
```

**الحل:**
```js
// ارجع نفس الرسالة سواء وُجد المستخدم أم لا
return res.status(200).json({ message: 'إذا كان البريد مسجلاً، ستصلك رسالة.' });
```

---

### 17. Reset Password Link يعمل على localhost فقط

**الملف:** `backend/routes/auth.js` السطر 229

```js
const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
// ← مشفر بـ localhost في الكود! لن يعمل في الإنتاج!
```

---

### 18. لا يوجد تحقق من صحة patientId في connectionMiddleware

**الملف:** `backend/middleware/connectionMiddleware.js` السطر 12

```js
const patientId = req.params.patientId || req.body.patient_id || req.query.patientId;
// ← لا يوجد تحقق من أن patientId هو ObjectId صحيح
// يمكن أن يتسبب في أخطاء MongoDB غير معالجة
```

---

### 19. Profile يرسل كامل userData بدون تصفية

**الملف:** `src/pages/Profile.jsx` السطر 137

```js
body: JSON.stringify(userData) // ← يرسل كل البيانات بما فيها التي لا يجب تعديلها
```

**الملف:** `backend/routes/api.js` السطر 20-28

```js
const updates = req.body;
delete updates.password_hash; // يحاول الحذف لكن...
// لا يوجد whitelist! أي حقل في الـ schema يمكن تعديله
```

---

## 🟢 الملاحظات الأخرى (Low)

### 20. بيانات Mock في الإنتاج (Development Data Leakage)

```js
// auth.js السطر 72, 95-101
console.log(`[DEBUG MODE] Registration failed...`);
console.log(`🔑 [DEBUG MODE] OTP CODE IS: ${otp}`); // ← OTP في السجلات!
```

يجب حذف جميع `console.log` المتعلقة بـ Debug في الإنتاج. يكفي `console.error` للأخطاء الحقيقية.

---

### 21. الدور (Role) يُقرأ من localStorage فقط — بدون تحقق

**الملف:** `src/App.jsx` السطر 24

```js
const [role, setRoleState] = useState(localStorage.getItem('role') || 'patient');
```

أي مستخدم يستطيع فتح Developer Tools وتغيير `role` في localStorage ليرى واجهة الأدوار الأخرى.

---

### 22. OTP Verification لا يتحقق من هوية البريد الإلكتروني

**الملف:** `backend/routes/auth.js` السطر 144-173

```js
const { email, otp } = req.body;
const user = await User.findOne({ email: email.toLowerCase() });
// ← لا يوجد تحديد لعدد المحاولات! يمكن brute-force الـ OTP
```

---

### 23. اتصال WebSocket غير مشفر

**الملف:** `src/context/BleContext.jsx` السطر 111

```js
const WS_BRIDGE_URL = 'ws://localhost:8765'; // ← ws:// وليس wss://
```

---

## 🛠️ خطة الإصلاح الموصى بها

### الأولوية الأولى (فورية — قبل أي نشر)

| # | الإجراء | الملف |
|---|---|---|
| 1 | إضافة `backend/.env` إلى `.gitignore` | `.gitignore` |
| 2 | توليد JWT Secret قوي عشوائي | `backend/.env` |
| 3 | استبدال MockUser بـ User الحقيقي في auth middleware | `backend/middleware/authMiddleware.js` |
| 4 | توليد OTP عشوائي وتقليل صلاحيته إلى 10 دقائق | `backend/routes/auth.js` |
| 5 | حذف Backdoor `test@test.com` | `src/pages/Welcome.jsx` |
| 6 | تقييد CORS | `backend/server.js` |

### الأولوية الثانية (خلال أسبوع)

| # | الإجراء | الملف |
|---|---|---|
| 7 | حماية مسار `/uploads` بمصادقة | `backend/server.js` |
| 8 | إزالة `debug` من رسائل الأخطاء في الإنتاج | `backend/routes/auth.js` |
| 9 | تفعيل mongoSanitize و xss | `backend/server.js` |
| 10 | Rate Limiting على register و forgot-password و verify-otp | `backend/routes/auth.js` |
| 11 | تغيير صلاحية JWT من 30 يوم إلى 15 دقيقة + Refresh Token | `backend/routes/auth.js` |
| 12 | إصلاح reset URL ليكون ديناميكياً | `backend/routes/auth.js` |

### الأولوية الثالثة (خلال شهر)

| # | الإجراء |
|---|---|
| 13 | الانتقال من localStorage إلى httpOnly Cookies للتوكن |
| 14 | إضافة Whitelist للحقول القابلة للتعديل في profile |
| 15 | إضافة حد لعدد محاولات OTP |
| 16 | إضافة تحقق من نوع وحجم صور الملف الشخصي |
| 17 | استخدام WSS بدلاً من WS للبلوتوث |
| 18 | إضافة HTTPS في الإنتاج |

---

## 📈 تقييم عام للأمان

```
🔴 الجاهزية للإنتاج الحالية: 2/10
🟡 بعد إصلاح الأولوية الأولى: 6/10
🟢 بعد إصلاح جميع المشاكل: 8.5/10
```

> [!IMPORTANT]
> هذا التطبيق يتعامل مع **بيانات طبية حساسة** وقد يخضع لأنظمة حماية البيانات الصحية (مثل HIPAA أو ما يعادله محلياً). الثغرات الحالية تعرض بيانات المرضى للخطر وقد تترتب عليها مسؤوليات قانونية.

---

*تم إنشاء هذا التقرير بعد الفحص الكامل لـ: backend/server.js، auth.js، api.js، connections.js، notifications.js، upload.js، authMiddleware.js، uploadMiddleware.js، connectionMiddleware.js، User.js، MockUser.js، Welcome.jsx، Profile.jsx، App.jsx، BleContext.jsx*
