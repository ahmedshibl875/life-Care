import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ForgotPassword({ lang, toggleLang, theme, toggleTheme }) {
    const navigate = useNavigate();
    const isRtl = lang === 'ar';
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const t = {
        ar: {
            title: "إعادة تعيين كلمة المرور",
            subtitle: "أدخل بريدك الإلكتروني وسنرسل لك رابطاً للتعيين",
            email: "البريد الإلكتروني",
            send: "إرسال رابط التعيين",
            loading: "جاري الإرسال...",
            back: "العودة لتسجيل الدخول",
            errEmail: "يرجى إدخال بريد إلكتروني صحيح"
        },
        en: {
            title: "Reset Password",
            subtitle: "Enter your email and we'll send you a reset link",
            email: "Email Address",
            send: "Send Reset Link",
            loading: "Sending...",
            back: "Back to Login",
            errEmail: "Please enter a valid email address"
        }
    }[lang];

    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setStatus('error');
            setMessage(t.errEmail);
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch('https://life-care-production.up.railway.app/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message);
            } else {
                setStatus('error');
                let errorMsg = data.error || 'Failed to send reset link';
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
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} color="var(--primary)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: 14, pointerEvents: 'none' }} />
                                <input
                                    type="email"
                                    placeholder={t.email}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        [isRtl ? 'paddingRight' : 'paddingLeft']: 40,
                                        paddingTop: 14,
                                        paddingBottom: 14,
                                        paddingLeft: isRtl ? 16 : 40,
                                        paddingRight: isRtl ? 40 : 16,
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
                                {status === 'loading' ? t.loading : t.send}
                            </button>
                        </form>
                    )}

                    <button
                        onClick={() => navigate('/welcome')}
                        style={{
                            background: 'transparent', border: 'none', color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            marginTop: 16, cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                        {t.back}
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
