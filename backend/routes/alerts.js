const express = require('express');
const router = express.Router();
const AlertEvent = require('../models/AlertEvent');
const { protect } = require('../middleware/authMiddleware');

// Create a new alert
router.post('/', protect, async (req, res) => {
  try {
    const { sensorType, readingValue, threshold, severity, details } = req.body;
    
    const alert = new AlertEvent({
      patientId: req.user._id,
      sensorType,
      readingValue,
      threshold,
      severity,
      details,
      startTime: Date.now()
    });

    await alert.save();
    
    // In a real system, you would also trigger a WebSocket event or Push Notification to the companion here.
    
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    console.error('Create Alert Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get alerts for a patient
router.get('/', protect, async (req, res) => {
  try {
    // If the user is a patient, return their own alerts.
    // If the user is a companion/doctor, they would pass patientId in query.
    let patientId = req.user._id;
    if ((req.user.role === 'companion' || req.user.role === 'doctor') && req.query.patientId) {
      patientId = req.query.patientId;
    }

    const alerts = await AlertEvent.find({ patientId }).sort({ startTime: -1 });
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Resolve an alert
router.put('/:id/resolve', protect, async (req, res) => {
  try {
    const alert = await AlertEvent.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    // Ensure authorization (patient or their companion/doctor)
    // Simplified for now: just update it
    
    alert.resolvedStatus = true;
    alert.endTime = Date.now();
    alert.duration = Math.floor((alert.endTime - alert.startTime) / 1000); // duration in seconds
    
    await alert.save();
    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
