'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, CalendarPlus, Check, ChevronRight, ChevronUp, ChevronDown, Palette, Smile, Sparkles, Star, Users, X, BadgeCheck, UserPlus } from 'lucide-react';
import { ParticipantIcon, PARTICIPANT_ICONS } from '@/app/lib/participantIcons';
import { PARTICIPANT_EMOJIS } from '@/app/lib/participantEmoji';
import { useAuth } from '@/app/contexts/AuthContext';
import { subscribeToGroup, createEvent, updateGroup, addParticipantToEvent, Group as FirestoreGroup, Participant } from '@/app/lib/firestore';
import AuthGuard from '@/app/components/AuthGuard';

// Event-specific icons (using Lucide icons, not emojis)
const EVENT_ICONS = [
    'trophy', 'star', 'crown', 'award', 'sparkles', 'rocket', 'flame', 'gem',
    'heart', 'sun', 'moon', 'compass', 'book', 'music', 'camera', 'plane',
    'zap', 'shield', 'sword', 'wand', 'gamepad', 'palette'
];

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788', '#FF8FA3', '#C9ADA7'];

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Use types from firestore
type Group = FirestoreGroup;

export default function CreateEventPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [groupId, setGroupId] = useState<string>('');

    useEffect(() => {
        // useParams() returns params directly, not a Promise
        if (params && typeof params === 'object' && 'groupId' in params) {
            setGroupId(params.groupId as string);
        } else if (params && typeof (params as any).then === 'function') {
            // Handle Promise case (Next.js 15+)
            (params as Promise<any>).then((resolvedParams: any) => {
                if (resolvedParams?.groupId) {
                    setGroupId(resolvedParams.groupId as string);
                }
            }).catch((error) => {
                // Error resolving params
                router.push('/');
            });
        }
    }, [params, router]);

    const [group, setGroup] = useState<Group | null>(null);
    const [eventName, setEventName] = useState('');
    const [endDate, setEndDate] = useState('');
    const [starGoal, setStarGoal] = useState(100);
    const [eventIcon, setEventIcon] = useState('trophy');
    const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
    const [showNewParticipant, setShowNewParticipant] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showEventIconPicker, setShowEventIconPicker] = useState(false);

    // New participant fields
    const [newName, setNewName] = useState('');
    const [newIcon, setNewIcon] = useState(PARTICIPANT_EMOJIS[0]);
    const [newAge, setNewAge] = useState(5);
    const [newColor, setNewColor] = useState(COLORS[0]);
    const [newGender, setNewGender] = useState<'male' | 'female'>('male');

    const closePickers = () => {
        setShowIconPicker(false);
        setShowColorPicker(false);
        setShowEventIconPicker(false);
    };

    const newAgeLabel = newAge % 1 === 0 ? String(newAge) : newAge.toFixed(1);

    useEffect(() => {
        if (!groupId || !user) return;

        const unsubscribe = subscribeToGroup(user.uid, groupId, (firestoreGroup) => {
            if (firestoreGroup) {
                setGroup(firestoreGroup as Group);
            } else {
                router.push('/');
            }
        });

        return () => unsubscribe();
    }, [groupId, user, router]);

    const toggleParticipant = (participantId: string) => {
        const newSet = new Set(selectedParticipants);
        if (newSet.has(participantId)) {
            newSet.delete(participantId);
        } else {
            newSet.add(participantId);
        }
        setSelectedParticipants(newSet);
    };

    const handleAddNewParticipant = async () => {
        if (!newName.trim() || !group || !user) return;

        const newParticipant: Participant = {
            id: Date.now().toString(),
            name: newName.trim(),
            icon: newIcon,
            age: newAge,
            color: newColor,
            gender: newGender,
            totalStars: 0,
            eventCount: 0,
            completedEvents: []
        };

        try {
            const updatedParticipants = [...group.participants, newParticipant];
            await updateGroup(user.uid, groupId, { participants: updatedParticipants });
            setSelectedParticipants((prev) => new Set([...prev, newParticipant.id]));
            setGroup((prev) => (prev ? { ...prev, participants: updatedParticipants } : null));
            setShowNewParticipant(false);

            // Reset form
            setNewName('');
            setNewIcon(PARTICIPANT_EMOJIS[0]);
            setNewAge(5);
            setNewColor(COLORS[0]);
            setNewGender('male');
            closePickers();
        } catch (error) {
            // Error adding participant
            alert('שגיאה בהוספת משתתף');
        }
    };

    const handleCreateEvent = async () => {
        if (!eventName.trim()) {
            alert('נא להזין שם אירוע');
            return;
        }
        if (!endDate) {
            alert('נא לבחור תאריך סיום');
            return;
        }
        if (selectedParticipants.size === 0) {
            alert('נא לבחור לפחות משתתף אחד');
            return;
        }

        if (!user || !group) {
            router.push('/');
            return;
        }

        // Get groupId from params if state is empty
        const currentGroupId = groupId || (params?.groupId as string) || (typeof params === 'object' && 'groupId' in params ? params.groupId as string : '');
        
        if (!currentGroupId) {
            alert('שגיאה: לא נמצא מזהה קבוצה');
            // Group ID is missing
            return;
        }

        try {
            // Convert datetime-local string to timestamp
            const endDateTimestamp = new Date(endDate).getTime();
            
            if (isNaN(endDateTimestamp)) {
                alert('תאריך לא תקין');
                return;
            }

            const eventId = await createEvent(user.uid, currentGroupId, {
                name: eventName.trim(),
                icon: eventIcon,
                endDate: endDateTimestamp,
                starGoal,
            });

            // Add participants to event
            for (const participantId of selectedParticipants) {
                const participant = group.participants.find((p) => p.id === participantId);
                if (participant) {
                    await addParticipantToEvent(user.uid, currentGroupId, eventId, participant);
                }
            }
            router.push(`/group/${currentGroupId}`);
        } catch (error) {
            // Error creating event
            alert('שגיאה ביצירת אירוע');
        }
    };

    if (!group) {
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
                        aria-label="חזרה"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                        <CalendarPlus className="w-4 h-4 text-[#4D96FF]" />
                        <span className="text-sm font-black text-slate-900">צור הרפתקה</span>
                    </div>

                    <div className="w-10" />
                </div>
            </nav>

            <main className="max-w-md mx-auto px-3 pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="space-y-4"
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
                                <ParticipantIcon icon={eventIcon} className="w-6 h-6 text-slate-600" emojiSize="text-lg" />
                            </button>
                            
                            {/* Event Name */}
                            <input
                                type="text"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
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
                                        onClick={() => setStarGoal(Math.max(1, starGoal - 1))}
                                        className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
                                        aria-label="הורד יעד"
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={starGoal}
                                        onChange={(e) => setStarGoal(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                        className="w-12 text-sm font-black text-slate-900 text-center bg-transparent border-none outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setStarGoal(Math.min(100, starGoal + 1))}
                                        className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
                                        aria-label="העלה יעד"
                                    >
                                        <ChevronUp className="w-3 h-3" />
                                    </button>
                                </div>
                                <Star className="w-4 h-4" fill="currentColor" style={{ color: '#FFD93D' }} />
                                <BadgeCheck className="w-4 h-4 text-[#4D96FF]" />
                            </div>

                            {/* End Date */}
                            <div className="mt-4">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block text-center mb-2">מועד סיום</label>
                                <input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full h-10 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#4D96FF]"
                                />
                            </div>
                        </div>
                    </motion.section>

                    {/* Participants Section */}
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
                                    setShowNewParticipant(true);
                                    closePickers();
                                }}
                                className="h-10 px-4 rounded-2xl bg-slate-100 text-slate-700 font-black text-xs active:scale-95 transition-transform"
                            >
                                הוסף חדש
                            </button>
                        </div>

                        {group.participants.length === 0 ? (
                            <div className="mt-4 p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                <Sparkles className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-black text-slate-400">אין עדיין משתתפים בקבוצה</p>
                            </div>
                        ) : (
                            <div className="mt-4 grid grid-cols-1 gap-2">
                                {group.participants.map((participant) => {
                                    const selected = selectedParticipants.has(participant.id);
                                    return (
                                        <button
                                            key={participant.id}
                                            type="button"
                                            onClick={() => toggleParticipant(participant.id)}
                                            className={`w-full text-right bg-white rounded-2xl border-2 px-3 py-2.5 flex items-center gap-3 active:scale-95 transition-transform ${
                                                selected ? 'border-[#4D96FF]' : 'border-slate-200'
                                            }`}
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
                                                    {selected ? (
                                                        <span className="inline-flex items-center gap-1 text-[#4D96FF] font-black text-xs">
                                                            נבחר
                                                            <Check className="w-4 h-4" />
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 font-black text-xs">בחר</span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                                                    גיל {participant.age.toFixed(1)} {participant.gender === 'male' ? '👦' : '👧'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </motion.section>

                    {/* Create Button */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCreateEvent}
                            className="btn-star h-12 rounded-2xl flex items-center justify-center gap-2"
                        >
                            צור אירוע
                            <Sparkles className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push(`/group/${groupId}`)}
                            className="h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform"
                        >
                            ביטול
                        </motion.button>
                    </div>
                </motion.div>
            </main>

            {/* New Participant Sheet */}
            <AnimatePresence>
                {showNewParticipant && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                        onClick={() => {
                            setShowNewParticipant(false);
                            closePickers();
                        }}
                    >
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 30, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-[#4D96FF]" />
                                    <span className="text-lg font-black text-slate-900">משתתף חדש</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewParticipant(false);
                                        closePickers();
                                    }}
                                    className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 inline-flex items-center justify-center active:scale-95 transition-transform"
                                    aria-label="סגור"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Participant Card - Like add-participant page */}
                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-3xl border shadow-sm p-4 relative overflow-hidden mb-4"
                                style={{
                                    background: newColor,
                                    borderColor: newColor,
                                    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
                                }}
                            >
                                <div className="pattern-overlay" />
                                <div className="relative">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowColorPicker(false);
                                                    setShowIconPicker(true);
                                                }}
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white/35 backdrop-blur-md cursor-pointer active:scale-95 transition-transform"
                                                style={{ border: `1px solid ${hexToRgba(newColor, 0.35)}` }}
                                            >
                                                <ParticipantIcon icon={newIcon} className="w-14 h-14 text-slate-900" emojiSize="text-4xl" />
                                            </button>
                                            <div className="min-w-0 flex-1">
                                                <input
                                                    type="text"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    placeholder="הזן שם"
                                                    dir="rtl"
                                                    className="w-full text-base font-black text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-400"
                                                />
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewAge(Math.max(1, newAge - 0.5))}
                                                            className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-white/20 active:scale-95 transition-transform"
                                                            aria-label="הורד גיל"
                                                        >
                                                            <ChevronDown className="w-3 h-3" />
                                                        </button>
                                                        <span className="text-xs font-bold text-slate-800/75 min-w-[40px] text-center">
                                                            גיל {newAgeLabel}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewAge(Math.min(100, newAge + 0.5))}
                                                            className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-white/20 active:scale-95 transition-transform"
                                                            aria-label="העלה גיל"
                                                        >
                                                            <ChevronUp className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewGender('male')}
                                                            className={`h-7 w-7 rounded-lg flex items-center justify-center text-lg active:scale-95 transition-transform ${
                                                                newGender === 'male' ? 'bg-blue-500' : 'bg-white/20'
                                                            }`}
                                                        >
                                                            👦
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewGender('female')}
                                                            className={`h-7 w-7 rounded-lg flex items-center justify-center text-lg active:scale-95 transition-transform ${
                                                                newGender === 'female' ? 'bg-pink-500' : 'bg-white/20'
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
                                            style={{ backgroundColor: `${newColor}80` }}
                                            aria-label="בחר צבע"
                                        >
                                            <Palette className="w-5 h-5 text-white" />
                                        </button>
                                    </div>
                                </div>
                            </motion.section>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleAddNewParticipant}
                                    disabled={!newName.trim()}
                                    className="btn-star h-12 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    שמור
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewParticipant(false);
                                        closePickers();
                                    }}
                                    className="h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform"
                                >
                                    ביטול
                                </button>
                            </div>

                            {/* Icon Picker */}
                            <AnimatePresence>
                                {showIconPicker && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-white rounded-t-3xl p-4"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Smile className="w-4 h-4 text-[#4D96FF]" />
                                                <span className="text-sm font-black text-slate-900">בחר אייקון</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowIconPicker(false)}
                                                className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 inline-flex items-center justify-center active:scale-95 transition-transform"
                                                aria-label="סגור"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="max-h-[55vh] overflow-y-auto">
                                            <div className="grid grid-cols-6 gap-2">
                                                {PARTICIPANT_EMOJIS.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewIcon(emoji);
                                                            setShowIconPicker(false);
                                                        }}
                                                        className="h-12 rounded-2xl border border-slate-200 bg-white active:scale-95 transition-transform inline-flex items-center justify-center text-2xl"
                                                        aria-label={`בחר אייקון ${emoji}`}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Color Picker */}
                            <AnimatePresence>
                                {showColorPicker && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-white rounded-t-3xl p-4"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Palette className="w-4 h-4 text-[#4D96FF]" />
                                                <span className="text-sm font-black text-slate-900">בחר צבע</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowColorPicker(false)}
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
                                                        setNewColor(c);
                                                        setShowColorPicker(false);
                                                    }}
                                                    className="h-12 rounded-2xl border-2 border-white shadow-sm active:scale-95 transition-transform"
                                                    style={{
                                                        backgroundColor: c,
                                                        outline: c === newColor ? '3px solid #4D96FF' : 'none',
                                                    }}
                                                    aria-label={`בחר צבע ${c}`}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                                                    setEventIcon(iconKey);
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
