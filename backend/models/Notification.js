const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            // أنواع التنبيهات المسموحة بناءً على دور المستخدم
            'appointment_reminder', // تذكير بموعد (مريض)
            'report_update',        // تحديث تقرير طبي (مريض)

            'new_appointment',      // طلب موعد جديد (دكتور)
            'patient_alert',        // تنبيه يخص المريض (دكتور)

            'emergency',            // طوارئ (مرافق)
            'health_status',        // حالة صحية (مرافق)

            'system_message'        // رسائل نظام عامة
        ],
        required: true
    },
    is_read: {
        type: Boolean,
        default: false
    },
    related_entity_id: {
        type: mongoose.Schema.Types.ObjectId, // ربط الإشعار بشيء محدد (رقم موعد أو رقم مريض) للوصول السريع
        default: null
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// إنشاء فهرس تسلسلي لضمان سرعة البحث عن تنبيهات المستخدم وجعل الأحدث في البداية
notificationSchema.index({ recipient_id: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
