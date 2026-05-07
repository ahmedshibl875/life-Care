import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VitalDetail() {
    const { type } = useParams();
    const navigate = useNavigate();
    const lang = document.documentElement.lang || 'en';
    const isRtl = lang === 'ar';

    const data = [
        { time: '12:00', hr: 72, bp: 120, bg: 95, temp: 36.6, spo2: 98 },
        { time: '16:00', hr: 78, bp: 125, bg: 110, temp: 37.1, spo2: 97 },
        { time: '20:00', hr: 68, bp: 118, bg: 90, temp: 36.9, spo2: 98 },
        { time: '00:00', hr: 62, bp: 115, bg: 85, temp: 36.5, spo2: 99 },
        { time: '04:00', hr: 60, bp: 112, bg: 80, temp: 36.4, spo2: 99 },
        { time: '08:00', hr: 70, bp: 122, bg: 100, temp: 36.7, spo2: 98 }
    ];

    const config = {
        hr: { color: 'var(--danger)', name: isRtl ? 'النبض' : 'Heart Rate', range: '60 - 100 bpm' },
        bp: { color: 'var(--secondary)', name: isRtl ? 'الضغط' : 'Blood Pressure', range: '90/60 - 120/80 mmHg' },
        bg: { color: 'var(--warning)', name: isRtl ? 'السكر' : 'Blood Glucose', range: '70 - 100 mg/dL' },
        temp: { color: 'var(--primary)', name: isRtl ? 'الحرارة' : 'Body Temp', range: '36.1 - 37.2 °C' },
        spo2: { color: '#339af0', name: isRtl ? 'الأكسجين في الدم' : 'Blood Oxygen (SpO2)', range: '95 - 100 %' }
    };

    const curr = config[type] || config.hr;

    return (
        <div className="flex flex-col gap-lg">
            <div className="flex gap-md items-center">
                <button className="glass-card flex items-center justify-center p-sm" onClick={() => navigate(-1)} style={{ padding: 12, border: 'none', cursor: 'pointer' }}>
                    {isRtl ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
                </button>
                <h1 style={{ margin: 0 }}>{curr.name} Analysis</h1>
            </div>

            <div className="glass-panel" style={{ padding: 24 }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
                    <h3>24 Hours Trend</h3>
                    <div className="flex items-center gap-sm" style={{ color: 'var(--text-muted)' }}>
                        <Info size={16} />
                        <span>Normal Range: {curr.range}</span>
                    </div>
                </div>

                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={curr.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={curr.color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', color: 'var(--text-main)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey={type}
                                stroke={curr.color}
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
