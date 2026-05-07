const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const User = require('../models/User');

// --- 1. بناء دالة مساعدة لإنشاء وإرسال إشعار تلقائي (مستخدمة داخلياً) ---
// يُمكن استدعاء هذه الدالة من مسارات المواعيد، أو التقارير حسب الحدث
const sendNotification = async (recipient_id, type, title, message, related_entity_id = null) => {
    try {
        const notif = new Notification({
            recipient_id,
            type,
            title,
            message,
            related_entity_id
        });
        await notif.save();
        return notif;
    } catch (err) {
        console.error('فشل في إرسال الإشعار', err);
    }
};

// --- 2. اختبار إرسال إشعار يدوي (للتجربة من قبل الأدمن أو تطبيق الاختبار) ---
router.post('/send', protect, async (req, res) => {
    try {
        const { recipient_id, type, title, message } = req.body;

        // جلب المستخدم لمعرفة دوره والتأكد من توافق الإشعار معه
        const targetUser = await User.findById(recipient_id);
        if (!targetUser) return res.status(404).json({ error: 'المستقبل غير موجود' });

        // التحقق من توافق الإشعارات المخصصة لـ(مريض)
        if (targetUser.role === 'patient') {
            if (!['appointment_reminder', 'report_update', 'system_message'].includes(type)) {
                return res.status(400).json({ error: 'هذا النوع من الإشعارات لا يُرسل للمرضى.' });
            }
        }

        // التحقق من توافق الإشعارات المخصصة لـ(دكتور)
        if (targetUser.role === 'doctor') {
            if (!['new_appointment', 'patient_alert', 'system_message'].includes(type)) {
                return res.status(400).json({ error: 'هذا النوع من الإشعارات لا يُرسل للأطباء.' });
            }
        }

        // التحقق من توافق الإشعارات المخصصة لـ(مرافق)
        if (targetUser.role === 'caregiver') {
            if (!['emergency', 'health_status', 'system_message'].includes(type)) {
                return res.status(400).json({ error: 'هذا النوع من الإشعارات لا يُرسل للمرافق.' });
            }
        }

        const notif = await sendNotification(recipient_id, type, title, message, req.body.related_id);
        res.status(201).json({ message: 'تم إرسال وحفظ الإشعار بنجاح.', notification: notif });

    } catch (err) {
        res.status(500).json({ error: 'خطأ أثناء السيرفر.' });
    }
});


// --- 3. استرجاع سجل الإشعارات الخاصة بالمستخدم الحالي ---
router.get('/my-notifications', protect, async (req, res) => {
    try {
        // يجلب الإشعارات مرتبة، الأحدث في البداية 
        const notifications = await Notification.find({ recipient_id: req.user._id })
            .sort({ created_at: -1 })
            .limit(50); // إظهار أحدث 50 إشعار

        // عدد الإشعارات غير المقروءة
        const unreadCount = await Notification.countDocuments({ recipient_id: req.user._id, is_read: false });

        res.status(200).json({
            message: 'تم استرجاع الإشعارات',
            unread_count: unreadCount,
            data: notifications
        });

    } catch (err) {
        res.status(500).json({ error: 'خطأ الخادم الداخلي' });
    }
});


// --- 4. تحديد إشعار بأنه (مقروء) ---
router.put('/:id/read', protect, async (req, res) => {
    try {
        // يبحث عن الإشعار بشرط أن يكون صاحبه هو المستخدم الحالي لمنع العبث في إشعارات الآخرين
        const notif = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient_id: req.user._id },
            { is_read: true },
            { new: true }
        );

        if (!notif) {
            return res.status(404).json({ error: 'الإشعار غير موجود أو لا تملك صلاحية تعديله.' });
        }

        res.status(200).json({ message: 'تم قراءة التنبيه', notification: notif });
    } catch (err) {
        res.status(500).json({ error: 'خطأ الخادم الداخلي' });
    }
});


// تصدير دالة الإرسال ليتم استخدامها في باقي أجزاء السيرفر عند حدوث طوارئ أو مواعيد
module.exports = { router, sendNotification };
