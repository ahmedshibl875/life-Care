const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const MedicalFile = require('../models/MedicalFile');

// راوت الرفع: محمية بتوكن الدخول، وتستقبل مًلفاً واحداً باسم (file)
// يتوقع مع الطلب في body إرسال : patient_id, doctor_id, record_id
router.post('/record', protect, upload.single('file'), async (req, res) => {
    try {
        // التأكد من أن المستخدم قد رفع ملف
        if (!req.file) {
            return res.status(400).json({ error: 'عذراً، يجب عليك اختيار ملف لرفعه.' });
        }

        const { patient_id, doctor_id, record_id } = req.body;

        // التحقق من أن جميع المعرفات المطلوبة متوفرة بالطلب (إجبارية لحفظ العلاقة)
        if (!patient_id || !doctor_id || !record_id) {
            // حذف الملف إذا كانت البيانات ناقصة حتى لا نكدس السيرفر بملفات يتيمة
            const fs = require('fs');
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                error: 'بيانات غير مكتملة. يجب إرفاق أرقام تعريفات المريض والطبيب والسجل الطبي.'
            });
        }

        // إنشاء رابط الوصول للملف عبر الإنترنت أو السيرفر (افتراضاً سيتم خدمة الـمجلد /uploads كـ statics)
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        // توثيق معلومات الملف وحفظها بالـ Database
        const newMedicalFile = new MedicalFile({
            patient_id,
            doctor_id,
            record_id,
            file_name: req.file.originalname,
            file_url: fileUrl,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        await newMedicalFile.save();

        res.status(201).json({
            message: 'تم رفع الملف بنجاح وربطه بالسجل الطبي.',
            file: newMedicalFile
        });

    } catch (err) {
        // معالجة خطأ حجم الملف من Multer بشكل خاص للغة العربية
        if (err.message && err.message.includes('File too large')) {
            return res.status(400).json({ error: 'عذراً، حجم الملف كبير جداً! الحد الأقصى المسموح به هو 5 ميجابايت.' });
        }
        res.status(500).json({ error: err.message || 'حدث خطأ داخلي أثناء حفظ الملف.' });
    }
});

module.exports = router;
