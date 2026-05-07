import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Home, Activity, Pill, UserPlus, HeartHandshake,
    FileText, Globe, LogOut, Users, Moon, Sun, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MainLayout({ lang, toggleLang, role, setRole, theme, toggleTheme }) {
    const isRtl = lang === 'ar';
    const navigate = useNavigate();
    const location = useLocation();

    // Role badge info
    const roleBadge = {
        patient: { label: isRtl ? 'مريض' : 'Patient', color: 'var(--primary)' },
        caregiver: { label: isRtl ? 'مرافق' : 'Caregiver', color: 'var(--secondary)' },
        doctor: { label: isRtl ? 'طبيب' : 'Doctor', color: 'var(--accent)' },
    };

    const getNavItems = () => {
        if (role === 'doctor') {
            return [
                { name: isRtl ? 'الرئيسية' : 'Home', path: '/dashboard', icon: <Home size={22} /> },
                { name: isRtl ? 'المرضى' : 'Patients', path: '/patients', icon: <Users size={22} /> },
            ];

        } else if (role === 'caregiver') {
            return [
                { name: isRtl ? 'الرئيسية' : 'Home', path: '/dashboard', icon: <Home size={22} /> },
                { name: isRtl ? 'التقارير' : 'Reports', path: '/reports', icon: <FileText size={22} /> },
            ];
        }
        return [
            { name: isRtl ? 'الرئيسية' : 'Home', path: '/dashboard', icon: <Home size={22} /> },
            { name: isRtl ? 'المراقبة' : 'Monitor', path: '/monitoring', icon: <Activity size={22} /> },
            { name: isRtl ? 'الأدوية' : 'Meds', path: '/medications', icon: <Pill size={22} /> },
            { name: isRtl ? 'التقارير' : 'Reports', path: '/reports', icon: <FileText size={22} /> },
            { name: isRtl ? 'العائلة' : 'Family', path: '/caregivers', icon: <HeartHandshake size={22} /> },
        ];
    };

    const navItems = getNavItems();
    const badge = roleBadge[role] || roleBadge.patient;

    const handleLogout = () => {
        setRole(null);
        navigate('/welcome');
    };

    return (
        <>
            {/* ── Header ── */}
            <header className="mobile-header" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <div className="flex items-center gap-sm">
                    <div style={{
                        background: 'linear-gradient(135deg,var(--primary-dark),var(--primary-light))',
                        padding: '8px 10px', borderRadius: 14, display: 'flex',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                    }}>
                        <Activity color="white" size={18} />
                    </div>
                    <div className="flex flex-col" style={{ gap: 1 }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem', lineHeight: 1 }}>
                            LifeCare
                        </span>
                        <span style={{
                            fontSize: '0.65rem', fontWeight: 600, color: 'white',
                            background: badge.color, padding: '2px 8px', borderRadius: 20, width: 'fit-content'
                        }}>
                            {badge.label}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-sm">
                    <button
                        onClick={() => navigate('/profile')}
                        style={{
                            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                            borderRadius: 12, width: 36, height: 36, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            color: 'var(--text-main)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                    >
                        <User size={17} />
                    </button>
                    <button
                        onClick={toggleTheme}
                        style={{
                            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                            borderRadius: 12, width: 36, height: 36, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            color: 'var(--text-main)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                    >
                        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                    </button>
                    <button
                        onClick={toggleLang}
                        style={{
                            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                            borderRadius: 12, width: 36, height: 36, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            color: 'var(--text-main)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                    >
                        <Globe size={17} />
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 12, width: 36, height: 36, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            color: 'var(--danger)'
                        }}
                    >
                        <LogOut size={17} />
                    </button>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="main-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* ── Bottom Navigation ── */}
            <nav className="bottom-nav">
                {navItems.map((item, idx) => (
                    <NavLink
                        key={idx}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>
        </>
    );
}
