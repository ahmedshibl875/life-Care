const express = require('express');
const router = express.Router();
const PatientNote = require('../models/PatientNote');
const { protect } = require('../middleware/auth');

// Create a new note
router.post('/', protect, async (req, res) => {
  try {
    const { noteText, eventTime, type } = req.body;
    
    // Determine event time. If not provided (Option 1: current device date/time), use Date.now()
    // Option 2 allows user to manually select Date/Time, which will be passed in eventTime.
    const finalEventTime = eventTime ? new Date(eventTime) : new Date();

    const note = new PatientNote({
      patientId: req.user.role === 'patient' ? req.user._id : req.body.patientId, // companions can add notes for patient
      noteText,
      eventTime: finalEventTime,
      createdBy: req.user._id,
      type: type || 'Patient'
    });

    await note.save();
    
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error('Create Note Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get notes for a patient
router.get('/', protect, async (req, res) => {
  try {
    let patientId = req.user._id;
    if ((req.user.role === 'companion' || req.user.role === 'doctor') && req.query.patientId) {
      patientId = req.query.patientId;
    }

    const notes = await PatientNote.find({ patientId }).sort({ eventTime: -1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a note
router.put('/:id', protect, async (req, res) => {
  try {
    const note = await PatientNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    if (req.body.noteText) note.noteText = req.body.noteText;
    if (req.body.eventTime) note.eventTime = new Date(req.body.eventTime);

    await note.save(); // updatedAt will be automatically updated
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
