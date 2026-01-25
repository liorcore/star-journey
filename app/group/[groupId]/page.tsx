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
    ChevronUp,
    ChevronDown,
    Sparkles,
    UserPlus,
    Palette,
    Smile,
    X,
    Trophy,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/contexts/AuthContext';
import { subscribeToGroup, updateGroup as updateGroupFirestore, deleteEvent, getGroupEvents, deleteParticipantFromGroup, Group as FirestoreGroup, Event as FirestoreEvent, Participant } from '@/app/lib/firestore';
import { db } from '@/app/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import AuthGuard from '@/app/components/AuthGuard';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788', '#FF8FA3', '#C9ADA7'];
import { ParticipantIcon } from '@/app/lib/participantIcons';
import { PARTICIPANT_EMOJIS } from '@/app/lib/participantEmoji';

function hexToRgba(hex: string, alpha: number) {
    const clean = hex.replace('#', '').trim();
    if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(0,0,0,${alpha})`;
    return `rgba(${r},${g},${b},${alpha})`;
}

// Use types from firestore
type Event = FirestoreEvent;
type Group = FirestoreGroup;


export default function GroupPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [groupId, setGroupId] = useState<string>('');

    useEffect(() => {
        const getParams = async () => {
            try {
                const resolvedParams = await params;
                setGroupId(resolvedParams.groupId as string);
            } catch (error) {
                // Error resolving params
                router.push('/');
            }
        };
        getParams();
    }, [params, router]);

    const [group, setGroup] = useState<Group | null>(null);
    const [showEditName, setShowEditName] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [copiedCode, setCopiedCode] = useState(false);
    const [showDeleteParticipantDialog, setShowDeleteParticipantDialog] = useState(false);
    const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);

    const [showEditParticipant, setShowEditParticipant] = useState(false);
    const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
    const [pName, setPName] = useState('');
    // keep as string to support legacy emoji icons already saved in localStorage
    const [pIcon, setPIcon] = useState<string>(PARTICIPANT_EMOJIS[0]);
    const [pAge, setPAge] = useState<number>(5);
    const [pColor, setPColor] = useState(COLORS[0]);
    const [pGender, setPGender] = useState<'male' | 'female'>('male');
    const [showPIconPicker, setShowPIconPicker] = useState(false);
    const [showPColorPicker, setShowPColorPicker] = useState(false);
    const [swipeTranslateX, setSwipeTranslateX] = useState<Record<string, number>>({});
    const [swipeStartX, setSwipeStartX] = useState<Record<string, number | undefined>>({});

    useEffect(() => {
        if (!groupId || !user) return;

        let events: FirestoreEvent[] = [];
        let eventsUnsubscribe: (() => void) | null = null;

        // Load events and subscribe to changes
        const loadEvents = async () => {
            try {
                events = await getGroupEvents(user.uid, groupId);
                // Ensure all events have icon field
                events.forEach((event: FirestoreEvent) => {
                    if (!event.icon) {
                        event.icon = 'trophy'; // default icon
                    }
                });
                // In demo mode (no db) or before Firestore subscription: merge events into group
                setGroup((prev) => (prev ? { ...prev, events } : prev));

                // Subscribe to events collection changes (Firebase only; when db is null we use getGroupEvents only)
                if (db) {
                    const eventsRef = collection(db, 'users', user.uid, 'groups', groupId, 'events');
                    eventsUnsubscribe = onSnapshot(eventsRef, (snapshot) => {
                        const updatedEvents = snapshot.docs.map((doc) => {
                            const eventData = doc.data();
                            if (!eventData.icon) {
                                eventData.icon = 'trophy';
                            }
                            return {
                                id: doc.id,
                                ...eventData,
                            } as FirestoreEvent;
                        });

                        events = updatedEvents;

                        setGroup((prevGroup) => {
                            if (prevGroup) {
                                return { ...prevGroup, events: updatedEvents } as Group;
                            }
                            return prevGroup;
                        });
                    });
                }
            } catch (error) {
                // Error loading events
            }
        };

        loadEvents();

        // Subscribe to group changes
        const unsubscribe = subscribeToGroup(user.uid, groupId, (firestoreGroup) => {
            if (firestoreGroup) {
                // Ensure all participants have completedEvents field
                firestoreGroup.participants.forEach((participant: Participant) => {
                    if (!participant.completedEvents) {
                        participant.completedEvents = [];
                    }
                    // Ensure all achievements have eventCompleted field
                    participant.completedEvents.forEach((achievement: any) => {
                        if (achievement.eventCompleted === undefined) {
                            // Check if the corresponding event exists and is completed
                            const event = events.find((e: FirestoreEvent) => e.id === achievement.eventId);
                            achievement.eventCompleted = event ? event.endDate < Date.now() : false;
                        }
                    });
                });

                // Update group with current events (from the events listener)
                setGroup((prevGroup) => {
                    const currentEvents = prevGroup?.events || events;
                    return { ...firestoreGroup, events: currentEvents } as Group;
                });
                setNewGroupName(firestoreGroup.name);
            } else {
                router.push('/');
            }
        });

        return () => {
            unsubscribe();
            if (eventsUnsubscribe) eventsUnsubscribe();
        };
    }, [groupId, user, router]);

    const updateGroup = async (updatedGroup: Group) => {
        if (!user) return;
        try {
            await updateGroupFirestore(user.uid, groupId, updatedGroup);
            // The real-time listener will update the state automatically
        } catch (error) {
            // Error updating group
            alert('שגיאה בעדכון קבוצה');
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

    const handleDeleteParticipant = (participant: Participant) => {
        setParticipantToDelete(participant);
        setShowDeleteParticipantDialog(true);
    };

    const handleSwipeStart = (e: React.TouchEvent, participantId: string) => {
        setSwipeStartX({ ...swipeStartX, [participantId]: e.touches[0].clientX });
    };

    const handleSwipeMove = (e: React.TouchEvent, participantId: string) => {
        const startX = swipeStartX[participantId];
        if (startX === undefined) return;
        const deltaX = startX - e.touches[0].clientX;
        const newTranslateX = Math.max(-80, Math.min(0, -deltaX));
        setSwipeTranslateX({ ...swipeTranslateX, [participantId]: newTranslateX });
    };

    const handleSwipeEnd = (participantId: string) => {
        const currentTranslate = swipeTranslateX[participantId] || 0;
        if (currentTranslate < -40) {
            setSwipeTranslateX({ ...swipeTranslateX, [participantId]: -80 });
        } else {
            setSwipeTranslateX({ ...swipeTranslateX, [participantId]: 0 });
        }
        setSwipeStartX({ ...swipeStartX, [participantId]: undefined });
    };

    const confirmDeleteParticipant = async () => {
        if (!user || !group || !participantToDelete) return;

        try {
            await deleteParticipantFromGroup(user.uid, groupId, participantToDelete.id);
            setShowDeleteParticipantDialog(false);
            setParticipantToDelete(null);
            // The real-time listener will update the state automatically
        } catch (error) {
            // Error deleting participant
            alert('שגיאה במחיקת משתתף');
        }
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

    const handleDeleteEvent = async (eventId: string) => {
        if (!group || !user) return;
        
        if (!confirm('האם אתה בטוח שברצונך למחוק את האירוע?')) {
            return;
        }

        try {
            await deleteEvent(user.uid, groupId, eventId);
            // Real-time listener will update automatically
        } catch (error: any) {
            // Error deleting event
            alert('שגיאה במחיקת אירוע');
        }
    };

    const formatDate = (timestamp: number | { toMillis: () => number } | any) => {
        let date: Date;
        if (timestamp && typeof timestamp === 'object' && 'toMillis' in timestamp) {
            // Firestore Timestamp
            date = new Date(timestamp.toMillis());
        } else if (typeof timestamp === 'number') {
            date = new Date(timestamp);
        } else {
            return 'לא זמין';
        }
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
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

    const getEventDuration = (event: any) => {
        const startDate = event.createdAt 
            ? (typeof event.createdAt === 'object' && 'toMillis' in event.createdAt 
                ? event.createdAt.toMillis() 
                : typeof event.createdAt === 'number' 
                    ? event.createdAt 
                    : Date.now())
            : event.endDate;
        const endDate = event.endDate;
        const diff = endDate - startDate;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days} ימים ו-${hours} שעות`;
        return `${hours} שעות`;
    };

    const pAgeLabel = pAge.toFixed(1);

    if (!group) {
        return (
            <AuthGuard>
                <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                        <Sparkles className="w-12 h-12 text-[#4D96FF]" />
                    </motion.div>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-[#F1F5F9] pb-16" dir="rtl">
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
                    
                    <div className="flex-1 text-center px-4 flex items-center justify-center">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                    </div>
                    
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-slate-100 text-slate-700 font-black text-[10px] sm:text-sm"
                    >
                        {copiedCode ? <Check size={12} className="text-green-500 sm:w-4 sm:h-4" /> : <Copy size={12} className="sm:w-4 sm:h-4" />}
                        <span className="font-mono">{group?.code || ''}</span>
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
                                <h1 className="text-2xl sm:text-6xl font-black rainbow-text mb-1 px-2 break-words leading-tight">
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
                        <h2 className="text-xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
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
                            .sort((a, b) => {
                                const aTotal = (group?.events || []).reduce((sum, event) => {
                                    const ep = event.participants.find(ep => ep.participantId === a.id);
                                    return sum + (ep?.stars || 0);
                                }, 0);
                                const bTotal = (group?.events || []).reduce((sum, event) => {
                                    const ep = event.participants.find(ep => ep.participantId === b.id);
                                    return sum + (ep?.stars || 0);
                                }, 0);
                                return bTotal - aTotal;
                            })
                            .map((participant, index) => (
                                <div
                                    key={participant.id}
                                    className="relative overflow-visible"
                                    onTouchStart={(e) => handleSwipeStart(e, participant.id)}
                                    onTouchMove={(e) => handleSwipeMove(e, participant.id)}
                                    onTouchEnd={() => handleSwipeEnd(participant.id)}
                                >
                                    <div
                                        className="p-2.5 sm:p-4 rounded-xl shadow-sm border-2 flex flex-col gap-2 sm:gap-3 transition-transform relative"
                                        style={{ 
                                            transform: `translateX(${swipeTranslateX[participant.id] || 0}px)`,
                                            backgroundColor: hexToRgba(participant.color, 0.1),
                                            borderColor: participant.color
                                        }}
                                    >
                                    <div className="flex items-start gap-2 sm:gap-3 w-full">
                                    <div 
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center text-xl sm:text-3xl relative overflow-hidden shrink-0 mt-0.5"
                                        style={{ backgroundColor: `${participant.color}22`, border: `1px solid ${participant.color}` }}
                                    >
                                        <div className="pattern-overlay" />
                                        <ParticipantIcon icon={participant.icon} className="text-slate-900" emojiSize="text-3xl sm:text-4xl" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div>
                                            <h3 className="font-black text-slate-900 truncate text-lg sm:text-2xl leading-tight">{participant.name}</h3>
                                            {/* Age and Gender */}
                                            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-600 mt-0.5">
                                                <span>גיל {participant.age.toFixed(1)}</span>
                                                <span>{participant.gender === 'male' ? '👦' : '👧'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                                        {index < 3 && (
                                            <div className="text-base sm:text-xl">
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                            </div>
                                        )}
                                        {/* Stars - next to medals */}
                                        {(() => {
                                            const totalStarsFromEvents = (group?.events || []).reduce((sum, event) => {
                                                const eventParticipant = event.participants.find(ep => ep.participantId === participant.id);
                                                return sum + (eventParticipant?.stars || 0);
                                            }, 0);
                                            
                                            if (totalStarsFromEvents === 0) return null;
                                            
                                            return (
                                                <div className="flex items-center gap-1.5">
                                                    <Star className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" style={{ color: '#FFD93D' }} />
                                                    <span className="text-lg sm:text-xl font-black text-slate-900">{totalStarsFromEvents}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    </div>
                                    
                                    {/* Event Badge and Completed Events Tags - bottom strip */}
                                    {(() => {
                                        const totalStarsFromEvents = (group?.events || []).reduce((sum, event) => {
                                            const eventParticipant = event.participants.find(ep => ep.participantId === participant.id);
                                            return sum + (eventParticipant?.stars || 0);
                                        }, 0);
                                        
                                        // Calculate completed events from actual events in the group
                                        const completedEventsList = (group?.events || [])
                                            .filter(event => {
                                                const eventParticipant = event.participants.find(ep => ep.participantId === participant.id);
                                                if (!eventParticipant) return false;
                                                // Event is completed if participant reached the goal
                                                return eventParticipant.stars >= event.starGoal;
                                            })
                                            .map(event => {
                                                const eventParticipant = event.participants.find(ep => ep.participantId === participant.id);
                                                return {
                                                    eventId: event.id,
                                                    eventName: event.name,
                                                    stars: eventParticipant?.stars || 0,
                                                    starGoal: event.starGoal,
                                                    icon: event.icon || 'trophy'
                                                };
                                            });
                                        
                                        // Get current event icon
                                        const participantEvents = (group?.events || [])
                                            .filter(event => {
                                                const eventParticipant = event.participants.find(ep => ep.participantId === participant.id);
                                                return eventParticipant && eventParticipant.stars > 0;
                                            })
                                            .map(event => {
                                                const eventParticipant = event.participants.find(ep => ep.participantId === participant.id);
                                                return {
                                                    name: event.name,
                                                    stars: eventParticipant?.stars || 0,
                                                    icon: event.icon || 'trophy',
                                                    endDate: event.endDate
                                                };
                                            })
                                            .sort((a, b) => {
                                                return (b.endDate || 0) - (a.endDate || 0);
                                            });
                                        
                                        const currentEventIcon = participantEvents.length > 0 ? participantEvents[0].icon : 'trophy';
                                        const totalGoal = (group?.events || []).reduce((sum, event) => {
                                            const eventParticipant = event.participants.find(ep => ep.participantId === participant.id);
                                            if (eventParticipant) {
                                                return sum + event.starGoal;
                                            }
                                            return sum;
                                        }, 0);
                                        
                                        // Always show the bottom strip with edit button, even if no events
                                        return (
                                            <div className="w-full mt-2 pt-2 border-t border-slate-200">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {/* Current Event Badge */}
                                                        {totalStarsFromEvents > 0 && (
                                                        <div className="relative group inline-block">
                                                            <div 
                                                                className="w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center text-[10px] sm:text-xs shadow-sm"
                                                            >
                                                                <ParticipantIcon icon={currentEventIcon} className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" emojiSize="text-sm" />
                                                            </div>
                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-lg max-w-xs">
                                                                <div className="flex items-center gap-1 mb-1">
                                                                    <Star className="w-3 h-3" fill="currentColor" style={{ color: '#FFD93D' }} />
                                                                    <span>{totalStarsFromEvents}/{totalGoal}</span>
                                                                </div>
                                                                {participantEvents.length > 0 && (
                                                                    <div className="border-t border-slate-700 pt-1 mt-1">
                                                                        {participantEvents.map((event, idx) => (
                                                                            <div key={idx} className="text-[10px] text-slate-300 truncate">
                                                                                {event.name}: {event.stars} ⭐
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Completed Events Tags */}
                                                    {completedEventsList.map((achievement, idx) => {
                                                        return (
                                                            <div
                                                                key={`${achievement.eventId}-${idx}`}
                                                                className="relative group"
                                                            >
                                                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-[10px] sm:text-xs bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-yellow-500 shadow-sm">
                                                                    <ParticipantIcon icon={achievement.icon} className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                                                                </div>
                                                                {/* Tooltip */}
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
                                                                    <div className="font-bold mb-1">{achievement.eventName}</div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Star className="w-3 h-3" fill="currentColor" style={{ color: '#FFD93D' }} />
                                                                        <span>{achievement.stars}/{achievement.starGoal} כוכבים | יעד: {achievement.starGoal}</span>
                                                                    </div>
                                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    </div>
                                                    {/* Edit Button - separate div on the right */}
                                                    <div>
                                                        <button
                                                            onClick={() => openEditParticipant(participant)}
                                                            className="shrink-0 p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 active:scale-95 transition-colors"
                                                            aria-label="ערוך משתתף"
                                                        >
                                                            <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    </div>
                                    {swipeTranslateX[participant.id] !== undefined && swipeTranslateX[participant.id] < -40 && (
                                        <button
                                            onClick={() => handleDeleteParticipant(participant)}
                                            className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 text-white flex items-center justify-center rounded-xl"
                                            style={{ transform: `translateX(${80 + (swipeTranslateX[participant.id] || 0)}px)` }}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                    </div>
                </section>

                {/* Events Section */}
                <section className="mb-6">
                    <div className="flex items-center justify-between mb-4 gap-2">
                        <h2 className="text-xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
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
                        {(!group.events || group.events.length === 0) ? (
                            <div className="col-span-full p-5 sm:p-10 bg-white rounded-xl border-2 border-dashed border-slate-200 text-center">
                                <Sparkles className="w-5 h-5 sm:w-10 sm:h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs sm:text-lg font-bold text-slate-400">אין הרפתקאות</p>
                            </div>
                        ) : (
                            (group.events || []).map((event) => {
                                const isEventEnded = event.endDate <= Date.now();
                                return (
                                <div
                                    key={event.id}
                                    className={`p-3 sm:p-6 rounded-xl shadow-sm border-2 relative overflow-hidden cursor-pointer ${
                                        isEventEnded 
                                            ? 'bg-slate-200 border-slate-400' 
                                            : 'bg-blue-50 border-blue-500'
                                    }`}
                                    onClick={() => router.push(`/group/${groupId}/event/${event.id}`)}
                                >
                                    <div className="pattern-overlay" />

                                    {/* Event icon in top-left corner */}
                                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                                        <ParticipantIcon icon={event.icon} className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteEvent(event.id);
                                        }}
                                        className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-3 p-1 text-slate-300 hover:text-red-500 z-10"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>

                                    <h3 className={`text-sm sm:text-xl font-black mb-2 sm:mb-4 pr-6 ${
                                        isEventEnded ? 'text-slate-600' : 'text-blue-600'
                                    }`}>{event.name}</h3>
                                    
                                    <div className="space-y-1.5 sm:space-y-3 mb-3 sm:mb-5">
                                        {/* Start Date */}
                                        {(event as any).createdAt && (
                                            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 font-bold text-[10px] sm:text-sm">
                                                <div className="p-1 bg-blue-50 text-blue-600 rounded"><Calendar className="w-3 h-3 sm:w-4 sm:h-4" /></div>
                                                <span>התחלה: {formatDate((event as any).createdAt)}</span>
                                            </div>
                                        )}
                                        {/* Duration */}
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 font-bold text-[10px] sm:text-sm">
                                            <div className="p-1 bg-red-50 text-red-600 rounded"><ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /></div>
                                            <span>משך: {getEventDuration(event)}</span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 sm:gap-2 font-bold text-[10px] sm:text-sm ${
                                            isEventEnded ? 'text-slate-500' : 'text-blue-600'
                                        }`}>
                                            <div className={`p-1 rounded ${
                                                isEventEnded ? 'bg-slate-100' : 'bg-blue-50'
                                            }`}><Clock className="w-3 h-3 sm:w-4 sm:h-4" /></div>
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
                                                    className="inline-flex flex-col items-center gap-0.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-center min-w-[75px] sm:min-w-[90px]"
                                                >
                                                    <div className="relative w-full">
                                                        <ParticipantIcon icon={p.icon} className="absolute top-1/2 -translate-y-1/2 right-1 w-1.5 h-1.5" emojiSize="text-xs" />
                                                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 truncate block">{p.name}</span>
                                                    </div>
                                                    <div
                                                        className="inline-flex items-center gap-0.5 font-black text-[10px] sm:text-xs"
                                                        style={{ color: p.color }}
                                                    >
                                                        <span>{ep.stars}</span>
                                                        <Star className="w-1.5 h-1.5 sm:w-2 sm:h-2" fill="currentColor" />
                                                    </div>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                                );
                            })
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

                                {/* Participant Card Preview */}
                                <div className="rounded-2xl border shadow-sm p-4 relative overflow-hidden mb-6"
                                    style={{
                                        background: pColor,
                                        borderColor: pColor,
                                        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
                                    }}
                                >
                                    <div className="pattern-overlay" />
                                    <div className="relative">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Icon */}
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        setShowPColorPicker(false);
                                                        setShowPIconPicker(true);
                                                    }}
                                                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-white/35 backdrop-blur-md active:scale-95 transition-transform"
                                                    style={{ border: `1px solid ${hexToRgba(pColor, 0.35)}` }}
                                                >
                                                    <ParticipantIcon icon={pIcon} className="w-16 h-16 text-slate-900" />
                                                </motion.button>

                                                <div className="min-w-0">
                                                    {/* Name */}
                                                    <motion.div
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            // Focus name input
                                                            const nameInput = document.getElementById('participant-name-input');
                                                            if (nameInput) nameInput.focus();
                                                        }}
                                                        className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform mb-1"
                                                    >
                                                        <h3 className="text-2xl font-black text-slate-900 truncate">{pName || 'שם המשתתף'}</h3>
                                                        <Pencil className="w-3 h-3 text-slate-500" />
                                                    </motion.div>

                                                    {/* Age & Gender */}
                                                    <div className="flex flex-col gap-2">
                                                        <div className="bg-white/40 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/30 flex items-center gap-2 min-w-[80px] justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPAge(Math.max(1, pAge - 0.5))}
                                                                className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-200 active:scale-95 transition-transform"
                                                                aria-label="הורד גיל"
                                                            >
                                                                <ChevronDown className="w-3 h-3" />
                                                            </button>
                                                            <span className="text-sm font-black text-slate-900">גיל {pAgeLabel}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPAge(Math.min(100, pAge + 0.5))}
                                                                className="h-6 w-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-200 active:scale-95 transition-transform"
                                                                aria-label="העלה גיל"
                                                            >
                                                                <ChevronUp className="w-3 h-3" />
                                                            </button>
                                                        </div>

                                                        {/* Gender Switch */}
                                                        <div className={`flex backdrop-blur-sm rounded-xl p-1 border transition-all ${
                                                            pGender === 'male'
                                                                ? 'bg-blue-200/70 border-blue-300/40'
                                                                : 'bg-pink-200/70 border-pink-300/40'
                                                        }`}>
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => setPGender('male')}
                                                                className={`px-4 py-2 rounded-lg text-lg font-bold transition-all flex-1 ${
                                                                    pGender === 'male'
                                                                        ? 'bg-blue-400 text-white shadow-md'
                                                                        : 'text-slate-600 hover:text-slate-800'
                                                                }`}
                                                            >
                                                                👦
                                                            </motion.button>
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => setPGender('female')}
                                                                className={`px-4 py-2 rounded-lg text-lg font-bold transition-all flex-1 ${
                                                                    pGender === 'female'
                                                                        ? 'bg-pink-400 text-white shadow-md'
                                                                        : 'text-slate-600 hover:text-slate-800'
                                                                }`}
                                                            >
                                                                👧
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Color Picker */}
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setShowPIconPicker(false);
                                                    setShowPColorPicker(true);
                                                }}
                                                className="w-16 h-16 rounded-full border-4 shadow-xl active:scale-95 transition-transform shrink-0 flex items-center justify-center relative overflow-hidden"
                                                style={{
                                                    background: `conic-gradient(from 0deg, #FF6B6B, #4ECDC4, #45B7D1, #FFA07A, #98D8C8, #F7DC6F, #BB8FCE, #85C1E2, #F8B739, #52B788, #FF8FA3, #C9ADA7)`,
                                                    border: '4px solid rgba(255,255,255,0.9)'
                                                }}
                                                title="שנה צבע"
                                            >
                                                <div className="absolute inset-1 rounded-full border-2 border-white/50 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                                                    <Palette className="w-6 h-6 text-slate-800 drop-shadow-lg" />
                                                </div>
                                            </motion.button>
                                        </div>

                                    </div>
                                </div>

                                {/* Hidden Name Input */}
                                <input
                                    id="participant-name-input"
                                    value={pName}
                                    onChange={(e) => setPName(e.target.value)}
                                    className="absolute opacity-0 pointer-events-none"
                                    dir="rtl"
                                />


                                {/* Save/Cancel Buttons */}
                                <div className="grid grid-cols-2 gap-3 pt-4">
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
                                                    {PARTICIPANT_EMOJIS.map((ic) => (
                                                        <button
                                                            key={ic}
                                                            type="button"
                                                            onClick={() => {
                                                                setPIcon(ic);
                                                                setShowPIconPicker(false);
                                                            }}
                                                            className="h-12 rounded-2xl border border-slate-200 bg-white active:scale-95 transition-transform inline-flex items-center justify-center"
                                                            aria-label="בחר אייקון"
                                                        >
                                                            <ParticipantIcon icon={ic} className="w-8 h-8 text-2xl" />
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

                {/* Delete Participant Dialog */}
                <AnimatePresence>
                    {showDeleteParticipantDialog && participantToDelete && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                            onClick={() => {
                                setShowDeleteParticipantDialog(false);
                                setParticipantToDelete(null);
                            }}
                        >
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                                        <Trash2 className="w-8 h-8 text-red-600" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                                        מחיקת משתתף
                                    </h3>
                                    <p className="text-slate-600 mb-4">
                                        האם אתה בטוח שברצונך למחוק את <strong>{participantToDelete.name}</strong>?
                                    </p>
                                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4">
                                        <p className="text-sm font-black text-red-800 mb-2">⚠️ אזהרה:</p>
                                        <ul className="text-sm text-red-700 text-right space-y-1">
                                            <li>• כל הנתונים של המשתתף יאבדו</li>
                                            <li>• כל הכוכבים וההישגים ימחקו</li>
                                            <li>• המשתתף יוסר מכל האירועים</li>
                                            <li>• הפעולה לא ניתנת לביטול</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteParticipantDialog(false);
                                            setParticipantToDelete(null);
                                        }}
                                        className="h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform"
                                    >
                                        ביטול
                                    </button>
                                    <button
                                        onClick={confirmDeleteParticipant}
                                        className="h-12 rounded-2xl bg-red-600 text-white font-black active:scale-95 transition-transform hover:bg-red-700"
                                    >
                                        מחק
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
        </AuthGuard>
    );
}
