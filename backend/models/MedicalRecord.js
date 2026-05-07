const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
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
    diagnosis: {
        type: String,
        required: true
    },
    treatment: {
        type: String,
        required: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
