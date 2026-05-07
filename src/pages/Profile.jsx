import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Calendar, HeartPulse, Hospital, Edit2, Check, Camera, Trash2, Plus, PhoneCall, Loader2, AlertCircle, ShieldCheck, Stethoscope, Activity } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';

export default function Profile({ role, lang }) {
    const isRtl = lang === 'ar';
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    const [userData, setUserData] = useState({
        full_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        disease: '',
        disease: '',
        specialty: '',
        hospital: '',
        profilePicture: '',
        patients: [],
        companions: [],
        doctors: []
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        // Mock data for preview when token is missing or server is down
        const mockData = {
            full_name: isRtl ? 'زائر (معاينة)' : 'Guest (Preview)',
            email: 'preview@example.com',
            phone: '+971 50 123 4567',
            date_of_birth: '1985-06-15',
            disease: isRtl ? 'ضغط دم' : 'Hypertension',
            disease: isRtl ? 'ضغط دم' : 'Hypertension',
            specialty: isRtl ? 'طبيب عام' : 'General Practitioner',
            hospital: 'Life Care',
            profilePicture: '',
            patients: [{ name: isRtl ? 'سالم علي' : 'Salem Ali', age: 72, disease: isRtl ? 'السكري' : 'Diabetes' }],
            companions: [{ name: isRtl ? 'زوجتي فاطمة' : 'Wife Fatima', phone: '0551122334' }],
            doctors: [{ name: isRtl ? 'د. أحمد محمود' : 'Dr. Ahmed M.', specialty: isRtl ? 'طبيب قلب' : 'Cardiologist', phone: '0509988776', hospital: 'Life Care' }]
        };

        if (!token) {
            setUserData(mockData);
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/actions/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.user) {
                const user = {
                    ...data.user,
                    patients: data.user.patients || [],
                    companions: data.user.companions || [],
                    doctors: data.user.doctors || [],
                    date_of_birth: data.user.date_of_birth ? new Date(data.user.date_of_birth).toISOString().split('T')[0] : ''
                };
                setUserData(user);
            } else {
                // If it fails to fetch but we are logged in, populate mock data to preview
                setUserData(mockData);
            }
        } catch (err) {
            console.error('Fetch Profile Failed (Backend Down?):', err);
            setUserData(mockData); // Show mock data to preview UI even on server error
        } finally {
            setIsLoading(false);
        }
    };

    const calculateAge = (dob) => {
        if (!dob) return '-';
        const diff = Date.now() - new Date(dob).getTime();
        const age = new Date(diff);
        return Math.abs(age.getUTCFullYear() - 1970);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('profilePicture', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateData = () => {
        const phoneRegex = /^[0-9]+$/;
        if (!userData.full_name?.trim()) return isRtl ? 'الاسم مطلوب' : 'Name is required';
        if (!userData.phone || !phoneRegex.test(userData.phone)) return isRtl ? 'رقم الهاتف يجب أن يحتوي على أرقام فقط' : 'Invalid phone number';
        if (role === 'patient' && !userData.date_of_birth) return isRtl ? 'تاريخ الميلاد مطلوب' : 'Date of Birth is required';
        if (role === 'doctor' && !userData.specialty?.trim()) return isRtl ? 'التخصص مطلوب' : 'Specialty is required';
        
        if (role === 'patient') {
            for (let doc of userData.doctors) {
                if (!doc.name || !doc.phone || !doc.specialty) return isRtl ? 'يرجى إكمال بيانات الأطباء (الاسم، الهاتف، التخصص)' : 'Please complete doctor details';
            }
            for (let comp of userData.companions) {
                if (!comp.name || !comp.phone) return isRtl ? 'يرجى إكمال جميع بيانات المرافقين' : 'Please complete companions data';
            }
        }
        return '';
    };

    const handleSave = async () => {
        const err = validateData();
        if (err) {
             setMessage({ type: 'error', text: err });
             return;
        }

        setIsSaving(true);
        setMessage({ type: '', text: '' });
        
        try {
            const res = await fetch('http://localhost:5000/api/actions/profile', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            
            if (res.ok) {
                setMessage({ type: 'success', text: isRtl ? 'تم حفظ البيانات بنجاح ✔' : 'Profile updated successfully ✔' });
                setIsEditing(false);
                setTimeout(() => setMessage({ type: '', text: '' }), 4000);
            } else {
                setMessage({ type: 'error', text: data.error || (isRtl ? 'فشل التحديث' : 'Failed to update') });
            }
        } catch (error) {
            setMessage({ type: 'error', text: isRtl ? 'خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.' : 'Server connection error.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setUserData(prev => ({ ...prev, [field]: value }));
    };

    const addItem = (arrayName, defaultObj) => {
        setUserData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], defaultObj] }));
    };

    const updateItem = (arrayName, index, field, value) => {
        setUserData(prev => {
            const arr = [...prev[arrayName]];
            arr[index] = { ...arr[index], [field]: value };
            return { ...prev, [arrayName]: arr };
        });
    };

    const removeItem = (arrayName, index) => {
        setUserData(prev => {
            const arr = prev[arrayName].filter((_, i) => i !== index);
            return { ...prev, [arrayName]: arr };
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center" style={{ height: '60vh' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Loader2 size={40} color="var(--primary)" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-lg" style={{ paddingBottom: '120px' }}>
            
            {/* HEADER & ACTIONS */}
            <div className="flex justify-between items-center" style={{ padding: '10px 0' }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{isRtl ? 'لوحة التحكم الصحية' : 'Health Dashboard'}</h2>
                    <p className="text-sm text-muted">{isRtl ? 'إدارة ملفك الصحي الشامل' : 'Manage your comprehensive health profile'}</p>
                </div>
                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-sm"
                    style={{
                        padding: '10px 20px', borderRadius: 20, fontSize: '0.9rem',
                        background: isEditing ? 'var(--primary)' : 'var(--glass-bg)',
                        border: isEditing ? 'none' : '1px solid var(--glass-border)',
                        color: isEditing ? 'white' : 'var(--text-main)',
                        cursor: 'pointer',
                        opacity: isSaving ? 0.7 : 1
                    }}
                >
                    {isSaving ? (
                        <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}><Loader2 size={16} /></motion.div> {isRtl ? 'جاري الحفظ' : 'Saving'}</>
                    ) : isEditing ? (
                        <><Check size={16} /> {isRtl ? 'حفظ البيانات' : 'Save Data'}</>
                    ) : (
                        <><Edit2 size={16} /> {isRtl ? 'تعديل البيانات' : 'Edit Profile'}</>
                    )}
                </button>
            </div>

            <AnimatePresence>
                {message.text && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                         style={{ background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${message.type === 'error' ? 'var(--danger)' : 'var(--primary)'}`, padding: 12, borderRadius: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <AlertCircle color={message.type === 'error' ? "var(--danger)" : "var(--primary)"} size={20} flexShrink={0} />
                        <span style={{ color: message.type === 'error' ? 'var(--danger)' : 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>{message.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PROFILE HEAD */}
            <div className="glass-panel flex flex-col items-center text-center p-lg relative" style={{ borderRadius: 24, padding: '30px', borderTop: '6px solid var(--primary)' }}>
                <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 16 }}>
                    {userData.profilePicture ? (
                        <img src={userData.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '3px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                            <User size={50} />
                        </div>
                    )}
                    
                    {isEditing && (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            style={{ position: 'absolute', bottom: 0, right: 0, width: 34, height: 34, background: 'var(--primary)', border: '2px solid white', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <Camera size={16} />
                        </button>
                    )}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                </div>
                
                {isEditing ? (
                    <input type="text" value={userData.full_name} onChange={e => handleChange('full_name', e.target.value)}
                           style={{ background: 'var(--glass-bg)', border: '1px solid var(--primary)', padding: '8px 16px', borderRadius: 12, textAlign: 'center', marginBottom: 8, fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-main)' }} placeholder={isRtl ? 'الاسم بالكامل' : 'Full Name'} />
                ) : (
                    <h2 style={{ margin: 0, fontSize: '1.6rem', marginBottom: 4 }}>{userData.full_name} <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 500, background: 'rgba(51, 154, 240, 0.1)', padding: '4px 8px', borderRadius: 8 }}>{role === 'patient' ? (isRtl ? 'مريض' : 'Patient') : role === 'doctor' ? (isRtl ? 'طبيب' : 'Doctor') : (isRtl ? 'مرافق' : 'Caregiver')}</span></h2>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Mail size={16} /> <span>{userData.email}</span>
                </div>
            </div>

            {/* PERSONAL DETAILS CARD */}
            <div className="glass-card flex flex-col gap-md p-md" style={{ padding: 20 }}>
                <h3 className="flex items-center gap-sm" style={{ margin: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
                    <ShieldCheck size={20} color="var(--primary)" /> {isRtl ? 'المعلومات الشخصية' : 'Personal Information'}
                </h3>
                
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: 10 }}>
                    <div>
                        <span className="text-muted text-sm flex items-center gap-xs"><Phone size={14} /> {isRtl ? 'رقم الهاتف' : 'Phone'}</span>
                        {isEditing ? (
                            <input type="tel" value={userData.phone} onChange={e => handleChange('phone', e.target.value)} style={{ width: '100%', mt: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                        ) : (
                            <div style={{ fontWeight: 600, marginTop: 4, direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>{userData.phone}</div>
                        )}
                    </div>

                    {role === 'patient' && (
                        <>
                            <div>
                                <span className="text-muted text-sm flex items-center gap-xs"><Calendar size={14} /> {isRtl ? 'تاريخ الميلاد' : 'Date of Birth'}</span>
                                {isEditing ? (
                                    <input type="date" value={userData.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} style={{ width: '100%', mt: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                                ) : (
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{userData.date_of_birth || '-'}</div>
                                )}
                            </div>
                            <div>
                                <span className="text-muted text-sm flex items-center gap-xs"><Activity size={14} /> {isRtl ? 'العمر' : 'Age'}</span>
                                <div style={{ fontWeight: 600, marginTop: 4 }}>
                                    {calculateAge(userData.date_of_birth)} {isRtl ? 'سنة' : 'years'}
                                </div>
                            </div>
                            <div>
                                <span className="text-muted text-sm flex items-center gap-xs"><HeartPulse size={14} color="var(--danger)" /> {isRtl ? 'الحالة المرضية' : 'Health Condition'}</span>
                                {isEditing ? (
                                    <select value={userData.disease} onChange={e => handleChange('disease', e.target.value)} style={{ width: '100%', mt: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                                        {['السكري', 'ضغط الدم', 'أمراض القلب', 'الربو', 'لا يوجد', 'أخرى'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                ) : (
                                    <div style={{ fontWeight: 600, marginTop: 4, color: 'var(--danger)' }}>{userData.disease || (isRtl ? 'لا يوجد' : 'None')}</div>
                                )}
                            </div>
                        </>
                    )}

                    {role === 'doctor' && (
                        <>
                            <div>
                                <span className="text-muted text-sm flex items-center gap-xs"><Stethoscope size={14} /> {isRtl ? 'التخصص' : 'Specialty'}</span>
                                {isEditing ? (
                                    <input type="text" value={userData.specialty || ''} onChange={e => handleChange('specialty', e.target.value)} style={{ width: '100%', mt: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                                ) : (
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{userData.specialty || (isRtl ? 'غير محدد' : 'Not specified')}</div>
                                )}
                            </div>
                            <div>
                                <span className="text-muted text-sm flex items-center gap-xs"><Hospital size={14} /> {isRtl ? 'العيادة / المستشفى' : 'Hospital / Clinic'}</span>
                                {isEditing ? (
                                    <input type="text" value={userData.hospital || ''} onChange={e => handleChange('hospital', e.target.value)} style={{ width: '100%', mt: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                                ) : (
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{userData.hospital || (isRtl ? 'غير محدد' : 'Not specified')}</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* INLINE CUSTOMER SERVICE SUPPORT */}
            <ChatWidget lang={lang} />

            {/* ROLE SPECIFIC SECTIONS */}
            {role === 'patient' && (
                <>
                    {/* 4. COMPANIONS SECTION */}
                    <div className="glass-card flex flex-col gap-md" style={{ padding: 20 }}>
                        <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
                            <h3 className="flex items-center gap-sm" style={{ margin: 0 }}>
                                <User size={20} color="var(--primary)" /> {isRtl ? 'الأشخاص المرافقين' : 'Companions'}
                            </h3>
                            {isEditing && (
                                <button onClick={() => addItem('companions', { name: '', phone: '' })} className="btn-secondary flex items-center gap-xs" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 12 }}>
                                    <Plus size={14} /> {isRtl ? 'إضافة' : 'Add'}
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-sm mt-2">
                            {userData.companions.length === 0 && <p className="text-sm text-muted text-center">{isRtl ? 'لا يوجد مرافقين مضافين' : 'No companions added'}</p>}
                            
                            {userData.companions.map((comp, i) => (
                                <div key={i} className="flex justify-between items-center gap-md" style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                                    <div className="flex-1 flex flex-col gap-sm">
                                        {isEditing ? (
                                            <>
                                                <input type="text" placeholder={isRtl ? 'اسم المرافق' : 'Companion Name'} value={comp.name} onChange={e => updateItem('companions', i, 'name', e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                                                <input type="tel" placeholder={isRtl ? 'رقم الهاتف' : 'Phone'} value={comp.phone} onChange={e => updateItem('companions', i, 'phone', e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ fontWeight: 600 }}>{comp.name}</div>
                                                <div className="text-sm text-muted flex items-center gap-xs"><Phone size={12} /> <span style={{ direction: 'ltr' }}>{comp.phone}</span></div>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-sm">
                                        {!isEditing && comp.phone && (
                                            <a href={`tel:${comp.phone}`} className="flex items-center justify-center" style={{ background: 'var(--primary)', color: 'white', width: 40, height: 40, borderRadius: '50%' }}>
                                                <PhoneCall size={18} />
                                            </a>
                                        )}
                                        {isEditing && (
                                            <button onClick={() => removeItem('companions', i)} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 8, padding: 10, cursor: 'pointer' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* 5. DOCTORS SECTION */}
                    <div className="glass-card flex flex-col gap-md" style={{ padding: 20 }}>
                        <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
                            <h3 className="flex items-center gap-sm" style={{ margin: 0 }}>
                                <Stethoscope size={20} color="var(--secondary)" /> {isRtl ? 'الأطباء المتابعين' : 'Following Doctors'}
                            </h3>
                            {isEditing && (
                                <button onClick={() => addItem('doctors', { name: '', specialty: '', phone: '', hospital: '' })} className="btn-secondary flex items-center gap-xs" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 12 }}>
                                    <Plus size={14} /> {isRtl ? 'إضافة طبيب' : 'Add Doctor'}
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-sm mt-2">
                            {userData.doctors.length === 0 && <p className="text-sm text-muted text-center">{isRtl ? 'لا يوجد أطباء مضافين' : 'No doctors added'}</p>}
                            
                            {userData.doctors.map((doc, i) => (
                                <div key={i} className="flex justify-between items-start gap-md" style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 12, borderLeft: !isRtl ? '4px solid var(--secondary)' : 'none', borderRight: isRtl ? '4px solid var(--secondary)' : 'none' }}>
                                    <div className="flex-1 flex flex-col gap-sm w-full">
                                        {isEditing ? (
                                            <>
                                                <input type="text" placeholder={isRtl ? 'اسم الطبيب' : 'Doctor Name'} value={doc.name} onChange={e => updateItem('doctors', i, 'name', e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                                                <input type="text" placeholder={isRtl ? 'التخصص (قلب، باطنة...)' : 'Specialty'} value={doc.specialty} onChange={e => updateItem('doctors', i, 'specialty', e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                                                <div className="flex gap-sm">
                                                    <input type="tel" placeholder={isRtl ? 'رقم الهاتف' : 'Phone'} value={doc.phone} onChange={e => updateItem('doctors', i, 'phone', e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                                                    <input type="text" placeholder={isRtl ? 'اسم العيادة (اختياري)' : 'Clinic (Opt)'} value={doc.hospital} onChange={e => updateItem('doctors', i, 'hospital', e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--secondary)' }}>{doc.name}</div>
                                                <div className="text-sm" style={{ fontWeight: 500 }}>{doc.specialty} {doc.hospital && `• ${doc.hospital}`}</div>
                                                <div className="text-sm text-muted flex items-center gap-xs mt-1"><Phone size={12} /> <span style={{ direction: 'ltr' }}>{doc.phone}</span></div>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col gap-sm items-center">
                                        {!isEditing && doc.phone && (
                                            <a href={`tel:${doc.phone}`} className="flex items-center justify-center shadow-sm" style={{ background: 'var(--secondary)', color: 'white', width: 44, height: 44, borderRadius: '50%' }}>
                                                <PhoneCall size={20} />
                                            </a>
                                        )}
                                        {isEditing && (
                                            <button onClick={() => removeItem('doctors', i)} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 8, padding: 10, cursor: 'pointer' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {(role === 'doctor' || role === 'caregiver') && (
                <div className="glass-card flex flex-col gap-md" style={{ padding: 20 }}>
                    <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
                        <h3 className="flex items-center gap-sm" style={{ margin: 0 }}>
                            <User size={20} color="var(--primary)" /> {isRtl ? 'المرضى الخاصين بي' : 'My Patients'}
                        </h3>
                    </div>
                    <div className="flex flex-col gap-sm mt-2">
                        {userData.patients.length === 0 && <p className="text-sm text-muted text-center">{isRtl ? 'لا يوجد مرضى مضافين' : 'No patients found'}</p>}
                        
                        {userData.patients.map((p, i) => (
                            <div key={i} className="flex justify-between items-center gap-md" style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                                <div className="flex-1 flex flex-col gap-sm">
                                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                                    <div className="text-sm text-muted">
                                        {p.age} {isRtl ? 'سنة' : 'years'} • <span style={{ color: 'var(--danger)' }}>{p.disease}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
