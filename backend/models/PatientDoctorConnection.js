const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // يشير إلى المريض في جدول المستخدمين
        required: true
    },
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // يشير إلى الطبيب في جدول المستخدمين
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'ended'],
        default: 'pending' // يبدأ الطلب معلقاً
    },
    ended_at: {
        type: Date,
        default: null
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// إنشاء فهرس لمنع تكرار المتابعة (منع فتح متابعة جديدة إذا كان هناك واحدة نشطة أو معلقة بالفعل)
connectionSchema.index({ patient_id: 1, doctor_id: 1, status: 1 });

module.exports = mongoose.model('PatientDoctorConnection', connectionSchema);
