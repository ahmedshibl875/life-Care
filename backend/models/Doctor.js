const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    specialization: {
        type: String,
        required: true
    },
    license_number: {
        type: String,
        required: true,
        unique: true // يمنع تكرار رقم ترخيص الدكتور
    },
    years_of_experience: {
        type: Number,
        required: true,
        min: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
