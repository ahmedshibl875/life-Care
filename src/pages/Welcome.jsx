import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, User, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Phone, Calendar, HeartPulse, Users, CheckCircle, Loader2 } from 'lucide-react';

export default function Welcome({ toggleLang, lang, setRole, theme, toggleTheme }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0 = welcome, 1 = login, 2 = register, 3 = otp
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const isRtl = lang === 'ar';

    const diseasesList = ['السكري', 'ضغط الدم', 'أمراض القلب', 'الربو', 'لا يوجد', 'أخرى'];

    const rolesList = [
        { id: 'patient', labelAr: 'مريض', labelEn: 'Patient' },
        { id: 'doctor', labelAr: 'طبيب', labelEn: 'Doctor' },
        { id: 'caregiver', labelAr: 'مرافق', labelEn: 'Caregiver' }
    ];

    const [formData, setFormData] = useState({
        role: 'patient',
        name: '',
        date_of_birth: '',
        disease: '',
        phone: '',
        companion_phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        otp: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverMessage, setServerMessage] = useState({ type: '', text: '' }); // type: 'error' | 'success'

    const t = {
        ar: {
            welcome: "Life Care",
            subtitle: "رفيقك الصحي الذكي",
            tagline: "رعاية حية لحياة أفضل",
            loginBtn: "تسجيل الدخول",
            createAccBtn: "إنشاء حساب جديد",
            loginTitle: "أهلاً بك مجدداً",
            loginSub: "قم بتسجيل الدخول للوصول لحسابك",
            registerTitle: "إنشاء حساب",
            noAcc: "ليس لديك حساب؟",
            hasAcc: "لديك حساب بالفعل؟",
            name: "الاسم الكامل",
            email: "البريد الإلكتروني",
            password: "كلمة المرور",
            forgotPassword: "نسيت كلمة المرور؟",
            dob: "تاريخ الميلاد",
            disease: "المرض",
            phone: "رقم الهاتف",
            companionPhone: "رقم هاتف المرافق",
            confirmPassword: "تأكيد كلمة المرور",
            errName: "يجب أن يحتوي الاسم على حروف ومسافات فقط (3 - 50 حرف)",
            errEmail: "يرجى إدخال بريد إلكتروني صحيح",
            errPassword: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
            errPasswordStrict: "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل وتحتوي على حرف وأرقام",
            errConfirmPassword: "كلمة المرور غير متطابقة مع تأكيد كلمة المرور",
            errDob: "تاريخ الميلاد مطلوب ولا يمكن أن يكون في المستقبل",
            errDisease: "يرجى اختيار المرض من القائمة",
            errPhone: "رقم الهاتف يجب أن يحتوي على أرقام فقط",
            errGeneral: "يرجى تصحيح الأخطاء المعلمة باللون الأحمر أولاً",
            verifyMsg: "تم إرسال رمز التحقق إلى بريدك الإلكتروني. الرجاء إدخاله.",
            submitting: "جارٍ التنفيذ...",
            networkError: "خطأ في الاتصال بالسيرفر. يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً.",
            otpTitle: "تأكيد الحساب",
            otpSub: "أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني",
            verifyOtp: "تأكيد",
            selectDiseaseMsg: "اختر المرض...",
            role: "نوع الحساب"
        },
        en: {
            welcome: "Life Care",
            subtitle: "Your Smart Health Companion",
            tagline: "Live Care — Live Better",
            loginBtn: "Log In",
            createAccBtn: "Create Account",
            loginTitle: "Welcome Back",
            loginSub: "Log in to access your account",
            registerTitle: "Create Account",
            noAcc: "Don't have an account?",
            hasAcc: "Already have an account?",
            name: "Full Name",
            email: "Email Address",
            password: "Password",
            forgotPassword: "Forgot Password?",
            dob: "Date of Birth",
            disease: "Disease",
            phone: "Phone Number",
            companionPhone: "Companion Phone Number",
            confirmPassword: "Confirm Password",
            errName: "Name must contain letters/spaces only (3 - 50 chars)",
            errEmail: "Please enter a valid email address",
            errPassword: "Password must be at least 8 characters",
            errPasswordStrict: "Password must be at least 8 chars and contain letters and numbers",
            errConfirmPassword: "Passwords do not match",
            errDob: "Date of birth is required and cannot be in the future",
            errDisease: "Please select a disease from the list",
            errPhone: "Phone number must contain numbers only",
            errGeneral: "Please fix the highlighted errors first",
            verifyMsg: "OTP sent to your email. Please enter it.",
            submitting: "Processing...",
            networkError: "Connection error. Please check your internet connection and try again.",
            otpTitle: "Verify Account",
            otpSub: "Enter the 6-digit code sent to your email",
            verifyOtp: "Verify",
            selectDiseaseMsg: "Select a disease...",
            role: "Account Type"
        }
    }[lang];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        setServerMessage({ type: '', text: '' });
    };

    const validateForm = (isLogin = false) => {
        const newErrors = {};

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) newErrors.email = t.errEmail;

        if (isLogin) {
            if (formData.password.length < 8) newErrors.password = t.errPassword;
        } else {
            const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]{3,50}$/;
            if (!nameRegex.test(formData.name.trim())) newErrors.name = t.errName;

            const phoneRegex = /^[0-9]+$/;
            if (!formData.phone || !phoneRegex.test(formData.phone)) newErrors.phone = t.errPhone;
            
            if (formData.role === 'patient') {
                if (!formData.companion_phone || !phoneRegex.test(formData.companion_phone)) newErrors.companion_phone = t.errPhone;

                if (!formData.date_of_birth) {
                    newErrors.date_of_birth = t.errDob;
                } else {
                    const today = new Date();
                    const dob = new Date(formData.date_of_birth);
                    if (dob > today) newErrors.date_of_birth = t.errDob;
                }

                if (!formData.disease || !diseasesList.includes(formData.disease)) {
                    newErrors.disease = t.errDisease;
                }
            }

            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                newErrors.password = t.errPasswordStrict;
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = t.errConfirmPassword;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setServerMessage({ type: '', text: '' });

        if (!validateForm(true)) {
            setServerMessage({ type: 'error', text: t.errGeneral });
            return;
        }

        setIsSubmitting(true);
        
        // ─── MOCK LOGIN LOGIC ───
        setTimeout(() => {
            const usersStr = localStorage.getItem('mockUsers');
            const users = usersStr ? JSON.parse(usersStr) : [];
            const user = users.find(u => u.email === formData.email && u.password === formData.password);

            if (user) {
                localStorage.setItem('token', 'mock_token_' + Date.now());
                setRole(user.role || 'patient');
                navigate('/dashboard');
            } else if (formData.email === 'test@test.com' || formData.email === 'admin@admin.com') { // simple fallback
                localStorage.setItem('token', 'mock_token_admin');
                setRole('doctor');
                navigate('/dashboard');
            } else {
                setServerMessage({ type: 'error', text: isRtl ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password' });
            }
            setIsSubmitting(false);
        }, 1000);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setServerMessage({ type: '', text: '' });

        if (!validateForm(false)) {
            setServerMessage({ type: 'error', text: t.errGeneral });
            return;
        }

        setIsSubmitting(true);
        
        // ─── MOCK REGISTER LOGIC ───
        setTimeout(() => {
            const usersStr = localStorage.getItem('mockUsers');
            const users = usersStr ? JSON.parse(usersStr) : [];
            
            if (users.some(u => u.email === formData.email)) {
                setServerMessage({ type: 'error', text: isRtl ? 'البريد الإلكتروني مسجل بالفعل' : 'Email already registered' });
                setIsSubmitting(false);
                return;
            }

            const newUser = {
                role: formData.role,
                name: formData.name,
                email: formData.email,
                password: formData.password,
            };

            users.push(newUser);
            localStorage.setItem('mockUsers', JSON.stringify(users));

            setServerMessage({ type: 'success', text: isRtl ? 'تم إنشاء الحساب (وضع المطور). رمز التأكيد هو 123456' : 'Mock account created. OTP is 123456.' });
            setFormData(prev => ({ ...prev, otp: '123456' })); // Auto-fill for mock testing
            setStep(3); // Go to OTP verification step
            setIsSubmitting(false);
        }, 1000);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setServerMessage({ type: '', text: '' });
        setIsSubmitting(true);

        // ─── MOCK OTP VERIFICATION ───
        setTimeout(() => {
            if (formData.otp === '123456') {
                setServerMessage({ type: 'success', text: isRtl ? 'تم التأكيد بنجاح!' : 'Verified successfully!' });
                setTimeout(() => {
                    setStep(1); // Go to login
                    setServerMessage({ type: '', text: '' });
                }, 1500);
            } else {
                setServerMessage({ type: 'error', text: isRtl ? 'رمز التأكيد غير صحيح' : 'Invalid OTP code' });
            }
            setIsSubmitting(false);
        }, 1000);
    };

    const renderInput = (name, type, placeholder, Icon) => {
        const hasError = !!errors[name];
        const isPassword = name === 'password';
        const isConfirmPassword = name === 'confirmPassword';
        
        let actualType = type;
        let isVisible = false;
        if (isPassword) {
            actualType = showPassword ? 'text' : 'password';
            isVisible = showPassword;
        } else if (isConfirmPassword) {
            actualType = showConfirmPassword ? 'text' : 'password';
            isVisible = showConfirmPassword;
        }

        const isSelect = type === 'select';

        return (
            <div className="flex flex-col" style={{ gap: 4 }}>
                <div style={{ position: 'relative' }}>
                    {Icon && <Icon size={18} color={hasError ? 'var(--danger)' : 'var(--primary)'} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: 14, pointerEvents: 'none' }} />}
                    
                    {isSelect ? (
                        <select
                            name={name}
                            value={formData[name]}
                            onChange={handleInputChange}
                            style={{
                                [isRtl ? 'paddingRight' : 'paddingLeft']: Icon ? 40 : 16,
                                paddingRight: 16,
                                border: hasError ? '2px solid var(--danger)' : '1px solid var(--glass-border)',
                                background: hasError ? 'rgba(239, 68, 68, 0.05)' : 'var(--glass-bg)',
                                width: '100%',
                                paddingTop: '12px',
                                paddingBottom: '12px',
                                borderRadius: '12px',
                                color: formData[name] ? 'var(--text-main)' : 'var(--text-muted)',
                                appearance: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="" disabled hidden>{placeholder}</option>
                            {name === 'role' ? rolesList.map(r => (
                                <option key={r.id} value={r.id} style={{ color: 'var(--text-main)', background: 'var(--glass-bg)' }}>{isRtl ? r.labelAr : r.labelEn}</option>
                            )) : diseasesList.map(d => (
                                <option key={d} value={d} style={{ color: 'var(--text-main)', background: 'var(--glass-bg)' }}>{d}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={actualType}
                            name={name}
                            placeholder={placeholder}
                            value={formData[name]}
                            onChange={handleInputChange}
                            style={{
                                [Icon ? (isRtl ? 'paddingRight' : 'paddingLeft') : '']: Icon ? 40 : 16,
                                [isPassword || isConfirmPassword ? (isRtl ? 'paddingLeft' : 'paddingRight') : '']: isPassword || isConfirmPassword ? 40 : 16,
                                border: hasError ? '2px solid var(--danger)' : '1px solid var(--glass-border)',
                                background: hasError ? 'rgba(239, 68, 68, 0.05)' : 'var(--glass-bg)',
                                width: '100%',
                                paddingTop: '12px',
                                paddingBottom: '12px',
                                borderRadius: '12px',
                                color: 'var(--text-main)' // Ensure text maintains theme color
                            }}
                        />
                    )}
                    
                    {(isPassword || isConfirmPassword) && (
                        <button
                            type="button"
                            onClick={() => isPassword ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                                position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'left' : 'right']: 14,
                                background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                            }}
                        >
                            {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}
                </div>
                {hasError && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.75rem', [isRtl ? 'paddingRight' : 'paddingLeft']: 6, fontWeight: 600 }}>
                        {errors[name]}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div className="flex justify-start items-center" style={{ padding: '14px 20px', paddingTop: 'max(14px, env(safe-area-inset-top))' }}>
                <button
                    onClick={toggleLang}
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'inherit' }}
                >
                    {isRtl ? 'English' : 'عربي'}
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px', justifyContent: 'center', overflowY: 'auto' }}>
                <AnimatePresence mode="wait">

                    {/* ─── Splash ─── */}
                    {step === 0 && (
                        <motion.div key="splash" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -24 }} className="flex flex-col items-center text-center">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 18, ease: 'linear' }} style={{ marginBottom: 28 }}>
                                <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary-dark),var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 48px rgba(16,185,129,0.4), 0 0 0 12px rgba(16,185,129,0.1)' }}>
                                    <Activity color="white" size={52} />
                                </div>
                            </motion.div>
                            <h1 style={{ color: 'var(--primary)', fontSize: '2.4rem', marginBottom: 6 }}>{t.welcome}</h1>
                            <p style={{ fontSize: '1rem', color: 'var(--text-sub)', fontWeight: 500, marginBottom: 4 }}>{t.subtitle}</p>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 44 }}>{t.tagline}</span>
                            <button className="btn-primary" onClick={() => setStep(2)} style={{ width: '100%', padding: '16px', fontSize: '1.05rem', borderRadius: 20, marginBottom: 16 }}>
                                {t.createAccBtn} 🚀
                            </button>
                            <button onClick={() => setStep(1)} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', width: '100%', padding: '16px', fontSize: '1.05rem', borderRadius: 20, cursor: 'pointer', fontWeight: 700 }}>
                                {t.loginBtn} <LogIn size={18} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
                            </button>
                        </motion.div>
                    )}

                    {/* ─── Login Form ─── */}
                    {step === 1 && (
                        <motion.div key="login" initial={{ opacity: 0, x: isRtl ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRtl ? 30 : -30 }} className="flex flex-col" style={{ gap: 16 }}>
                            <div className="text-center" style={{ marginBottom: 16 }}>
                                <div style={{ width: 64, height: 64, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white' }}>
                                    <Lock size={32} />
                                </div>
                                <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{t.loginTitle}</h2>
                                <p style={{ color: 'var(--text-sub)', marginTop: 8 }}>{t.loginSub}</p>
                            </div>

                            {serverMessage.text && (
                                <div style={{ background: serverMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${serverMessage.type === 'error' ? 'var(--danger)' : 'var(--primary)'}`, padding: 12, borderRadius: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <AlertCircle color={serverMessage.type === 'error' ? "var(--danger)" : "var(--primary)"} size={20} flexShrink={0} />
                                    <span style={{ color: serverMessage.type === 'error' ? 'var(--danger)' : 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>{serverMessage.text}</span>
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="flex flex-col gap-md">
                                {renderInput('email', 'email', t.email, Mail)}
                                {renderInput('password', 'password', t.password, Lock)}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
                                    <span
                                        onClick={() => navigate('/forgot-password')}
                                        style={{ color: 'var(--primary)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                        {t.forgotPassword}
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ marginTop: 8, padding: 16, borderRadius: 18, opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}><Loader2 size={20} /></motion.div> {t.submitting}</> : t.loginBtn}
                                </button>
                            </form>

                            <div className="text-center" style={{ marginTop: 12, marginBottom: 40 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{t.noAcc} </span>
                                <button type="button" onClick={() => { setStep(2); setServerMessage({ type: '', text: '' }); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
                                    {t.createAccBtn}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── Register Form ─── */}
                    {step === 2 && (
                        <motion.div key="register" initial={{ opacity: 0, x: isRtl ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRtl ? 30 : -30 }} className="flex flex-col" style={{ gap: 16 }}>
                            <div className="text-center" style={{ marginBottom: 16 }}>
                                <div style={{ width: 64, height: 64, background: 'var(--secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white' }}>
                                    <ShieldCheck size={32} />
                                </div>
                                <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{t.registerTitle}</h2>
                            </div>

                            {serverMessage.text && (
                                <div style={{ background: serverMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${serverMessage.type === 'error' ? 'var(--danger)' : 'var(--primary)'}`, padding: 12, borderRadius: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <AlertCircle color={serverMessage.type === 'error' ? "var(--danger)" : "var(--primary)"} size={20} flexShrink={0} />
                                    <span style={{ color: serverMessage.type === 'error' ? 'var(--danger)' : 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>{serverMessage.text}</span>
                                </div>
                            )}

                            <form onSubmit={handleRegister} className="flex flex-col gap-md">
                                {renderInput('role', 'select', t.role, Users)}
                                {renderInput('name', 'text', t.name, User)}
                                {renderInput('phone', 'tel', t.phone, Phone)}
                                {formData.role === 'patient' && renderInput('date_of_birth', 'date', t.dob, Calendar)}
                                {formData.role === 'patient' && renderInput('disease', 'select', t.selectDiseaseMsg, HeartPulse)}
                                {formData.role === 'patient' && renderInput('companion_phone', 'tel', t.companionPhone, Users)}
                                {renderInput('email', 'email', t.email, Mail)}
                                {renderInput('password', 'password', t.password, Lock)}
                                {renderInput('confirmPassword', 'password', t.confirmPassword, CheckCircle)}

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ marginTop: 8, padding: 16, borderRadius: 18, opacity: isSubmitting ? 0.7 : 1, background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}><Loader2 size={20} /></motion.div> {t.submitting}</> : t.createAccBtn}
                                </button>
                            </form>

                            <div className="text-center" style={{ marginTop: 12, paddingBottom: 40 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{t.hasAcc} </span>
                                <button type="button" onClick={() => { setStep(1); setServerMessage({ type: '', text: '' }); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
                                    {t.loginBtn}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── OTP Verification ─── */}
                    {step === 3 && (
                        <motion.div key="otp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col" style={{ gap: 16 }}>
                            <div className="text-center" style={{ marginBottom: 16 }}>
                                <div style={{ width: 64, height: 64, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white' }}>
                                    <Mail size={32} />
                                </div>
                                <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{t.otpTitle}</h2>
                                <p style={{ color: 'var(--text-sub)', marginTop: 8 }}>{t.otpSub}</p>
                            </div>

                            {serverMessage.text && (
                                <div style={{ background: serverMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${serverMessage.type === 'error' ? 'var(--danger)' : 'var(--primary)'}`, padding: 12, borderRadius: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <AlertCircle color={serverMessage.type === 'error' ? "var(--danger)" : "var(--primary)"} size={20} flexShrink={0} />
                                    <span style={{ color: serverMessage.type === 'error' ? 'var(--danger)' : 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>{serverMessage.text}</span>
                                </div>
                            )}

                            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-md">
                                {renderInput('otp', 'text', '123456', ShieldCheck)}

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ marginTop: 8, padding: 16, borderRadius: 18, opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    disabled={isSubmitting || !formData.otp}
                                >
                                    {isSubmitting ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}><Loader2 size={20} /></motion.div> {t.submitting}</> : t.verifyOtp}
                                </button>
                            </form>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
