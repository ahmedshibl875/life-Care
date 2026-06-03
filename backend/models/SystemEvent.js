const mongoose = require('mongoose');

const SystemEventSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventType: { type: String, required: true }, // 'DEVICE_OFFLINE', 'DEVICE_ONLINE', 'RECOVERY'
  details: { type: String },
  lastKnownValues: {
    heartRate: Number,
    spO2: Number,
    temperature: Number
  },
  eventTime: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.model('SystemEvent', SystemEventSchema);
