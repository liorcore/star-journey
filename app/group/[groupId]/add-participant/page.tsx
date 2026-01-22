'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, ChevronUp, ChevronDown, Copy, Palette, Smile, Sparkles, UserPlus, X } from 'lucide-react';
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
                <motion.header
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                >
                    <h1 className="text-2xl font-black text-slate-900">הוסף משתתף חדש</h1>
                    <p className="text-sm text-slate-500 mt-2">
                        בוחרים שם, אייקון וצבע — ויוצאים למסע.
                    </p>
                </motion.header>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="space-y-4"
                >
                    {/* Name */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <label className="control-label text-[11px]">שם</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="הזן שם"
                            dir="rtl"
                            className="mt-2 w-full h-12 rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4D96FF]"
                        />
                    </section>

                    {/* Icon */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Smile className="w-4 h-4 text-[#4D96FF]" />
                                <span className="control-label text-[11px]">אייקון</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowColorPicker(false);
                                    setShowIconPicker(true);
                                }}
                                className="h-10 px-4 rounded-2xl bg-slate-100 text-slate-700 font-black text-xs active:scale-95 transition-transform"
                            >
                                בחר
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setShowColorPicker(false);
                                setShowIconPicker(true);
                            }}
                            className="mt-3 w-full h-14 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center text-3xl active:scale-95 transition-transform"
                            aria-label="בחירת אייקון"
                        >
                            <ParticipantIcon icon={icon} className="w-9 h-9" emojiSize="text-3xl" />
                        </button>
                    </section>

                    {/* Age */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <span className="control-label text-[11px]">גיל</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAge(Math.max(1, age - 0.5))}
                                    className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 inline-flex items-center justify-center active:scale-95 transition-transform"
                                    aria-label="הורד גיל"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <span className="text-2xl font-black text-slate-900 min-w-[60px] text-center">{ageLabel}</span>
                                <button
                                    type="button"
                                    onClick={() => setAge(Math.min(100, age + 0.5))}
                                    className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 inline-flex items-center justify-center active:scale-95 transition-transform"
                                    aria-label="העלה גיל"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between text-[11px] mt-4 text-slate-400 font-bold">
                            <span>1</span>
                            <span>100</span>
                        </div>
                    </section>

                    {/* Color */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4 text-[#4D96FF]" />
                                <span className="control-label text-[11px]">צבע</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowIconPicker(false);
                                    setShowColorPicker(true);
                                }}
                                className="h-10 px-4 rounded-2xl bg-slate-100 text-slate-700 font-black text-xs active:scale-95 transition-transform"
                            >
                                בחר
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setShowIconPicker(false);
                                setShowColorPicker(true);
                            }}
                            className="mt-3 w-full h-14 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center gap-3 active:scale-95 transition-transform"
                            aria-label="בחירת צבע"
                        >
                            <span className="w-10 h-10 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                            <span className="text-xs font-black text-slate-600">לחץ לשינוי</span>
                        </button>
                    </section>

                    {/* Gender */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <span className="control-label text-[11px]">מין</span>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setGender('male')}
                                className={`h-14 rounded-2xl border-2 font-black text-2xl active:scale-95 transition-transform ${
                                    gender === 'male'
                                        ? 'border-[#4D96FF] bg-blue-50'
                                        : 'border-slate-200 bg-white'
                                }`}
                                aria-pressed={gender === 'male'}
                            >
                                👦
                            </button>
                            <button
                                type="button"
                                onClick={() => setGender('female')}
                                className={`h-14 rounded-2xl border-2 font-black text-2xl active:scale-95 transition-transform ${
                                    gender === 'female'
                                        ? 'border-[#4D96FF] bg-blue-50'
                                        : 'border-slate-200 bg-white'
                                }`}
                                aria-pressed={gender === 'female'}
                            >
                                👧
                            </button>
                        </div>
                    </section>

                    {/* Preview */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 relative overflow-hidden">
                        <div className="pattern-overlay" />
                        <div className="relative">
                            <span className="control-label text-[11px]">תצוגה מקדימה</span>
                            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/70 border border-slate-200 p-3" style={{ borderRight: `6px solid ${color}` }}>
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                                    style={{ backgroundColor: `${color}22`, border: `1px solid ${color}` }}
                                >
                                    <ParticipantIcon icon={icon} className="w-8 h-8" emojiSize="text-3xl" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-black text-slate-900 truncate">{name || 'שם המשתתף'}</p>
                                    <p className="text-xs font-bold text-slate-500 mt-1">
                                        גיל {ageLabel} {gender === 'male' ? '👦' : '👧'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
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
                </motion.div>
            </main>

            {/* Icon Picker Sheet */}
            <AnimatePresence>
                {showIconPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/40"
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
                        className="fixed inset-0 z-[60] bg-black/40"
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
