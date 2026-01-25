'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BadgeCheck, ChevronRight, ChevronUp, ChevronDown, Crown, Minus, Pencil, Sparkles, Star, Timer, UserPlus, X, Users, Droplet, Container, Trophy } from 'lucide-react';
import { ParticipantIcon, PARTICIPANT_ICONS } from '@/app/lib/participantIcons';
import { useAuth } from '@/app/contexts/AuthContext';
import { subscribeToGroup, subscribeToEvent, updateEvent, updateParticipantStars, updateEventPoolStars, deleteEvent, addParticipantToEvent, Event as FirestoreEvent, Group as FirestoreGroup, Participant } from '@/app/lib/firestore';
import { canEditEvent, canManageStars } from '@/app/lib/permissions';
import AuthGuard from '@/app/components/AuthGuard';

// Event-specific icons (using Lucide icons, not emojis)
const EVENT_ICONS = [
    'trophy', 'star', 'crown', 'award', 'sparkles', 'rocket', 'flame', 'gem',
    'heart', 'sun', 'moon', 'compass', 'book', 'music', 'camera', 'plane',
    'zap', 'shield', 'sword', 'wand', 'gamepad', 'palette'
];

// Use types from firestore
type Event = FirestoreEvent;
type Group = FirestoreGroup;

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
    // קונפטי מרשים וארוך במיוחד
    burstConfetti({ big: true });
    setTimeout(() => burstConfetti({ big: true }), 200);
    setTimeout(() => burstConfetti({ big: true }), 400);
    setTimeout(() => burstConfetti({ big: true }), 600);
    setTimeout(() => burstConfetti({ big: true }), 800);
    setTimeout(() => burstConfetti({ big: true }), 1000);
    setTimeout(() => burstConfetti({ big: true }), 1200);
    setTimeout(() => burstConfetti({ big: true }), 1400);
}

