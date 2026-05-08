import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Activity, AlertCircle, Heart, Droplet, Thermometer, Wind, MessageCircle, Send, X, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function PatientsList() {
    const navigate = useNavigate();
    const lang = document.documentElement.lang || 'ar';
    const isRtl = lang === 'ar';

    const [patients, setPatients] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    const token = localStorage.getItem('token') || '';

    // Load actual data from API if available, else mock data fallback
    useEffect(() => {
        if (!token) {
            // Mock fallback
            setTimeout(() => {
                setPatients([
                    { id: 'p1', _id: 'p1', name: isRtl ? 'أحمد علي' : 'Ahmed Ali', age: 65, condition: isRtl ? 'سكري، ضغط دم' : 'Diabetes, Hypertension', status: 'critical', lastUpdate: isRtl ? 'منذ ١٠ دقائق' : '10 mins ago', vitals: { hr: 110, bp: '150/95', bg: 180, temp: 37.8, spo2: 94 } },
                    { id: 'p2', _id: 'p2', name: isRtl ? 'فاطمة سعد' : 'Fatima Saad', age: 54, condition: isRtl ? 'ربو' : 'Asthma', status: 'stable', lastUpdate: isRtl ? 'منذ ساعة' : '1 hour ago', vitals: { hr: 75, bp: '120/80', bg: 95, temp: 36.8, spo2: 98 } }
                ]);
                setPendingRequests([
                    { connId: 'c1', name: isRtl ? 'محمد خالد' : 'Mohammed Khaled' }
                ]);
            }, 0);
            return;
        }

        fetch('https://life-care-production.up.railway.app/api/connections/get_doctor_patients', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data && data.data) {
                    const approved = data.data.filter(c => c.status === 'approved').map(c => ({
                        ...c.patient_id, connId: c._id,
                        status: 'stable', condition: 'Under Observation',
                        vitals: { hr: 75, bp: '120/80', bg: 95, temp: 36.8, spo2: 98 },
                        lastUpdate: 'Just now'
                    }));
                    const pending = data.data.filter(c => c.status === 'pending').map(c => ({
                        connId: c._id,
                        name: c.patient_id?.name || 'Unknown Patient'
                    }));

                    setPatients(approved);
                    setPendingRequests(pending);
                }
            }).catch(err => console.error(err));
    }, [token, isRtl]);

    const handleAction = async (connId, action) => {
        try {
            if (!token) {
                // Mock behavior
                setPendingRequests(prev => prev.filter(r => r.connId !== connId));
                if (action === 'approve') {
                    setPatients(prev => [...prev, { id: Date.now(), _id: Date.now(), name: 'New Patient', age: 40, condition: 'General', status: 'stable', vitals: { hr: 75, bp: '120/80', bg: 95, temp: 36.8, spo2: 98 }, lastUpdate: 'Just now' }]);
                }
                return;
            }

            const res = await fetch(`https://life-care-production.up.railway.app/api/connections/${action}_follow_request/${connId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Remove from pending
                const reqItem = pendingRequests.find(r => r.connId === connId);
                setPendingRequests(prev => prev.filter(r => r.connId !== connId));

                if (action === 'approve' && reqItem) {
                    // Refetch data optimally instead of full reload or hard mock
                    window.location.reload(); // Quick sync for simplicity
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openPatient = (patient) => {
        setSelectedPatient(patient);
        setMessages([
            { id: 1, sender: 'patient', text: isRtl ? 'مرحباً دكتور، أشعر ببعض التعب اليوم.' : 'Hello Doctor, I feel a bit tired today.', time: '10:00 AM' },
            { id: 2, sender: 'doctor', text: isRtl ? 'أهلاً بك. هل التزمت بمواعيد الدواء المحددة؟' : 'Welcome. Did you stick to the prescribed medication schedule?', time: '10:05 AM' }
        ]);
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'doctor',
            text: chatInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setChatInput('');
    };

    const getStatusIndicator = (key, val) => {
        if (!val || val === '--' || val === '--/--') return { text: '--', color: 'var(--text-muted)' };
        let text = isRtl ? 'طبيعي' : 'Normal';
        let color = 'var(--success)';
        const setLow = () => { text = isRtl ? 'منخفض' : 'Low'; color = 'var(--warning)'; };
        const setHigh = () => { text = isRtl ? 'مرتفع' : 'High'; color = 'var(--danger)'; };

        const v = parseFloat(val);

        if (key === 'hr') {
            if (v < 60) setLow();
            else if (v > 100) setHigh();
        } else if (key === 'temp') {
            if (v < 36.1) setLow();
            else if (v > 37.5) setHigh();
        } else if (key === 'spo2') {
            if (v < 95) setLow();
        } else if (key === 'bg') {
            if (v < 70) setLow();
            else if (v > 140) setHigh();
        } else if (key === 'bp') {
            const parts = String(val).split('/');
            if (parts.length === 2) {
                const sys = Number(parts[0]);
                const dia = Number(parts[1]);
                if (sys < 90 || dia < 60) setLow();
                else if (sys > 120 || dia > 80) setHigh();
            }
        }
        return { text, color };
    };

    return (
        <div className="flex flex-col gap-lg" style={{ paddingBottom: 40 }}>
            <div className="flex justify-between items-center" style={{ padding: '10px 0' }}>
                <div>
                    <h2>{isRtl ? 'مرضاي والطلبات' : 'Patients & Requests'}</h2>
                    <p className="text-sm text-muted">{isRtl ? 'إدارة مرضاك النشطين ومعالجة الطلبات الجديدة.' : 'Manage your active patients and handle new medical requests.'}</p>
                </div>
            </div>

            {/* PENDING REQUESTS SECTION */}
            {pendingRequests.length > 0 && (
                <div className="flex flex-col gap-md">
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--warning)' }}>
                        {isRtl ? 'طلبات متابعة معلقة' : 'Pending Follow-up Requests'}
                    </h3>
                    <div className="grid gap-sm">
                        {pendingRequests.map(req => (
                            <div key={req.connId} className="glass-card flex justify-between items-center" style={{ padding: 16, borderLeft: '4px solid var(--warning)' }}>
                                <div className="flex items-center gap-md">
                                    <User size={20} color="var(--warning)" />
                                    <span style={{ fontWeight: 600 }}>{req.name}</span>
                                </div>
                                <div className="flex gap-sm">
                                    <button onClick={() => handleAction(req.connId, 'approve')} className="flex items-center justify-center" style={{ background: '#e6f4ea', color: '#137333', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        <CheckCircle size={18} style={{ marginRight: isRtl ? 0 : 4, marginLeft: isRtl ? 4 : 0 }} />
                                        {isRtl ? 'قبول' : 'Accept'}
                                    </button>
                                    <button onClick={() => handleAction(req.connId, 'reject')} className="flex items-center justify-center" style={{ background: '#fce8e6', color: '#c5221f', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        <XCircle size={18} style={{ marginRight: isRtl ? 0 : 4, marginLeft: isRtl ? 4 : 0 }} />
                                        {isRtl ? 'رفض' : 'Reject'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    placeholder={isRtl ? 'البحث في مرضاك...' : 'Search your patients...'}
                    style={{ paddingLeft: isRtl ? 16 : 40, paddingRight: isRtl ? 40 : 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', width: '100%', color: 'var(--text-main)', padding: '12px' }}
                />
                <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', right: isRtl ? 12 : 'auto', left: isRtl ? 'auto' : 12, top: 12 }} />
            </div>

            <div className="flex flex-col gap-md">
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{isRtl ? 'المرضى الحاليون' : 'Active Patients'}</h3>
                {patients.length === 0 && <p className="text-sm text-muted">{isRtl ? 'لا يوجد مرضى حاليين لتتم متابعتهم.' : 'No active patients to follow up on.'}</p>}

                {patients.map(p => (
                    <motion.div
                        key={p._id || p.id}
                        onClick={() => openPatient(p)}
                        whileTap={{ scale: 0.98 }}
                        className="glass-card"
                        style={{
                            padding: 16,
                            borderLeft: p.status === 'critical' ? '4px solid var(--danger)' : p.status === 'warning' ? '4px solid var(--warning)' : '4px solid var(--success)',
                            cursor: 'pointer'
                        }}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-md">
                                <div style={{ background: 'var(--glass-bg)', padding: 10, borderRadius: '50%' }}>
                                    <User size={24} color="var(--text-main)" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{p.name}</h3>
                                    <p className="text-sm">{p.age} {isRtl ? 'سنة' : 'yrs'} • {p.condition}</p>
                                </div>
                            </div>

                            {p.status === 'critical' ? (
                                <AlertCircle color="var(--danger)" size={24} />
                            ) : (
                                <Activity color={p.status === 'warning' ? 'var(--warning)' : 'var(--success)'} size={24} />
                            )}
                        </div>

                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {isRtl ? 'آخر مزامنة:' : 'Last data sync:'} {p.lastUpdate}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Patient Details & Chat Modal */}
            <AnimatePresence>
                {selectedPatient && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh', background: 'var(--bg-main)', zIndex: 999, display: 'flex', flexDirection: 'column' }}
                    >
                        {/* Header */}
                        <div className="glass-panel" style={{ padding: '20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0, borderBottom: '1px solid var(--glass-border)' }}>
                            <div className="flex items-center gap-md">
                                <div style={{ background: 'var(--primary)', color: 'white', padding: 8, borderRadius: '50%' }}>
                                    <User size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedPatient.name}</h2>
                                    <span className="text-sm text-muted">{selectedPatient.condition}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPatient(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                                <X size={28} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

                            {/* Vitals Section */}
                            <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                                <h3 style={{ margin: 0 }}>{isRtl ? 'المؤشرات الحيوية الأخيرة' : 'Latest Vitals'}</h3>
                                <button
                                    className="btn-primary flex items-center gap-sm"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 12 }}
                                    onClick={() => navigate('/reports', { state: { patient: selectedPatient } })}
                                >
                                    <FileText size={16} />
                                    {isRtl ? 'عرض التقرير' : 'View Report'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2" style={{ gap: 12, marginBottom: 24 }}>
                                {Object.entries({
                                    hr: { icon: Heart, color: 'var(--danger)', label: isRtl ? 'النبض' : 'Heart Rate', unit: 'bpm' },
                                    bp: { icon: Activity, color: 'var(--warning)', label: isRtl ? 'الضغط' : 'Blood Pressure', unit: '' },
                                    bg: { icon: Droplet, color: '#339af0', label: isRtl ? 'السكر' : 'Glucose', unit: 'mg/dL' },
                                    spo2: { icon: Wind, color: 'var(--success)', label: isRtl ? 'الأكسجين' : 'SpO2', unit: '%' },
                                    temp: { icon: Thermometer, color: 'var(--primary)', label: isRtl ? 'درجة الحرارة' : 'Body Temp', unit: '°C' }
                                }).map(([key, info]) => {
                                    const val = selectedPatient.vitals[key];
                                    const stat = getStatusIndicator(key, val);
                                    return (
                                        <div key={key} className="glass-card flex items-center gap-sm" style={{ padding: 12, gridColumn: key === 'temp' ? 'span 2' : 'span 1' }}>
                                            <info.icon color={info.color} size={20} />
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted">{info.label}</span>
                                                <span className="font-bold">{val} {info.unit}</span>
                                                <div style={{ marginTop: 4, fontSize: '0.7rem', fontWeight: 600, color: stat.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: stat.color }} />
                                                    {stat.text}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Chat Section */}
                            <div className="flex items-center gap-sm" style={{ marginBottom: 16 }}>
                                <MessageCircle color="var(--primary)" size={20} />
                                <h3 style={{ margin: 0 }}>{isRtl ? 'المحادثة' : 'Chat'}</h3>
                            </div>

                            <div className="flex flex-col gap-md" style={{ paddingBottom: 80 }}>
                                {messages.map(msg => {
                                    const isMe = msg.sender === 'doctor';
                                    return (
                                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? (isRtl ? 'flex-end' : 'flex-end') : (isRtl ? 'flex-start' : 'flex-start') }}>
                                            <div
                                                className="glass-card"
                                                style={{
                                                    padding: '12px 16px',
                                                    maxWidth: '80%',
                                                    background: isMe ? 'var(--primary)' : 'var(--glass-bg)',
                                                    color: isMe ? 'white' : 'var(--text-main)',
                                                    borderRadius: isMe ? (isRtl ? '20px 0 20px 20px' : '20px 20px 0 20px') : (isRtl ? '0 20px 20px 20px' : '20px 20px 20px 0'),
                                                    border: isMe ? 'none' : '1px solid var(--glass-border)'
                                                }}
                                            >
                                                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{msg.text}</p>
                                            </div>
                                            <div className="flex items-center gap-sm text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                                                <Clock size={12} /> {msg.time}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>

                        {/* Chat Input */}
                        <div className="glass-panel" style={{ padding: 16, borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 12, borderRadius: 0 }}>
                            <input
                                type="text"
                                placeholder={isRtl ? 'اكتب رسالة...' : 'Type a message...'}
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                style={{ flex: 1, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: '12px 20px', color: 'var(--text-main)' }}
                            />
                            <button
                                onClick={handleSendMessage}
                                style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <Send size={20} style={{ transform: isRtl ? 'rotate(180deg)' : 'none', marginRight: isRtl ? 0 : 4, marginLeft: isRtl ? 4 : 0 }} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
