const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const PatientDoctorConnection = require('../models/PatientDoctorConnection');
const User = require('../models/User');
const { sendNotification } = require('./notifications');

// 0. التحقق من صحة Doctor ID (للبحث عن طريق الآي دي المخصص للدكتور)
router.get('/verify_doctor/:custom_id', protect, restrictTo('patient'), async (req, res) => {
    try {
        const customId = req.params.custom_id.toUpperCase();
        const doctor = await User.findOne({ doctor_id: customId, role: 'doctor' }).select('_id name specialty hospital doctor_id');

        if (!doctor) {
            return res.status(404).json({ error: 'لم يتم العثور على طبيب بهذا المعرف.' });
        }

        res.status(200).json({
            message: 'تم العثور على الطبيب بنجاح.',
            doctor: {
                _id: doctor._id,
                name: doctor.name,
                specialty: doctor.specialty || 'General',
                hospital: doctor.hospital || 'Doctor Clinic',
                doctor_id: doctor.doctor_id
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'خطأ الخادم الداخلي أثناء التحقق من المعرف.' });
    }
});

// 1. المريض يرسل طلب متابعة للدكتور
router.post('/send_follow_request', protect, restrictTo('patient'), async (req, res) => {
    try {
        const { doctor_id } = req.body;

        // التحقق من أن الطبيب المختار موجود بنظامنا كدكتور فعلياً
        const doctor = await User.findOne({ _id: doctor_id, role: 'doctor' });
        if (!doctor) {
            return res.status(404).json({ error: 'لم يتم العثور على الطبيب المحدد.' });
        }

        // التحقق مما إذا كان هناك طلب قيد الانتظار أو متابعة نشطة بالفعل بين هذا المريض وذلك الطبيب
        const existingConnection = await PatientDoctorConnection.findOne({
            patient_id: req.user._id,
            doctor_id,
            status: { $in: ['pending', 'approved'] }
        });

        if (existingConnection) {
            return res.status(400).json({ error: 'يوجد طلب معلق أو متابعة طبية نشطة مسبقاً مع هذا الطبيب.' });
        }

        // إنشاء اتصال مبدئي (قيد المراجعة)
        const newConnection = new PatientDoctorConnection({
            patient_id: req.user._id,
            doctor_id
        });
        await newConnection.save();

        // إرسال إشعار فوري للدكتور المعني
        await sendNotification(
            doctor_id,
            'new_appointment', // يمكن إعادة استخدام هذا النوع للتنبيه بالطلب
            'طلب متابعة طبية جديد',
            `يطلب المريض ${req.user.name} بدء متابعة سريرية معك والوصول لملفاته الطبية.`,
            newConnection._id
        );

        res.status(201).json({ message: 'تم إرسال طلب المتابعة إلى الطبيب بنجاح.', connection: newConnection });
    } catch (err) {
        res.status(500).json({ error: 'حدث خطأ داخلي أثناء معالجة الطلب.' });
    }
});

// 2. الدكتور يوافق على طلب المتابعة الوارد
router.put('/approve_follow_request/:id', protect, restrictTo('doctor'), async (req, res) => {
    try {
        // التأكد من أن الطلب المعلق يخص هذا الدكتور تحديداً
        const connection = await PatientDoctorConnection.findOne({
            _id: req.params.id,
            doctor_id: req.user._id,
            status: 'pending'
        });

        if (!connection) return res.status(404).json({ error: 'الطلب غير موجود أو تمت معالجته مسبقاً.' });

        connection.status = 'approved';
        await connection.save();

        // إشعار المريض بقبول الدكتور
        await sendNotification(
            connection.patient_id,
            'system_message',
            'تمت الموافقة على طلب المتابعة',
            `قام الطبيب ${req.user.name} بقبول طلبك وتم إنشاء الاتصال الآمن ومنحه حق الوصول لبياناتك.`,
            connection._id
        );

        res.status(200).json({ message: 'تم فتح قناة المتابعة والموافقة على الطلب بنجاح.', connection });
    } catch (err) {
        res.status(500).json({ error: 'خطأ الخادم الداخلي' });
    }
});

// 3. الدكتور يرفض طلب المتابعة الوارد
router.put('/reject_follow_request/:id', protect, restrictTo('doctor'), async (req, res) => {
    try {
        const connection = await PatientDoctorConnection.findOne({
            _id: req.params.id,
            doctor_id: req.user._id,
            status: 'pending'
        });

        if (!connection) return res.status(404).json({ error: 'الطلب غير موجود أو تمت معالجته مسبقاً.' });

        // رفض الطلب
        connection.status = 'rejected';
        await connection.save();

        await sendNotification(
            connection.patient_id,
            'system_message',
            'إعتذار عن المتابعة',
            `للأسف، تعذر على الطبيب ${req.user.name} قبول متابعتك الطبية حالياً بسبب ضغط المواعيد، يمكنك البحث عن أطباء آخرين.`,
            connection._id
        );

        res.status(200).json({ message: 'تم رفض طلب المتابعة.' });
    } catch (err) {
        res.status(500).json({ error: 'خطأ الخادم الداخلي' });
    }
});

// 4. المريض يُنهي المتابعة (سحب الصلاحيات من الدكتور فوراً)
router.put('/end_follow_up/:id', protect, restrictTo('patient'), async (req, res) => {
    try {
        // التأكد من أن המبادر بالإنهاء هو המريض المرتبط بالدكتور
        const connection = await PatientDoctorConnection.findOne({
            _id: req.params.id,
            patient_id: req.user._id,
            status: 'approved' // يمكن إلغاء فقط العلاقات النشطة الموافَق عليها مسبقاً
        });

        if (!connection) return res.status(404).json({ error: 'لا توجد متابعة طبية نشطة مع هذا المعرف.' });

        // إنهاء الاتصال بشكل دائم وتسجيل وقت الإلغاء
        connection.status = 'ended';
        connection.ended_at = new Date();
        await connection.save();

        // إشعار الطبيب بسحب الصلاحيات
        await sendNotification(
            connection.doctor_id,
            'patient_alert',
            'إنهاء ارتباط',
            `قام المريض ${req.user.name} بإنهاء المتابعة الطبية وإسقاط صلاحية الوصول لسجله الطبي.`,
            connection._id
        );

        res.status(200).json({ message: 'تم قطع الاتصال وإنهاء المتابعة الطبية بنجاح.', connection });
    } catch (err) {
        res.status(500).json({ error: 'خطأ الخادم الداخلي' });
    }
});

// 5. جلب قائمة أطباء المريض (المعلقين أو المقبولين)
router.get('/get_patient_doctors', protect, restrictTo('patient'), async (req, res) => {
    try {
        // populate تقوم بجلب بيانات الطبيب الحقيقية من الـ ID بأمان دون جلب باسورداته أو معلوماته الحساسة
        const connections = await PatientDoctorConnection.find({
            patient_id: req.user._id,
            status: { $in: ['pending', 'approved'] }
        }).populate('doctor_id', 'name email phone');

        res.status(200).json({ message: 'قائمة الأطباء المرتبطين بك.', data: connections });
    } catch (err) {
        res.status(500).json({ error: 'خطأ الخادم الداخلي' });
    }
});

// 6. جلب قائمة مرضى الطبيب (الذين لديهم ارتباط فعلي أو طلبات جديدة)
router.get('/get_doctor_patients', protect, restrictTo('doctor'), async (req, res) => {
    try {
        const connections = await PatientDoctorConnection.find({
            doctor_id: req.user._id,
            status: { $in: ['pending', 'approved'] }
        }).populate('patient_id', 'name phone dateOfBirth'); // جلب بيانات המرضى الأساسية

        res.status(200).json({ message: 'قائمة المرضى قيد العلاج والطلبات الجديدة.', data: connections });
    } catch (err) {
        res.status(500).json({ error: 'خطأ الخادم الداخلي' });
    }
});

module.exports = router;
