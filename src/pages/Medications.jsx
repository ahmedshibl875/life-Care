import { useState, useEffect, useRef } from 'react';
import {
    Pill, Clock, CalendarDays, Plus, Bell, Image as ImageIcon,
    Type, X, AlertTriangle, CheckCircle2, Camera, BellRing, Trash2, BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALARM_SOUND = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';

export default function Medications() {
    const lang = document.documentElement.lang || 'ar';
    const isRtl = lang === 'ar';

    const [meds, setMeds] = useState([
        {
            id: 1,
            name: 'Lisinopril',
            image: null,
            dose: '10mg',
            times: ['08:00', '20:00'],
            days: [0, 1, 2, 3, 4, 5, 6], // 0: Sunday, 1: Monday, etc.
            takenToday: false,
            color: 'var(--secondary)'
        }
    ]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [activeAlarm, setActiveAlarm] = useState(null);

    // Form State
    const [newName, setNewName] = useState('');
    const [newImage, setNewImage] = useState(null);
    const [newDose, setNewDose] = useState('');
    const [newTime, setNewTime] = useState('');
    const [addedTimes, setAddedTimes] = useState([]);
    const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);

    const weekDays = isRtl
        ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Alarm Check Logic
    useEffect(() => {
        const checkAlarm = () => {
            const now = new Date();
            const currentDay = now.getDay();
            const currentHours = String(now.getHours()).padStart(2, '0');
            const currentMinutes = String(now.getMinutes()).padStart(2, '0');
            const currentTime = `${currentHours}:${currentMinutes}`;

            // We check every 5 seconds for demo, but normally every minute
            meds.forEach(med => {
                if (med.days.includes(currentDay) && med.times.includes(currentTime) && !med.takenToday) {
                    if (!activeAlarm || activeAlarm.id !== med.id) {
                        try {
                            const audio = new Audio(ALARM_SOUND);
                            audio.loop = true;
                            audio.play().catch(e => console.log('Audio play failed:', e));
                            setActiveAlarm({ ...med, audio });
                        } catch (err) {
                            setActiveAlarm(med);
                        }
                    }
                }
            });
        };

        const interval = setInterval(checkAlarm, 5000); // Check every 5 seconds for real-time demo accuracy
        return () => clearInterval(interval);
    }, [meds, activeAlarm]);

    const handleAddTime = () => {
        if (newTime && !addedTimes.includes(newTime)) {
            setAddedTimes([...addedTimes, newTime]);
            setNewTime('');
        }
    };

    const toggleDay = (dayIdx) => {
        if (selectedDays.includes(dayIdx)) {
            setSelectedDays(selectedDays.filter(d => d !== dayIdx));
        } else {
            setSelectedDays([...selectedDays, dayIdx].sort());
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveMedication = () => {
        if (!newName || addedTimes.length === 0 || selectedDays.length === 0) {
            alert(isRtl ? 'يرجى إدخال اسم الدواء والمواعيد على الأقل' : 'Please enter medication name and times at least');
            return;
        }

        const newMed = {
            id: Date.now(),
            name: newName,
            image: newImage,
            dose: newDose || '1 pill',
            times: addedTimes.sort(),
            days: selectedDays,
            takenToday: false,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
        };

        setMeds([...meds, newMed]);
        setShowAddForm(false);

        // Reset form
        setNewName(''); setNewImage(null); setNewDose(''); setAddedTimes([]); setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    };

    const stopAudio = (alarm) => {
        if (alarm && alarm.audio) {
            alarm.audio.pause();
            alarm.audio.currentTime = 0;
        }
    };

    const markAsTaken = (id) => {
        setMeds(meds.map(m => m.id === id ? { ...m, takenToday: true } : m));
        if (activeAlarm && activeAlarm.id === id) {
            stopAudio(activeAlarm);
            setActiveAlarm(null);
        }
    };

    const handleSnooze = () => {
        if (activeAlarm) {
            stopAudio(activeAlarm);
            setActiveAlarm(null);
        }
    };

    const cancelAlarm = (id) => {
        // Stop audio if it's the active alarm
        if (activeAlarm && activeAlarm.id === id) {
            stopAudio(activeAlarm);
            setActiveAlarm(null);
        }
        // Remove the medication entirely
        setMeds(prev => prev.filter(m => m.id !== id));
    };

    return (
        <div className="flex flex-col gap-lg" style={{ paddingBottom: 100 }}>
            {/* Alarm Modal Overlay */}
            <AnimatePresence>
                {activeAlarm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center p-md text-center"
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(250, 82, 82, 0.95)', zIndex: 1000, color: 'white'
                        }}
                    >
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                            <BellRing size={80} color="white" style={{ marginBottom: 20 }} />
                        </motion.div>
                        <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: 10 }}>{isRtl ? 'موعد الدواء!' : 'Medication Time!'}</h1>

                        {activeAlarm.image && (
                            <img src={activeAlarm.image} alt="Medication" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: '20px', border: '4px solid white', marginBottom: 16 }} />
                        )}
                        <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: 16 }}>{activeAlarm.name}</h2>

                        <p style={{ fontSize: '1.2rem', marginBottom: 40, opacity: 0.9 }}>
                            {isRtl ? `الجرعة المحددة: ${activeAlarm.dose}` : `Dose: ${activeAlarm.dose}`}
                        </p>

                        <div className="flex flex-col gap-md" style={{ width: '100%', maxWidth: 300 }}>
                            <button
                                onClick={() => markAsTaken(activeAlarm.id)}
                                className="btn-primary flex justify-center items-center gap-sm"
                                style={{ background: 'white', color: 'var(--danger)', fontSize: '1.2rem', padding: 20 }}
                            >
                                <CheckCircle2 size={28} /> {isRtl ? 'تم أخذ الدواء' : 'Taken'}
                            </button>

                            <button
                                onClick={handleSnooze}
                                className="btn-secondary flex justify-center items-center gap-sm"
                                style={{ background: 'transparent', border: '2px solid white', color: 'white', fontSize: '1.2rem', padding: 20 }}
                            >
                                {isRtl ? 'ذكرني لاحقاً (غفوة)' : 'Snooze'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center" style={{ padding: '10px 0' }}>
                <div>
                    <h2>{isRtl ? 'مواعيد الأدوية' : 'Medications'}</h2>
                    <p className="text-sm">{isRtl ? 'نظام التنبيهات الدقيق للأدوية.' : 'Precise medication alarms.'}</p>
                </div>
                <button className="btn-primary flex items-center justify-center" style={{ width: 44, height: 44, padding: 0, borderRadius: '50%' }} onClick={() => setShowAddForm(true)}>
                    <Plus size={24} />
                </button>
            </div>

            {/* Add Medication Form / Modal */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="glass-panel"
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 500,
                            borderRadius: 0, overflowY: 'auto', padding: 20, paddingTop: 40,
                            background: 'var(--glass-bg)', backdropFilter: 'blur(20px)'
                        }}
                    >
                        <div className="flex justify-between items-center" style={{ marginBottom: 30 }}>
                            <h2 style={{ margin: 0 }}>{isRtl ? 'إضافة دواء جديد' : 'Add Medication'}</h2>
                            <button onClick={() => setShowAddForm(false)} style={{ background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-lg">
                            <input
                                type="text"
                                placeholder={isRtl ? 'اسم الدواء (مطلوب)' : 'Medication Name (Required)'}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />

                            <div className="glass-card flex flex-col items-center justify-center p-md" style={{ border: '2px dashed var(--glass-border)', padding: 24, position: 'relative' }}>
                                {newImage ? (
                                    <img src={newImage} alt="Preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12 }} />
                                ) : (
                                    <>
                                        <Camera size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
                                            {isRtl ? 'صورة الدواء (اختياري، اضغط للرفع)' : 'Medication Image (Optional, click to upload)'}
                                        </p>
                                    </>
                                )}
                                <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                                {newImage && (
                                    <button onClick={(e) => { e.preventDefault(); setNewImage(null); }} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28 }}>
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <input
                                type="text"
                                placeholder={isRtl ? 'الجرعة (مثال: حبة واحدة, 10 مل)' : 'Dose (e.g., 1 pill, 10ml)'}
                                value={newDose}
                                onChange={(e) => setNewDose(e.target.value)}
                            />

                            {/* Times Selection */}
                            <div className="glass-card" style={{ padding: 20 }}>
                                <label style={{ display: 'block', marginBottom: 10, fontWeight: 'bold' }}>{isRtl ? 'أوقات الجرعة اليومية:' : 'Daily Dose Times:'}</label>
                                <div className="flex gap-md" style={{ marginBottom: 16 }}>
                                    <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} style={{ flex: 1 }} />
                                    <button className="btn-primary flex items-center justify-center" style={{ padding: '0 20px' }} onClick={handleAddTime}>
                                        <Plus size={20} />
                                    </button>
                                </div>

                                {addedTimes.length > 0 && (
                                    <div className="flex gap-sm flex-wrap">
                                        {addedTimes.map((time, idx) => (
                                            <span key={idx} className="glass-card flex items-center gap-sm" style={{ padding: '8px 16px', borderRadius: 20, background: 'var(--primary)', color: 'white', border: 'none' }}>
                                                <Clock size={16} /> {time}
                                                <X size={16} onClick={() => setAddedTimes(addedTimes.filter(t => t !== time))} style={{ cursor: 'pointer', marginLeft: 8 }} />
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Days Selection */}
                            <div className="glass-card" style={{ padding: 20 }}>
                                <label style={{ display: 'block', marginBottom: 16, fontWeight: 'bold' }}>{isRtl ? 'في أي أيام الأسبوع؟' : 'Days of the week?'}</label>
                                <div className="flex gap-sm justify-between">
                                    {weekDays.map((day, idx) => {
                                        const isSelected = selectedDays.includes(idx);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => toggleDay(idx)}
                                                style={{
                                                    width: 40, height: 40, borderRadius: '50%', border: 'none',
                                                    background: isSelected ? 'var(--primary)' : 'var(--glass-bg)',
                                                    color: isSelected ? 'white' : 'var(--text-muted)',
                                                    fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer',
                                                    boxShadow: isSelected ? '0 4px 12px rgba(12,166,120,0.4)' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {day[0]}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <button className="btn-primary" onClick={handleSaveMedication} style={{ padding: '16px', fontSize: '1.1rem', marginTop: 10 }}>
                                {isRtl ? 'حفظ الميعاد وتفعيل المنبه' : 'Save & Activate Alarm'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Medication List */}
            <div className="flex flex-col gap-md">
                <AnimatePresence>
                    {meds.length === 0 && (
                        <div className="glass-card flex flex-col justify-center items-center text-center p-lg text-muted" style={{ padding: 40 }}>
                            <Bell size={48} color="var(--glass-border)" style={{ marginBottom: 16 }} />
                            <p>{isRtl ? 'لم تقم بتسجيل أي أدوية بعد.' : 'No medications recorded yet.'}</p>
                        </div>
                    )}

                    {meds.map(med => (
                        <motion.div
                            layout
                            key={med.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`glass-card flex flex-col justify-between`}
                            style={{
                                padding: 20,
                                borderRight: isRtl ? `6px solid ${med.color}` : 'none',
                                borderLeft: !isRtl ? `6px solid ${med.color}` : 'none',
                                position: 'relative',
                                opacity: med.takenToday ? 0.6 : 1
                            }}
                        >
                            <div className="flex justify-between items-start" style={{ marginBottom: 16 }}>
                                <div className="flex items-start gap-md">
                                    {med.image ? (
                                        <img src={med.image} alt="Medication" style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ padding: 12, background: `${med.color}20`, borderRadius: 12, width: 60, height: 60, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <Pill color={med.color} size={32} />
                                        </div>
                                    )}

                                    <div style={{ marginTop: 4 }}>
                                        <h2 style={{ margin: 0, fontSize: '1.2rem', textDecoration: med.takenToday ? 'line-through' : 'none' }}>{med.name}</h2>
                                        <span className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>{med.dose}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => markAsTaken(med.id)}
                                    style={{
                                        background: med.takenToday ? 'var(--success)' : 'var(--glass-bg)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '50%',
                                        width: 44, height: 44,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: med.takenToday ? '0 4px 12px rgba(64,192,87,0.4)' : 'none',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <CheckCircle2 color={med.takenToday ? 'white' : 'var(--text-main)'} size={24} />
                                </button>
                            </div>

                            <div className="flex gap-sm" style={{ marginTop: 14 }}>
                                <button
                                    onClick={() => markAsTaken(med.id)}
                                    disabled={med.takenToday}
                                    className="btn-primary flex items-center justify-center gap-sm"
                                    style={{
                                        flex: 1, padding: '10px 12px', fontSize: '0.85rem', borderRadius: 12,
                                        background: med.takenToday ? 'var(--success)' : 'var(--primary)',
                                        opacity: med.takenToday ? 0.8 : 1
                                    }}
                                >
                                    <CheckCircle2 size={18} />
                                    {med.takenToday ? (isRtl ? '\u062aم \u0627\u0644\u0623\u062e\u0630' : 'Taken') : (isRtl ? '\u062a\u0645 \u0627\u0644\u0623\u062e\u0630' : 'Mark Taken')}
                                </button>
                                <button
                                    onClick={() => cancelAlarm(med.id)}
                                    title={isRtl ? '\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0645\u0646\u0628\u0647' : 'Cancel Alarm'}
                                    style={{
                                        background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)',
                                        borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
                                        color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        fontSize: '0.82rem', fontWeight: 600
                                    }}
                                >
                                    <BellOff size={17} />
                                    {isRtl ? '\u0625\u0644\u063a\u0627\u0621' : 'Cancel'}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
