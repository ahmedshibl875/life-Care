import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartHandshake, PhoneCall, AlertCircle, Plus, BellRing, User, Phone, Users, CheckCircle, Copy } from 'lucide-react';

export default function Caregivers() {
    const lang = document.documentElement.lang || 'ar';
    const isRtl = lang === 'ar';

    const [caregivers, setCaregivers] = useState([
        { id: 1, name: isRtl ? 'علي أحمد' : 'Ali Ahmed', relation: isRtl ? 'ابن' : 'Son', phone: '+123456789', isPrimary: true },
        { id: 2, name: isRtl ? 'فاطمة' : 'Fatima', relation: isRtl ? 'ابنة' : 'Daughter', phone: '+987654321', isPrimary: false }
    ]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newCaregiver, setNewCaregiver] = useState({ name: '', relation: '', phone: '' });
    const [generatedCode, setGeneratedCode] = useState(null);

    const handleGenerateCode = () => {
        if (!newCaregiver.name || !newCaregiver.phone) {
            alert(isRtl ? 'يرجى إدخال الاسم ورقم الهاتف على الأقل.' : 'Please enter at least name and phone.');
            return;
        }
        // Generate a random 6 char code
        const code = 'LC-' + Math.floor(1000 + Math.random() * 9000);
        setGeneratedCode(code);
    };

    const handleCopyAndSave = () => {
        navigator.clipboard.writeText(generatedCode);
        alert(isRtl ? 'تم نسخ الكود!' : 'Code copied!');

        setCaregivers(prev => [...prev, {
            id: Date.now(),
            name: newCaregiver.name,
            relation: newCaregiver.relation || (isRtl ? 'مرافق' : 'Caregiver'),
            phone: newCaregiver.phone,
            isPrimary: false
        }]);

        setShowAddForm(false);
        setGeneratedCode(null);
        setNewCaregiver({ name: '', relation: '', phone: '' });
    };

    return (
        <div className="flex flex-col gap-lg" style={{ paddingBottom: 40 }}>
            <div className="flex flex-col gap-sm" style={{ padding: '10px 0' }}>
                <div className="flex justify-between items-center">
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{isRtl ? 'العائلة والمرافقين' : 'Family & Caregivers'}</h2>
                    <button className="btn-secondary flex items-center gap-sm" style={{ background: 'var(--danger)', boxShadow: '0 4px 12px rgba(250, 82, 82, 0.3)', padding: '8px 12px', fontSize: '0.85rem' }}>
                        <AlertCircle size={16} /> {isRtl ? 'طوارئ SOS' : 'SOS'}
                    </button>
                </div>
                <p className="text-sm">{isRtl ? 'إدارة جهات الاتصال الخاصة بالطوارئ.' : 'Manage your emergency contacts.'}</p>
            </div>

            <div className="flex flex-col gap-md">
                <div
                    onClick={() => setShowAddForm(true)}
                    className="glass-card flex flex-col justify-center items-center gap-md"
                    style={{ padding: 40, border: '2px dashed var(--glass-border)', cursor: 'pointer', background: 'transparent' }}
                >
                    <div style={{ background: 'var(--glass-bg)', padding: 16, borderRadius: '50%' }}>
                        <Plus size={32} color="var(--primary)" />
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>{isRtl ? 'إضافة فرد عائلة / مرافق' : 'Add Family Member'}</h3>
                </div>

                {caregivers.map(cg => (
                    <motion.div
                        key={cg.id}
                        whileHover={{ scale: 1.02 }}
                        className="glass-card flex flex-col justify-between"
                        style={{ padding: 24, position: 'relative', borderLeft: cg.isPrimary ? '4px solid var(--primary)' : 'none' }}
                    >
                        {cg.isPrimary && (
                            <span style={{ position: 'absolute', top: 16, right: isRtl ? 'auto' : 16, left: isRtl ? 16 : 'auto', background: 'var(--primary)20', color: 'var(--primary)', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {isRtl ? 'أساسي' : 'Primary'}
                            </span>
                        )}

                        <div className="flex items-start gap-md" style={{ marginBottom: 24 }}>
                            <div style={{ background: 'var(--primary)', color: 'white', padding: 16, borderRadius: '50%' }}>
                                <HeartHandshake size={32} />
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <h2 style={{ margin: 0 }}>{cg.name}</h2>
                                <span className="text-muted text-sm">{cg.relation} • {cg.phone}</span>
                            </div>
                        </div>

                        <div className="flex gap-md mt-4">
                            <button className="flex-1 flex items-center justify-center gap-sm btn-primary" style={{ padding: '12px' }}>
                                <PhoneCall size={20} /> <span className="hide-on-print">{isRtl ? 'اتصال الآن' : 'Call Now'}</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-sm glass-card text-warning" style={{ padding: '12px', border: 'none', cursor: 'pointer' }}>
                                <BellRing size={20} /> <span className="hide-on-print">{isRtl ? 'تنبيه' : 'Alert'}</span>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal for adding/generating code */}
            <AnimatePresence>
                {showAddForm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh', background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(4px)' }}
                            onClick={() => { if (!generatedCode) setShowAddForm(false); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100 }}
                            className="glass-panel"
                            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 400, zIndex: 1000, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
                        >
                            {!generatedCode ? (
                                <>
                                    <h2 style={{ margin: 0, color: 'var(--primary)', textAlign: 'center' }}>{isRtl ? 'إضافة مرافق جديد' : 'Add New Caregiver'}</h2>
                                    <p className="text-sm text-center" style={{ marginBottom: 12 }}>
                                        {isRtl ? 'أدخل بينات المرافق، وسنقوم بإنشاء رمز دخول (Code) خاص به لربط حسابه بحالتك.' : 'Enter details to generate a unique sync code for them.'}
                                    </p>

                                    <div className="flex items-center gap-sm" style={{ background: 'var(--glass-bg)', padding: '12px 16px', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
                                        <User size={20} color="var(--primary)" />
                                        <input
                                            placeholder={isRtl ? 'اسم المرافق' : 'Caregiver Name'}
                                            value={newCaregiver.name} onChange={e => setNewCaregiver({ ...newCaregiver, name: e.target.value })}
                                            style={{ border: 'none', background: 'transparent', width: '100%', padding: 0, outline: 'none' }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-sm" style={{ background: 'var(--glass-bg)', padding: '12px 16px', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
                                        <Users size={20} color="var(--primary)" />
                                        <input
                                            placeholder={isRtl ? 'صلة القرابة (مثال: ابن، زوج)' : 'Relation'}
                                            value={newCaregiver.relation} onChange={e => setNewCaregiver({ ...newCaregiver, relation: e.target.value })}
                                            style={{ border: 'none', background: 'transparent', width: '100%', padding: 0, outline: 'none' }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-sm" style={{ background: 'var(--glass-bg)', padding: '12px 16px', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
                                        <Phone size={20} color="var(--primary)" />
                                        <input
                                            type="tel"
                                            placeholder={isRtl ? 'رقم الهاتف' : 'Phone Number'}
                                            value={newCaregiver.phone} onChange={e => setNewCaregiver({ ...newCaregiver, phone: e.target.value })}
                                            style={{ border: 'none', background: 'transparent', width: '100%', padding: 0, outline: 'none' }}
                                        />
                                    </div>

                                    <div className="flex gap-md" style={{ marginTop: 12 }}>
                                        <button className="btn-secondary" style={{ flex: 1, background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--glass-border)', boxShadow: 'none' }} onClick={() => setShowAddForm(false)}>
                                            {isRtl ? 'إلغاء' : 'Cancel'}
                                        </button>
                                        <button className="btn-primary" style={{ flex: 1 }} onClick={handleGenerateCode}>
                                            {isRtl ? 'إنشاء رمز الربط' : 'Generate Code'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-lg">
                                    <div style={{ background: 'var(--success)20', padding: 20, borderRadius: '50%' }}>
                                        <CheckCircle size={48} color="var(--success)" />
                                    </div>

                                    <h2 style={{ margin: 0, textAlign: 'center' }}>{isRtl ? 'تم إنشاء الرمز بنجاح!' : 'Code Generated!'}</h2>
                                    <p className="text-sm text-center" style={{ lineHeight: 1.6 }}>
                                        {isRtl
                                            ? `أرسل هذا الرمز لـ "${newCaregiver.name}". يمكنه استخدامه عند إنشاء حسابه كمرافق في تطبيق LifeCare لربط بياناتك به تلقائياً.`
                                            : `Send this code to "${newCaregiver.name}". They can use it during their Caregiver registration to sync with your account.`}
                                    </p>

                                    <div className="glass-card flex items-center justify-between" style={{ padding: '16px 24px', width: '100%', border: '2px dashed var(--primary)' }}>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: 2 }}>
                                            {generatedCode}
                                        </span>
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '10px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}
                                            onClick={handleCopyAndSave}
                                        >
                                            <Copy size={18} /> {isRtl ? 'نسخ وحفظ' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
