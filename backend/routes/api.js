const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { checkDoctorPatientConnection } = require('../middleware/connectionMiddleware');
const User = require('../models/MockUser');

// === 0. مسارات الملف الشخصي ===
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash -otp -resetPasswordToken');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Server error retrieving profile' });
    }
});

router.put('/profile', protect, async (req, res) => {
    try {
        const updates = req.body;
        
        // Prevent protected fields from being updated directly here
        delete updates.password_hash;
        delete updates.role;
        delete updates.isVerified;
        delete updates.email; // Can't change email easily without re-verification

        const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select('-password_hash');
        
        res.status(200).json({ message: 'تم تحديث الملف الشخصي بنجاح', user });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'فشل في تحديث الملف الشخصي', details: err.message });
    }
});

// === 1. مسارات (صلاحيات) المريض ===
// رؤية السجل الطبي: مسموح للمريض الذي يملكه وللدكتور المعالج أو المرافق (لكن الكود يوضح الأساسيات)
router.get('/patient/medical-record', protect, restrictTo('patient', 'doctor', 'caregiver'), (req, res) => {
    // بناءً على منطق محدد: المريض يرى سجله فقط، الدكتور يرى سجل مريضه، المرافق يرى سجل المريض المرتبط به
    res.status(200).json({ message: `تم استرجاع السجل الطبي الخاص بك بنجاح، مرحباً بصفتك: ${req.user.role}` });
});

// حجز المواعيد: مسموح للمريض فقط القيام بذلك (وربما المرافق أحياناً، ولكن كمثال نقيده للمريض)
router.post('/patient/appointments', protect, restrictTo('patient'), (req, res) => {
    res.status(200).json({ message: 'تم حجز الموعد بنجاح.' });
});

// رؤية بيانات الأطباء المتاحة للبحث والتصفح
router.get('/patient/doctors-list', protect, restrictTo('patient'), async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('name email phone specialty hospital');
        res.status(200).json({ message: 'تم استرجاع قائمة الأطباء المتاحين.', data: doctors });
    } catch (err) {
        res.status(500).json({ error: 'خطأ الخادم الداخلي أثناء جلب الأطباء.' });
    }
});


// === 2. مسارات (صلاحيات) الدكتور ===
// رؤية المرضى المرتبطين بالطبيب
router.get('/doctor/my-patients', protect, restrictTo('doctor'), (req, res) => {
    res.status(200).json({ message: 'تم استرجاع قائمة جميع المرضى المرتبطين بك.' });
});

// تحديث السجلات الطبية: مسموح فقط للطبيب المختص، وبشرط وجود متابعة نشطة
router.put('/doctor/medical-record/:patientId', protect, restrictTo('doctor'), checkDoctorPatientConnection, (req, res) => {
    res.status(200).json({ message: 'تم تحديث السجل الطبي للمريض بشكل آمن.' });
});

// رؤية السجل الطبي للمريض من قبل الدكتور (بشرط وجود متابعة نشطة)
router.get('/doctor/patient-record/:patientId', protect, restrictTo('doctor'), checkDoctorPatientConnection, (req, res) => {
    res.status(200).json({ message: 'تم الوصول إلى السجل الطبي للمريض بنجاح.' });
});

// إدارة المواعيد (قبول / رفض / تأجيل)
router.put('/doctor/manage-appointments', protect, restrictTo('doctor'), (req, res) => {
    res.status(200).json({ message: 'تمت إدارة الموعد المطلوب للمريض.' });
});


// === 3. مسارات (صلاحيات) المرافق ===
// رؤية المعلومات الطبية للمريض المصرح له فقط
router.get('/caregiver/patient-info', protect, restrictTo('caregiver'), (req, res) => {
    // في أرض الواقع سيتم البحث عن المريض المحدد بـ req.user.patientId
    res.status(200).json({ message: 'تم استرجاع المعلومات الخاصة بالمريض المرتبط بك بصفتك مرافق.' });
});

// استقبال واسترجاع التنبيهات
router.get('/caregiver/alerts', protect, restrictTo('caregiver'), (req, res) => {
    res.status(200).json({ message: 'سجل التنبيهات الصحية والتوصيات للطوارئ.' });
});

// التواصل مع الأطباء: مسموح للمرافق وللمريض أحياناً
router.post('/caregiver/messages', protect, restrictTo('caregiver', 'patient'), (req, res) => {
    res.status(200).json({ message: 'تم إرسال الرسالة إلى صندوق الطبيب.' });
});


module.exports = router;
