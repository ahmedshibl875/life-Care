const mongoose = require('mongoose');

const PatientNoteSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  noteText: { type: String, required: true },
  eventTime: { type: Date, required: true }, // The time the event actually occurred (auto or manual)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Usually the patient, but could be doctor
  type: { type: String, enum: ['Patient', 'Doctor', 'System', 'Medication'], default: 'Patient' }
}, { timestamps: true }); // timestamps adds createdAt (Creation Time) and updatedAt (Last Edited Time)

module.exports = mongoose.model('PatientNote', PatientNoteSchema);
