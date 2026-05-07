const PatientDoctorConnection = require('../models/PatientDoctorConnection');

// Security & Privacy rule: Doctor can only access patient data if they have an active "approved" connection
exports.checkDoctorPatientConnection = async (req, res, next) => {
    try {
        // Only apply this check to doctors
        if (req.user.role !== 'doctor') {
            return next();
        }

        // Get the patient ID from params, body, or query
        const patientId = req.params.patientId || req.body.patient_id || req.query.patientId;

        if (!patientId) {
            return res.status(400).json({ error: 'معرف المريض (patientId) مطلوب للتحقق من صلاحية الوصول.' });
        }

        // Check if there is an approved connection
        const activeConnection = await PatientDoctorConnection.findOne({
            patient_id: patientId,
            doctor_id: req.user._id,
            status: 'approved'
        });

        if (!activeConnection) {
            return res.status(403).json({ error: 'غير مصرح للوصول: لا يمكنك الوصول إلى بيانات هذا المريض بدون موافقة مسبقة أو متابعة نشطة.' });
        }

        next();
    } catch (err) {
        return res.status(500).json({ error: 'خطأ داخلي أثناء التحقق من صلاحيات متابعة الدكتور للمريض.' });
    }
};
