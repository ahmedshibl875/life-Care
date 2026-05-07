import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPassword({ lang, toggleLang }) {
    const { token } = useParams();
    const navigate = useNavigate();
    const isRtl = lang === 'ar';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const t = {
        ar: {
            title: "تعيين كلمة مرور جديدة",
            subtitle: "أدخل كلمة المرور الجديدة لحسابك",
            password: "كلمة المرور الجديدة",
            confirmPassword: "تأكيد كلمة المرور",
            save: "حفظ وتسجيل الدخول",
            loading: "جاري الحفظ...",
            errMismatch: "كلمات المرور غير متطابقة",
            errLength: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
            loginBtn: "الذهاب لتسجيل الدخول"
        },
        en: {
            title: "Set New Password",
            subtitle: "Enter a new password for your account",
            password: "New Password",
            confirmPassword: "Confirm Password",
            save: "Save & Login",
            loading: "Saving...",
            errMismatch: "Passwords do not match",
            errLength: "Password must be at least 8 characters",
            loginBtn: "Go to Login"
        }
    }[lang];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            setStatus('error');
            setMessage(t.errLength);
            return;
        }

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage(t.errMismatch);
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: password })
            });
            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message);
            } else {
                setStatus('error');
                let errorMsg = data.error || 'Failed to reset password';
                if (data.debug) {
                    console.error("🛑 [DEBUG MODE] Backend Exception:", data.debug);
                    errorMsg += ` (تفاصيل المطور: ${data.debug})`;
                }
                setMessage(errorMsg);
            }
        } catch (err) {
            setStatus('error');
            setMessage('Server error. Please try again later.');
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', padding: 24 }}>
            {/* Top controls */}
            <div className="flex justify-start items-center" style={{ paddingTop: 'max(14px, env(safe-area-inset-top))', marginBottom: 32 }}>
                <button
                    onClick={toggleLang}
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'inherit' }}
                >
                    {isRtl ? 'English' : 'عربي'}
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col"
                    style={{ gap: 16, width: '100%', maxWidth: 400 }}
                >
                    <div className="text-center" style={{ marginBottom: 16 }}>
                        <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{t.title}</h2>
                        <p style={{ color: 'var(--text-sub)', marginTop: 8 }}>{t.subtitle}</p>
                    </div>

                    {status === 'error' && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: 12, borderRadius: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <AlertCircle color="var(--danger)" size={20} flexShrink={0} />
                            <span style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{message}</span>
                        </div>
                    )}

                    {status === 'success' ? (
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--primary)', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                            <CheckCircle color="var(--primary)" size={48} />
                            <span style={{ color: 'var(--primary)', fontSize: '1rem', fontWeight: 600 }}>{message}</span>
                            <button
                                onClick={() => navigate('/welcome')}
                                className="btn-primary"
                                style={{ marginTop: 16, width: '100%', padding: 14, borderRadius: 12 }}
                            >
                                {t.loginBtn}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-md">

                            {/* New Password */}
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="var(--primary)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: 14, pointerEvents: 'none' }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t.password}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        [isRtl ? 'paddingRight' : 'paddingLeft']: 40,
                                        [isRtl ? 'paddingLeft' : 'paddingRight']: 40,
                                        paddingTop: 14,
                                        paddingBottom: 14,
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--glass-bg)',
                                        width: '100%',
                                        borderRadius: 12
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'left' : 'right']: 14,
                                        background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Confirm Password */}
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="var(--primary)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: 14, pointerEvents: 'none' }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t.confirmPassword}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{
                                        [isRtl ? 'paddingRight' : 'paddingLeft']: 40,
                                        [isRtl ? 'paddingLeft' : 'paddingRight']: 40,
                                        paddingTop: 14,
                                        paddingBottom: 14,
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--glass-bg)',
                                        width: '100%',
                                        borderRadius: 12
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ marginTop: 8, padding: 16, borderRadius: 18, opacity: status === 'loading' ? 0.7 : 1 }}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? t.loading : t.save}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
