const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { checkDoctorPatientConnection } = require('../middleware/connectionMiddleware');
const User = require('../models/MockUser');
const VitalsHistory = require('../models/VitalsHistory');
const AlertEvent = require('../models/AlertEvent');
const PatientNote = require('../models/PatientNote');
const SystemEvent = require('../models/SystemEvent');
const IntelligenceEngine = require('../services/IntelligenceEngine');

// === 0. مسارات الملف الشخصي ===
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash -otp -resetPasswordToken');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Server error retrieving profile' });
    }
});

router.put('/profile', protect, async (req, res) => {
    try {
        const updates = req.body;
        
        // Prevent protected fields from being updated directly here
        delete updates.password_hash;
        delete updates.role;
        delete updates.isVerified;
        delete updates.email; // Can't change email easily without re-verification

        const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select('-password_hash');
        
        res.status(200).json({ message: 'تم تحديث الملف الشخصي بنجاح', user });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'فشل في تحديث الملف الشخصي', details: err.message });
    }
});

// === 1. مسارات (صلاحيات) المريض ===
// رؤية السجل الطبي: مسموح للمريض الذي يملكه وللدكتور المعالج أو المرافق (لكن الكود يوضح الأساسيات)
router.get('/patient/medical-record', protect, restrictTo('patient', 'doctor', 'caregiver'), (req, res) => {
    // بناءً على منطق محدد: المريض يرى سجله فقط، الدكتور يرى سجل مريضه، المرافق يرى سجل المريض المرتبط به
    res.status(200).json({ message: `تم استرجاع السجل الطبي الخاص بك بنجاح، مرحباً بصفتك: ${req.user.role}` });
});

// حجز المواعيد: مسموح للمريض فقط القيام بذلك (وربما المرافق أحياناً، ولكن كمثال نقيده للمريض)
router.post('/patient/appointments', protect, restrictTo('patient'), (req, res) => {
    res.status(200).json({ message: 'تم حجز الموعد بنجاح.' });
});

// رؤية بيانات الأطباء المتاحة للبحث والتصفح
router.get('/patient/doctors-list', protect, restrictTo('patient'), async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('name email phone specialty hospital');
        res.status(200).json({ message: 'تم استرجاع قائمة الأطباء المتاحين.', data: doctors });
    } catch (err) {
        res.status(500).json({ error: 'خطأ الخادم الداخلي أثناء جلب الأطباء.' });
    }
});

