'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

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

export default function GroupPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;

    const [group, setGroup] = useState<Group | null>(null);
    const [showEditName, setShowEditName] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [showCodeTooltip, setShowCodeTooltip] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

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

    const handleUpdateName = () => {
        if (group && newGroupName.trim()) {
            updateGroup({ ...group, name: newGroupName });
            setShowEditName(false);
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
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${days}ד ${hours}ש ${minutes}ד`;
    };

    if (!group) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-2xl">...טוען</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)' }}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="btn btn-secondary mb-6"
                    >
                        🏠 חזרה לדף הבית
                    </button>

                    <div className="glass-card p-6 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            {showEditName ? (
                                <div className="flex items-center gap-3 flex-1">
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="input flex-1"
                                        dir="rtl"
                                    />
                                    <button onClick={handleUpdateName} className="btn btn-primary">✓</button>
                                    <button onClick={() => setShowEditName(false)} className="btn btn-secondary">✗</button>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-4xl font-bold rainbow-text">{group.name}</h1>
                                    <button
                                        onClick={() => setShowEditName(true)}
                                        className="text-2xl hover:scale-110 transition-transform"
                                    >
                                        ✏️
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <button
                                    onClick={handleCopyCode}
                                    onMouseEnter={() => setShowCodeTooltip(true)}
                                    onMouseLeave={() => setShowCodeTooltip(false)}
                                    className="text-3xl hover:scale-110 transition-transform"
                                >
                                    🔄
                                </button>
                                {showCodeTooltip && (
                                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 glass-card px-4 py-2 whitespace-nowrap z-10">
                                        {copiedCode ? '✓ הועתק!' : `קוד: ${group.code}`}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create Event Button */}
                <button
                    onClick={() => router.push(`/group/${groupId}/create-event`)}
                    className="btn btn-primary w-full mb-8"
                >
                    ✨ צור אירוע חדש
                </button>

                {/* Events List */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold mb-6">אירועים</h2>
                    {group.events.length === 0 ? (
                        <div className="glass-card p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                            <p className="text-xl">עדיין אין אירועים. צור אירוע ראשון!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {group.events.map((event) => (
                                <div
                                    key={event.id}
                                    className="glass-card p-6 cursor-pointer relative group"
                                    onClick={() => router.push(`/group/${groupId}/event/${event.id}`)}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteEvent(event.id);
                                        }}
                                        className="absolute top-4 left-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xl"
                                    >
                                        🗑️
                                    </button>

                                    <h3 className="text-2xl font-bold mb-3">{event.name}</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span>⏰</span>
                                        <span>{getTimeRemaining(event.endDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span>⭐</span>
                                        <span>יעד: {event.starGoal}</span>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {event.participants.map((ep) => {
                                            const participant = group.participants.find(p => p.id === ep.participantId);
                                            if (!participant) return null;
                                            return (
                                                <div
                                                    key={ep.participantId}
                                                    className="px-3 py-1 rounded-full text-sm font-semibold"
                                                    style={{ backgroundColor: participant.color, color: '#000' }}
                                                >
                                                    {participant.icon} {participant.name}: {ep.stars}⭐
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Participants Section */}
                <div>
                    <h2 className="text-3xl font-bold mb-6">משתתפי הקבוצה</h2>
                    <button
                        onClick={() => router.push(`/group/${groupId}/add-participant`)}
                        className="btn btn-primary w-full mb-6"
                    >
                        ➕ הוסף משתתף חדש
                    </button>

                    {group.participants.length === 0 ? (
                        <div className="glass-card p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                            <p className="text-xl">עדיין אין משתתפים. הוסף משתתף ראשון!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...group.participants]
                                .sort((a, b) => b.totalStars - a.totalStars)
                                .map((participant) => (
                                    <div
                                        key={participant.id}
                                        className="glass-card p-5"
                                        style={{ borderRight: `4px solid ${participant.color}` }}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-4xl">{participant.icon}</span>
                                                <div>
                                                    <h3 className="text-xl font-bold">{participant.name}</h3>
                                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                        גיל {participant.age} {participant.gender === 'male' ? '👦' : '👧'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-bold">{participant.totalStars} ⭐</span>
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                {participant.eventCount} אירועים
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
