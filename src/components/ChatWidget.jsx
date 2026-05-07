import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Bot, HelpCircle } from 'lucide-react';

export default function ChatWidget({ lang }) {
    const isRtl = lang === 'ar';
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const t = {
        ar: {
            title: 'خدمة العملاء',
            subtitle: 'عادة ما نرد خلال بضع دقائق',
            placeholder: 'اكتب رسالتك هنا...',
            send: 'إرسال',
            welcome: 'مرحباً! كيف يمكننا مساعدتك اليوم في تطبيق Life Care؟ 😊',
            botReply: 'شكراً لتواصلك معنا. أحد ممثلي خدمة العملاء سيقوم بالرد عليك قريباً!'
        },
        en: {
            title: 'Customer Support',
            subtitle: 'We typically reply in a few minutes',
            placeholder: 'Type your message...',
            send: 'Send',
            welcome: 'Hello! How can we help you today at Life Care? 😊',
            botReply: 'Thanks for reaching out! A support representative will reply to you shortly!'
        }
    }[lang || 'ar'];

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ text: t.welcome, sender: 'bot', time: new Date() }]);
        }
    }, [lang]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const newUserMsg = { text: input, sender: 'user', time: new Date() };
        setMessages(prev => [...prev, newUserMsg]);
        setInput('');

        // Simulate bot reply
        setTimeout(() => {
            setMessages(prev => [...prev, { text: t.botReply, sender: 'bot', time: new Date() }]);
        }, 1500);
    };

    return (
        <div className="glass-card flex flex-col" style={{ width: '100%', height: '450px', display: 'flex', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            {/* Header */}
            <div style={{ background: 'var(--primary)', padding: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Bot size={24} color="white" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{t.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>{t.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-main)' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' 
                    }}>
                        <div style={{
                            maxWidth: '80%',
                            padding: '10px 14px',
                            borderRadius: '16px',
                            borderBottomRightRadius: msg.sender === 'user' ? (isRtl ? '16px' : '4px') : (isRtl ? '4px' : '16px'),
                            borderBottomLeftRadius: msg.sender === 'user' ? (isRtl ? '4px' : '16px') : (isRtl ? '16px' : '4px'),
                            background: msg.sender === 'user' ? 'var(--primary)' : 'var(--glass-bg)',
                            color: msg.sender === 'user' ? 'white' : 'var(--text-main)',
                            border: msg.sender === 'user' ? 'none' : '1px solid var(--glass-border)',
                            fontSize: '0.95rem',
                            lineHeight: '1.4'
                        }}>
                            {msg.text}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', margin: '0 4px' }}>
                            {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '12px', background: 'var(--glass-bg)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={t.placeholder}
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '20px',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--bg-main)',
                        color: 'var(--text-main)',
                        outline: 'none'
                    }}
                />
                <button 
                    onClick={handleSend}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: input.trim() ? 'var(--primary)' : 'var(--text-muted)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: input.trim() ? 'pointer' : 'default',
                        transition: '0.3s'
                    }}
                >
                    <Send size={18} style={{ transform: isRtl ? 'rotate(180deg)' : 'none', marginLeft: !isRtl ? '2px' : '0', marginRight: isRtl ? '2px' : '0' }} />
                </button>
            </div>
        </div>
    );
}
