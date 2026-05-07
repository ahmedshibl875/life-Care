const multer = require('multer');
const path = require('path');
const fs = require('fs');

// التأكد من وجود مجلد الرفع
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// إعدادات التخزين للحفاظ على اسم الملف مع إضافة معرّف عشوائي لتفادي التكرار
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // إزالة الحروف الخاصة من الاسم الأصلي للحماية
        const cleanName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, "_");
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, cleanName + '-' + uniqueSuffix + ext);
    }
});

// فلتر الأمان للأنواع المسموحة فقط
const fileFilter = (req, file, cb) => {
    // الأنواع المسموحة
    const allowedTypes = /jpeg|jpg|png|pdf/;

    // فحص امتداد الملف
    const hasValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    // فحص المحتوى الفعلي للملف (Mimetype) كخط دفاع إضافي للملفات المزيفة
    const hasValidMime = allowedTypes.test(file.mimetype);

    if (hasValidMime && hasValidExt) {
        return cb(null, true); // السماح بالملف
    } else {
        return cb(new Error('نوع الملف غير مدعوم! يُسمح فقط بملفات (PDF, JPG, PNG).'), false);
    }
};

// إنشاء أداة الرفع مع تحديد حد أقصى لحجم الملف
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // الحد الأقصى 5 ميجابايت (5MB)
    },
    fileFilter: fileFilter
});

module.exports = upload;
