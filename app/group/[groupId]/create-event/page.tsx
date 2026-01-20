'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const ICONS = ['😀', '😊', '😎', '🥳', '🤩', '😇', '🦸', '🦄', '🐶', '🐱', '🐼', '🦁', '🐯', '🦊', '🐻', '🐨', '🐸', '🦋', '🌟', '⚡', '🔥', '💎', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🚀', '✈️'];
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

export default function CreateEventPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;

    const [group, setGroup] = useState<Group | null>(null);
    const [eventName, setEventName] = useState('');
    const [endDate, setEndDate] = useState('');
    const [starGoal, setStarGoal] = useState(100);
    const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
    const [showNewParticipant, setShowNewParticipant] = useState(false);

    // New participant fields
    const [newName, setNewName] = useState('');
    const [newIcon, setNewIcon] = useState(ICONS[0]);
    const [newAge, setNewAge] = useState(5);
    const [newColor, setNewColor] = useState(COLORS[0]);
    const [newGender, setNewGender] = useState<'male' | 'female'>('male');

    useEffect(() => {
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
            eventCount: 0
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
        setNewIcon(ICONS[0]);
        setNewAge(5);
        setNewColor(COLORS[0]);
        setNewGender('male');
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-2xl">...טוען</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)' }}>
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => router.push(`/group/${groupId}`)}
                    className="btn btn-secondary mb-6"
                >
                    ← חזרה
                </button>

                <div className="glass-card p-8">
                    <h1 className="text-3xl font-bold mb-8 text-center">צור אירוע חדש</h1>

                    {/* Event Name */}
                    <div className="mb-6">
                        <label className="block mb-2 text-lg font-semibold">שם האירוע</label>
                        <input
                            type="text"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            className="input"
                            placeholder="הזן שם אירוע"
                            dir="rtl"
                        />
                    </div>

                    {/* End Date */}
                    <div className="mb-6">
                        <label className="block mb-2 text-lg font-semibold">תאריך סיום</label>
                        <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input"
                        />
                    </div>

                    {/* Star Goal */}
                    <div className="mb-8">
                        <label className="block mb-2 text-lg font-semibold">יעד כוכבים ⭐ {starGoal}</label>
                        <input
                            type="number"
                            value={starGoal}
                            onChange={(e) => setStarGoal(parseInt(e.target.value) || 0)}
                            className="input"
                            min="1"
                        />
                    </div>

                    {/* Participants */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">משתתפים באירוע</h2>

                        {group.participants.length > 0 && (
                            <div className="mb-4 space-y-2">
                                <h3 className="text-lg font-semibold mb-2">בחר משתתפים קיימים</h3>
                                {group.participants.map((participant) => (
                                    <div
                                        key={participant.id}
                                        onClick={() => toggleParticipant(participant.id)}
                                        className={`glass-card p-4 cursor-pointer transition-all ${selectedParticipants.has(participant.id) ? 'ring-2 ring-green-400' : ''
                                            }`}
                                        style={{ borderRight: `4px solid ${participant.color}` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">{participant.icon}</span>
                                                <div>
                                                    <p className="font-bold">{participant.name}</p>
                                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                        גיל {participant.age} {participant.gender === 'male' ? '👦' : '👧'}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedParticipants.has(participant.id) && <span className="text-2xl">✓</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setShowNewParticipant(!showNewParticipant)}
                            className="btn btn-secondary w-full"
                        >
                            {showNewParticipant ? '✗ ביטול' : '➕ צור משתתף חדש'}
                        </button>

                        {showNewParticipant && (
                            <div className="mt-4 glass-card p-6">
                                <h3 className="text-xl font-bold mb-4">משתתף חדש</h3>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="input mb-4"
                                    placeholder="שם"
                                    dir="rtl"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setNewGender('male')}
                                        className={`glass-card p-3 text-3xl ${newGender === 'male' ? 'ring-2 ring-blue-400' : ''}`}
                                    >
                                        👦
                                    </button>
                                    <button
                                        onClick={() => setNewGender('female')}
                                        className={`glass-card p-3 text-3xl ${newGender === 'female' ? 'ring-2 ring-pink-400' : ''}`}
                                    >
                                        👧
                                    </button>
                                </div>
                                <button onClick={handleAddNewParticipant} className="btn btn-primary w-full mt-4">
                                    הוסף משתתף
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Create Button */}
                    <button onClick={handleCreateEvent} className="btn btn-primary w-full">
                        ✨ צור אירוע
                    </button>
                </div>
            </div>
        </div>
    );
}
