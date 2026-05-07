const jwt = require('jsonwebtoken');
const User = require('../models/MockUser');

// مصادقة الدخول (Protect Middleware) - التحقق من صحة التوكن (Token Verification)
exports.protect = async (req, res, next) => {
    try {
        let token;

        // التحقق من وجود التوكن في الـ Headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ error: 'غير مصرح لك بالوصول، يرجى تسجيل الدخول للحصول على صلاحية الوصول.' });
        }

        // فك تشفير البيانات والتحقق من التوكن
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

        // استخراج المستخدم من قاعدة البيانات والتحقق ما إذا كان الحساب ما زال موجوداً
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ error: 'المستخدم صاحب هذا الرمز لم يعد موجوداً في النظام.' });
        }

        // حفظ بيانات المستخدم لاستخدامها في المراحل القادمة
        req.user = currentUser;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'رمز المصادقة غير صالح متلاعب به، أو منتهي الصلاحية.' });
    }
};

// نظام تقييد الصلاحيات (Role-Based Authorization) - التحقق قبل كل راوت
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // فحص نوع حساب المستخدم الذي قام بالطلب (patient, doctor, OR caregiver)
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'ليس لديك الصلاحية للقيام بهذا الإجراء، محاولة وصول مرفوضة.' });
        }
        next();
    };
};
