const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    appointment_date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// منع حجز موعدين لنفس الدكتور في ذات الوقت بالضبط
appointmentSchema.index({ doctor_id: 1, appointment_date: 1 }, { unique: true });

// منع المريض من حجز نفس الموعد لدى دكتورين مختلفين في نفس الوقت
appointmentSchema.index({ patient_id: 1, appointment_date: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
