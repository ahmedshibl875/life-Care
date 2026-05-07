const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // لكل مريض حساب مستخدم واحد فقط للمنع من تكرار البيانات
    },
    date_of_birth: {
        type: Date,
        required: true
    },
    medical_history: {
        type: [String],
        default: []
    },
    emergency_contact: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
