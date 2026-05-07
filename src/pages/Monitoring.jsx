import { motion } from 'framer-motion';
import { useBle } from '../context/BleContext';
import { useNavigate } from 'react-router-dom';

// Simple mockup sparkline component
const Sparkline = ({ color }) => {
    // Generate a random-looking smooth curve
    const points = '0,40 10,35 20,40 30,20 40,30 50,25 60,45 70,10 80,30 90,35 100,50';
    return (
        <svg viewBox="0 0 100 50" style={{ width: '100%', height: '40px', overflow: 'visible' }}>
            <polyline 
                points={points} 
                fill="none" 
                stroke={color} 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ opacity: 0.8 }}
            />
        </svg>
    );
};

export default function Monitoring({ lang }) {
    const isRtl = lang === 'ar';
    const navigate = useNavigate();
    const { vitals, fatigue, fallDetection } = useBle();

    const getStatusIndicator = (key, val) => {
        if (!val || val === '--' || val === '--/--') return { text: '--', color: 'var(--text-muted)' };
        let text = isRtl ? 'طبيعي' : 'Normal';
        let color = 'var(--success)';
        const setLow = () => { text = isRtl ? 'منخفض' : 'Low'; color = 'var(--warning)'; };
        const setHigh = () => { text = isRtl ? 'حرج' : 'Critical'; color = 'var(--danger)'; };

        if (key === 'hr') {
            if (val < 60) setLow();
            else if (val > 100) setHigh();
        } else if (key === 'temp') {
            if (val < 36.1) setLow();
            else if (val > 37.5) setHigh();
        } else if (key === 'spo2') {
            if (val < 95) setLow();
            else if (val < 90) setHigh();
        } else if (key === 'bg') {
            if (val < 70) setLow();
            else if (val > 140) setHigh();
        } else if (key === 'hrv') {
            if (val < 30) setLow();
        } else if (key === 'stress') {
            if (val > 60) setLow(); // Low meaning Warning
            if (val > 80) setHigh();
        } else if (key === 'sleep') {
            if (val < 60) setHigh();
            else if (val < 80) setLow();
        } else if (key === 'bp') {
            const parts = String(val).split('/');
            if (parts.length === 2) {
                const sys = Number(parts[0]);
                const dia = Number(parts[1]);
                if (sys < 90 || dia < 60) setLow();
                else if (sys > 140 || dia > 90) setHigh();
                else if (sys > 120 || dia > 80) setLow(); // Pre-hypertension warning
            }
        }
        return { text, color };
    };

    return (
        <div className="flex flex-col gap-lg pb-md">
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '32px', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{isRtl ? 'المراقبة المتقدمة' : 'Advanced Monitoring'}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>
                    {isRtl ? 'تفاصيل جميع المؤشرات الحيوية وتحليلها.' : 'Detailed view of all vital signs and analysis.'}
                </p>
            </div>

            <div className="flex flex-col gap-md">
                {Object.entries(vitals).map(([key, vital]) => {
                    const stat = getStatusIndicator(key, vital.value);
                    return (
                        <motion.div
                            key={key}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/vitals/${key}`)}
                            className="glass-card"
                            style={{ padding: '20px', borderRadius: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 16 }}
                        >
                            <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-sm">
                                    <div style={{ background: `${vital.color}15`, padding: '12px', borderRadius: '16px', color: vital.color }}>
                                        <vital.icon size={26} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{vital.label}</h3>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: stat.color, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: stat.color, border: `2px solid ${stat.color}33` }} />
                                            {stat.text}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-baseline gap-[4px]">
                                        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                                            {vital.value}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            {vital.unit}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ width: '100%', padding: '8px 0' }}>
                                <Sparkline color={stat.color === 'var(--text-muted)' ? 'var(--primary)' : stat.color} />
                            </div>
                        </motion.div>
                    );
                })}

                {/* Explicitly Render Motion / Fatigue */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="glass-card"
                    style={{ padding: '20px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-sm">
                            <div style={{ background: fatigue?.includes('إرهاق') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '16px', color: fatigue?.includes('إرهاق') ? 'var(--danger)' : '#f59e0b' }}>
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{isRtl ? 'الحركة والإرهاق' : 'Motion & Fatigue'}</h3>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: fatigue?.includes('إرهاق') ? 'var(--danger)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: fatigue?.includes('إرهاق') ? 'var(--danger)' : 'var(--success)', border: '2px solid rgba(0,0,0,0.1)' }} />
                                    {fatigue?.includes('إرهاق') ? (isRtl ? 'حرج' : 'Critical') : (isRtl ? 'طبيعي' : 'Normal')}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-baseline gap-[4px]">
                                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                                    {fatigue || (isRtl ? 'مستقر' : 'Stable')}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Explicitly Render Fall Detection */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="glass-card"
                    style={{ padding: '20px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-sm">
                            <div style={{ background: fallDetection ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '16px', color: fallDetection ? 'var(--danger)' : 'var(--success)' }}>
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10.2 15.2-1.8 1.8"/><path d="m14 11.4-1.8 1.8"/><path d="M14 6h.01"/><path d="m16 9.5-2.2 2.2"/><path d="M19 12h.01"/><path d="m20.2 9.2-1.8 1.8"/><path d="m22 6-3.8 3.8"/><path d="m22 22-8-8"/><path d="m5 10 3 3"/><path d="m5 14 .01.01"/><path d="m9 14 3 3"/><path d="M9 18h.01"/></svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{isRtl ? 'حساس السقوط' : 'Fall Detection'}</h3>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: fallDetection ? 'var(--danger)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: fallDetection ? 'var(--danger)' : 'var(--success)', border: '2px solid rgba(0,0,0,0.1)' }} />
                                    {fallDetection ? (isRtl ? 'حرج' : 'Critical') : (isRtl ? 'طبيعي' : 'Normal')}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-baseline gap-[4px]">
                                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                                    {fallDetection ? (isRtl ? 'سقوط' : 'FALL') : (isRtl ? 'آمن' : 'Safe')}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
