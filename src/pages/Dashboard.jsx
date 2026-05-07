import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBle } from '../context/BleContext';
import { Heart, Activity, Droplet, Thermometer, Watch, AlertTriangle, CheckCircle, Users, Wind, Stethoscope, Calendar, Flame } from 'lucide-react';

export default function Dashboard({ role, lang }) {
    const navigate = useNavigate();
    const isRtl = lang === 'ar';
    
    const { 
        synced, setSynced, bluetoothActive, setBluetoothActive,
        showScanner, setShowScanner, scanningStep, setScanningStep,
        connMode, connecting, setConnecting, connStatus, setConnStatus, connError, setConnError,
        rssi, battery, isAlerting, setIsAlerting, alertMsg, vitals, setVitals, gyro, steps, fatigue, fallDetection,
        handleDisconnect, connectViaBridge, startScanner, connectNativeBluetooth, connectToDevice, connectSimulatedWatch, wsRef
    } = useBle();

    const getStatusIndicator = (key, val) => {
        if (!val || val === '--' || val === '--/--') return { text: '--', color: 'var(--text-muted)' };
        let text = isRtl ? 'طبيعي' : 'Normal';
        let color = 'var(--success)';
        const setLow = () => { text = isRtl ? 'منخفض' : 'Low'; color = 'var(--warning)'; };
        const setHigh = () => { text = isRtl ? 'مرتفع' : 'High'; color = 'var(--danger)'; };

        if (key === 'hr') {
            if (val < 60) setLow();
            else if (val > 100) setHigh();
        } else if (key === 'temp') {
            if (val < 36.1) setLow();
            else if (val > 37.5) setHigh();
        } else if (key === 'spo2') {
            if (val < 95) setLow();
        } else if (key === 'bg') {
            if (val < 70) setLow();
            else if (val > 140) setHigh();
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

    // DOCTOR DASHBOARD
    if (role === 'doctor') {
        return (
            <div className="flex flex-col gap-lg pb-md">
                <div className="glass-panel" style={{ 
                    padding: '28px 24px', 
                    background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-light) 100%)', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '32px',
                    boxShadow: '0 20px 40px -10px rgba(30, 58, 138, 0.4)'
                }}>
                    <h2 style={{ margin: 0, marginBottom: 8, fontSize: '1.8rem', color: 'white' }}>{isRtl ? 'مرحباً، د. سارة' : 'Welcome, Dr. Sarah'}</h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, marginBottom: 16 }}>
                        <Stethoscope size={14} />
                        {isRtl ? 'أخصائي أمراض القلب والأوعية الدموية' : 'Cardiologist Specialist'}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{isRtl ? 'نظرة عامة ومباشرة على حالات مرضاك.' : 'Overview of your patients live vitals.'}</p>
                    {/* Device Status Header (Signal & Battery) */}
                    {synced && (
                        <div className="flex justify-between items-center" style={{ marginTop: 16, background: 'var(--glass-border)', padding: '8px 12px', borderRadius: 12 }}>
                            <div className="flex items-center gap-sm">
                                <div className="flex items-end gap-[2px]" style={{ height: 14 }}>
                                    {[1, 2, 3, 4].map(bar => (
                                        <div key={bar} style={{
                                            width: 3,
                                            height: bar * 3,
                                            background: rssi && (rssi > -90 + (bar * 10)) ? 'var(--primary)' : 'var(--text-muted)',
                                            opacity: rssi && (rssi > -90 + (bar * 10)) ? 1 : 0.3,
                                            borderRadius: 1
                                        }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8 }}>{isRtl ? 'الإشارة' : 'Signal'}</span>
                            </div>

                            {battery !== null && (
                                <div className="flex items-center gap-sm">
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: battery < 20 ? 'var(--danger)' : 'var(--text-main)' }}>{battery}%</span>
                                    <div style={{ width: 22, height: 12, border: '1.5px solid currentColor', borderRadius: 2, position: 'relative', padding: 1, color: battery < 20 ? 'var(--danger)' : 'var(--text-main)' }}>
                                        <div style={{ width: `${battery}%`, height: '100%', background: battery < 20 ? 'var(--danger)' : 'var(--primary)', borderRadius: 1 }} />
                                        <div style={{ position: 'absolute', right: -3, top: 2, width: 2, height: 4, background: 'currentColor', borderRadius: '0 1px 1px 0' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                <div className="grid grid-cols-2">
                    <div className="glass-card flex flex-col items-center justify-center text-center p-md" style={{ padding: 16 }}>
                        <Users size={32} color="var(--primary)" style={{ marginBottom: 8 }} />
                        <h3>12</h3>
                        <p className="text-sm">{isRtl ? 'إجمالي المرضى' : 'Total Patients'}</p>
                    </div>
                    <div className="glass-card flex flex-col items-center justify-center text-center p-md" style={{ padding: 16 }}>
                        <AlertTriangle size={32} color="var(--danger)" style={{ marginBottom: 8 }} />
                        <h3>2</h3>
                        <p className="text-sm">{isRtl ? 'حالات حرجة' : 'Critical Alerts'}</p>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                        <h3>{isRtl ? 'المواعيد القادمة' : 'Upcoming Appointments'}</h3>
                    </div>
                    <div className="glass-card" style={{ padding: 16, borderLeft: '4px solid var(--secondary)' }}>
                        <p className="font-bold">Ahmed Ali - {isRtl ? 'متابعة سكر' : 'Glucose Follow-up'}</p>
                        <p className="text-sm">Today, 14:30 PM</p>
                    </div>
                </div>
            </div>
        );
    }

    // CAREGIVER DASHBOARD
    if (role === 'caregiver') {
        return (
            <div className="flex flex-col gap-lg pb-md">
                <div className="glass-panel" style={{ 
                    padding: '28px 24px', 
                    background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-light) 100%)', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '32px',
                    boxShadow: '0 20px 40px -10px rgba(30, 58, 138, 0.4)'
                }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 style={{ margin: 0, marginBottom: 8, fontSize: '1.6rem', color: 'white' }}>{isRtl ? 'مراقبة: أحمد علي' : 'Monitoring: Ahmed Ali'}</h2>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(28, 192, 160, 0.3)', backdropFilter: 'blur(10px)', color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, marginBottom: 16 }}>
                                <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                                {isRtl ? 'يتم استقبال البيانات' : 'Receiving Vitals'}
                            </div>
                        </div>
                    </div>
                    {/* Device Status Header (Signal & Battery) */}
                    {synced && (
                        <div className="flex justify-between items-center" style={{ marginTop: 16, background: 'var(--glass-border)', padding: '8px 12px', borderRadius: 12 }}>
                            <div className="flex items-center gap-sm">
                                <div className="flex items-end gap-[2px]" style={{ height: 14 }}>
                                    {[1, 2, 3, 4].map(bar => (
                                        <div key={bar} style={{
                                            width: 3,
                                            height: bar * 3,
                                            background: rssi && (rssi > -90 + (bar * 10)) ? 'var(--primary)' : 'var(--text-muted)',
                                            opacity: rssi && (rssi > -90 + (bar * 10)) ? 1 : 0.3,
                                            borderRadius: 1
                                        }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8 }}>{isRtl ? 'الإشارة' : 'Signal'}</span>
                            </div>

                            {battery !== null && (
                                <div className="flex items-center gap-sm">
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: battery < 20 ? 'var(--danger)' : 'var(--text-main)' }}>{battery}%</span>
                                    <div style={{ width: 22, height: 12, border: '1.5px solid currentColor', borderRadius: 2, position: 'relative', padding: 1, color: battery < 20 ? 'var(--danger)' : 'var(--text-main)' }}>
                                        <div style={{ width: `${battery}%`, height: '100%', background: battery < 20 ? 'var(--danger)' : 'var(--primary)', borderRadius: 1 }} />
                                        <div style={{ position: 'absolute', right: -3, top: 2, width: 2, height: 4, background: 'currentColor', borderRadius: '0 1px 1px 0' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                <div className="flex justify-between items-center" style={{ marginTop: 8 }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{isRtl ? 'المؤشرات الحيوية الأساسية' : 'Key Vitals'}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, padding: '6px 12px', background: isAlerting ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isAlerting ? 'var(--danger)' : 'var(--success)', borderRadius: 20 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isAlerting ? 'var(--danger)' : 'var(--success)' }} />
                        {isAlerting ? (isRtl ? 'حرج' : 'Critical') : (isRtl ? 'مستقر' : 'Stable')}
                    </div>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                    {Object.entries(vitals).filter(([k]) => ['hr', 'bp', 'temp', 'spo2'].includes(k)).map(([key, vital]) => {
                        const stat = getStatusIndicator(key, vital.value);
                        return (
                        <motion.div
                            key={key}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/vitals/${key}`)}
                            className="glass-card"
                            style={{ padding: '20px 16px', borderRadius: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}
                        >
                            <div className="flex justify-between items-start" style={{ marginBottom: 16 }}>
                                <div style={{ background: `${vital.color}15`, padding: '10px', borderRadius: '14px', color: vital.color, position: 'relative' }}>
                                    <vital.icon size={22} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-xs">
                                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{vital.value}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{vital.unit}</span>
                                </div>
                                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: 4, fontWeight: 500 }}>{vital.label}</h3>
                                <div style={{ marginTop: 6, fontSize: '0.75rem', fontWeight: 600, color: stat.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: stat.color }} />
                                    {stat.text}
                                </div>
                            </div>
                        </motion.div>
                    )})}
                </div>
            </div>
        );
    }

    // PATIENT DASHBOARD (DEFAULT)
    return (
        <div className="flex flex-col gap-lg pb-md">
            <div className="glass-panel" style={{ 
                padding: '28px 24px', 
                background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-light) 100%)', 
                color: 'white',
                border: 'none',
                borderRadius: '32px',
                boxShadow: '0 20px 40px -10px rgba(30, 58, 138, 0.4)'
            }}>
                <h2 style={{ margin: 0, marginBottom: 8, fontSize: '1.8rem', color: 'white' }}>{isRtl ? 'لوحة تحكم أحمد' : 'Ahmed\'s Dashboard'}</h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, marginBottom: 16 }}>
                    <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                    {isRtl ? 'مريض سكري وضغط دم' : 'Diabetes & Hypertension Patient'}
                </div>
                <p className="text-sm" style={{ marginBottom: 20, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                    {isRtl ? 'مراقبة حية عبر الساعة الذكية وتتبع دقيق للنشاط.' : 'Real-time health monitoring & advanced activity tracking.'}
                </p>
                {/* Device Status Header (Signal & Battery) */}
                {synced && (
                    <div className="flex justify-between items-center" style={{ marginBottom: 16, background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: 12 }}>
                        <div className="flex items-center gap-sm">
                            <div className="flex items-end gap-[2px]" style={{ height: 14 }}>
                                {[1, 2, 3, 4].map(bar => (
                                    <div key={bar} style={{
                                        width: 3,
                                        height: bar * 3,
                                        background: rssi && (rssi > -90 + (bar * 10)) ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                                        borderRadius: 1
                                    }} />
                                ))}
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8 }}>{isRtl ? 'الإشارة' : 'Signal'}</span>
                        </div>

                        {battery !== null && (
                            <div className="flex items-center gap-sm">
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: battery < 20 ? 'var(--danger)' : 'inherit' }}>{battery}%</span>
                                <div style={{ width: 22, height: 12, border: '1.5px solid currentColor', borderRadius: 2, position: 'relative', padding: 1 }}>
                                    <div style={{ width: `${battery}%`, height: '100%', background: battery < 20 ? 'var(--danger)' : 'var(--primary)', borderRadius: 1 }} />
                                    <div style={{ position: 'absolute', right: -3, top: 2, width: 2, height: 4, background: 'currentColor', borderRadius: '0 1px 1px 0' }} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    className="btn-primary flex justify-center items-center gap-sm"
                    onClick={synced ? handleDisconnect : startScanner}
                    style={{
                        width: '100%', borderRadius: 20,
                        background: synced ? 'rgba(255, 255, 255, 0.2)' : 'white',
                        color: synced ? 'white' : 'var(--secondary)',
                        boxShadow: synced ? 'none' : '0 8px 16px rgba(0,0,0,0.1)',
                        border: synced ? '1px solid rgba(255,255,255,0.3)' : 'none',
                    }}
                >
                    <Watch size={20} className={synced && bluetoothActive ? 'animate-pulse' : ''} />
                    {synced ? (isRtl ? 'فصل الجهاز' : 'Disconnect Device') : (isRtl ? 'ربط life care' : 'Connect life care')}
                </button>

                {/* Connection mode badge */}
                {synced && connMode && (
                    <div className="flex justify-center" style={{ marginTop: 14 }}>
                        <span style={{
                            fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', gap: 6
                        }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} className="animate-pulse" />
                            {connMode === 'ws'
                                ? (isRtl ? 'متصل عبر Bridge' : 'Connected via WS Bridge')
                                : (isRtl ? 'متصل عبر BLE مباشر' : 'Connected via BLE Direct')}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Connecting Overlay ─────────────────────────────────── */}
            <AnimatePresence>
                {connecting && (
                    <motion.div
                        key="conn-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24
                        }}
                    >
                        {/* Icon area */}
                        {connStatus !== 'error' ? (
                            <div style={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <motion.div
                                    animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.15, 0.4] }}
                                    transition={{ repeat: Infinity, duration: 1.6 }}
                                    style={{ position: 'absolute', inset: -18, borderRadius: '50%', background: connStatus === 'connected' ? 'var(--success)' : 'var(--primary)' }}
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.1, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 1.6, delay: 0.3 }}
                                    style={{ position: 'absolute', inset: -6, borderRadius: '50%', background: connStatus === 'connected' ? 'var(--success)' : 'var(--primary)' }}
                                />
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: connStatus === 'connected' ? 'var(--success)' : 'linear-gradient(135deg,#059669,#10b981)',
                                    boxShadow: `0 12px 40px ${connStatus === 'connected' ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.4)'}`
                                }}>
                                    {connStatus === 'connected'
                                        ? <CheckCircle color="white" size={40} />
                                        : <Watch color="white" size={36} className="animate-pulse" />}
                                </div>
                            </div>
                        ) : (
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle color="var(--danger)" size={38} />
                            </div>
                        )}

                        {/* Status text */}
                        <div style={{ textAlign: 'center', color: 'white' }}>
                            <h2 style={{ color: 'white', marginBottom: 8 }}>
                                {connStatus === 'scanning' && (isRtl ? 'جارٍ البحث عن الجهاز...' : 'Scanning for device...')}
                                {connStatus === 'connecting' && (isRtl ? 'جارٍ الاتصال بـ Life Care...' : 'Connecting to Life Care...')}
                                {connStatus === 'connected' && (isRtl ? 'تم الاتصال بنجاح!' : 'Connected!')}
                                {connStatus === 'error' && (isRtl ? 'فشل الاتصال' : 'Connection Failed')}
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                {connStatus === 'scanning' && (isRtl ? 'جهاز life care (ESP32-C3)' : 'life care (ESP32-C3)')}
                                {connStatus === 'connecting' && (isRtl ? 'اشتراك في قراءات الحيوية...' : 'Subscribing to vitals...')}
                                {connStatus === 'connected' && (isRtl ? 'البيانات تصل الآن' : 'Live data incoming')}
                                {connStatus === 'error' && connError}
                            </p>
                        </div>

                        {/* Cancel / Retry */}
                        {connStatus === 'error' ? (
                            <div className="flex gap-md">
                                <button
                                    onClick={() => { setConnecting(false); setConnError(''); }}
                                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 14, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    {isRtl ? 'إغلاق' : 'Close'}
                                </button>
                                <button
                                    onClick={() => { setConnecting(false); setTimeout(startScanner, 100); }}
                                    className="btn-primary"
                                    style={{ borderRadius: 14, padding: '10px 24px' }}
                                >
                                    {isRtl ? 'إعادة المحاولة' : 'Retry'}
                                </button>
                            </div>
                        ) : connStatus !== 'connected' ? (
                            <button
                                onClick={() => { setConnecting(false); if (wsRef.current) wsRef.current.close(); }}
                                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 14, padding: '10px 28px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                {isRtl ? 'إلغاء' : 'Cancel'}
                            </button>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Emergency Non-Intrusive Banner (Replaces full screen overlay) */}
            <AnimatePresence>
                {isAlerting && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
                        style={{ position: 'fixed', top: 20, left: 20, right: 20, background: 'rgba(220,38,38,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 20, boxShadow: '0 10px 25px rgba(220,38,38,0.3)', color: 'white', backdropFilter: 'blur(8px)' }}
                    >
                        <div style={{ background: 'white', padding: 8, borderRadius: '50%' }}>
                            <AlertTriangle size={24} color="#dc2626" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{isRtl ? 'تحذير طبي' : 'Medical Alert'}</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>{alertMsg}</p>
                        </div>
                        <button
                            onClick={() => setIsAlerting(false)}
                            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                            {isRtl ? 'إغفاء' : 'Dismiss'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scanning Modal */}
            <AnimatePresence>
                {showScanner && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh', background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(4px)' }}
                            onClick={() => setShowScanner(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100 }}
                            className="glass-panel"
                            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '92%', maxWidth: 360, zIndex: 1000, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
                        >
                            <div className="flex justify-between items-center">
                                <h3 style={{ margin: 0 }}>
                                    {isRtl ? 'الأجهزة المتاحة' : 'BLE Devices'}
                                </h3>
                                <button onClick={() => setShowScanner(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                            </div>

                            {scanningStep === 'searching' && (
                                <div className="flex flex-col items-center" style={{ margin: '16px 0', gap: 16 }}>
                                    <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div className="animate-pulse" style={{ position: 'absolute', inset: -12, background: 'var(--primary)', opacity: 0.15, borderRadius: '50%' }} />
                                        <div className="animate-pulse" style={{ position: 'absolute', inset: -4, background: 'var(--primary)', opacity: 0.1, borderRadius: '50%' }} />
                                        <div style={{ background: 'var(--primary)', padding: 18, borderRadius: '50%', color: 'white' }}>
                                            <Watch size={36} />
                                        </div>
                                    </div>
                                    <p className="text-sm" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                        {isRtl ? 'جارٍ البحث عن life care...' : 'Scanning for life care...'}
                                    </p>
                                </div>
                            )}

                            {scanningStep === 'found' && (
                                <div className="flex flex-col gap-sm">
                                    <p className="text-sm" style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 4 }}>
                                        {isRtl ? 'اختر طريقة الاتصال:' : 'Choose connection method:'}
                                    </p>

                                    {/* ── Real ESP32 Device ── */}
                                    {navigator.bluetooth && (
                                        <button
                                            className="glass-card flex items-center gap-md"
                                            onClick={connectNativeBluetooth}
                                            style={{ padding: '14px 16px', cursor: 'pointer', border: '2px solid var(--primary)', textAlign: 'start', width: '100%' }}
                                        >
                                            <div style={{ background: 'linear-gradient(135deg,#059669,#10b981)', color: 'white', padding: 10, borderRadius: 12, flexShrink: 0 }}>
                                                <Watch size={22} />
                                            </div>
                                            <div className="flex flex-col" style={{ gap: 2 }}>
                                                <span className="font-bold" style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
                                                    life care
                                                </span>
                                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                    {isRtl ? 'بوردة ESP32 حقيقية • 0x180D' : 'ESP32 Hardware • 0x180D'}
                                                </span>
                                            </div>
                                            <span style={{ marginInlineStart: 'auto', fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 8, fontWeight: 700, flexShrink: 0 }}>
                                                LIVE
                                            </span>
                                        </button>
                                    )}

                                    {/* ── Demo / Simulated fallback ── */}
                                    <button
                                        className="glass-card flex items-center gap-md"
                                        onClick={connectSimulatedWatch}
                                        style={{ padding: '14px 16px', cursor: 'pointer', textAlign: 'start', width: '100%' }}
                                    >
                                        <div style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: 'white', padding: 10, borderRadius: 12, flexShrink: 0 }}>
                                            <Activity size={22} />
                                        </div>
                                        <div className="flex flex-col" style={{ gap: 2 }}>
                                            <span className="font-bold" style={{ fontSize: '0.95rem' }}>{isRtl ? 'جهاز تجريبي (محاكاة)' : 'Demo Device (Simulated)'}</span>
                                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRtl ? 'بيانات وهمية للاختبار' : 'Mock data — no real device needed'}</span>
                                        </div>
                                        <span style={{ marginInlineStart: 'auto', fontSize: '0.7rem', background: 'rgba(59,130,246,0.12)', color: 'var(--secondary)', padding: '3px 8px', borderRadius: 8, fontWeight: 700, flexShrink: 0 }}>
                                            DEMO
                                        </span>
                                    </button>
                                </div>
                            )}

                            {scanningStep === 'error' && (
                                <div className="flex flex-col items-center text-center" style={{ gap: 12, padding: '12px 0' }}>
                                    <AlertTriangle size={40} color="var(--danger)" />
                                    <p style={{ color: 'var(--danger)', fontWeight: 600 }}>
                                        {isRtl ? 'تعذّر الاتصال بالجهاز' : 'Connection failed'}
                                    </p>
                                    <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={() => { setScanningStep('found'); }}>
                                        {isRtl ? 'إعادة المحاولة' : 'Retry'}
                                    </button>
                                </div>
                            )}

                            <button
                                className="btn-secondary"
                                style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', boxShadow: 'none', padding: '10px' }}
                                onClick={() => setShowScanner(false)}
                            >
                                {isRtl ? 'إلغاء' : 'Cancel'}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center" style={{ marginTop: 8 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{isRtl ? 'المؤشرات الأساسية' : 'Key Vitals'}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, padding: '6px 12px', background: isAlerting ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isAlerting ? 'var(--danger)' : 'var(--success)', borderRadius: 20 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: isAlerting ? 'var(--danger)' : 'var(--success)' }} />
                    {isAlerting ? (isRtl ? 'حرج' : 'Critical') : (isRtl ? 'مستقر' : 'Stable')}
                </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '16px' }}>

                {/* HERO WIDGET: STEPS (as requested by aesthetic reference) */}
                <motion.div 
                    whileTap={{ scale: 0.96 }}
                    className="glass-card flex flex-col items-center justify-center p-md" 
                    style={{ gridColumn: 'span 2', padding: '24px', borderRadius: '28px', position: 'relative', overflow: 'hidden' }}
                >
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'var(--primary)', opacity: 0.05, borderRadius: '50%' }} />
                    <div className="flex justify-between items-start" style={{ width: '100%', zIndex: 1 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{isRtl ? 'النشاط والحركة' : 'Daily Steps'}</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {isRtl ? 'الهدف الموصى به: 10,000' : 'Daily Goal: 10,000'}
                            </p>
                        </div>
                        <div style={{ background: fatigue && fatigue.includes('إرهاق') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: fatigue && fatigue.includes('إرهاق') ? 'var(--danger)' : 'var(--success)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {fatigue || (isRtl ? 'مستقر' : 'Stable')}
                        </div>
                    </div>
                    <div style={{ position: 'relative', width: '200px', height: '200px', marginTop: '16px', zIndex: 1 }}>
                        <svg fill="none" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', filter: 'drop-shadow(0 4px 10px rgba(6,182,212,0.3))' }}>
                            <circle cx="50" cy="50" r="42" stroke="var(--glass-border)" strokeWidth="10" />
                            <circle cx="50" cy="50" r="42" stroke="var(--primary)" strokeWidth="10" strokeDasharray="264" strokeDashoffset={synced ? Math.max(0, 264 - ((steps || 0) / 10000) * 264) : "264"} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 2s ease-out' }} />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1, letterSpacing: '-1px' }}>{synced ? (steps || 0) : '--'}</span>
                            <span style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>{isRtl ? 'خطوة' : 'Steps'}</span>
                        </div>
                    </div>
                </motion.div>

                {/* ALL 9 REQUESTED METRICS */}
                {
                    // Map through all vitals
                    Object.entries(vitals).map(([key, vital]) => {
                        const stat = getStatusIndicator(key, vital.value);
                        return (
                        <motion.div
                            key={key}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/vitals/${key}`)}
                            className="glass-card"
                            style={{ padding: '20px 16px', borderRadius: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}
                        >
                            <div className="flex justify-between items-start" style={{ marginBottom: 16 }}>
                                <div style={{
                                    background: `${vital.color}15`,
                                    padding: '10px',
                                    borderRadius: '14px',
                                    color: vital.color,
                                    position: 'relative'
                                }}>
                                    <vital.icon size={22} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-xs">
                                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                                        {vital.value}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        {vital.unit}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: 4, fontWeight: 500 }}>{vital.label}</h3>
                                <div style={{ marginTop: 6, fontSize: '0.75rem', fontWeight: 600, color: stat.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: stat.color }} />
                                    {stat.text}
                                </div>
                            </div>
                        </motion.div>
                    )})
                }

                {/* MOTION (Gyros / Fatigue) CARD */}
                <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="glass-card"
                    style={{ padding: '20px 16px', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}
                >
                    <div className="flex justify-between items-start" style={{ marginBottom: 16 }}>
                        <div style={{
                            background: fatigue && fatigue.includes('إرهاق') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            padding: '10px', borderRadius: '14px', position: 'relative',
                            color: fatigue && fatigue.includes('إرهاق') ? 'var(--danger)' : '#f59e0b'
                        }}>
                            <Activity size={22} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-xs">
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                                {fatigue || (isRtl ? 'مستقر' : 'Stable')}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: 4, fontWeight: 500 }}>
                            {isRtl ? 'الحركة المكتشفة' : 'Detected Motion'}
                        </h3>
                        <div style={{ marginTop: 6, fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, color: fatigue && fatigue.includes('إرهاق') ? 'var(--danger)' : 'var(--success)' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: fatigue && fatigue.includes('إرهاق') ? 'var(--danger)' : 'var(--success)' }} />
                            {fatigue && fatigue.includes('إرهاق') ? (isRtl ? 'حركة عنيفة/إرهاق' : 'Intense Motion') : (isRtl ? 'حركة طبيعية' : 'Normal Motion')}
                        </div>
                    </div>
                </motion.div>

                {/* FALL DETECTION CARD */}
                <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="glass-card"
                    style={{ padding: '20px 16px', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}
                >
                    <div className="flex justify-between items-start" style={{ marginBottom: 16 }}>
                        <div style={{
                            background: fallDetection ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            padding: '10px', borderRadius: '14px', position: 'relative',
                            color: fallDetection ? 'var(--danger)' : 'var(--success)'
                        }}>
                            <AlertTriangle size={22} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-xs">
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                                {fallDetection ? (isRtl ? 'سقوط!' : 'FALL!') : (isRtl ? 'آمن' : 'Safe')}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: 4, fontWeight: 500 }}>
                            {isRtl ? 'مستشعر السقوط' : 'Fall Detection'}
                        </h3>
                        <div style={{ marginTop: 6, fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, color: fallDetection ? 'var(--danger)' : 'var(--success)' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: fallDetection ? 'var(--danger)' : 'var(--success)' }} />
                            {fallDetection ? (isRtl ? 'حرج' : 'Critical') : (isRtl ? 'طبيعي' : 'Normal')}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
