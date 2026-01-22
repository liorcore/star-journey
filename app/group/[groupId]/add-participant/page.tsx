'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, ChevronUp, ChevronDown, Palette, Smile, Sparkles, UserPlus, X } from 'lucide-react';
import { ParticipantIcon } from '@/app/lib/participantIcons';
import { PARTICIPANT_EMOJIS } from '@/app/lib/participantEmoji';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788', '#FF8FA3', '#C9ADA7'];

interface Participant {
    id: string;
    name: string;
    icon: string;
    age: number;
    color: string;
    gender: 'male' | 'female';
    totalStars: number;
    eventCount: number;
}

interface Group {
    id: string;
    name: string;
    code: string;
    participants: Participant[];
    events: any[];
}

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function AddParticipantPage() {
    const params = useParams();
    const router = useRouter();
    const [groupId, setGroupId] = useState<string>('');

    useEffect(() => {
        const getParams = async () => {
            try {
                const resolvedParams = await params;
                setGroupId(resolvedParams.groupId as string);
            } catch (error) {
                console.error('Error resolving params:', error);
                router.push('/');
            }
        };
        getParams();
    }, [params, router]);
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const eventId = searchParams.get('eventId');

    const [name, setName] = useState('');
    const [icon, setIcon] = useState(PARTICIPANT_EMOJIS[0]);
    const [age, setAge] = useState(5);
    const [color, setColor] = useState(COLORS[0]);
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const ageLabel = age.toFixed(1);

    const closePickers = () => {
        setShowIconPicker(false);
        setShowColorPicker(false);
    };

    const handleSave = () => {
        if (!name.trim()) {
            alert('נא להזין שם');
            return;
        }

        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const groupIndex = groups.findIndex((g: Group) => g.id === groupId);

        if (groupIndex === -1) {
            router.push('/');
            return;
        }

        const newParticipant: Participant = {
            id: Date.now().toString(),
            name: name.trim(),
            icon,
            age,
            color,
            gender,
            totalStars: 0,
            eventCount: 0,
            completedEvents: []
        };

        groups[groupIndex].participants.push(newParticipant);

        // If we came from an event, add the participant to that event too
        if (eventId) {
            const eventIndex = groups[groupIndex].events.findIndex((e: any) => e.id === eventId);
            if (eventIndex !== -1) {
                groups[groupIndex].events[eventIndex].participants.push({
                    participantId: newParticipant.id,
                    stars: 0
                });
            }
        }

        localStorage.setItem('groups', JSON.stringify(groups));

        // Navigate back to event if we came from one, otherwise to group
        if (eventId) {
            router.push(`/group/${groupId}/event/${eventId}`);
        } else {
            router.push(`/group/${groupId}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] pb-10" dir="rtl">
            {/* Top Bar */}
            <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 px-3">
                <div className="max-w-md mx-auto h-full flex items-center justify-between">
                    <button
                        onClick={() => router.push(`/group/${groupId}`)}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-95 transition-transform"
                        aria-label="חזרה"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#4D96FF]" />
                        <span className="text-sm font-black text-slate-900">הוסף משתתף</span>
                    </div>

                    <div className="w-10" />
                </div>
            </nav>

            <main className="max-w-md mx-auto px-3 pt-20">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border shadow-sm p-4 relative overflow-hidden"
                    style={{
                        background: color,
                        borderColor: color,
                        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
                    }}
                >
                    <div className="pattern-overlay" />
                    <div className="relative">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowColorPicker(false);
                                        setShowIconPicker(true);
                                    }}
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white/35 backdrop-blur-md cursor-pointer active:scale-95 transition-transform"
                                    style={{ border: `1px solid ${hexToRgba(color, 0.35)}` }}
                                >
                                    <ParticipantIcon icon={icon} className="w-14 h-14 text-slate-900" emojiSize="text-4xl" />
                                </button>
                                <div className="min-w-0 flex-1">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="הזן שם"
                                        dir="rtl"
                                        className="w-full text-base font-black text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-400"
                                    />
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setAge(Math.max(1, age - 0.5))}
                                                className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-white/20 active:scale-95 transition-transform"
                                                aria-label="הורד גיל"
                                            >
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-bold text-slate-800/75 min-w-[40px] text-center">
                                                גיל {ageLabel}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setAge(Math.min(100, age + 0.5))}
                                                className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-white/20 active:scale-95 transition-transform"
                                                aria-label="העלה גיל"
                                            >
                                                <ChevronUp className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setGender('male')}
                                                className={`h-7 w-7 rounded-lg flex items-center justify-center text-lg active:scale-95 transition-transform ${
                                                    gender === 'male' ? 'bg-blue-500' : 'bg-white/20'
                                                }`}
                                            >
                                                👦
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setGender('female')}
                                                className={`h-7 w-7 rounded-lg flex items-center justify-center text-lg active:scale-95 transition-transform ${
                                                    gender === 'female' ? 'bg-pink-500' : 'bg-white/20'
                                                }`}
                                            >
                                                👧
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowIconPicker(false);
                                    setShowColorPicker(true);
                                }}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/40 backdrop-blur-sm border-2 border-white/50 shadow-sm active:scale-95 transition-transform shrink-0"
                                style={{ backgroundColor: `${color}80` }}
                                aria-label="בחר צבע"
                            >
                                <Palette className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </motion.section>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button
                        onClick={handleSave}
                        className="btn-star h-12 rounded-2xl flex items-center justify-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        שמור
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push(`/group/${groupId}`)}
                        className="h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform"
                    >
                        ביטול
                    </button>
                </div>
            </main>

            {/* Icon Picker Sheet */}
            <AnimatePresence>
                {showIconPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                        onClick={closePickers}
                    >
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 30, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Smile className="w-4 h-4 text-[#4D96FF]" />
                                    <span className="text-sm font-black text-slate-900">בחר אייקון</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={closePickers}
                                    className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 inline-flex items-center justify-center active:scale-95 transition-transform"
                                    aria-label="סגור"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="max-h-[55vh] overflow-y-auto">
                                <div className="grid grid-cols-6 gap-2">
                                    {PARTICIPANT_EMOJIS.map((ic) => (
                                        <button
                                            key={ic}
                                            type="button"
                                            onClick={() => {
                                                setIcon(ic);
                                                setShowIconPicker(false);
                                            }}
                                            className="h-12 rounded-2xl border border-slate-200 bg-white active:scale-95 transition-transform inline-flex items-center justify-center"
                                            aria-label="בחר אייקון"
                                        >
                                            <ParticipantIcon icon={ic} className="w-8 h-8" emojiSize="text-2xl" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Color Picker Sheet */}
            <AnimatePresence>
                {showColorPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                        onClick={closePickers}
                    >
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 30, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-[#4D96FF]" />
                                    <span className="text-sm font-black text-slate-900">בחר צבע</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={closePickers}
                                    className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 inline-flex items-center justify-center active:scale-95 transition-transform"
                                    aria-label="סגור"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-6 gap-3">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                            setColor(c);
                                            setShowColorPicker(false);
                                        }}
                                        className="h-12 rounded-2xl border-2 border-white shadow-sm active:scale-95 transition-transform"
                                        style={{
                                            backgroundColor: c,
                                            outline: c === color ? '3px solid #4D96FF' : 'none',
                                        }}
                                        aria-label={`בחר צבע ${c}`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
