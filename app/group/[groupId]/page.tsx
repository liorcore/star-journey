'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, 
    Plus, 
    Calendar, 
    Users, 
    Copy, 
    Check, 
    Edit2, 
    Pencil,
    Trash2, 
    Star, 
    Clock, 
    ChevronLeft,
    Sparkles,
    UserPlus,
    Palette,
    Smile,
    X
} from 'lucide-react';
import confetti from 'canvas-confetti';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788', '#FF8FA3', '#C9ADA7'];
import { PARTICIPANT_ICONS, ParticipantIcon } from '@/app/lib/participantIcons';

function hexToRgba(hex: string, alpha: number) {
    const clean = hex.replace('#', '').trim();
    if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(0,0,0,${alpha})`;
    return `rgba(${r},${g},${b},${alpha})`;
}

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

interface Event {
    id: string;
    name: string;
    endDate: number;
    starGoal: number;
    participants: { participantId: string; stars: number }[];
}

interface Group {
    id: string;
    name: string;
    code: string;
    participants: Participant[];
    events: Event[];
}

import { Heebo } from 'next/font/google';

const heebo = Heebo({ 
    subsets: ['hebrew', 'latin'],
    weight: ['400', '700', '900'],
    variable: '--font-heebo',
});

export default function GroupPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;

    const [group, setGroup] = useState<Group | null>(null);
    const [showEditName, setShowEditName] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [copiedCode, setCopiedCode] = useState(false);

    const [showEditParticipant, setShowEditParticipant] = useState(false);
    const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
    const [pName, setPName] = useState('');
    // keep as string to support legacy emoji icons already saved in localStorage
    const [pIcon, setPIcon] = useState<string>(PARTICIPANT_ICONS[0].key);
    const [pAge, setPAge] = useState<number>(5);
    const [pColor, setPColor] = useState(COLORS[0]);
    const [pGender, setPGender] = useState<'male' | 'female'>('male');
    const [showPIconPicker, setShowPIconPicker] = useState(false);
    const [showPColorPicker, setShowPColorPicker] = useState(false);

    useEffect(() => {
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const foundGroup = groups.find((g: Group) => g.id === groupId);
        if (foundGroup) {
            setGroup(foundGroup);
            setNewGroupName(foundGroup.name);
        } else {
            router.push('/');
        }
    }, [groupId, router]);

    const updateGroup = (updatedGroup: Group) => {
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const index = groups.findIndex((g: Group) => g.id === groupId);
        if (index !== -1) {
            groups[index] = updatedGroup;
            localStorage.setItem('groups', JSON.stringify(groups));
            setGroup(updatedGroup);
        }
    };

    const openEditParticipant = (participant: Participant) => {
        setEditingParticipantId(participant.id);
        setPName(participant.name);
        setPIcon(participant.icon);
        setPAge(participant.age ?? 5);
        setPColor(participant.color);
        setPGender(participant.gender);
        setShowEditParticipant(true);
        setShowPIconPicker(false);
        setShowPColorPicker(false);
    };

    const closeParticipantSheets = () => {
        setShowEditParticipant(false);
        setEditingParticipantId(null);
        setShowPIconPicker(false);
        setShowPColorPicker(false);
    };

    const handleSaveParticipantEdit = () => {
        if (!group || !editingParticipantId) return;
        if (!pName.trim()) {
            alert('נא להזין שם');
            return;
        }

        const updatedParticipants = group.participants.map((p) => {
            if (p.id !== editingParticipantId) return p;
            return {
                ...p,
                name: pName.trim(),
                icon: pIcon,
                age: pAge,
                color: pColor,
                gender: pGender,
            };
        });

        updateGroup({ ...group, participants: updatedParticipants });
        closeParticipantSheets();
    };

    const handleUpdateName = () => {
        if (group && newGroupName.trim()) {
            updateGroup({ ...group, name: newGroupName });
            setShowEditName(false);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

    const handleCopyCode = () => {
        if (group) {
            navigator.clipboard.writeText(group.code);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const handleDeleteEvent = (eventId: string) => {
        if (group && confirm('האם אתה בטוח שברצונך למחוק את האירוע?')) {
            const updatedEvents = group.events.filter(e => e.id !== eventId);
            updateGroup({ ...group, events: updatedEvents });
        }
    };

    const getTimeRemaining = (endDate: number) => {
        const now = Date.now();
        const diff = endDate - now;

        if (diff <= 0) return 'הסתיים';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days} ימים ו-${hours} שעות`;
        return `${hours} שעות`;
    };

    const pAgeLabel = pAge % 1 === 0 ? String(pAge) : pAge.toFixed(1);

    if (!group) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                    <Sparkles className="w-12 h-12 text-[#4D96FF]" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-[#F1F5F9] pb-16 ${heebo.variable} font-sans`} dir="rtl">
            {/* Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 h-14 sm:h-20 bg-white border-b border-slate-200 z-50 px-3 sm:px-6">
                <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => router.push('/')}
                        className="p-2 rounded-lg sm:rounded-xl bg-slate-100 text-slate-600"
                    >
                        <Home size={18} className="sm:w-6 sm:h-6" />
                    </motion.button>
                    
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-slate-100 text-slate-700 font-black text-[10px] sm:text-sm"
                    >
                        {copiedCode ? <Check size={12} className="text-green-500 sm:w-4 sm:h-4" /> : <Copy size={12} className="sm:w-4 sm:h-4" />}
                        <span className="font-mono">{group.code}</span>
                    </motion.button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-16 sm:pt-24">
                {/* Group Header */}
                <section className="text-center mb-6 sm:mb-12">
                    <AnimatePresence mode="wait">
                        {showEditName ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center justify-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="text-lg sm:text-4xl font-black bg-white border-2 border-[#4D96FF] rounded-xl px-3 py-1.5 text-center focus:outline-none w-full max-w-[200px] sm:max-w-md"
                                    dir="rtl"
                                    autoFocus
                                />
                                <button onClick={handleUpdateName} className="p-2 sm:p-3 bg-[#4D96FF] text-white rounded-lg font-black text-sm">✓</button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="cursor-pointer py-1"
                                onClick={() => setShowEditName(true)}
                            >
                                <h1 className="text-xl sm:text-5xl font-black rainbow-text mb-1 px-2 break-words leading-tight">
                                    {group.name}
                                </h1>
                                <div className="flex justify-center items-center text-slate-400">
                                    <Edit2 size={14} className="sm:w-4 sm:h-4" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Participants Section - Mobile First */}
                <section className="mb-6 sm:mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Users className="text-[#4D96FF] w-4 h-4 sm:w-6 sm:h-6" />
                            הצוות
                        </h2>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => router.push(`/group/${groupId}/add-participant`)}
                            className="p-1.5 sm:p-2 bg-slate-100 text-slate-600 rounded-lg"
                        >
                            <UserPlus size={16} className="sm:w-5 sm:h-5" />
                        </motion.button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        {[...group.participants]
                            .sort((a, b) => b.totalStars - a.totalStars)
                            .map((participant, index) => (
                                <div
                                    key={participant.id}
                                    className="bg-white p-2.5 sm:p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2 sm:gap-3"
                                >
                                    <div 
                                        className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg sm:text-2xl relative overflow-hidden shrink-0"
                                        style={{ backgroundColor: `${participant.color}22`, border: `1px solid ${participant.color}` }}
                                    >
                                        <div className="pattern-overlay" />
                                        <ParticipantIcon icon={participant.icon} className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <h3 className="font-black text-slate-900 truncate text-xs sm:text-base">{participant.name}</h3>
                                            <span className="font-black text-xs sm:text-base text-[#FFD93D] flex items-center gap-0.5 shrink-0">
                                                {participant.totalStars}
                                                <Star className="w-2.5 h-2.5 sm:w-4 sm:h-4" fill="currentColor" />
                                            </span>
                                        </div>
                                        <div className="w-full h-1 sm:h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all"
                                                style={{ 
                                                    width: `${Math.min(100, (participant.totalStars / 50) * 100)}%`,
                                                    backgroundColor: participant.color 
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {index < 3 && (
                                            <div className="text-base sm:text-xl">
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                            </div>
                                        )}
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => openEditParticipant(participant)}
                                            className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg bg-slate-100 text-slate-600"
                                            title="ערוך משתתף"
                                            aria-label={`ערוך ${participant.name}`}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>

                {/* Events Section */}
                <section className="mb-6">
                    <div className="flex items-center justify-between mb-4 gap-2">
                        <h2 className="text-base sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Calendar className="text-[#4D96FF] w-4 h-4 sm:w-6 sm:h-6" />
                            הרפתקאות
                        </h2>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push(`/group/${groupId}/create-event`)}
                            className="btn-star flex items-center gap-1 px-2.5 py-1.5 sm:px-5 sm:py-2.5 text-[10px] sm:text-sm"
                        >
                            <Plus size={14} className="sm:w-4 sm:h-4" />
                            <span>חדש</span>
                        </motion.button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {group.events.length === 0 ? (
                            <div className="col-span-full p-5 sm:p-10 bg-white rounded-xl border-2 border-dashed border-slate-200 text-center">
                                <Sparkles className="w-5 h-5 sm:w-10 sm:h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs sm:text-lg font-bold text-slate-400">אין הרפתקאות</p>
                            </div>
                        ) : (
                            group.events.map((event) => (
                                <div
                                    key={event.id}
                                    className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden cursor-pointer"
                                    onClick={() => router.push(`/group/${groupId}/event/${event.id}`)}
                                >
                                    <div className="pattern-overlay" />
                                    
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteEvent(event.id);
                                        }}
                                        className="absolute top-2 left-2 sm:top-4 sm:left-4 p-1 text-slate-300 hover:text-red-500 z-10"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>

                                    <h3 className="text-sm sm:text-xl font-black text-slate-900 mb-2 sm:mb-4 pr-6">{event.name}</h3>
                                    
                                    <div className="space-y-1.5 sm:space-y-3 mb-3 sm:mb-5">
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 font-bold text-[10px] sm:text-sm">
                                            <div className="p-1 bg-slate-100 rounded"><Clock className="w-3 h-3 sm:w-4 sm:h-4" /></div>
                                            <span>{getTimeRemaining(event.endDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 font-bold text-[10px] sm:text-sm">
                                            <div className="p-1 bg-yellow-50 text-[#FFD93D] rounded"><Star className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" /></div>
                                            <span>יעד: {event.starGoal}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {event.participants.map((ep) => {
                                            const p = group.participants.find(part => part.id === ep.participantId);
                                            return p ? (
                                                <div
                                                    key={p.id}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] sm:text-xs font-black text-slate-900 border"
                                                    style={{
                                                        backgroundColor: hexToRgba(p.color, 0.22),
                                                        borderColor: hexToRgba(p.color, 0.35),
                                                    }}
                                                >
                                                    <span className="truncate max-w-[110px] sm:max-w-[160px]">{p.name}</span>
                                                    <span className="inline-flex items-center gap-0.5 text-slate-800">
                                                        <span className="font-black">{ep.stars}</span>
                                                        <Star className="w-3 h-3" fill="currentColor" style={{ color: '#FFD93D' }} />
                                                    </span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Edit Participant Sheet */}
                <AnimatePresence>
                    {showEditParticipant && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/40"
                            onClick={closeParticipantSheets}
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
                                        <Pencil className="w-4 h-4 text-[#4D96FF]" />
                                        <span className="text-sm font-black text-slate-900">עריכת משתתף</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeParticipantSheets}
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
                                            value={pName}
                                            onChange={(e) => setPName(e.target.value)}
                                            className="mt-2 w-full h-11 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-black text-slate-900 focus:outline-none focus:border-[#4D96FF]"
                                            dir="rtl"
                                        />
                                    </div>

                                    {/* Icon + Color */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPColorPicker(false);
                                                setShowPIconPicker(true);
                                            }}
                                            className="bg-slate-50 rounded-2xl border border-slate-200 p-3 active:scale-95 transition-transform"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Smile className="w-4 h-4 text-[#4D96FF]" />
                                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">אייקון</span>
                                                </div>
                                                <span className="w-7 h-7 inline-flex items-center justify-center text-slate-900">
                                                    <ParticipantIcon icon={pIcon} className="w-6 h-6" />
                                                </span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPIconPicker(false);
                                                setShowPColorPicker(true);
                                            }}
                                            className="bg-slate-50 rounded-2xl border border-slate-200 p-3 active:scale-95 transition-transform"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Palette className="w-4 h-4 text-[#4D96FF]" />
                                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">צבע</span>
                                                </div>
                                                <span className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: pColor }} />
                                            </div>
                                        </button>
                                    </div>

                                    {/* Age */}
                                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">גיל</span>
                                            <span className="text-xl font-black text-slate-900">{pAgeLabel}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="100"
                                            step="0.5"
                                            value={pAge}
                                            onChange={(e) => setPAge(parseFloat(e.target.value))}
                                            className="mt-3 w-full h-3 rounded-full appearance-none cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to left, #4D96FF 0%, #4D96FF ${(pAge / 100) * 100}%, #e2e8f0 ${(pAge / 100) * 100}%, #e2e8f0 100%)`
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
                                                onClick={() => setPGender('male')}
                                                className={`h-12 rounded-2xl border-2 font-black text-2xl active:scale-95 transition-transform ${
                                                    pGender === 'male' ? 'border-[#4D96FF] bg-blue-50' : 'border-slate-200 bg-white'
                                                }`}
                                            >
                                                👦
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPGender('female')}
                                                className={`h-12 rounded-2xl border-2 font-black text-2xl active:scale-95 transition-transform ${
                                                    pGender === 'female' ? 'border-[#4D96FF] bg-blue-50' : 'border-slate-200 bg-white'
                                                }`}
                                            >
                                                👧
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <button
                                            onClick={handleSaveParticipantEdit}
                                            className="btn-star h-12 rounded-2xl flex items-center justify-center gap-2"
                                        >
                                            שמור
                                        </button>
                                        <button
                                            type="button"
                                            onClick={closeParticipantSheets}
                                            className="h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform"
                                        >
                                            ביטול
                                        </button>
                                    </div>
                                </div>

                                {/* Icon Picker */}
                                <AnimatePresence>
                                    {showPIconPicker && (
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
                                                    onClick={() => setShowPIconPicker(false)}
                                                    className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 inline-flex items-center justify-center active:scale-95 transition-transform"
                                                    aria-label="סגור"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="max-h-[55vh] overflow-y-auto">
                                                <div className="grid grid-cols-6 gap-2">
                                                    {PARTICIPANT_ICONS.map(({ key, label }) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => {
                                                                setPIcon(key);
                                                                setShowPIconPicker(false);
                                                            }}
                                                            className="h-12 rounded-2xl border border-slate-200 bg-white active:scale-95 transition-transform inline-flex items-center justify-center"
                                                            aria-label={`בחר אייקון ${label}`}
                                                        >
                                                            <ParticipantIcon icon={key} className="w-6 h-6 text-slate-900" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Color Picker */}
                                <AnimatePresence>
                                    {showPColorPicker && (
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
                                                    onClick={() => setShowPColorPicker(false)}
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
                                                            setPColor(c);
                                                            setShowPColorPicker(false);
                                                        }}
                                                        className="h-12 rounded-2xl border-2 border-white shadow-sm active:scale-95 transition-transform"
                                                        style={{
                                                            backgroundColor: c,
                                                            outline: c === pColor ? '3px solid #4D96FF' : 'none',
                                                        }}
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
            </main>
        </div>
    );
}
