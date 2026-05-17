const express = require('express');
const router = express.Router();
const Joi = require('joi');
const User = require('../models/MockUser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Set up Nodemailer transporter (for Dev and Prod)
const transporter = nodemailer.createTransport({
    service: 'gmail', // you can change this to your email provider
    auth: {
        user: process.env.EMAIL_USER || 'your.email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your_app_password'
    }
});

// Rate limiting for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;

// Registration Schema (Name, Email, Password exactly as requested)
const registerSchema = Joi.object({
    name: Joi.string().trim().min(3).max(50).pattern(nameRegex).required().messages({
        'string.empty': 'الاسم الكامل مطلوب.',
        'string.min': 'الاسم يجب أن يتكون من 3 أحرف على الأقل.',
        'string.pattern.base': 'الاسم يجب أن يحتوي على حروف ومسافات فقط.'
    }),
    email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
        'string.empty': 'البريد الإلكتروني مطلوب.',
        'string.email': 'صيغة البريد الإلكتروني غير صحيحة.'
    }),
    password: Joi.string().min(8).max(50).pattern(/^(?=.*[a-zA-Z])(?=.*\d)/).required().messages({
        'string.empty': 'كلمة المرور مطلوبة.',
        'string.min': 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.',
        'string.pattern.base': 'كلمة المرور يجب أن تحتوي على الأقل على حرف واحد ورقم واحد.'
    }),
    date_of_birth: Joi.date().max('now').allow('', null).optional().messages({
        'date.max': 'تاريخ الميلاد لا يمكن أن يكون في المستقبل.'
    }),
    disease: Joi.string().valid('السكري', 'ضغط الدم', 'أمراض القلب', 'الربو', 'لا يوجد', 'أخرى').allow('', null).optional().messages({
        'any.only': 'يرجى اختيار مرض صحيح من القائمة.'
    }),
    phone: Joi.string().pattern(/^[0-9]+$/).required().messages({
        'string.empty': 'رقم الهاتف مطلوب.',
        'string.pattern.base': 'رقم الهاتف يجب أن يحتوي على أرقام فقط.'
    }),
    companion_phone: Joi.string().pattern(/^[0-9]+$/).allow('', null).optional().messages({
        'string.pattern.base': 'رقم الهاتف يجب أن يحتوي على أرقام فقط.'
    }),
    role: Joi.string().valid('patient', 'companion', 'doctor').optional().default('patient')
});

// Register Endpoint
router.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ errors: error.details.map(err => err.message) });
        }

        const existingUser = await User.findOne({ email: value.email.toLowerCase() });
        if (existingUser) {
            console.log(`[DEBUG MODE] Registration failed: Email ${value.email.toLowerCase()} already exists.`);
            return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل.' });
        }

        // Generate OTP (Virtual Mock Mode: Always 123456)
        const otp = "123456";
        const otpExpires = new Date(Date.now() + 60 * 60000); // 1 hour for testing

        // Create user
        const newUser = new User({
            full_name: value.name,
            email: value.email.toLowerCase(),
            password_hash: value.password, // Mongoose pre-save hook handles hashing
            date_of_birth: value.date_of_birth,
            disease: value.disease,
            phone: value.phone,
            companion_phone: value.companion_phone || '',
            role: value.role || 'patient',
            isVerified: false,
            otp,
            otpExpires
        });

        console.log(`[DEBUG MODE] Attempting to save new user to database...`);
        await newUser.save();
        console.log(`[DEBUG MODE] User saved successfully. User ID: ${newUser._id}`);

        // Immediately log OTP for local testing so they don't have to check email
        console.log(`\n===========================================`);
        console.log(`🔑 [DEBUG MODE] OTP CODE IS: ${otp}`);
        console.log(`===========================================\n`);

        // Send confirmation email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@lifecare.com',
            to: newUser.email,
            subject: 'رمز التحقق - Life Care',
            html: `<h3>مرحباً ${newUser.full_name}،</h3>
                   <p>شكراً لتسجيلك في Life Care. رمز التحقق (OTP) الخاص بك هو:</p>
                   <h2>${otp}</h2>
                   <p>هذا الرمز صالح لمدة 10 دقائق.</p>`
        };

        /*
        transporter.sendMail(mailOptions).catch(err => {
            console.error('Email failed to send (you might need to configure .env with EMAIL_USER/PASS):', err.message);
            console.log(`[DEV MODE] OTP: ${otp}`);
        });
        */

        res.status(201).json({
            message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني لتأكيد الحساب.',
            user: { email: newUser.email }
        });
    } catch (err) {
        console.error('🚨 [DEBUG MODE] Registration Error (Server Side):', err);
        
        // Handle specific Database connection error
        if (err.name === 'MongooseServerSelectionError' || (err.message && err.message.includes('buffering timed out'))) {
            return res.status(500).json({ error: 'الخادم لا يمكنه حفظ البيانات (تطبيق MongoDB مغلق أو غير مثبت على جهازك). يرجى التأكد من تشغيل قاعدة البيانات.', debug: err.message });
        }

        // Handle unique constraint error (fallback)
        if (err.code === 11000) {
            return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل.' });
        }

        res.status(500).json({ error: 'حدث خطأ داخلي في الخادم أثناء معالجة الطلب.', debug: err.message });
    }
});

