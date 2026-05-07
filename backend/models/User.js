const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // الحفاظ على تفرد الإيميل
        lowercase: true,
        trim: true
    },
    password_hash: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    companion_phone: {
        type: String,
        required: true,
        trim: true
    },
    date_of_birth: {
        type: Date,
        required: true
    },
    disease: {
        type: String,
        required: true,
        enum: ['السكري', 'ضغط الدم', 'أمراض القلب', 'الربو', 'لا يوجد', 'أخرى']
    },
    profilePicture: {
        type: String,
        default: ''
    },
    patients: [{
        name: String,
        age: Number,
        disease: String
    }],
    companions: [{
        name: String,
        phone: String
    }],
    doctors: [{
        name: String,
        specialty: String,
        phone: String,
        hospital: String
    }],
    role: {
        type: String,
        enum: ['patient', 'doctor', 'caregiver'],
        default: 'patient'
    },
    doctor_id: {
        type: String,
        unique: true,
        sparse: true, // Only for doctors, so don't index nulls uniquely
        trim: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    otp: String,
    otpExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password_hash = await bcrypt.hash(this.password_hash, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
};

module.exports = mongoose.model('User', userSchema);
