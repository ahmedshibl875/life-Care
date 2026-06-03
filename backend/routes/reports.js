const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const VitalsHistory = require('../models/VitalsHistory');
const AlertEvent = require('../models/AlertEvent');
const PatientNote = require('../models/PatientNote');
const User = require('../models/MockUser'); // or User if migrated
const IntelligenceEngine = require('../services/IntelligenceEngine');

const getTargetPatientId = (req) => {
  if (req.user.role === 'patient') return req.user._id;
  // If doctor or caregiver, expect patientId in query. Add actual permission check in prod.
  return req.query.patientId || req.user._id;
};

// 1. SMART REPORT GENERATION: Summary & Abnormal Periods
router.get('/summary', protect, async (req, res) => {
  try {
    const patientId = getTargetPatientId(req);
    
    // Time filter (default: last 24 hours)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const alerts = await AlertEvent.find({ patientId, startTime: { $gte: since } });
    
    let highestHR = 0, lowestHR = 999;
    
    // We could calculate highest/lowest from VitalsHistory as well
    const vitals = await VitalsHistory.find({ patientId, timestamp: { $gte: since } });
    vitals.forEach(v => {
      if (v.heartRate > highestHR) highestHR = v.heartRate;
      if (v.heartRate < lowestHR) lowestHR = v.heartRate;
    });

    const mostCriticalEvent = alerts.find(a => a.severity === 'Critical') || alerts[0] || null;

    // Abnormal Time Periods mapping
    const abnormalPeriods = alerts.map(a => ({
      sensor: a.sensorType,
      startTime: a.startTime,
      endTime: a.endTime || new Date(),
      duration: a.duration || Math.floor(((a.endTime || new Date()) - a.startTime) / 1000),
      description: a.details
    }));

    res.json({
      success: true,
      data: {
        totalAlerts: alerts.length,
        highestHR: highestHR === 0 ? null : highestHR,
        lowestHR: lowestHR === 999 ? null : lowestHR,
        mostCriticalEvent,
        abnormalPeriods
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. NOTE CORRELATION
router.get('/correlations', protect, async (req, res) => {
  try {
    const patientId = getTargetPatientId(req);
    
    // Find recent notes
    const notes = await PatientNote.find({ patientId }).sort({ eventTime: -1 }).limit(10);
    const alerts = await AlertEvent.find({ patientId }).sort({ startTime: -1 }).limit(20);

    const correlations = [];

    // Simple rule-based correlation: Find alerts within 15 minutes of a note
    notes.forEach(note => {
      const noteTime = note.eventTime.getTime();
      const fifteenMins = 15 * 60 * 1000;
      
      const relatedAlerts = alerts.filter(a => {
        const alertTime = a.startTime.getTime();
        return Math.abs(alertTime - noteTime) <= fifteenMins;
      });

      if (relatedAlerts.length > 0) {
        correlations.push({
          note: note.noteText,
          noteTime: note.eventTime,
          relatedAlerts: relatedAlerts.map(a => ({
            type: a.sensorType,
            description: a.details,
            time: a.startTime
          }))
        });
      }
    });

    res.json({ success: true, data: correlations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. TREND ANALYSIS
router.get('/trends', protect, async (req, res) => {
  try {
    const patientId = getTargetPatientId(req);
    const range = req.query.range || 'daily'; // daily, weekly, monthly
    
    let daysToSubtract = 1;
    if (range === 'weekly') daysToSubtract = 7;
    if (range === 'monthly') daysToSubtract = 30;

    const since = new Date(Date.now() - daysToSubtract * 24 * 60 * 60 * 1000);
    
    const vitals = await VitalsHistory.find({ patientId, timestamp: { $gte: since } }).sort({ timestamp: 1 });
    
    // A real implementation would use MongoDB Aggregation pipelines ($group).
    // Doing a simplified grouping in memory.
    const grouped = {
      labels: [],
      heartRate: [],
      spO2: [],
      temperature: []
    };

    // If we have data, we'll pick max 7 points to display smoothly on a mobile chart
    if (vitals.length > 0) {
      const step = Math.max(1, Math.floor(vitals.length / 7));
      for (let i = 0; i < vitals.length; i += step) {
        const v = vitals[i];
        // Formatting label based on range
        const label = range === 'daily' ? `${v.timestamp.getHours()}:00` : `${v.timestamp.getDate()}/${v.timestamp.getMonth()+1}`;
        grouped.labels.push(label);
        grouped.heartRate.push(v.heartRate || 0);
        grouped.spO2.push(v.spO2 || 0);
        grouped.temperature.push(v.temperature || 0);
      }
    } else {
       // Mock fallback
       grouped.labels = ['1','2','3','4','5','6','7'];
       grouped.heartRate = [70,72,75,71,80,72,74];
    }

    res.json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. AI INSIGHTS (Rule-based Engine)
router.get('/insights', protect, async (req, res) => {
  try {
    const patientId = getTargetPatientId(req);
    const role = req.user.role; // Adjust insight based on role

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // look at last 30 days
    
    // Fetch data concurrently
    const [vitals, alerts, notes] = await Promise.all([
      VitalsHistory.find({ patientId, timestamp: { $gte: since } }),
      AlertEvent.find({ patientId, startTime: { $gte: since } }),
      PatientNote.find({ patientId, eventTime: { $gte: since } })
    ]);
    
    // Generate insights via the Intelligence Engine
    const insights = IntelligenceEngine.generateComprehensiveReport(vitals, alerts, notes, role);

    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
