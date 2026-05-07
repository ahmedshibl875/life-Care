import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FileText, Download, Calendar, Share2, ClipboardList, Activity, ArrowLeft, ArrowRight, UploadCloud, FilePlus, File, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DB_NAME = 'LifeCareDB';
const STORE_NAME = 'medical_reports';
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveReport(report) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(report);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

async function getReports() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export default function Reports() {
    const location = useLocation();
    const navigate = useNavigate();
    const patient = location.state?.patient;
    const lang = document.documentElement.lang || 'ar';
    const isRtl = lang === 'ar';

    const [period, setPeriod] = useState('week'); // Default to week
    const [customDays, setCustomDays] = useState(7);
    const [history, setHistory] = useState([]);

    // State for uploaded patient records
    const [uploadedFiles, setUploadedFiles] = useState([
        { id: 'mock-1', name: isRtl ? 'تحليل دم شامل.pdf' : 'Complete_Blood_Count.pdf', date: isRtl ? '١٥/١٠/٢٠٢٣' : '10/15/2023', data: null },
        { id: 'mock-2', name: isRtl ? 'أشعة سينية للصدر.png' : 'Chest_XRay.png', date: isRtl ? '٠٢/١١/٢٠٢٣' : '11/02/2023', data: null }
    ]);

    // Load actual reports from IndexedDB
    useEffect(() => {
        const loadFiles = async () => {
            try {
                const storedFiles = await getReports();
                if (storedFiles && storedFiles.length > 0) {
                    setUploadedFiles(prev => {
                        const newIds = new Set(storedFiles.map(f => f.id));
                        const filteredMocks = prev.filter(p => !newIds.has(p.id) && p.id.toString().startsWith('mock'));
                        return [...filteredMocks, ...storedFiles];
                    });
                }
            } catch (err) {
                console.error('Failed to load reports from DB', err);
            }
        };
        loadFiles();
    }, []);

    // Load actual history from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('lifeCareHistory');
        if (saved) {
            try { setHistory(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    // Prepare chart data from history
    const getChartData = () => {
        if (history.length === 0) {
            // Mock fallback if empty
            return [
                { name: isRtl ? 'لا بيانات' : 'No Data', hr: 0, spo2: 0, temp: 0 }
            ];
        }

        const grouped = {};
        history.forEach(entry => {
            const date = new Date(entry.timestamp);
            const dayKey = isRtl ? `${date.getDate()}/${date.getMonth() + 1}` : `${date.getMonth() + 1}/${date.getDate()}`;
            if (!grouped[dayKey]) grouped[dayKey] = { name: dayKey, hr: [], temp: [], spo2: [], bpSys: [], bpDia: [] };

            if (entry.hr && entry.hr !== '--') grouped[dayKey].hr.push(Number(entry.hr));
            if (entry.temp && entry.temp !== '--') grouped[dayKey].temp.push(Number(entry.temp));
            if (entry.spo2 && entry.spo2 !== '--') grouped[dayKey].spo2.push(Number(entry.spo2));
            if (entry.bp && entry.bp !== '--' && typeof entry.bp === 'string') {
                const parts = entry.bp.split('/');
                if (parts.length === 2) {
                    grouped[dayKey].bpSys.push(Number(parts[0]));
                    grouped[dayKey].bpDia.push(Number(parts[1]));
                }
            }
        });

        return Object.values(grouped).map(g => ({
            name: g.name,
            hr: g.hr.length ? Math.round(g.hr.reduce((a, b) => a + b, 0) / g.hr.length) : null,
            temp: g.temp.length ? Number((g.temp.reduce((a, b) => a + b, 0) / g.temp.length).toFixed(1)) : null,
            spo2: g.spo2.length ? Math.round(g.spo2.reduce((a, b) => a + b, 0) / g.spo2.length) : null,
            bpSys: g.bpSys.length ? Math.round(g.bpSys.reduce((a, b) => a + b, 0) / g.bpSys.length) : null,
            bpDia: g.bpDia.length ? Math.round(g.bpDia.reduce((a, b) => a + b, 0) / g.bpDia.length) : null,
        }));
    };

    const data = getChartData();

    // Calculate Averages for the UI cards
    const getAverages = () => {
        if (history.length === 0) return { hr: '-- ', temp: '-- ', spo2: '-- ', bp: '120/80 ', bg: '95 ' };

        let hrSum = 0, hrCnt = 0, tempSum = 0, tempCnt = 0, spo2Sum = 0, spo2Cnt = 0;
        history.forEach(item => {
            if (item.hr && item.hr !== '--') { hrSum += Number(item.hr); hrCnt++; }
            if (item.temp && item.temp !== '--') { tempSum += Number(item.temp); tempCnt++; }
            if (item.spo2 && item.spo2 !== '--') { spo2Sum += Number(item.spo2); spo2Cnt++; }
        });

        return {
            hr: hrCnt ? Math.round(hrSum / hrCnt) + ' ' : '-- ',
            temp: tempCnt ? (tempSum / tempCnt).toFixed(1) + ' ' : '-- ',
            spo2: spo2Cnt ? Math.round(spo2Sum / spo2Cnt) + ' ' : '-- ',
            bp: history.length > 0 && history[history.length - 1].bp && history[history.length - 1].bp !== '--' ? history[history.length - 1].bp + ' ' : '120/80 ',
            bg: '95 '
        };
    };

    const avg = getAverages();

    const renderCustomDot = (props, metric) => {
        const { cx, cy, payload, value, index } = props;
        if (value == null) return null;
        
        // Colors: Blue for normal, Red for high, Orange for low
        let color = '#339af0'; 
        
        if (metric === 'hr') {
            if (value > 100) color = 'var(--danger)';
            else if (value < 60) color = 'var(--warning)';
        } else if (metric === 'temp') {
            if (value > 37.5) color = 'var(--danger)';
            else if (value < 36.5) color = 'var(--warning)';
        } else if (metric === 'spo2') {
            if (value < 95) color = 'var(--warning)';
        } else if (metric === 'bpSys') {
            if (value > 120) color = 'var(--danger)';
            else if (value < 90) color = 'var(--warning)';
        } else if (metric === 'bpDia') {
            if (value > 80) color = 'var(--danger)';
            else if (value < 60) color = 'var(--warning)';
        }
        
        return (
            <circle key={`dot-${metric}-${index}`} cx={cx} cy={cy} r={5} fill={color} stroke="var(--bg-main)" strokeWidth={2} />
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        const reportText = isRtl
            ? `تقرير Life Care الطبي:\nمتوسط النبض: 73bpm\nمتوسط الحرارة: 36.8°C\nنسبة الأكسجين: 98%\nالسكر التراكمي: 95 mg/dL\nالحالة العامة: مستقرة.`
            : `Life Care Report:\nAvg HR: 73bpm\nAvg Temp: 36.8°C\nAvg SpO2: 98%\nAvg Glucose: 95 mg/dL\nStatus: Stable.`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: isRtl ? 'التقرير الطبي - Life Care' : 'Life Care - Medical Report',
                    text: reportText,
                });
            } catch (err) {
                console.error('Share failed', err);
            }
        } else {
            alert(isRtl ? 'خاصية المشاركة غير مدعومة في متصفحك الحالي.' : 'Web Share API not supported in this browser.');
        }
    };

    const getStatusIndicator = (key, val) => {
        if (!val || val === '--' || String(val).includes('--')) return { text: '--', color: 'var(--text-muted)' };
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
            {/* Header */}
            {patient && (
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: -10, alignSelf: 'flex-start' }}
                >
                    {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                    {isRtl ? 'رجوع للمريض' : 'Back to Patient'}
                </button>
            )}
            <div className="flex justify-between items-center" style={{ padding: '10px 0', marginBottom: 10 }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                        {patient ? (isRtl ? `تقرير: ${patient.name}` : `Report: ${patient.name}`) : (isRtl ? 'التقارير الطبية' : 'Medical Reports')}
                    </h2>
                    <p className="text-sm">{isRtl ? 'احصائيات وملخص الحالة' : 'Statistics and health summary'}</p>
                </div>

                <div className="flex gap-sm">
                    <button className="btn-secondary flex items-center gap-sm" style={{ padding: '8px 12px', fontSize: '0.85rem' }} onClick={handleShare}>
                        <Share2 size={16} /> <span className="hide-on-print">{isRtl ? 'مشاركة' : 'Share'}</span>
                    </button>
                    <button className="btn-primary flex items-center gap-sm" style={{ padding: '8px 12px', fontSize: '0.85rem' }} onClick={handlePrint}>
                        <Download size={16} /> <span className="hide-on-print">{isRtl ? 'طباعة PDF' : 'Print PDF'}</span>
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="glass-card flex flex-col gap-sm hide-on-print" style={{ padding: 16 }}>
                <h3 style={{ fontSize: '0.9rem', margin: 0 }}>{isRtl ? 'تحديد فترة التقرير:' : 'Select Report Period:'}</h3>
                <div className="flex gap-sm">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 12 }}
                    >
                        <option value="month">{isRtl ? 'هذا الشهر' : 'This Month'}</option>
                        <option value="last_month">{isRtl ? 'الشهر الماضي' : 'Last Month'}</option>
                        <option value="week">{isRtl ? 'هذا الأسبوع' : 'This Week'}</option>
                        <option value="custom">{isRtl ? 'أيام مخصصة' : 'Custom Days'}</option>
                    </select>

                    <AnimatePresence>
                        {period === 'custom' && (
                            <motion.input
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 100 }}
                                exit={{ opacity: 0, width: 0 }}
                                type="number"
                                min="1" max="90"
                                value={customDays}
                                onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                                style={{ padding: '8px', borderRadius: 12, border: '1px solid var(--primary)' }}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Summary */}
            <div className="glass-panel" style={{ padding: 20, borderLeft: '4px solid var(--success)' }}>
                <div className="flex items-center gap-sm" style={{ marginBottom: 12 }}>
                    <ClipboardList color="var(--success)" size={24} />
                    <h3 style={{ margin: 0 }}>{isRtl ? 'ملخص الحالة الصحية' : 'Health Summary'}</h3>
                </div>
                <p style={{ lineHeight: 1.6 }}>
                    {isRtl ? (
                        <>
                            بناءً على قراءاتك خلال <b>{period === 'last_month' ? 'الشهر الماضي' : period === 'month' ? 'هذا الشهر' : period === 'week' ? 'هذا الأسبوع' : `الـ ${customDays} يوم الماضية`}</b>:
                            {period === 'last_month'
                                ? ' لقد كان الشهر الماضي مستقراً بشكل عام مع تحسن ملحوظ في معدل نبضات القلب، وبقاء درجة الحرارة طبيعية (متوسط 36.8°C)، كما تم الحفاظ على أكسجين الدم ضمن المعدل الآمن.'
                                : ' لقد حافظت على معدل أكسجين ممتاز (98%) وحرارة طبيعية (36.8°C). يرجى الانتباه لوجود ارتفاع طفيف في السكر (يوم الثلاثاء 105 mg/dL)، يُنصح بتنظيم الوجبات وفق جدولك الطبي.'}
                        </>
                    ) : (
                        <>
                            Based on your readings over the <b>{period === 'last_month' ? 'last month' : period === 'month' ? 'this month' : period === 'week' ? 'this week' : `last ${customDays} days`}</b>:
                            {period === 'last_month'
                                ? ' Last month was generally stable with a noticeable improvement in heart rate. Temperature remained normal (avg 36.8°C) and Blood oxygen stayed well within safe ranges.'
                                : ' You maintained excellent Oxygen levels (98%) and normal body temperature (36.8°C). Note a slight glucose spike (Tue 105 mg/dL), consider regulating meals according to your schedule.'}
                        </>
                    )}
                </p>
            </div>

            {/* Averages */}
            <div className="grid grid-cols-2">
                {[
                    { key: 'hr', title: isRtl ? 'النبض (متوسط)' : 'Heart Rate', val: avg.hr, unit: 'bpm', color: 'var(--danger)' },
                    { key: 'bp', title: isRtl ? 'الضغط (متوسط)' : 'Blood Pressure', val: avg.bp, unit: 'mmHg', color: 'var(--secondary)' },
                    { key: 'temp', title: isRtl ? 'الحرارة (متوسط)' : 'Temperature', val: avg.temp, unit: '°C', color: 'var(--success)' },
                    { key: 'bg', title: isRtl ? 'السكر (متوسط)' : 'Glucose Level', val: avg.bg, unit: 'mg/dL', color: 'var(--warning)' },
                    { key: 'spo2', title: isRtl ? 'الأكسجين (SpO2)' : 'Oxygen (SpO2)', val: avg.spo2, unit: '%', color: '#339af0' }
                ].map((item) => {
                    const stat = getStatusIndicator(item.key, item.val);
                    return (
                        <div key={item.title} className="glass-card flex flex-col items-center justify-center p-md" style={{ padding: 16, gap: 8 }}>
                            <Activity size={24} color={item.color} />
                            <h3 style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>{item.title}</h3>
                            <span className="font-bold text-lg" style={{ color: item.color }}>
                                {item.val}{item.unit}
                            </span>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: stat.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: stat.color }} />
                                {stat.text}
                            </div>
                        </div>
                    );
                })}
            </div>


            {/* Chart */}
            <div className="glass-panel mt-4" style={{ padding: 24, paddingBottom: 10 }}>
                <div className="flex justify-between items-center mb-4" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>{isRtl ? 'تحليل المؤشرات القياسي' : 'Trend Analysis'}</h3>
                    <div className="glass-card flex items-center gap-sm px-4 py-2 hide-on-print" style={{ padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem' }}>
                        <Calendar size={14} /> {isRtl ? 'آخر 7 أيام' : 'Last 7 Days'}
                    </div>
                </div>

                <div className="flex flex-col gap-lg">
                    {/* Blood Pressure Chart */}
                    <div style={{ paddingBottom: 20 }}>
                        <h4 style={{ fontSize: '0.95rem', marginBottom: 16 }}>{isRtl ? 'ضغط الدم (BP)' : 'Blood Pressure (BP)'} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isRtl ? '(الطبيعي: 120/80)' : '(Normal: 120/80)'}</span></h4>
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} />
                                    <Tooltip cursor={{ fill: 'var(--glass-bg)' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', color: 'var(--text-main)', background: 'var(--glass-bg)' }} />
                                    <Line type="monotone" dataKey="bpSys" name={isRtl ? 'الانقباضي' : 'Systolic'} stroke="var(--text-muted)" strokeWidth={2} dot={(props) => renderCustomDot(props, 'bpSys')} activeDot={{ r: 7 }} />
                                    <Line type="monotone" dataKey="bpDia" name={isRtl ? 'الانبساطي' : 'Diastolic'} stroke="var(--primary)" strokeWidth={2} dot={(props) => renderCustomDot(props, 'bpDia')} activeDot={{ r: 7 }} strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Heart Rate Chart */}
                    <div style={{ paddingBottom: 20 }}>
                        <h4 style={{ fontSize: '0.95rem', marginBottom: 16 }}>{isRtl ? 'معدل النبض (HR)' : 'Heart Rate (HR)'} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isRtl ? '(الطبيعي: 60 - 100)' : '(Normal: 60 - 100)'}</span></h4>
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} />
                                    <Tooltip cursor={{ fill: 'var(--glass-bg)' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', color: 'var(--text-main)', background: 'var(--glass-bg)' }} />
                                    <Line type="monotone" dataKey="hr" name={isRtl ? 'النبض' : 'Heart Rate'} stroke="var(--text-muted)" strokeWidth={2} dot={(props) => renderCustomDot(props, 'hr')} activeDot={{ r: 7 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Temperature Chart */}
                    <div style={{ paddingBottom: 20 }}>
                        <h4 style={{ fontSize: '0.95rem', marginBottom: 16 }}>{isRtl ? 'درجة الحرارة (Temp)' : 'Temperature (Temp)'} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isRtl ? '(الطبيعي: 36.5 - 37.5)' : '(Normal: 36.5 - 37.5)'}</span></h4>
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} />
                                    <Tooltip cursor={{ fill: 'var(--glass-bg)' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', color: 'var(--text-main)', background: 'var(--glass-bg)' }} />
                                    <Line type="monotone" dataKey="temp" name={isRtl ? 'الحرارة' : 'Temperature'} stroke="var(--text-muted)" strokeWidth={2} dot={(props) => renderCustomDot(props, 'temp')} activeDot={{ r: 7 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Oxygen Chart */}
                    <div style={{ paddingBottom: 10 }}>
                        <h4 style={{ fontSize: '0.95rem', marginBottom: 16 }}>{isRtl ? 'نسبة الأكسجين (SpO2)' : 'Oxygen (SpO2)'} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isRtl ? '(الطبيعي: > 95)' : '(Normal: > 95)'}</span></h4>
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} domain={['dataMin - 2', 100]} />
                                    <Tooltip cursor={{ fill: 'var(--glass-bg)' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', color: 'var(--text-main)', background: 'var(--glass-bg)' }} />
                                    <Line type="monotone" dataKey="spo2" name={isRtl ? 'الأكسجين' : 'Oxygen'} stroke="var(--text-muted)" strokeWidth={2} dot={(props) => renderCustomDot(props, 'spo2')} activeDot={{ r: 7 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient Records Upload Section */}
            <div className="glass-panel" style={{ padding: 24, paddingBottom: 24, marginTop: 8 }}>
                <div className="flex justify-between items-center mb-4" style={{ marginBottom: 16 }}>
                    <div className="flex items-center gap-sm">
                        <FilePlus color="var(--primary)" size={24} />
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{isRtl ? 'سجل المريض (أشعة وتحاليل)' : 'Patient Record (Scans & Labs)'}</h3>
                    </div>
                </div>

                <div className="flex flex-col gap-md">
                    {uploadedFiles.length > 0 ? (
                        uploadedFiles.map((file, idx) => (
                            <div key={file.id || idx} className="glass-card flex justify-between items-center" style={{ padding: '12px 16px' }}>
                                <div className="flex items-center gap-sm">
                                    <File color="var(--secondary)" size={20} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{file.name}</span>
                                </div>
                                <div className="flex items-center gap-sm">
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{file.date}</span>
                                    {file.data ? (
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(file.data);
                                                    const blob = await res.blob();
                                                    const blobUrl = URL.createObjectURL(blob);
                                                    window.open(blobUrl, '_blank');
                                                } catch (e) {
                                                    console.error("Failed to open file", e);
                                                    alert(isRtl ? "عذراً، واجهنا مشكلة في فتح هذا الملف." : "Sorry, we couldn't open this file.");
                                                }
                                            }}
                                            className="btn-secondary flex items-center gap-xs" 
                                            style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: 8, border: 'none', background: 'rgba(51, 154, 240, 0.1)', color: 'var(--primary)', cursor: 'pointer' }}
                                        >
                                            <Eye size={14} /> {isRtl ? 'عرض' : 'View'}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => alert(isRtl ? 'هذا الملف للقراءة فقط (نموذج تجريبي).' : 'This is a mock read-only file.')}
                                            className="btn-secondary flex items-center gap-xs" 
                                            style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: 8, border: 'none', background: 'var(--glass-bg)', color: 'var(--text-muted)', cursor: 'pointer' }}
                                        >
                                            <Eye size={14} /> {isRtl ? 'عرض' : 'View'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', margin: '10px 0' }}>
                            {isRtl ? 'لا توجد ملفات مرفوعة حالياً.' : 'No uploaded files currently.'}
                        </p>
                    )}
                </div>

                <div style={{ marginTop: 20 }}>
                    <input
                        type="file"
                        id="upload-record"
                        style={{ display: 'none' }}
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                    const base64data = reader.result;
                                    const newFile = {
                                        id: Date.now().toString(),
                                        name: file.name,
                                        date: new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US'),
                                        data: base64data,
                                        type: file.type
                                    };
                                    
                                    try {
                                        await saveReport(newFile);
                                    } catch(err) {
                                        console.error("Failed to save report to DB", err);
                                    }
                                    
                                    setUploadedFiles(prev => [...prev, newFile]);
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                    />
                    <label htmlFor="upload-record" className="btn-primary flex items-center justify-center gap-sm" style={{ padding: '12px', borderRadius: 12, cursor: 'pointer', width: '100%' }}>
                        <UploadCloud size={20} />
                        {isRtl ? 'رفع تقرير جديد (أشعة / تحليل)' : 'Upload New Report (Scan / Lab)'}
                    </label>
                </div>
            </div>
        </div>
    );
}
