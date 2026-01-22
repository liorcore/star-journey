'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, CalendarPlus, Check, ChevronRight, ChevronUp, ChevronDown, Palette, Smile, Sparkles, Star, Users, X, BadgeCheck } from 'lucide-react';
import { ParticipantIcon, PARTICIPANT_ICONS } from '@/app/lib/participantIcons';
import { PARTICIPANT_EMOJIS } from '@/app/lib/participantEmoji';

// Event-specific icons (using Lucide icons, not emojis)
const EVENT_ICONS = [
    'trophy', 'star', 'crown', 'award', 'sparkles', 'rocket', 'flame', 'gem',
    'heart', 'sun', 'moon', 'compass', 'book', 'music', 'camera', 'plane',
    'zap', 'shield', 'sword', 'wand', 'gamepad', 'palette'
];

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
    completedEvents?: any[];
}

interface Group {
    id: string;
    name: string;
    code: string;
    participants: Participant[];
    events: any[];
}

export default function CreateEventPage() {
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

    const [group, setGroup] = useState<Group | null>(null);
    const [eventName, setEventName] = useState('');
    const [endDate, setEndDate] = useState('');
    const [starGoal, setStarGoal] = useState(100);
    const [eventIcon, setEventIcon] = useState('trophy');
    const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
    const [showNewParticipant, setShowNewParticipant] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

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
        if (!groupId) return;
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const foundGroup = groups.find((g: Group) => g.id === groupId);
        if (foundGroup) {
            setGroup(foundGroup);
        } else {
            router.push('/');
        }
    }, [groupId, router]);

    const toggleParticipant = (participantId: string) => {
        const newSet = new Set(selectedParticipants);
        if (newSet.has(participantId)) {
            newSet.delete(participantId);
        } else {
            newSet.add(participantId);
        }
        setSelectedParticipants(newSet);
    };

    const handleAddNewParticipant = () => {
        if (!newName.trim() || !group) return;

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

        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const groupIndex = groups.findIndex((g: Group) => g.id === groupId);
        groups[groupIndex].participants.push(newParticipant);
        localStorage.setItem('groups', JSON.stringify(groups));

        setGroup(groups[groupIndex]);
        setSelectedParticipants(new Set([...selectedParticipants, newParticipant.id]));
        setShowNewParticipant(false);

        // Reset form
        setNewName('');
        setNewIcon(PARTICIPANT_EMOJIS[0]);
        setNewAge(5);
        setNewColor(COLORS[0]);
        setNewGender('male');
        closePickers();
    };

    const handleCreateEvent = () => {
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

        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const groupIndex = groups.findIndex((g: Group) => g.id === groupId);

        if (groupIndex === -1) {
            router.push('/');
            return;
        }

        const newEvent = {
            id: Date.now().toString(),
            name: eventName.trim(),
            icon: eventIcon,
            endDate: new Date(endDate).getTime(),
            starGoal,
            participants: Array.from(selectedParticipants).map(pid => ({
                participantId: pid,
                stars: 0
            }))
        };

        groups[groupIndex].events.push(newEvent);

        // Update participant event counts
        selectedParticipants.forEach(pid => {
            const participant = groups[groupIndex].participants.find((p: Participant) => p.id === pid);
            if (participant) {
                participant.eventCount = (participant.eventCount || 0) + 1;
            }
        });

        localStorage.setItem('groups', JSON.stringify(groups));
        router.push(`/group/${groupId}`);
    };

    if (!group) {
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
                        className="fixed inset-0 z-[60] bg-black/40"
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
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#4D96FF]" />
                                    <span className="text-sm font-black text-slate-900">משתתף חדש</span>
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

                            <div className="space-y-3">
                                {/* Name */}
                                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
                                    <div className="text-[11px] font-black text-slate-600 uppercase tracking-wider">שם</div>
                                    <input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="שם המשתתף"
                                        className="mt-2 w-full h-11 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-black text-slate-900 focus:outline-none focus:border-[#4D96FF]"
                                        dir="rtl"
                                    />
                                </div>

                                {/* Icon + Color */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowColorPicker(false);
                                            setShowIconPicker(true);
                                        }}
                                        className="bg-slate-50 rounded-2xl border border-slate-200 p-3 active:scale-95 transition-transform"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Smile className="w-4 h-4 text-[#4D96FF]" />
                                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">אייקון</span>
                                            </div>
                                            <span className="w-7 h-7 inline-flex items-center justify-center">
                                                <ParticipantIcon icon={newIcon} className="w-7 h-7" emojiSize="text-2xl" />
                                            </span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowIconPicker(false);
                                            setShowColorPicker(true);
                                        }}
                                        className="bg-slate-50 rounded-2xl border border-slate-200 p-3 active:scale-95 transition-transform"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Palette className="w-4 h-4 text-[#4D96FF]" />
                                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">צבע</span>
                                            </div>
                                            <span className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: newColor }} />
                                        </div>
                                    </button>
                                </div>

                                {/* Age */}
                                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">גיל</span>
                                        <span className="text-xl font-black text-slate-900">{newAgeLabel}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        step="0.5"
                                        value={newAge}
                                        onChange={(e) => setNewAge(parseFloat(e.target.value))}
                                        className="mt-3 w-full h-3 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to left, #4D96FF 0%, #4D96FF ${(newAge / 100) * 100}%, #e2e8f0 ${(newAge / 100) * 100}%, #e2e8f0 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-[11px] mt-2 text-slate-400 font-bold">
                                        <span>1</span>
                                        <span>100</span>
                                    </div>
                                </div>

                                {/* Gender */}
                                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
                                    <div className="text-[11px] font-black text-slate-600 uppercase tracking-wider">מין</div>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewGender('male')}
                                            className={`h-12 rounded-2xl border-2 font-black text-2xl active:scale-95 transition-transform ${
                                                newGender === 'male' ? 'border-[#4D96FF] bg-blue-50' : 'border-slate-200 bg-white'
                                            }`}
                                        >
                                            👦
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewGender('female')}
                                            className={`h-12 rounded-2xl border-2 font-black text-2xl active:scale-95 transition-transform ${
                                                newGender === 'female' ? 'border-[#4D96FF] bg-blue-50' : 'border-slate-200 bg-white'
                                            }`}
                                        >
                                            👧
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <button
                                        onClick={handleAddNewParticipant}
                                        className="btn-star h-12 rounded-2xl flex items-center justify-center gap-2"
                                    >
                                        הוסף
                                        <Check className="w-4 h-4" />
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
                                                {EVENT_ICONS.map((iconKey) => {
                                                    const iconData = PARTICIPANT_ICONS.find(icon => icon.key === iconKey);
                                                    return iconData ? (
                                                        <button
                                                            key={iconKey}
                                                            type="button"
                                                            onClick={() => {
                                                                setEventIcon(iconKey);
                                                                setShowIconPicker(false);
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
    );
}