export default function EventPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [groupId, setGroupId] = useState<string>('');
    const [eventId, setEventId] = useState<string>('');

    useEffect(() => {
        const getParams = async () => {
            try {
                const resolvedParams = await params;
                setGroupId(resolvedParams.groupId as string);
                setEventId(resolvedParams.eventId as string);
            } catch (error) {
                // Error resolving params
                router.push('/');
            }
        };
        getParams();
    }, [params, router]);

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
    const [showBonusStar, setShowBonusStar] = useState(false);
    const [showAddParticipant, setShowAddParticipant] = useState(false);
    const [showExistingParticipants, setShowExistingParticipants] = useState(false);
    const [showEditEvent, setShowEditEvent] = useState(false);
    const [editEventName, setEditEventName] = useState('');
    const [editEventEndDate, setEditEventEndDate] = useState('');
    const [editEventStarGoal, setEditEventStarGoal] = useState(0);
    const [editPoolStarGoal, setEditPoolStarGoal] = useState(0);
    const [editEventIcon, setEditEventIcon] = useState('trophy');
    const [showEventIconPicker, setShowEventIconPicker] = useState(false);
    
    // Pool stars state
    const [showPoolCelebration, setShowPoolCelebration] = useState(false);
    const [showPoolBonusStar, setShowPoolBonusStar] = useState(false);
    const [poolStarFlash, setPoolStarFlash] = useState<{ text?: string; variant?: 'normal' | 'bonus' } | null>(null);

    const FEEDBACK_MS = {
        starFlashNormal: 900,
        starFlashBonus: 1050,
        congrats: 2600,
        bonusToast: 1500,
        sad: 1900,
    } as const;

    useEffect(() => {
        if (!groupId || !eventId || !user) return;

        const unsubscribeGroup = subscribeToGroup(user.uid, groupId, (firestoreGroup) => {
            if (firestoreGroup) {
                // Ensure all participants have completedEvents field
                firestoreGroup.participants.forEach((participant: Participant) => {
                    if (!participant.completedEvents) {
                        participant.completedEvents = [];
                    }
                });
                setGroup(firestoreGroup as Group);
            } else {
                router.push('/');
            }
        });

        const unsubscribeEvent = subscribeToEvent(user.uid, groupId, eventId, (firestoreEvent) => {
            if (firestoreEvent) {
                if (!firestoreEvent.icon) {
                    firestoreEvent.icon = 'trophy'; // default icon
                }
                setEvent(firestoreEvent as Event);
            } else {
                router.push(`/group/${groupId}`);
            }
        });

        return () => {
            unsubscribeGroup();
            unsubscribeEvent();
        };
    }, [groupId, eventId, user, router]);

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

    // updateEventData is no longer needed - we use updateEvent directly and real-time listeners

    const handleAddStar = async (participantId: string) => {
        if (!event || !user) return;

        // Check permissions
        const canManage = await canManageStars(user.uid, groupId, eventId, participantId);
        if (!canManage) {
            alert('אין הרשאה להוסיף כוכבים למשתתף זה');
            return;
        }

        const currentStars = event.participants.find((ep) => ep.participantId === participantId)?.stars ?? 0;
        const increment = currentStars >= event.starGoal ? 2 : 1; // מעל היעד = 2 נקודות
        const willHitGoal = currentStars < event.starGoal && currentStars + increment >= event.starGoal;
        const isAboveGoal = currentStars >= event.starGoal;

        try {
            await updateParticipantStars(user.uid, groupId, eventId, participantId, currentStars + increment);
            // Real-time listener will update automatically
        } catch (error) {
            // Error adding star
            alert('שגיאה בהוספת כוכב');
            return;
        }

        // חיווי במרכז למסך (כוכב) - רק לכוכבים רגילים, לא להשלמת יעד
        if (isAboveGoal && !willHitGoal) {
            setStarFlash({ variant: 'normal' });
            setTimeout(() => setStarFlash(null), FEEDBACK_MS.starFlashNormal);
            // קונפטי לכוכב רגיל
            burstConfetti({ big: false });
        }

        if (willHitGoal) {
            const p = group?.participants.find((x) => x.id === participantId);
            setCongratsName(p?.name ?? '');

            // Add event achievement to participant
            if (p && event) {
                // Ensure completedEvents exists
                if (!p.completedEvents) {
                    p.completedEvents = [];
                }

                const isEventCompleted = event.endDate < Date.now();
                const achievement = {
                    eventId: event.id,
                    stars: currentStars + increment,
                    icon: event.icon,
                    eventName: event.name,
                    eventCompleted: isEventCompleted
                };

                // Check if achievement already exists, update if so
                const existingIndex = p.completedEvents.findIndex(a => a.eventId === event.id);
                if (existingIndex >= 0) {
                    p.completedEvents[existingIndex] = achievement;
                } else {
                    p.completedEvents.push(achievement);
                }

                // Update participant in group (this will be handled by real-time listener)
                // Note: completedEvents should be updated in the group document
                // For now, we'll rely on the real-time listener to update the UI
            }

            // הצג חיווי "כל הכבוד!!" למספר שניות
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 5000);
            richGoalCelebration();
            return;
        }

        if (isAboveGoal) {
            // מעל היעד: קונפטי + חיווי כוכב גדול עם 2
            setShowBonusStar(true);
            setTimeout(() => setShowBonusStar(false), 2000);
            burstConfetti({ big: true });
            return;
        }

        // תוספת רגילה: קונפטי + כוכב במרכז
        burstConfetti({ big: false });
    };

    const handleAddPoolStar = async () => {
        if (!event || !user) return;

        // Check permissions: owner or guest
        const isOwner = event.ownerId === user.uid;
        const isGuest = event.guests?.some((g) => g.userId === user.uid) || false;
        
        if (!isOwner && !isGuest) {
            alert('אין הרשאה להוסיף כוכבים ל-POOL');
            return;
        }

        const currentPoolStars = event.poolStars || 0;
        const poolStarGoal = event.poolStarGoal || event.starGoal;
        const increment = currentPoolStars >= poolStarGoal ? 2 : 1; // מעל היעד = 2 נקודות
        const willHitGoal = currentPoolStars < poolStarGoal && currentPoolStars + increment >= poolStarGoal;
        const isAboveGoal = currentPoolStars >= poolStarGoal;

        try {
            await updateEventPoolStars(user.uid, groupId, eventId, currentPoolStars + increment);
            // Real-time listener will update automatically
        } catch (error) {
            alert('שגיאה בהוספת כוכב ל-POOL');
            return;
        }

        // חיווי במרכז למסך (כוכב) - רק לכוכבים רגילים, לא להשלמת יעד
        if (isAboveGoal && !willHitGoal) {
            setPoolStarFlash({ variant: 'normal' });
            setTimeout(() => setPoolStarFlash(null), FEEDBACK_MS.starFlashNormal);
            burstConfetti({ big: false });
        }

        if (willHitGoal) {
            // הצג חיווי "כל הכבוד!!" למספר שניות
            setShowPoolCelebration(true);
            setTimeout(() => setShowPoolCelebration(false), 5000);
            richGoalCelebration();
            return;
        }

        if (isAboveGoal) {
            // מעל היעד: קונפטי + חיווי כוכב גדול עם 2
            setShowPoolBonusStar(true);
            setTimeout(() => setShowPoolBonusStar(false), 2000);
            burstConfetti({ big: true });
            return;
        }

        // תוספת רגילה: קונפטי + כוכב במרכז
        burstConfetti({ big: false });
    };

    const handleRemovePoolStar = async () => {
        if (!event || !user) return;

        // Check permissions: owner or guest
        const isOwner = event.ownerId === user.uid;
        const isGuest = event.guests?.some((g) => g.userId === user.uid) || false;
        
        if (!isOwner && !isGuest) {
            alert('אין הרשאה להסיר כוכבים מה-POOL');
            return;
        }

        const currentPoolStars = event.poolStars || 0;
        
        if (currentPoolStars === 0) {
            return;
        }

        try {
            await updateEventPoolStars(user.uid, groupId, eventId, currentPoolStars - 1);
            // Real-time listener will update automatically
            setShowSadEmoji(true);
            setTimeout(() => setShowSadEmoji(false), FEEDBACK_MS.sad);
        } catch (error) {
            alert('שגיאה בהסרת כוכב מה-POOL');
        }
    };

    const handleRemoveStar = async (participantId: string) => {
        if (!event || !user) return;

        // Check permissions
        const canManage = await canManageStars(user.uid, groupId, eventId, participantId);
        if (!canManage) {
            alert('אין הרשאה להסיר כוכבים ממשתתף זה');
            return;
        }

        const currentStars = event.participants.find((ep) => ep.participantId === participantId)?.stars ?? 0;
        if (currentStars <= 0) return;

        try {
            await updateParticipantStars(user.uid, groupId, eventId, participantId, currentStars - 1);
            // Real-time listener will update automatically
            setShowSadEmoji(true);
            setTimeout(() => setShowSadEmoji(false), FEEDBACK_MS.sad);
        } catch (error) {
            // Error removing star
            alert('שגיאה בהסרת כוכב');
        }
    };

    const handleAddExistingParticipant = async (participantId: string) => {
        if (!event || !user || !group) return;

        // Check if participant is already in the event
        const alreadyInEvent = event.participants.some(ep => ep.participantId === participantId);
        if (alreadyInEvent) {
            alert('המשתתף כבר באירוע!');
            return;
        }

        const participant = group.participants.find((p) => p.id === participantId);
        if (!participant) return;

        try {
            await addParticipantToEvent(user.uid, groupId, eventId, participant);
            setShowExistingParticipants(false);
        } catch (error) {
            // Error adding participant
            alert('שגיאה בהוספת משתתף');
        }
    };

    const handleAddExistingParticipantInEdit = async (participantId: string) => {
        if (!event || !user || !group) return;

        // Check if participant is already in the event
        const alreadyInEvent = event.participants.some(ep => ep.participantId === participantId);
        if (alreadyInEvent) {
            alert('המשתתף כבר באירוע!');
            return;
        }

        const participant = group.participants.find((p) => p.id === participantId);
        if (!participant) return;

        try {
            await addParticipantToEvent(user.uid, groupId, eventId, participant);
        } catch (error) {
            // Error adding participant
            alert('שגיאה בהוספת משתתף');
        }
    };

    const openEditEvent = () => {
        if (!event) return;
        setEditEventName(event.name);
        setEditEventIcon(event.icon);
        setEditEventEndDate(new Date(event.endDate).toISOString().slice(0, 16));
        setEditEventStarGoal(event.starGoal);
        setEditPoolStarGoal(event.poolStarGoal || event.starGoal);
        setShowEditEvent(true);
    };

    const handleSaveEventEdit = async () => {
        if (!event || !user) return;

        // Check permissions
        const canEdit = await canEditEvent(user.uid, groupId, eventId);
        if (!canEdit) {
            alert('אין הרשאה לערוך אירוע זה');
            return;
        }

        const endDate = new Date(editEventEndDate).getTime();
        if (isNaN(endDate) || endDate <= Date.now()) {
            alert('נא להזין תאריך עתידי תקין');
            return;
        }

        if (editEventStarGoal < 1) {
            alert('יעד הכוכבים חייב להיות לפחות 1');
            return;
        }

        if (editPoolStarGoal < 1) {
            alert('יעד הכוכבים הקבוצתי חייב להיות לפחות 1');
            return;
        }

        try {
            await updateEvent(user.uid, groupId, eventId, {
                name: editEventName.trim(),
                icon: editEventIcon,
                endDate,
                starGoal: editEventStarGoal,
                poolStarGoal: editPoolStarGoal,
            });
            setShowEditEvent(false);
        } catch (error) {
            // Error saving event edit
            alert('שגיאה בשמירת שינויים');
        }
    };

    if (!group || !event) {
        return (
            <AuthGuard>
                <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                        <Sparkles className="w-12 h-12 text-[#4D96FF]" />
                    </motion.div>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
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
                        <div className="text-sm font-black text-slate-900 truncate max-w-[220px]">
                            {group?.name || 'טוען...'}
                        </div>
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
                        {/* Event icon in top-right corner */}
                        <div className="absolute top-2 right-2">
                            <ParticipantIcon icon={event.icon} className="w-6 h-6 text-slate-600" emojiSize="text-lg" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-[#4D96FF]/10 text-[#4D96FF] text-xs font-black uppercase tracking-wider border border-[#4D96FF]/20">
                                אירוע
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-black rainbow-text text-center break-words">{event.name}</h1>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-50 to-blue-50 rounded-xl px-4 py-3 border-2 border-yellow-200/50 shadow-sm">
                            <span className="text-base font-black text-slate-900">יעד: {event.starGoal}</span>
                            <Star className="w-5 h-5" fill="currentColor" style={{ color: '#FFD93D' }} />
                            <BadgeCheck className="w-5 h-5 text-[#4D96FF]" />
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 text-slate-500">
                            <Timer className="w-4 h-4 text-[#4D96FF]" />
                            <span className="text-xs font-black uppercase tracking-widest">נותר זמן</span>
                        </div>

                        {/* Countdown (LTR) */}
                        <div className="mt-3 grid grid-cols-4 gap-2" dir="ltr">
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

                {/* Pool Stars Card */}
                {event && (
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.02 }}
                        className="mb-6"
                    >
                        {(() => {
                            const poolStars = event.poolStars || 0;
                            const poolStarGoal = event.poolStarGoal || event.starGoal;
                            const poolProgress = Math.min((poolStars / poolStarGoal) * 100, 100);
                            const isPoolDone = poolStars >= poolStarGoal;
                            
                            // Get all participants in the event
                            const poolParticipants = event.participants
                                .map(ep => {
                                    const participant = group?.participants.find(p => p.id === ep.participantId);
                                    return participant;
                                })
                                .filter(p => p !== undefined) as Participant[];

                            return (
                                <div
                                    className="rounded-3xl border shadow-sm p-4 relative overflow-hidden"
                                    style={{
                                        background: isPoolDone
                                            ? 'linear-gradient(135deg, #FF0080 0%, #FF8C00 16%, #FFD93D 32%, #00FF00 50%, #00CED1 66%, #4D96FF 82%, #BB8FCE 100%)'
                                            : '#4D96FF',
                                        borderColor: isPoolDone ? '#4D96FF' : '#4D96FF',
                                        boxShadow: isPoolDone
                                            ? '0 14px 40px rgba(77,150,255,0.20), 0 0 0 2px rgba(255,217,61,0.30)'
                                            : '0 6px 18px rgba(15, 23, 42, 0.06)',
                                    }}
                                >
                                    <div className="pattern-overlay" />
                                    {isPoolDone && (
                                        <div className="absolute top-0 left-3 bg-yellow-400/95 backdrop-blur-md rounded-lg px-1.5 py-0.5 text-[9px] font-black text-slate-900 border border-yellow-500 shadow-sm flex items-center gap-1">
                                            <BadgeCheck className="w-3 h-3" fill="currentColor" />
                                            הושלם!
                                        </div>
                                    )}
                                    <div className="relative">
                                        {/* Participants Icons */}
                                        {poolParticipants.length > 0 && (
                                            <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                                                {poolParticipants.map((participant) => (
                                                    <div
                                                        key={participant.id}
                                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-white/35 backdrop-blur-md shrink-0"
                                                        style={{ border: `1px solid ${hexToRgba(participant.color, 0.35)}` }}
                                                    >
                                                        <ParticipantIcon icon={participant.icon} className="w-6 h-6 sm:w-8 sm:h-8 text-slate-900" emojiSize="text-lg sm:text-xl" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Pool Stars Counter */}
                                        <div className="text-center mb-4">
                                            <div className="text-5xl sm:text-6xl font-black text-white leading-none">
                                                {poolStars}
                                            </div>
                                            <div className="text-sm sm:text-base font-black text-white/90 uppercase tracking-widest mt-1">כוכבים משותפים</div>
                                        </div>

                                        {/* Vertical Progress Bar */}
                                        <div className="flex items-center justify-center mb-4">
                                            <div className="relative w-20 h-32 sm:w-24 sm:h-40">
                                                {/* Progress fill - fills from bottom */}
                                                <div 
                                                    className="absolute bottom-0 right-0 transition-all duration-500 ease-out rounded-b-2xl"
                                                    style={{
                                                        left: '3px',
                                                        right: '3px',
                                                        height: `${poolProgress}%`,
                                                        background: poolProgress >= 100 
                                                            ? 'linear-gradient(to top, #854d0e 0%, #a16207 20%, #ca8a04 50%, #eab308 80%, #fde047 100%)'
                                                            : `linear-gradient(to top, #854d0e 0%, #a16207 ${50 - (poolProgress / 100) * 20}%, #ca8a04 ${50 + (poolProgress / 100) * 30}%, #eab308 100%)`,
                                                        boxShadow: poolProgress >= 100 
                                                            ? `0 0 50px rgba(234, 179, 8, 0.9), 0 0 30px rgba(234, 179, 8, 0.7), 0 0 15px rgba(253, 224, 71, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.3)`
                                                            : `0 0 ${20 + (poolProgress / 100) * 40}px rgba(234, 179, 8, ${0.5 + (poolProgress / 100) * 0.4}), 0 0 ${10 + (poolProgress / 100) * 20}px rgba(250, 204, 21, ${0.3 + (poolProgress / 100) * 0.3}), inset 0 0 10px rgba(255, 255, 255, 0.2)`,
                                                        borderRadius: '0 0 0.75rem 0.75rem',
                                                    }}
                                                >
                                                    {/* Shine effect when full */}
                                                    {poolProgress >= 100 && (
                                                        <div className="absolute top-0 left-0 right-0 h-4 bg-white/50 animate-pulse rounded-t-full"></div>
                                                    )}
                                                </div>
                                                
                                                {/* Background container - brought forward */}
                                                <div 
                                                    className="absolute inset-0 border-[6px] border-white/80 rounded-2xl z-10"
                                                    style={{
                                                        borderRadius: '1rem',
                                                        pointerEvents: 'none',
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Progress Text */}
                                        <div className="text-center mb-4">
                                            <div className="text-xs font-black text-white/90 uppercase tracking-wider">
                                                {poolStars} / {poolStarGoal} ({poolProgress.toFixed(0)}%)
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-4 relative">
                                            <div className="absolute inset-0 backdrop-blur-sm bg-black/10 rounded-3xl"></div>
                                            <div className="relative flex items-center justify-between gap-3 px-2 py-2">
                                                <button
                                                    onClick={handleAddPoolStar}
                                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl backdrop-blur-sm bg-white/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                                >
                                                    <Star className="w-8 h-8 sm:w-9 sm:h-9" fill="currentColor" style={{ color: '#FFD93D' }} />
                                                </button>
                                                <div className="text-center">
                                                    <div className="text-5xl sm:text-6xl font-black text-white leading-none">
                                                        {poolStars}
                                                    </div>
                                                    <div className="text-sm sm:text-base font-black text-white/90 uppercase tracking-widest">כוכבים</div>
                                                </div>
                                                <button
                                                    onClick={handleRemovePoolStar}
                                                    disabled={poolStars === 0}
                                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl backdrop-blur-sm bg-white/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                                >
                                                    <span className="text-4xl sm:text-5xl">😢</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.section>
                )}

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
                                className="rounded-3xl border shadow-sm p-4 relative overflow-hidden"
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
                                    <div className="absolute top-0 left-3 bg-yellow-400/95 backdrop-blur-md rounded-lg px-1.5 py-0.5 text-[9px] font-black text-slate-900 border border-yellow-500 shadow-sm flex items-center gap-1">
                                        <Crown className="w-3 h-3" fill="currentColor" />
                                        מוביל
                                    </div>
                                )}
                                <div className="relative">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 bg-white/35 backdrop-blur-md"
                                                style={{ border: `1px solid ${hexToRgba(participant.color, 0.35)}` }}
                                            >
                                                <ParticipantIcon icon={participant.icon} className="w-16 h-16 sm:w-20 sm:h-20 text-slate-900" emojiSize="text-5xl sm:text-6xl" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-3xl sm:text-4xl font-black text-slate-900 truncate">{participant.name}</h3>
                                                    {isDone && <BadgeCheck className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />}
                                                </div>
                                                <p className="text-sm sm:text-base font-bold text-slate-800/75 mt-0.5">
                                                    גיל {participant.age} {participant.gender === 'male' ? '👦' : '👧'}
                                                </p>
                                            </div>
                                        </div>
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
                                    <div className="mt-4 relative">
                                        <div className="absolute inset-0 backdrop-blur-sm bg-black/10 rounded-3xl"></div>
                                        <div className="relative flex items-center justify-between gap-3 px-2 py-2">
                                            <button
                                                onClick={() => handleAddStar(participantId)}
                                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl backdrop-blur-sm bg-white/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                            >
                                                <Star className="w-8 h-8 sm:w-9 sm:h-9" fill="currentColor" style={{ color: '#FFD93D' }} />
                                            </button>
                                            <div className="text-center">
                                                <div className="text-5xl sm:text-6xl font-black text-slate-900 leading-none">
                                                    {stars}
                                                </div>
                                                <div className="text-sm sm:text-base font-black text-slate-800/70 uppercase tracking-widest">כוכבים</div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveStar(participantId)}
                                                disabled={stars === 0}
                                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl backdrop-blur-sm bg-white/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                            >
                                                <span className="text-4xl sm:text-5xl">😢</span>
                                            </button>
                                        </div>
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
                        className="fixed inset-0 z-[85] backdrop-blur-sm bg-black/10 flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="text-center"
                        >
                            <div className="text-6xl mb-4 animate-bounce">🎉</div>
                            <div className="text-4xl font-black rainbow-text mb-4 animate-pulse">כל הכבוד!!</div>
                            <div className="text-8xl animate-bounce">😄</div>
                            {congratsName && (
                                <div className="mt-4 text-lg font-black text-white drop-shadow-lg">
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
                        className="fixed inset-0 z-[84] backdrop-blur-sm bg-black/10 flex items-center justify-center pointer-events-none"
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

            {/* Bonus star overlay - כוכב גדול עם 2 */}
            <AnimatePresence>
                {showBonusStar && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[83] backdrop-blur-sm bg-black/10 flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 1.3, opacity: 0, rotate: 15 }}
                            transition={{ type: 'spring', stiffness: 250, damping: 18 }}
                            className="text-center"
                        >
                            <div className="flex items-center justify-center gap-6">
                                <Star className="w-32 h-32 drop-shadow-2xl" fill="currentColor" style={{ color: '#FFD93D' }} />
                                <div className="text-8xl font-black text-white drop-shadow-2xl">2</div>
                                <Star className="w-32 h-32 drop-shadow-2xl" fill="currentColor" style={{ color: '#FFD93D' }} />
                            </div>
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

            {/* Pool Celebration overlay */}
            <AnimatePresence>
                {showPoolCelebration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[85] backdrop-blur-sm bg-black/10 flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="text-center"
                        >
                            <div className="text-6xl mb-4 animate-bounce">🎉</div>
                            <div className="text-4xl font-black rainbow-text mb-4 animate-pulse">כל הכבוד!!</div>
                            <div className="text-8xl animate-bounce">😄</div>
                            <div className="mt-4 text-lg font-black text-white drop-shadow-lg">
                                ה-POOL הגיע ליעד!
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pool Bonus star overlay */}
            <AnimatePresence>
                {showPoolBonusStar && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[83] backdrop-blur-sm bg-black/10 flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 1.3, opacity: 0, rotate: 15 }}
                            transition={{ type: 'spring', stiffness: 250, damping: 18 }}
                            className="text-center"
                        >
                            <div className="flex items-center justify-center gap-6">
                                <Star className="w-32 h-32 drop-shadow-2xl" fill="currentColor" style={{ color: '#FFD93D' }} />
                                <div className="text-8xl font-black text-white drop-shadow-2xl">2</div>
                            </div>
                            <div className="mt-4 text-2xl font-black text-white drop-shadow-lg">כוכב בונוס!</div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pool Star flash overlay */}
            <AnimatePresence>
                {poolStarFlash && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[82] backdrop-blur-sm bg-black/10 flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.4, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                            className="text-center"
                        >
                            <Star 
                                className={`drop-shadow-2xl ${poolStarFlash.variant === 'bonus' ? 'w-40 h-40' : 'w-32 h-32'}`}
                                fill="currentColor" 
                                style={{ color: '#FFD93D' }} 
                            />
                            {poolStarFlash.text && (
                                <div className="mt-4 text-4xl font-black text-white drop-shadow-2xl">
                                    {poolStarFlash.text}
                                </div>
                            )}
                        </motion.div>
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
                        className="fixed inset-0 z-[84] backdrop-blur-sm bg-black/10 flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.6, opacity: 0, y: 6 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 6 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                            className="text-center"
                        >
                            <Star className="w-24 h-24 drop-shadow-2xl" fill="currentColor" style={{ color: '#FFD93D' }} />
                            {starFlash.text && (
                                <div className="mt-4 text-4xl font-black text-white drop-shadow-2xl">
                                    {starFlash.text}
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
                                                <ParticipantIcon icon={participant.icon} className="w-6 h-6 text-slate-900" emojiSize="text-lg" />
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
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowEditEvent(false)}
                    >
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 30, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header Card - Similar to Event Card */}
                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm p-4 mb-4 relative overflow-hidden"
                            >
                                <div className="relative">
                                    {/* Event icon in top-right corner - clickable */}
                                    <button
                                        type="button"
                                        onClick={() => setShowEventIconPicker(true)}
                                        className="absolute top-2 right-2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                        aria-label="בחר אייקון"
                                    >
                                        <ParticipantIcon icon={editEventIcon} className="w-6 h-6 text-slate-600" emojiSize="text-lg" />
                                    </button>
                                    
                                    {/* Event Name */}
                                    <input
                                        type="text"
                                        value={editEventName}
                                        onChange={(e) => setEditEventName(e.target.value)}
                                        placeholder="שם האירוע"
                                        dir="rtl"
                                        className="w-full text-2xl font-black text-slate-900 text-center bg-transparent border-none outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#4D96FF] rounded-lg px-2"
                                    />

                                    {/* Star Goal */}
                                    <div className="mt-4 flex items-center justify-center gap-2 bg-white/70 backdrop-blur-md rounded-lg px-3 py-2 border border-white/50">
                                        <span className="text-sm font-black text-slate-900">יעד:</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditEventStarGoal(Math.max(1, editEventStarGoal - 1))}
                                                className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
                                                aria-label="הורד יעד"
                                            >
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={editEventStarGoal}
                                                onChange={(e) => setEditEventStarGoal(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                                className="w-12 text-sm font-black text-slate-900 text-center bg-transparent border-none outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setEditEventStarGoal(Math.min(100, editEventStarGoal + 1))}
                                                className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
                                                aria-label="העלה יעד"
                                            >
                                                <ChevronUp className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <Star className="w-4 h-4" fill="currentColor" style={{ color: '#FFD93D' }} />
                                        <BadgeCheck className="w-4 h-4 text-[#4D96FF]" />
                                    </div>

                                    {/* Pool Star Goal */}
                                    <div className="mt-4 flex items-center justify-center gap-2 bg-white/70 backdrop-blur-md rounded-lg px-3 py-2 border border-white/50">
                                        <span className="text-sm font-black text-slate-900">יעד POOL:</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditPoolStarGoal(Math.max(1, editPoolStarGoal - 1))}
                                                className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
                                                aria-label="הורד יעד POOL"
                                            >
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={editPoolStarGoal}
                                                onChange={(e) => setEditPoolStarGoal(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                                className="w-12 text-sm font-black text-slate-900 text-center bg-transparent border-none outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setEditPoolStarGoal(Math.min(100, editPoolStarGoal + 1))}
                                                className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
                                                aria-label="העלה יעד POOL"
                                            >
                                                <ChevronUp className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <Users className="w-4 h-4 text-[#4D96FF]" />
                                        <BadgeCheck className="w-4 h-4 text-[#4D96FF]" />
                                    </div>

                                    {/* End Date */}
                                    <div className="mt-4">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block text-center mb-2">מועד סיום</label>
                                        <input
                                            type="datetime-local"
                                            value={editEventEndDate}
                                            onChange={(e) => setEditEventEndDate(e.target.value)}
                                            className="w-full h-10 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#4D96FF]"
                                        />
                                    </div>
                                </div>
                            </motion.section>

                            {/* Add Participants Section */}
                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm p-4 mb-4"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-[#4D96FF]" />
                                        <span className="control-label text-[11px]">משתתפים</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            router.push(`/group/${groupId}/add-participant?eventId=${eventId}`);
                                        }}
                                        className="h-10 px-4 rounded-2xl bg-slate-100 text-slate-700 font-black text-xs active:scale-95 transition-transform"
                                    >
                                        הוסף חדש
                                    </button>
                                </div>

                                {!group || group.participants.filter(p => !event?.participants.some(ep => ep.participantId === p.id)).length === 0 ? (
                                    <div className="mt-4 p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                        <Sparkles className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm font-black text-slate-400">כל המשתתפים כבר באירוע</p>
                                    </div>
                                ) : (
                                    <div className="mt-4 grid grid-cols-1 gap-2">
                                        {group.participants
                                            .filter(p => !event?.participants.some(ep => ep.participantId === p.id))
                                            .map((participant) => (
                                                <button
                                                    key={participant.id}
                                                    type="button"
                                                    onClick={() => handleAddExistingParticipantInEdit(participant.id)}
                                                    className="w-full text-right bg-white rounded-2xl border-2 border-slate-200 px-3 py-2.5 flex items-center gap-3 active:scale-95 transition-transform hover:border-[#4D96FF]"
                                                >
                                                    <div
                                                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 relative overflow-hidden"
                                                        style={{ backgroundColor: `${participant.color}22`, border: `1px solid ${participant.color}` }}
                                                    >
                                                        <div className="pattern-overlay" />
                                                        <ParticipantIcon icon={participant.icon} className="w-6 h-6" emojiSize="text-2xl" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="font-black text-slate-900 truncate text-sm">{participant.name}</p>
                                                            <span className="text-slate-400 font-black text-xs">לחץ להוספה</span>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                                                            גיל {participant.age.toFixed(1)} {participant.gender === 'male' ? '👦' : '👧'}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </motion.section>

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

            {/* Event Icon Picker Sheet */}
            <AnimatePresence>
                {showEventIconPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowEventIconPicker(false)}
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
                                    <Sparkles className="w-4 h-4 text-[#4D96FF]" />
                                    <span className="text-sm font-black text-slate-900">בחר אייקון לאירוע</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowEventIconPicker(false)}
                                    className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 inline-flex items-center justify-center active:scale-95 transition-transform"
                                    aria-label="סגור"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="max-h-[55vh] overflow-y-auto">
                                <div className="grid grid-cols-6 gap-2">
                                    {EVENT_ICONS.map((iconKey) => {
                                        const iconData = PARTICIPANT_ICONS.find(icon => icon.key === iconKey);
                                        return iconData ? (
                                            <button
                                                key={iconKey}
                                                type="button"
                                                onClick={() => {
                                                    setEditEventIcon(iconKey);
                                                    setShowEventIconPicker(false);
                                                }}
                                                className="h-12 rounded-2xl border border-slate-200 bg-white active:scale-95 transition-transform inline-flex items-center justify-center"
                                                aria-label={`בחר אייקון ${iconData.label}`}
                                            >
                                                <iconData.Icon className="w-6 h-6 text-slate-700" />
                                            </button>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        </AuthGuard>
    );
}
