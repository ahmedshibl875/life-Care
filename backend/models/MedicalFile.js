const mongoose = require('mongoose');

const medicalFileSchema = new mongoose.Schema({
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
    record_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalRecord',
        required: true
    },
    file_name: {
        type: String,
        required: true
    },
    file_url: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('MedicalFile', medicalFileSchema);
