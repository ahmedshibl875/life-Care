const mongoose = require('mongoose');

const AlertEventSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sensorType: { type: String, required: true, enum: ['Heart Rate', 'SpO2', 'Body Temperature', 'Blood Pressure', 'Other'] },
  readingValue: { type: Number, required: true },
  threshold: { type: Number, required: true },
  severity: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Critical'] },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number }, // in seconds
  resolvedStatus: { type: Boolean, default: false },
  details: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AlertEvent', AlertEventSchema);
