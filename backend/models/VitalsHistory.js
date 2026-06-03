const mongoose = require('mongoose');

const VitalsHistorySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  heartRate: { type: Number },
  spO2: { type: Number },
  temperature: { type: Number },
  bloodPressure: { type: String }, // Stored as "120/80"
  deviceStatus: { type: String, default: 'connected' }, // 'connected', 'disconnected', 'error', 'low_battery'
  batteryLevel: { type: Number },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.model('VitalsHistory', VitalsHistorySchema);