// Verify OTP Endpoint
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({ error: 'المستخدم غير موجود.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'الحساب مؤكد بالفعل.' });
        }

        if (user.otp !== otp || user.otpExpires < new Date()) {
            return res.status(400).json({ error: 'الرمز غير صحيح أو منتهي الصلاحية.' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'تم تأكيد الحساب بنجاح! يمكنك الآن تسجيل الدخول.' });
    } catch (err) {
        console.error('🚨 [DEBUG MODE] Verify OTP Error:', err);
        if (err.name === 'MongooseServerSelectionError') {
            return res.status(500).json({ error: 'خطأ: الخادم لا يمكنه الاتصال بقاعدة البيانات (MongoDB لا يعمل).', debug: err.message });
        }
        res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.', debug: err.message });
    }
});

// Resend Verification OTP Endpoint
router.post('/resend-verification', async (req, res) => {
    try {
        // Since we are mocking OTPs for now, we'll just return success.
        // In reality, you'd find the user by email from a logged-in state or request body,
        // generate a new OTP, save it, and email it.
        res.status(200).json({ message: 'تم إرسال الرمز الجديد بنجاح.' });
    } catch (err) {
        res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.' });
    }
});

// Login Endpoint
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبة.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });

        if (!user.isVerified) {
            return res.status(403).json({ error: 'الرجاء تأكيد البريد الإلكتروني قبل تسجيل الدخول.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '30d' }
        );

        res.status(200).json({
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: { id: user._id, name: user.full_name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('🚨 [DEBUG MODE] Login Error:', err);
        // Handle specific Database connection error
        if (err.name === 'MongooseServerSelectionError' || (err.message && err.message.includes('buffering timed out'))) {
            return res.status(500).json({ error: 'لا يمكن تسجيل الدخول لأن قاعدة البيانات مغلقة (برنامج MongoDB ليس قيد التشغيل على جهازك).', debug: err.message });
        }
        res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.', debug: err.message });
    }
});

// Forgot Password Endpoint
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) return res.status(400).json({ error: 'لا يوجد حساب بهذا البريد الإلكتروني.' });

        // Generate a 6-digit OTP for Mobile App Reset
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@lifecare.com',
            to: user.email,
            subject: 'رمز إعادة تعيين كلمة المرور - Life Care',
            html: `<h3>مرحباً ${user.full_name}،</h3>
                   <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. يرجى إدخال الرمز المكون من 6 أرقام داخل تطبيق الموبايل:</p>
                   <h2>${resetToken}</h2>
                   <p>هذا الرمز صالح لمدة ساعة واحدة فقط.</p>`
        };

        console.log(`\n===========================================`);
        console.log(`🔑 [DEBUG MODE] Password Reset OTP: ${resetToken}`);
        console.log(`===========================================\n`);

        transporter.sendMail(mailOptions).catch(err => {
            console.error('Email failed to send:', err.message);
        });

        res.status(200).json({ message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.' });
    } catch (err) {
        console.error('🚨 [DEBUG MODE] Forgot Password Error:', err);
        if (err.name === 'MongooseServerSelectionError' || (err.message && err.message.includes('buffering timed out'))) {
            return res.status(500).json({ error: 'خطأ: الخادم لا يمكنه الاتصال بقاعدة البيانات (تطبيق MongoDB لا يعمل).', debug: err.message });
        }
        res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.', debug: err.message });
    }
});

// Reset Password Endpoint
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ error: 'الرابط غير صالح أو منتهي الصلاحية.' });

        // Password validation
        if (newPassword.length < 8) return res.status(400).json({ error: 'كلمة المرور ضعيفة.' });

        user.password_hash = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Marking field as modified for mongoose pre-save hook to hash
        user.markModified('password_hash');
        await user.save();

        res.status(200).json({ message: 'تم تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.' });
    } catch (err) {
        console.error('🚨 [DEBUG MODE] Reset Password Error:', err);
        if (err.name === 'MongooseServerSelectionError') {
            return res.status(500).json({ error: 'خطأ: الخادم لا يمكنه الاتصال بقاعدة البيانات (MongoDB لا يعمل).', debug: err.message });
        }
        res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.', debug: err.message });
    }
});

module.exports = router;
