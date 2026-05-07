const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    linked_patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true // ضمان ربط المرافق بمريض حقيقي
    },
    relationship: {
        type: String,
        required: true
    }
}, { timestamps: true });

// منع تكرار نفس المرافق لنفس المريض إذا كانت هناك حاجة لذلك
caregiverSchema.index({ user_id: 1, linked_patient_id: 1 }, { unique: true });

module.exports = mongoose.model('Caregiver', caregiverSchema);
