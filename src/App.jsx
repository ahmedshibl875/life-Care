import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import VitalDetail from './pages/VitalDetail';
import Medications from './pages/Medications';
import Doctors from './pages/Doctors';
import Caregivers from './pages/Caregivers';
import Reports from './pages/Reports';
import PatientsList from './pages/PatientsList';
import MainLayout from './layouts/MainLayout';
import Profile from './pages/Profile';
import Monitoring from './pages/Monitoring';
import MedicationReminder from './components/MedicationReminder';
import useMedicationReminder from './hooks/useMedicationReminder';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChatWidget from './components/ChatWidget';
import { BleProvider } from './context/BleContext';

function App() {
  const [lang, setLang] = useState('ar');
  const [role, setRoleState] = useState(localStorage.getItem('role') || 'patient'); // default to patient instead of null
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  const setRole = (newRole) => {
    if (newRole) {
        localStorage.setItem('role', newRole);
        setRoleState(newRole);
    }
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-theme', theme);
  }, [lang, theme]);

  const toggleLang = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const reminderProps = useMedicationReminder();

  return (
    <Router>
      <button
        onClick={reminderProps.triggerTestReminder}
        style={{
          position: 'fixed', bottom: '20px', left: '20px', zIndex: 99999,
          padding: '10px 15px', borderRadius: '50px', backgroundColor: '#2A7DE1',
          color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        }}
      >
        تجربة التذكير بالدواء
      </button>

      <MedicationReminder reminderProps={reminderProps} />

      <BleProvider lang={lang}>
      <div className="app-wrapper" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Routes>
          <Route path="/" element={<Navigate to="/welcome" />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={<Welcome toggleLang={toggleLang} lang={lang} setRole={setRole} theme={theme} toggleTheme={toggleTheme} />} />

          <Route path="/verify-email/:token" element={<VerifyEmail lang={lang} />} />
          <Route path="/forgot-password" element={<ForgotPassword lang={lang} toggleLang={toggleLang} theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/reset-password/:token" element={<ResetPassword lang={lang} toggleLang={toggleLang} theme={theme} toggleTheme={toggleTheme} />} />

          <Route element={<MainLayout toggleLang={toggleLang} lang={lang} role={role} setRole={setRole} theme={theme} toggleTheme={toggleTheme} />}>
            <Route path="/dashboard" element={<Dashboard role={role} lang={lang} />} />
            <Route path="/monitoring" element={<Monitoring lang={lang} />} />
            <Route path="/vitals/:type" element={<VitalDetail />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/caregivers" element={<Caregivers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/patients" element={<PatientsList />} />
            <Route path="/profile" element={<Profile role={role} lang={lang} />} />
          </Route>
        </Routes>
      </div>
     </BleProvider>
    </Router>
  );
}

export default App;
