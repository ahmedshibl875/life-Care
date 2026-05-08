import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, PhoneCall, Video, CalendarCheck, Share2, Search, XCircle, CheckCircle, Clock } from 'lucide-react';

export default function Doctors() {
    const lang = document.documentElement.lang || 'ar';
    const isRtl = lang === 'ar';

    // Mock data initially, will update with real fetch if possible
    const [doctors, setDoctors] = useState([
        { id: 'd1', name: 'Dr. Sarah Ahmed', special: 'Cardiologist', status: 'approved' },
        { id: 'd2', name: 'Dr. John Smith', special: 'General Physician', status: 'pending' }
    ]);

    const [doctorIdInput, setDoctorIdInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchMessage, setSearchMessage] = useState('');
    const [verifiedDoctor, setVerifiedDoctor] = useState(null);

    const token = localStorage.getItem('token') || ''; // JWT token if exists

    const [allDoctors, setAllDoctors] = useState(() => {
        return token ? [] : [
            { _id: 'doc1', name: 'Dr. Ahmed Ibrahim', specialty: 'Cardiologist', hospital: 'Life Care' },
            { _id: 'doc2', name: 'Dr. Mona Hassan', specialty: 'Neurology', hospital: 'Al Shifa' }
        ];
    });
    const [doctorSearch, setDoctorSearch] = useState('');

    // Example of how we fetch connected doctors
    useEffect(() => {
        if (!token) {
            return;
        }

        // Fetch user's connected doctors
        fetch('https://life-care-production.up.railway.app/api/connections/get_patient_doctors', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data && data.data) {
                    const mapped = data.data.map(conn => ({
                        id: conn.doctor_id._id,
                        connId: conn._id,
                        name: conn.doctor_id.name,
                        special: conn.doctor_id.specialty || 'Specialist',
                        status: conn.status
                    }));
                    setDoctors(mapped);
                }
            }).catch(err => console.error(err));

        // Fetch all platform doctors
        fetch('https://life-care-production.up.railway.app/api/patient/doctors-list', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data && data.data) {
                    setAllDoctors(data.data);
                }
            }).catch(err => console.error(err));
    }, [token]);

    const verifyDoctorId = async () => {
        if (!doctorIdInput.trim()) return;
        setIsSearching(true);
        setSearchMessage('');
        setVerifiedDoctor(null);

        try {
            const res = await fetch(`https://life-care-production.up.railway.app/api/connections/verify_doctor/${doctorIdInput}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setIsSearching(false);

            if (res.ok && data.doctor) {
                setVerifiedDoctor(data.doctor);
                setSearchMessage(isRtl ? 'تم العثور على الطبيب بنجاح' : 'Doctor found successfully');
            } else {
                setSearchMessage(data.error || (isRtl ? 'لم يتم العثور على طبيب بهذا المعرف.' : 'Doctor not found with this ID.'));
            }
        } catch (error) {
            setIsSearching(false);
            setSearchMessage(isRtl ? 'تعذر الاتصال بالخادم.' : 'Could not connect to server.');
        }
    };

    const sendFollowRequest = async (targetId) => {
        // Support direct parameter or state input
        const idToUse = typeof targetId === 'string' ? targetId : doctorIdInput;
        if (!idToUse.trim()) return;

        setIsSearching(true);
        setSearchMessage('');

        try {
            const res = await fetch('https://life-care-production.up.railway.app/api/connections/send_follow_request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ doctor_id: idToUse })
            });

            const data = await res.json();
            setIsSearching(false);

            if (res.ok) {
                setSearchMessage(isRtl ? 'تم إرسال الطلب بنجاح!' : 'Request sent successfully!');

                // Find doctor name if from list or verified
                const docInfo = allDoctors.find(d => d._id === idToUse) || verifiedDoctor;
                const docName = docInfo ? docInfo.name : 'Doctor (Pending)';
                const special = docInfo ? (docInfo.specialty || 'Unknown') : 'Unknown';

                setDoctors(prev => [{ id: idToUse, name: docName, special: special, status: 'pending' }, ...prev]);

                if (typeof targetId !== 'string') setDoctorIdInput('');
                setVerifiedDoctor(null); // Reset after success
            } else {
                setSearchMessage(data.error || (isRtl ? 'خطأ في الإرسال' : 'Error sending request'));
                if (typeof targetId === 'string') alert(data.error || (isRtl ? 'خطأ في الإرسال' : 'Error sending request'));
            }
        } catch (error) {
            setIsSearching(false);
            setSearchMessage(isRtl ? 'تعذر الاتصال بالخادم.' : 'Could not connect to server.');
            if (typeof targetId === 'string') alert(isRtl ? 'تعذر الاتصال بالخادم.' : 'Could not connect to server.');
        }
    };

    const endFollowUp = async (doc) => {
        if (!window.confirm(isRtl ? 'هل أنت متأكد من إنهاء المتابعة مع هذا الطبيب؟ سحب الصلاحيات فوري.' : 'Are you sure you want to end follow-up with this doctor?')) return;

        try {
            if (!token) {
                // Mock behavior if no token
                setDoctors(prev => prev.filter(d => d.id !== doc.id));
                return;
            }

            const res = await fetch(`https://life-care-production.up.railway.app/api/connections/end_follow_up/${doc.connId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setDoctors(prev => prev.filter(d => d.id !== doc.id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col gap-lg pb-10">
            <div className="flex flex-col gap-sm mt-2">
                <div className="flex justify-between items-center">
                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{isRtl ? 'طاقمك الطبي' : 'Your Care Team'}</h2>
                </div>
                <p className="text-sm text-muted">{isRtl ? 'إدارة الأطباء المتابعين لحالتك وإرسال طلبات جديدة.' : 'Manage your connected doctors and send new follow-up requests.'}</p>
            </div>

            {/* BROWSE ALL DOCTORS SECTION */}
            <div className="glass-card flex flex-col gap-md" style={{ padding: 20, borderTop: '4px solid var(--accent)', marginTop: 10 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{isRtl ? 'تصفح قائمة الأطباء' : 'Browse All Doctors'}</h3>
                <p className="text-sm text-muted mb-2">{isRtl ? 'ابحث عن طبيب بالاسم أو التخصص لإضافته لطاقمك الطبي.' : 'Search for a doctor by name or specialty to add them to your care team.'}</p>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder={isRtl ? 'البحث بالاسم أو التخصص...' : 'Search by name or specialty...'}
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                        style={{ padding: '12px 16px', paddingLeft: isRtl ? 16 : 40, paddingRight: isRtl ? 40 : 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', width: '100%', color: 'var(--text-main)' }}
                    />
                    <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: isRtl ? 14 : 'auto', left: isRtl ? 'auto' : 14, top: 14 }} />
                </div>

                <div className="flex flex-col gap-sm mt-2" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: 4 }}>
                    {allDoctors.length === 0 && <p className="text-sm text-muted">{isRtl ? 'لا يوجد أطباء متاحين حالياً.' : 'No doctors available currently.'}</p>}
                    {allDoctors.filter(d =>
                        (d.name && d.name.toLowerCase().includes(doctorSearch.toLowerCase())) ||
                        (d.specialty && d.specialty.toLowerCase().includes(doctorSearch.toLowerCase()))
                    ).map(doc => {
                        const isConnected = doctors.some(connected => connected.id === doc._id);
                        return (
                            <div key={doc._id} className="flex justify-between items-center" style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                                <div className="flex items-center gap-md">
                                    <div style={{ padding: 8, background: 'var(--primary)', color: 'white', borderRadius: '50%' }}>
                                        <User size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{doc.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.specialty || 'General'} • {doc.hospital || 'Clinic'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => sendFollowRequest(doc._id)}
                                    disabled={isConnected || isSearching}
                                    style={{
                                        padding: '6px 12px', borderRadius: 8, border: 'none', cursor: isConnected ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem',
                                        background: isConnected ? 'var(--glass-border)' : 'var(--primary)', color: isConnected ? 'var(--text-muted)' : 'white'
                                    }}
                                >
                                    {isConnected ? (isRtl ? 'مضاف' : 'Added') : (isRtl ? 'إضافة' : 'Add')}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* SEND REQUEST TO DOCTOR BY ID (Manual) */}
            <div className="glass-card flex flex-col gap-md" style={{ padding: 20, borderTop: '4px solid var(--primary)' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{isRtl ? 'إضافة بمعرف الطبيب (Doctor ID)' : 'Add by Doctor ID'}</h3>
                <p className="text-sm text-muted mb-2">{isRtl ? 'أدخل معرف الدكتور (Doctor ID) للتحقق منه وبدء المتابعة.' : 'Enter Doctor ID to verify and start follow-up.'}</p>
                <div className="flex gap-sm">
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="text"
                            placeholder={isRtl ? 'مثال: DOC12345...' : 'Example: DOC12345...'}
                            value={doctorIdInput}
                            onChange={(e) => { setDoctorIdInput(e.target.value.toUpperCase()); setVerifiedDoctor(null); }}
                            style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', width: '100%', color: 'var(--text-main)', textTransform: 'uppercase' }}
                        />
                    </div>
                    <button onClick={verifyDoctorId} disabled={isSearching || !doctorIdInput} className="btn-secondary flex items-center gap-sm" style={{ padding: '0 20px', borderRadius: 12 }}>
                        {isSearching ? '...' : <Search size={18} />} {isRtl ? 'بحث' : 'Search'}
                    </button>
                </div>
                {searchMessage && !verifiedDoctor && <div style={{ fontSize: '0.85rem', color: searchMessage.includes('نجاح') || searchMessage.includes('successfully') ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{searchMessage}</div>}

                {/* Verified Doctor Card */}
                {verifiedDoctor && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-sm" style={{ marginTop: 10, padding: 16, background: 'var(--bg-main)', borderRadius: 12, border: '1px solid var(--success)' }}
                    >
                        <div className="flex items-center gap-md">
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <User size={24} />
                            </div>
                            <div className="flex flex-col flex-1">
                                <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-main)' }}>{verifiedDoctor.name}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{verifiedDoctor.specialty} • {verifiedDoctor.hospital}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => sendFollowRequest(verifiedDoctor._id)}
                            disabled={isSearching}
                            className="btn-primary mt-2 flex items-center justify-center gap-sm" style={{ width: '100%', padding: '10px', background: 'var(--success)' }}
                        >
                            <CheckCircle size={18} /> {isRtl ? 'بدء المتابعة' : 'Start Follow-up'}
                        </button>
                    </motion.div>
                )}
            </div>

            <div className="flex flex-col gap-md mt-2">
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{isRtl ? 'الأطباء المرتبطين بملفك' : 'Connected Doctors'}</h3>
                {doctors.length === 0 && <p className="text-sm text-muted">{isRtl ? 'لا يوجد أطباء متابعين لحالتك حتى الآن.' : 'No doctors following your case yet.'}</p>}

                {doctors.map(doc => (
                    <motion.div
                        key={doc.id}
                        whileHover={{ scale: 1.01 }}
                        className="glass-card flex flex-col justify-between"
                        style={{ padding: 20, borderLeft: doc.status === 'approved' ? '4px solid var(--success)' : '4px solid var(--warning)' }}
                    >
                        <div className="flex items-start gap-md mb-4 justify-between">
                            <div className="flex items-center gap-md">
                                <div
                                    className="flex items-center justify-center font-bold"
                                    style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--primary)', color: 'white', fontSize: '1.2rem' }}
                                >
                                    <User size={24} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{doc.name}</h2>
                                    <span className="text-muted text-sm flex gap-sm items-center">
                                        {doc.status === 'pending' ? <Clock size={14} color="var(--warning)" /> : <CheckCircle size={14} color="var(--success)" />}
                                        {doc.status === 'pending' ? (isRtl ? 'قيد الانتظار لمعالجة الطلب...' : 'Pending doctor approval...') : doc.special}
                                    </span>
                                </div>
                            </div>

                            {doc.status === 'approved' && (
                                <button onClick={() => endFollowUp(doc)} className="btn-secondary flex items-center gap-sm" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                    <XCircle size={16} /> {isRtl ? 'إنهاء المتابعة' : 'End Follow-up'}
                                </button>
                            )}
                        </div>

                        {doc.status === 'approved' && (
                            <div className="flex gap-sm">
                                <button className="flex-1 flex items-center justify-center gap-sm glass-card text-success" style={{ padding: '10px', border: 'none', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <PhoneCall size={18} /> {isRtl ? 'اتصال' : 'Call'}
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-sm btn-primary" style={{ padding: '10px' }}>
                                    <CalendarCheck size={18} /> {isRtl ? 'موعد' : 'Book'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