// لوحة التحكم الخاصة بالمريض
router.get('/patient/dashboard', protect, restrictTo('patient'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        // Mock data logic. In real app, fetch from a Vitals collection
        res.status(200).json({
            vitals: {
                heartRate: user.lastHeartRate || 72,
                temp: user.lastTemp || 36.6,
                bp: user.lastBp || '120/80',
            },
            chartData: [65, 68, 74, 72, 78, user.lastHeartRate || 72],
            activities: [
                { id: '1', title: 'Heart Rate Measured', time: 'Just now', value: `${user.lastHeartRate || 72} bpm`, icon: 'heart', color: '#EF4444' }
            ]
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error retrieving dashboard' });
    }
});

// مزامنة أجهزة القياس (BLE Sync)
router.post('/patient/vitals/sync', protect, restrictTo('patient'), async (req, res) => {
    try {
        const { heartRate, oxygen, temperature, bloodPressure, deviceStatus, batteryLevel } = req.body;
        
        // Update user's latest vitals
        await User.findByIdAndUpdate(req.user.id, {
            $set: {
                lastHeartRate: heartRate,
                lastTemp: temperature,
                lastBp: bloodPressure,
                lastSpO2: oxygen
            }
        });
        
        // Save to historical record
        const vitalsRecord = new VitalsHistory({
            patientId: req.user.id,
            heartRate,
            spO2: oxygen,
            temperature,
            bloodPressure,
            deviceStatus: deviceStatus || 'connected',
            batteryLevel
        });
        await vitalsRecord.save();

        res.status(200).json({ message: 'تمت مزامنة البيانات الصحية بنجاح' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'فشل في مزامنة البيانات' });
    }
});


// === 2. مسارات (صلاحيات) الدكتور ===
// رؤية المرضى المرتبطين بالطبيب
router.get('/doctor/my-patients', protect, restrictTo('doctor'), (req, res) => {
    res.status(200).json({ message: 'تم استرجاع قائمة جميع المرضى المرتبطين بك.' });
});

// تحديث السجلات الطبية: مسموح فقط للطبيب المختص، وبشرط وجود متابعة نشطة
router.put('/doctor/medical-record/:patientId', protect, restrictTo('doctor'), checkDoctorPatientConnection, (req, res) => {
    res.status(200).json({ message: 'تم تحديث السجل الطبي للمريض بشكل آمن.' });
});

// رؤية السجل الطبي للمريض من قبل الدكتور (بشرط وجود متابعة نشطة)
router.get('/doctor/patient-record/:patientId', protect, restrictTo('doctor'), checkDoctorPatientConnection, (req, res) => {
    res.status(200).json({ message: 'تم الوصول إلى السجل الطبي للمريض بنجاح.' });
});

// إدارة المواعيد (قبول / رفض / تأجيل)
router.put('/doctor/manage-appointments', protect, restrictTo('doctor'), (req, res) => {
    res.status(200).json({ message: 'تمت إدارة الموعد المطلوب للمريض.' });
});


// === 3. مسارات (صلاحيات) المرافق ===
// رؤية المعلومات الطبية للمريض المصرح له فقط
router.get('/caregiver/patient-info', protect, restrictTo('caregiver'), (req, res) => {
    // في أرض الواقع سيتم البحث عن المريض المحدد بـ req.user.patientId
    res.status(200).json({ message: 'تم استرجاع المعلومات الخاصة بالمريض المرتبط بك بصفتك مرافق.' });
});

// استقبال واسترجاع التنبيهات
router.get('/caregiver/alerts', protect, restrictTo('caregiver'), (req, res) => {
    res.status(200).json({ message: 'سجل التنبيهات الصحية والتوصيات للطوارئ.' });
});

// التواصل مع الأطباء: مسموح للمرافق وللمريض أحياناً
router.post('/caregiver/messages', protect, restrictTo('caregiver', 'patient'), (req, res) => {
    res.status(200).json({ message: 'تم إرسال الرسالة إلى صندوق الطبيب.' });
});

// استخراج خط الأساس الديناميكي (Dynamic Baseline) للمريض
router.get('/patient/baseline', protect, restrictTo('patient', 'doctor', 'caregiver'), async (req, res) => {
    try {
        const patientId = req.user.role === 'patient' ? req.user.id : (req.query.patientId || req.user.id);
        
        // 14 days of data to compute baseline
        const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const vitals = await VitalsHistory.find({ patientId, timestamp: { $gte: since } });

        if (vitals.length < 5) {
            // Not enough data, return medical defaults
            return res.json({
                success: true,
                isDefault: true,
                data: {
                    hrAvg: 75, hrSD: 15,
                    spo2Avg: 98, spo2SD: 2,
                    tempAvg: 37, tempSD: 0.5
                }
            });
        }

        // Helper to calculate mean and standard deviation
        const calculateStats = (dataArray) => {
            if (dataArray.length === 0) return { avg: 0, sd: 0 };
            const mean = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const variance = dataArray.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dataArray.length;
            return { avg: Math.round(mean * 10) / 10, sd: Math.round(Math.sqrt(variance) * 10) / 10 };
        };

        const hrData = vitals.map(v => v.heartRate).filter(v => v != null && v > 0);
        const spo2Data = vitals.map(v => v.spO2).filter(v => v != null && v > 0);
        const tempData = vitals.map(v => v.temperature).filter(v => v != null && v > 0);

        const hrStats = calculateStats(hrData);
        const spo2Stats = calculateStats(spo2Data);
        const tempStats = calculateStats(tempData);

        res.json({
            success: true,
            isDefault: false,
            data: {
                hrAvg: hrStats.avg || 75, hrSD: hrStats.sd || 15,
                spo2Avg: spo2Stats.avg || 98, spo2SD: spo2Stats.sd || 2,
                tempAvg: tempStats.avg || 37, tempSD: tempStats.sd || 0.5
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'فشل في استخراج خط الأساس الديناميكي' });
    }
});

// === 4. مسارات النظام والسجل الزمني الموحد ===

// تسجيل أحداث النظام (مثل انقطاع الاتصال)
router.post('/events', protect, restrictTo('patient'), async (req, res) => {
    try {
        const { eventType, details, lastKnownValues } = req.body;
        const systemEvent = new SystemEvent({
            patientId: req.user.id,
            eventType,
            details,
            lastKnownValues
        });
        await systemEvent.save();
        res.status(200).json({ message: 'Event logged successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to log event' });
    }
});

// السجل الزمني الموحد للمريض (Timeline)
router.get('/patient/timeline', protect, restrictTo('patient', 'doctor', 'caregiver'), async (req, res) => {
    try {
        const patientId = req.user.role === 'patient' ? req.user.id : (req.query.patientId || req.user.id);
        
        const [alerts, notes, events] = await Promise.all([
            AlertEvent.find({ patientId }).sort({ startTime: -1 }).limit(50),
            PatientNote.find({ patientId }).sort({ eventTime: -1 }).limit(50),
            SystemEvent.find({ patientId }).sort({ eventTime: -1 }).limit(50)
        ]);

        const formattedAlerts = alerts.map(a => ({
            id: a._id,
            type: 'alert',
            title: `تنبيه: ${a.sensorType}`,
            description: a.details,
            time: a.startTime,
            severity: a.severity
        }));

        const formattedNotes = notes.map(n => ({
            id: n._id,
            type: 'note',
            title: `ملاحظة (${n.type})`,
            description: n.noteText,
            time: n.eventTime
        }));

        const formattedEvents = events.map(e => ({
            id: e._id,
            type: 'system',
            title: e.eventType === 'DEVICE_OFFLINE' ? 'انقطاع الاتصال بالجهاز' : 'تعافي مؤشرات المريض',
            description: e.details,
            time: e.eventTime,
            severity: e.eventType === 'DEVICE_OFFLINE' ? 'Warning' : 'Info'
        }));

        const timeline = [...formattedAlerts, ...formattedNotes, ...formattedEvents]
            .sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json({ success: true, data: timeline });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'فشل في استخراج السجل الزمني' });
    }
});

