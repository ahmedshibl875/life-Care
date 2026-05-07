import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function VerifyEmail({ lang }) {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const isRtl = lang === 'ar';

    const t = {
        ar: {
            verifying: "جارٍ التحقق من بريدك الإلكتروني...",
            successTitle: "تم التأكيد بنجاح!",
            errorTitle: "فشل التأكيد",
            loginBtn: "الذهاب لتسجيل الدخول"
        },
        en: {
            verifying: "Verifying your email...",
            successTitle: "Verification Successful!",
            errorTitle: "Verification Failed",
            loginBtn: "Go to Login"
        }
    }[lang];

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/auth/verify-email/${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage(data.message);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Server error. Please try again later.');
            }
        };

        if (token) verify();
    }, [token]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card flex flex-col items-center text-center"
                style={{ padding: 32, maxWidth: 400, width: '100%' }}
            >
                {status === 'loading' && (
                    <>
                        <Loader size={48} color="var(--primary)" className="animate-spin" style={{ marginBottom: 16 }} />
                        <h2 style={{ margin: 0 }}>{t.verifying}</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle size={56} color="var(--primary)" style={{ marginBottom: 16 }} />
                        <h2 style={{ margin: 0, color: 'var(--primary)' }}>{t.successTitle}</h2>
                        <p style={{ marginTop: 8, color: 'var(--text-sub)' }}>{message}</p>
                        <button
                            onClick={() => navigate('/welcome')}
                            className="btn-primary"
                            style={{ marginTop: 24, width: '100%', padding: 14, borderRadius: 12 }}
                        >
                            {t.loginBtn}
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <AlertCircle size={56} color="var(--danger)" style={{ marginBottom: 16 }} />
                        <h2 style={{ margin: 0, color: 'var(--danger)' }}>{t.errorTitle}</h2>
                        <p style={{ marginTop: 8, color: 'var(--text-sub)' }}>{message}</p>
                        <button
                            onClick={() => navigate('/welcome')}
                            style={{
                                marginTop: 24, width: '100%', padding: 14, borderRadius: 12,
                                background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', fontWeight: 'bold'
                            }}
                        >
                            {t.loginBtn}
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
