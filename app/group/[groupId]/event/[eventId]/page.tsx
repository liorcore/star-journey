'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BadgeCheck, ChevronRight, Crown, Minus, Pencil, Sparkles, Star, Timer, UserPlus } from 'lucide-react';
import { ParticipantIcon } from '@/app/lib/participantIcons';

interface Participant {
    id: string;
    name: string;
    icon: string; // lucide key (or legacy emoji)
    age: number;
    color: string;
    gender: 'male' | 'female';
    totalStars: number;
    eventCount: number;
}

interface EventParticipant {
    participantId: string;
    stars: number;
}

interface Event {
    id: string;
    name: string;
    endDate: number;
    starGoal: number;
    participants: EventParticipant[];
}

interface Group {
    id: string;
    name: string;
    code: string;
    participants: Participant[];
    events: Event[];
}

function hexToRgba(hex: string, alpha: number) {
    const clean = hex.replace('#', '').trim();
    if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(0,0,0,${alpha})`;
    return `rgba(${r},${g},${b},${alpha})`;
}

function burstConfetti(opts?: { big?: boolean }) {
    confetti({
        particleCount: opts?.big ? 260 : 120,
        spread: opts?.big ? 105 : 70,
        startVelocity: opts?.big ? 60 : 40,
        origin: { y: 0.72 },
        colors: ['#FFD93D', '#4D96FF', '#FF6B6B', '#4ECDC4', '#BB8FCE', '#FFA07A', '#FF0080'],
        scalar: opts?.big ? 1.15 : 1,
    });
}

function emojiRain(opts?: { count?: number }) {
    const emojis = ['😄', '😁', '😆', '😊', '🥳', '🤩', '😎', '⭐', '✨'];
    const count = opts?.count ?? 90;

    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.position = 'fixed';
        el.style.left = `${Math.random() * 100}vw`;
        el.style.top = '-40px';
        el.style.fontSize = `${18 + Math.random() * 22}px`;
        el.style.zIndex = '9999';
        el.style.pointerEvents = 'none';
        el.style.willChange = 'transform, opacity';
        document.body.appendChild(el);

        const duration = 1900 + Math.random() * 900;
        const endY = window.innerHeight + 80;
        const driftX = (Math.random() - 0.5) * 260;
        const rotate = (Math.random() - 0.5) * 840;

        el.animate(
            [
                { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: 1 },
                { transform: `translate3d(${driftX}px, ${endY}px, 0) rotate(${rotate}deg)`, opacity: 0 }
            ],
            { duration, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        ).onfinish = () => el.remove();
    }
}

function richGoalCelebration() {
    // קונפטי רגיל ארוך יותר
    burstConfetti({ big: true });
    setTimeout(() => burstConfetti({ big: true }), 300);
    setTimeout(() => burstConfetti({ big: true }), 600);
    setTimeout(() => burstConfetti({ big: true }), 900);
    setTimeout(() => burstConfetti({ big: true }), 1200);
}

export default function EventPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;
    const eventId = params.eventId as string;

    const [group, setGroup] = useState<Group | null>(null);
    const [event, setEvent] = useState<Event | null>(null);
    const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const [showSadEmoji, setShowSadEmoji] = useState(false);
    const [showCongrats, setShowCongrats] = useState(false);
    const [congratsName, setCongratsName] = useState<string>('');
    const [bonusToast, setBonusToast] = useState<string | null>(null);
    const [starFlash, setStarFlash] = useState<{ text?: string; variant?: 'normal' | 'bonus' } | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showHappyEmoji, setShowHappyEmoji] = useState(false);
    const [showAddParticipant, setShowAddParticipant] = useState(false);
    const [showExistingParticipants, setShowExistingParticipants] = useState(false);
    const [showEditEvent, setShowEditEvent] = useState(false);
    const [editEventName, setEditEventName] = useState('');
    const [editEventEndDate, setEditEventEndDate] = useState('');
    const [editEventStarGoal, setEditEventStarGoal] = useState(0);

    const FEEDBACK_MS = {
        starFlashNormal: 900,
        starFlashBonus: 1050,
        congrats: 2600,
        bonusToast: 1500,
        sad: 1900,
    } as const;

    useEffect(() => {
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const foundGroup = groups.find((g: Group) => g.id === groupId);
        if (foundGroup) {
            setGroup(foundGroup);
            const foundEvent = foundGroup.events.find((e: Event) => e.id === eventId);
            if (foundEvent) {
                setEvent(foundEvent);
            } else {
                router.push(`/group/${groupId}`);
            }
        } else {
            router.push('/');
        }
    }, [groupId, eventId, router]);

    useEffect(() => {
        if (!event) return;

        const updateCountdown = () => {
            const now = Date.now();
            const diff = event.endDate - now;

            if (diff <= 0) {
                setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining({ days, hours, minutes, seconds });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [event]);

    const sortedParticipants = useMemo(() => {
        if (!group || !event) return [];
        return [...event.participants]
            .map(ep => ({
                ...ep,
                participant: group.participants.find(p => p.id === ep.participantId)!
            }))
            .filter(ep => ep.participant)
            .sort((a, b) => b.stars - a.stars);
    }, [group, event]);

    const updateEventData = (updatedEvent: Event) => {
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const groupIndex = groups.findIndex((g: Group) => g.id === groupId);
        if (groupIndex === -1) return;

        const eventIndex = groups[groupIndex].events.findIndex((e: Event) => e.id === eventId);
        if (eventIndex === -1) return;

        groups[groupIndex].events[eventIndex] = updatedEvent;

        // Update participant total stars across all events
        groups[groupIndex].participants.forEach((participant: Participant) => {
            let totalStars = 0;
            groups[groupIndex].events.forEach((evt: Event) => {
                const ep = evt.participants.find(p => p.participantId === participant.id);
                if (ep) totalStars += ep.stars;
            });
            participant.totalStars = totalStars;
        });

        localStorage.setItem('groups', JSON.stringify(groups));
        setGroup(groups[groupIndex]);
        setEvent(updatedEvent);
    };

    const handleAddStar = (participantId: string) => {
        if (!event) return;

        const currentStars = event.participants.find((ep) => ep.participantId === participantId)?.stars ?? 0;
        const increment = currentStars >= event.starGoal ? 2 : 1; // מעל היעד = 2 נקודות
        const willHitGoal = currentStars < event.starGoal && currentStars + increment >= event.starGoal;
        const isAboveGoal = currentStars >= event.starGoal;

        const updatedParticipants = event.participants.map(ep =>
            ep.participantId === participantId
                ? { ...ep, stars: ep.stars + increment }
                : ep
        );

        updateEventData({ ...event, participants: updatedParticipants });

        // חיווי במרכז למסך (כוכב)
        if (isAboveGoal) {
            setStarFlash({ text: '+2', variant: 'bonus' });
            setTimeout(() => setStarFlash(null), FEEDBACK_MS.starFlashBonus);
        } else {
            setStarFlash({ variant: 'normal' });
            setTimeout(() => setStarFlash(null), FEEDBACK_MS.starFlashNormal);
        }

        if (willHitGoal) {
            const p = group?.participants.find((x) => x.id === participantId);
            setCongratsName(p?.name ?? '');
            // הצג חיווי "כל הכבוד!!" ל-3 שניות
            setShowCelebration(true);
            setTimeout(() => {
                setShowCelebration(false);
                // אחרי "כל הכבוד" - הצג סמיילי שמח גדול לכמה שניות
                setShowHappyEmoji(true);
                setTimeout(() => setShowHappyEmoji(false), 2500);
            }, 3000);
            richGoalCelebration();
            return;
        }

        if (isAboveGoal) {
            // מעל היעד: קונפטי + חיווי כוכב עם 2
            setStarFlash({ text: '2', variant: 'bonus' });
            setTimeout(() => setStarFlash(null), FEEDBACK_MS.starFlashBonus);
            burstConfetti({ big: true });
            // גשם סמייליים שמחים קטן
            emojiRain({ count: 80 });
            return;
        }

        // תוספת רגילה: קונפטי + כוכב במרכז
        burstConfetti({ big: false });
    };

    const handleRemoveStar = (participantId: string) => {
        if (!event) return;

        const updatedParticipants = event.participants.map(ep =>
            ep.participantId === participantId && ep.stars > 0
                ? { ...ep, stars: ep.stars - 1 }
                : ep
        );

        updateEventData({ ...event, participants: updatedParticipants });

        setShowSadEmoji(true);
        setTimeout(() => setShowSadEmoji(false), FEEDBACK_MS.sad);
    };

    const handleAddExistingParticipant = (participantId: string) => {
        if (!event) return;

        // Check if participant is already in the event
        const alreadyInEvent = event.participants.some(ep => ep.participantId === participantId);
        if (alreadyInEvent) {
            alert('המשתתף כבר באירוע!');
            return;
        }

        const updatedParticipants = [...event.participants, { participantId, stars: 0 }];
        updateEventData({ ...event, participants: updatedParticipants });
        setShowExistingParticipants(false);
    };

    const openEditEvent = () => {
        if (!event) return;
        setEditEventName(event.name);
        setEditEventEndDate(new Date(event.endDate).toISOString().slice(0, 16));
        setEditEventStarGoal(event.starGoal);
        setShowEditEvent(true);
    };

    const handleSaveEventEdit = () => {
        if (!event) return;

        const endDate = new Date(editEventEndDate).getTime();
        if (isNaN(endDate) || endDate <= Date.now()) {
            alert('נא להזין תאריך עתידי תקין');
            return;
        }

        if (editEventStarGoal < 1) {
            alert('יעד הכוכבים חייב להיות לפחות 1');
            return;
        }

        updateEventData({
            ...event,
            name: editEventName.trim(),
            endDate,
            starGoal: editEventStarGoal
        });
        setShowEditEvent(false);
    };

    if (!group || !event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                    <Sparkles className="w-12 h-12 text-[#4D96FF]" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F5F9] pb-10" dir="rtl">
            {/* Top Bar */}
            <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 px-3">
                <div className="max-w-md mx-auto h-full flex items-center justify-between">
                    <button
                        onClick={() => router.push(`/group/${groupId}`)}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-95 transition-transform"
                        aria-label="חזרה לקבוצה"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="min-w-0 text-center">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">אירוע</div>
                        <div className="text-sm font-black text-slate-900 truncate max-w-[220px]">{event.name}</div>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowAddParticipant(true)}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-95 transition-transform"
                        aria-label="הוסף משתתף"
                    >
                        <UserPlus className="w-5 h-5" />
                    </motion.button>
                </div>
            </nav>

            <main className="max-w-md mx-auto px-3 pt-20">
                {/* Header Card */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4 relative overflow-hidden"
                >
                    <div className="pattern-overlay" />
                    {/* Edit button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={openEditEvent}
                        className="absolute top-2 left-2 sm:top-4 sm:left-4 p-1 text-slate-400 hover:text-slate-600 z-10"
                        title="ערוך אירוע"
                        aria-label="ערוך אירוע"
                    >
                        <Pencil className="w-4 h-4" />
                    </motion.button>
                    <div className="relative">
                        <h1 className="text-2xl font-black rainbow-text text-center break-words">{event.name}</h1>

                        <div className="mt-4 flex items-center justify-center gap-2">
                            <Star className="w-5 h-5" fill="currentColor" style={{ color: '#FFD93D' }} />
                            <span className="text-sm font-black text-slate-900">יעד: {event.starGoal}</span>
                            <BadgeCheck className="w-4 h-4 text-[#4D96FF]" />
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 text-slate-500">
                            <Timer className="w-4 h-4 text-[#4D96FF]" />
                            <span className="text-xs font-black uppercase tracking-widest">נותר זמן</span>
                        </div>

                        {/* Countdown (LTR) */}
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2" dir="ltr">
                            {([
                                { label: 'ימים', value: timeRemaining.days },
                                { label: 'שעות', value: timeRemaining.hours },
                                { label: 'דקות', value: timeRemaining.minutes },
                                { label: 'שניות', value: timeRemaining.seconds },
                            ] as const).map((item) => (
                                <div key={item.label} className="bg-slate-50 rounded-2xl border border-slate-200 p-3 text-center">
                                    <div className="text-2xl font-black text-slate-900 leading-none">{item.value}</div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Participants */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="space-y-3"
                >
                    {sortedParticipants.map(({ participant, participantId, stars }, index) => {
                        const isDone = stars >= event.starGoal;
                        const progress = Math.min((stars / event.starGoal) * 100, 100);

                        return (
                            <div
                                key={participantId}
                                className="rounded-2xl border shadow-sm p-4 relative overflow-hidden"
                                style={{
                                    background: isDone
                                        ? 'linear-gradient(135deg, #FF0080 0%, #FF8C00 16%, #FFD93D 32%, #00FF00 50%, #00CED1 66%, #4D96FF 82%, #BB8FCE 100%)'
                                        : participant.color,
                                    borderColor: isDone ? '#4D96FF' : participant.color,
                                    boxShadow: isDone
                                        ? '0 14px 40px rgba(77,150,255,0.20), 0 0 0 2px rgba(255,217,61,0.30)'
                                        : '0 6px 18px rgba(15, 23, 42, 0.06)',
                                }}
                            >
                                <div className="pattern-overlay" />
                                {index === 0 && (
                                    <div className="absolute top-1 left-2 bg-yellow-400/95 backdrop-blur-md rounded-lg px-1.5 py-0.5 text-[9px] font-black text-slate-900 border border-yellow-500 shadow-sm flex items-center gap-1">
                                        <Crown className="w-3 h-3" fill="currentColor" />
                                        מוביל
                                    </div>
                                )}
                                <div className="relative">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white/35 backdrop-blur-md"
                                                style={{ border: `1px solid ${hexToRgba(participant.color, 0.35)}` }}
                                            >
                                                <ParticipantIcon icon={participant.icon} className="w-14 h-14 text-slate-900" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-black text-slate-900 truncate">{participant.name}</h3>
                                                    {isDone && <BadgeCheck className="w-4 h-4 text-green-600" />}
                                                </div>
                                                <p className="text-xs font-bold text-slate-800/75 mt-0.5">
                                                    גיל {participant.age} {participant.gender === 'male' ? '👦' : '👧'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stars count in center */}
                                    <div className="text-center mt-3">
                                        <div className="text-4xl font-black text-slate-900 leading-none flex items-center justify-center gap-2">
                                            <Star className="w-8 h-8" fill="currentColor" style={{ color: '#FFD93D' }} />
                                            {stars}
                                            <Star className="w-8 h-8" fill="currentColor" style={{ color: '#FFD93D' }} />
                                        </div>
                                        <div className="text-xs font-black text-slate-800/70 uppercase tracking-widest">כוכבים</div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                                                {stars} / {event.starGoal}
                                            </span>
                                            <span className="text-[11px] font-black text-slate-900/60">{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="mt-2 h-3 rounded-full bg-white/55">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${progress}%`,
                                                    background: 'white',
                                                    boxShadow: '0 0 12px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleAddStar(participantId)}
                                            className="btn-star h-12 rounded-2xl flex items-center justify-center gap-2"
                                        >
                                            <Star className="w-4 h-4" fill="currentColor" style={{ color: '#FFD93D' }} />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveStar(participantId)}
                                            disabled={stars === 0}
                                            className="h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                        >
                                            <span className="text-2xl">😢</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </motion.section>
            </main>

            {/* Congrats overlay */}
            <AnimatePresence>
                {showCongrats && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] backdrop-blur-sm bg-black/10 flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="px-6 py-5 rounded-3xl border-2 border-white/60 bg-white/75 shadow-xl text-center"
                        >
                            <div className="text-3xl font-black rainbow-text">כל הכבוד!</div>
                            {congratsName && (
                                <div className="mt-1 text-sm font-black text-slate-800">{congratsName} הגיע/ה ליעד</div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Celebration overlay - כל הכבוד עם סמייליים ומדליות */}
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[85] flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="text-center"
                        >
                            <div className="text-6xl mb-4">🎉</div>
                            <div className="text-4xl font-black rainbow-text mb-2">כל הכבוד!!</div>
                            <div className="text-2xl">🏆 🥇 ⭐ ✨</div>
                            {congratsName && (
                                <div className="mt-2 text-lg font-black text-white drop-shadow-lg">
                                    {congratsName} הגיע/ה ליעד!
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Happy emoji overlay - סמיילי שמח גדול */}
            <AnimatePresence>
                {showHappyEmoji && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[84] flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="text-[200px] animate-pulse"
                        >
                            😄
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* +2 toast with star */}
            <AnimatePresence>
                {bonusToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="fixed top-16 left-1/2 -translate-x-1/2 z-[85] pointer-events-none"
                    >
                        <div className="px-4 py-2 rounded-2xl bg-white/85 border border-slate-200 shadow-md text-sm font-black text-slate-900">
                            <span className="inline-flex items-center gap-1.5">
                                <span>{bonusToast}</span>
                                <Star className="w-4 h-4" fill="currentColor" style={{ color: '#FFD93D' }} />
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center star flash */}
            <AnimatePresence>
                {starFlash && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[84] flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.6, opacity: 0, y: 6 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 6 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                            className="text-center"
                        >
                            <div className="mx-auto w-20 h-20 rounded-[2.5rem] bg-white/70 backdrop-blur-md border border-white/60 shadow-xl flex items-center justify-center">
                                <Star className="w-10 h-10" fill="currentColor" style={{ color: '#FFD93D' }} />
                            </div>
                            {starFlash.text && (
                                <div className="mt-2 text-2xl font-black text-slate-900">
                                    {starFlash.text}{' '}
                                    <Star className="inline-block w-5 h-5 align-[-2px]" fill="currentColor" style={{ color: '#FFD93D' }} />
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sad feedback overlay */}
            <AnimatePresence>
                {showSadEmoji && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] backdrop-blur-sm bg-black/10 flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="text-[96px]"
                        >
                            😢
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Participant Modal */}
            <AnimatePresence>
                {showAddParticipant && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center"
                        onClick={() => setShowAddParticipant(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="text-2xl font-black text-slate-900 mb-2">הוסף משתתף</div>
                                <div className="text-sm text-slate-500">בחר איך להוסיף משתתף לאירוע</div>
                            </div>

                            <div className="space-y-3">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setShowAddParticipant(false);
                                        // Navigate to add new participant with event context
                                        router.push(`/group/${groupId}/add-participant?eventId=${eventId}`);
                                    }}
                                    className="w-full btn-star h-12 rounded-2xl flex items-center justify-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    משתתף חדש
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setShowAddParticipant(false);
                                        setShowExistingParticipants(true);
                                    }}
                                    className="w-full h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    משתתף קיים מהקבוצה
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Existing Participants Modal */}
            <AnimatePresence>
                {showExistingParticipants && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center"
                        onClick={() => setShowExistingParticipants(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="text-2xl font-black text-slate-900 mb-2">בחר משתתף</div>
                                <div className="text-sm text-slate-500">בחר משתתף קיים להוספה לאירוע</div>
                            </div>

                            <div className="max-h-[50vh] overflow-y-auto space-y-2">
                                {group?.participants
                                    .filter(p => !event?.participants.some(ep => ep.participantId === p.id))
                                    .map((participant) => (
                                        <motion.button
                                            key={participant.id}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleAddExistingParticipant(participant.id)}
                                            className="w-full p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-3"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                                style={{ backgroundColor: `${participant.color}22`, border: `1px solid ${participant.color}` }}
                                            >
                                                <ParticipantIcon icon={participant.icon} className="w-6 h-6 text-slate-900" />
                                            </div>
                                            <div className="text-right flex-1">
                                                <div className="text-sm font-black text-slate-900">{participant.name}</div>
                                                <div className="text-xs text-slate-500">גיל {participant.age.toFixed(1)} {participant.gender === 'male' ? '👦' : '👧'}</div>
                                            </div>
                                        </motion.button>
                                    ))}
                                {group?.participants.filter(p => !event?.participants.some(ep => ep.participantId === p.id)).length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        <div className="text-sm font-bold">כל המשתתפים כבר באירוע!</div>
                                    </div>
                                )}
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowExistingParticipants(false)}
                                className="w-full mt-4 h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform"
                            >
                                סגור
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Event Modal */}
            <AnimatePresence>
                {showEditEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center"
                        onClick={() => setShowEditEvent(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="text-2xl font-black text-slate-900 mb-2">ערוך אירוע</div>
                                <div className="text-sm text-slate-500">שנה את פרטי האירוע</div>
                            </div>

                            <div className="space-y-4">
                                {/* Event Name */}
                                <section className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                                    <label className="control-label text-[11px]">שם האירוע</label>
                                    <input
                                        type="text"
                                        value={editEventName}
                                        onChange={(e) => setEditEventName(e.target.value)}
                                        placeholder="הזן שם לאירוע"
                                        dir="rtl"
                                        className="mt-2 w-full h-12 rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4D96FF]"
                                    />
                                </section>

                                {/* End Date */}
                                <section className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                                    <label className="control-label text-[11px]">מועד סיום</label>
                                    <input
                                        type="datetime-local"
                                        value={editEventEndDate}
                                        onChange={(e) => setEditEventEndDate(e.target.value)}
                                        className="mt-2 w-full h-12 rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 focus:outline-none focus:border-[#4D96FF]"
                                    />
                                </section>

                                {/* Star Goal */}
                                <section className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="control-label text-[11px]">יעד כוכבים</span>
                                        <span className="text-2xl font-black text-slate-900">{editEventStarGoal}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={editEventStarGoal}
                                        onChange={(e) => setEditEventStarGoal(parseInt(e.target.value))}
                                        className="mt-4 w-full h-3 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to left, #4D96FF 0%, #4D96FF ${(editEventStarGoal / 100) * 100}%, #e2e8f0 ${(editEventStarGoal / 100) * 100}%, #e2e8f0 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-[11px] mt-2 text-slate-400 font-bold">
                                        <span>1</span>
                                        <span>100</span>
                                    </div>
                                </section>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSaveEventEdit}
                                    className="btn-star h-12 rounded-2xl flex items-center justify-center gap-2"
                                >
                                    שמור
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowEditEvent(false)}
                                    className="h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform"
                                >
                                    ביטול
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