// ترتيب المرضى للطبيب (Triage Ranking)
router.get('/doctor/patients-ranking', protect, restrictTo('doctor'), async (req, res) => {
    try {
        // Mock fetching patients linked to this doctor
        const patients = await User.find({ role: 'patient' }).select('_id name');
        
        // 30-day window
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const rankedPatients = await Promise.all(patients.map(async (p) => {
            const vitals = await VitalsHistory.find({ patientId: p._id, timestamp: { $gte: since } });
            const alerts = await AlertEvent.find({ patientId: p._id, startTime: { $gte: since } });
            
            const riskInsight = IntelligenceEngine.calculateHealthRiskScore(vitals, alerts);
            // Parse risk score
            const scoreMatch = riskInsight.description.match(/Risk Score: (\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
            const statusMatch = riskInsight.description.match(/Status: (\w+)/);
            const status = statusMatch ? statusMatch[1] : 'Low';
            
            return {
                id: p._id,
                name: p.name,
                riskScore: score,
                status: status,
                alertCount: alerts.length
            };
        }));
        
        // Sort: Score descending -> Alert count descending
        rankedPatients.sort((a, b) => {
            if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
            return b.alertCount - a.alertCount;
        });

        // Grouping
        const critical = rankedPatients.filter(p => p.status === 'Critical');
        const highRisk = rankedPatients.filter(p => p.status === 'High');
        const stable = rankedPatients.filter(p => p.status === 'Medium' || p.status === 'Low');

        res.json({
            success: true,
            data: {
                critical,
                highRisk,
                stable
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'فشل في ترتيب المرضى' });
    }
});

module.exports = router;
