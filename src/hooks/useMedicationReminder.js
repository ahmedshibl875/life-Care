import { useState, useEffect, useRef } from 'react';

export default function useMedicationReminder() {
    const [activeReminder, setActiveReminder] = useState(null);
    const [isLate, setIsLate] = useState(false);
    const audioCtxRef = useRef(null);
    const reminderTimeoutRef = useRef(null);
    const intervalRef = useRef(null);

    // Audio synthesis for the reminder
    const playSound = () => {
        try {
            const soundEnabled = true;
            if (!soundEnabled) return;

            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const playBeep = (startTime) => {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ctx.currentTime); // Calm tone
                osc.frequency.exponentialRampToValueAtTime(700, startTime + 0.5);

                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 1);

                osc.connect(gainNode);
                gainNode.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 1.5);
            };

            // Play sound twice (2-3 sec duration total)
            playBeep(ctx.currentTime);
            playBeep(ctx.currentTime + 1.2);
        } catch (e) {
            console.error('Audio play failed:', e);
        }
    };

    // Vibrate: 1 sec, pause 0.5 sec, vibrate 1 sec
    const triggerVibration = () => {
        if (navigator.vibrate) {
            navigator.vibrate([1000, 500, 1000]);
        }
    };

    const triggerAlert = () => {
        playSound();
        triggerVibration();
    };

    const scheduleReminder = (medication, isAlreadyLate = false) => {
        setActiveReminder(medication);
        setIsLate(isAlreadyLate);

        triggerAlert();

        // Loop every 10 min if ignored
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setIsLate(true);
            triggerAlert();
        }, 10 * 60 * 1000);
    };

    const takeMedication = () => {
        setActiveReminder(null);
        setIsLate(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (reminderTimeoutRef.current) clearTimeout(reminderTimeoutRef.current);
    };

    const snoozeReminder = () => {
        const medToSnooze = { ...activeReminder };
        setActiveReminder(null);
        setIsLate(false);

        if (intervalRef.current) clearInterval(intervalRef.current);
        if (reminderTimeoutRef.current) clearTimeout(reminderTimeoutRef.current);

        // Appear again after exactly 10 minutes, marked as late
        reminderTimeoutRef.current = setTimeout(() => {
            scheduleReminder(medToSnooze, true);
        }, 10 * 60 * 1000);
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (reminderTimeoutRef.current) clearTimeout(reminderTimeoutRef.current);
        };
    }, []);

    const triggerTestReminder = () => {
        scheduleReminder({
            id: Date.now(),
            name: 'Paracetamol',
            dose: '500mg',
            time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        });
    };

    return {
        activeReminder,
        isLate,
        takeMedication,
        snoozeReminder,
        triggerTestReminder
    };
}
