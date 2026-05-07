import React from 'react';
import { Pill, Clock, Bell, AlertTriangle, Syringe } from 'lucide-react';
import '../index.css';

export default function MedicationReminder({ reminderProps }) {
    const { activeReminder, isLate, takeMedication, snoozeReminder } = reminderProps;

    if (!activeReminder) return null;

    // Themed Colors setup based on requirements
    const colors = {
        background: '#DCEBFF',     // Light comfortable medical blue
        primary: '#2A7DE1',        // Medical blue
        attention: '#2ECC71',      // Green
        warning: '#8E44AD',        // Calm purple for late warning
        textDark: '#1A1A1A',       // Dark text
        white: '#FFFFFF'
    };

    const currentColor = isLate ? colors.warning : colors.primary;

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            direction: 'rtl',
        },
        card: {
            backgroundColor: colors.background,
            borderRadius: '24px',
            padding: '28px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            borderTop: `6px solid ${currentColor}`,
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: colors.textDark,
        },
        iconWrapper: {
            backgroundColor: colors.white,
            padding: '14px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentColor,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
        title: {
            fontSize: '20px',
            fontWeight: 'bold',
            fontFamily: '"Roboto", "Inter", sans-serif',
            margin: 0,
            color: currentColor,
        },
        detailsBox: {
            backgroundColor: colors.white,
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        },
        row: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: colors.textDark,
            fontFamily: '"Roboto", "Inter", sans-serif',
        },
        medNameText: {
            fontSize: '18px',
            fontWeight: '600',
        },
        doseText: {
            fontSize: '16px',
            fontWeight: '500',
        },
        timeText: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: isLate ? colors.warning : colors.attention,
        },
        buttonContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '8px',
        },
        btnTake: {
            backgroundColor: currentColor,
            color: colors.white,
            border: 'none',
            padding: '16px',
            borderRadius: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: `0 6px 16px ${isLate ? 'rgba(142, 68, 173, 0.25)' : 'rgba(42, 125, 225, 0.25)'}`,
            fontFamily: '"Roboto", "Inter", sans-serif',
        },
        btnSnooze: {
            backgroundColor: 'transparent',
            color: colors.textDark,
            border: `2px solid ${colors.textDark}`,
            padding: '14px',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontFamily: '"Roboto", "Inter", sans-serif',
            opacity: 0.8,
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.card} className="medication-reminder-card">

                <div style={styles.header}>
                    <div style={styles.iconWrapper}>
                        {isLate ? <AlertTriangle size={32} /> : <Bell size={32} />}
                    </div>
                    <div>
                        <h2 style={styles.title}>{isLate ? 'تنبيه موعد الدواء!' : 'وقت الدواء'}</h2>
                    </div>
                </div>

                <div style={styles.detailsBox}>
                    <div style={styles.row}>
                        <Pill size={22} color={currentColor} />
                        <span style={styles.medNameText}>{activeReminder.name}</span>
                    </div>
                    <div style={styles.row}>
                        <Syringe size={20} color="#777" />
                        <span style={styles.doseText}>الجرعة: {activeReminder.dose}</span>
                    </div>
                    <div style={styles.row}>
                        <Clock size={20} color={isLate ? colors.warning : colors.attention} />
                        <span style={styles.timeText}>
                            الوقت: {activeReminder.time}
                        </span>
                    </div>
                </div>

                <div style={styles.buttonContainer}>
                    <button style={styles.btnTake} onClick={takeMedication}>
                        ✓ تم تناول الدواء
                    </button>

                    <button style={styles.btnSnooze} onClick={snoozeReminder}>
                        <Clock size={18} /> تذكير لاحق بعد 10 دقائق
                    </button>
                </div>

            </div>
        </div>
    );
}
