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

export default function EventPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;
    const eventId = params.eventId as string;

    const [group, setGroup] = useState<Group | null>(null);
    const [event, setEvent] = useState<Event | null>(null);
    const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [showConfetti, setShowConfetti] = useState(false);
    const [showSadEmoji, setShowSadEmoji] = useState(false);

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

    const updateEventData = (updatedEvent: Event) => {
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const groupIndex = groups.findIndex((g: Group) => g.id === groupId);
        if (groupIndex === -1) return;

        const eventIndex = groups[groupIndex].events.findIndex((e: Event) => e.id === eventId);
        if (eventIndex === -1) return;

        groups[groupIndex].events[eventIndex] = updatedEvent;

        // Update participant total stars
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

        const updatedParticipants = event.participants.map(ep =>
            ep.participantId === participantId
                ? { ...ep, stars: ep.stars + 1 }
                : ep
        );

        updateEventData({ ...event, participants: updatedParticipants });

        // Show confetti animation
        setShowConfetti(true);
        createConfetti();
        setTimeout(() => setShowConfetti(false), 3000);
    };

    const handleRemoveStar = (participantId: string) => {
        if (!event) return;

        const updatedParticipants = event.participants.map(ep =>
            ep.participantId === participantId && ep.stars > 0
                ? { ...ep, stars: ep.stars - 1 }
                : ep
        );

        updateEventData({ ...event, participants: updatedParticipants });

        // Show sad emoji animation
        setShowSadEmoji(true);
        setTimeout(() => setShowSadEmoji(false), 2000);
    };

    const createConfetti = () => {
        const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#BB8FCE'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.opacity = '1';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';

            document.body.appendChild(confetti);

            const duration = 2000 + Math.random() * 1000;
            const endY = window.innerHeight + 10;
            const endX = parseFloat(confetti.style.left) + (Math.random() - 0.5) * 200;

            confetti.animate([
                { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${endX - parseFloat(confetti.style.left)}px, ${endY}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
            ], {
                duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => confetti.remove();
        }
    };

    if (!group || !event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-2xl">...טוען</div>
            </div>
        );
    }

    const sortedParticipants = [...event.participants]
        .map(ep => ({
            ...ep,
            participant: group.participants.find(p => p.id === ep.participantId)!
        }))
        .filter(ep => ep.participant)
        .sort((a, b) => b.stars - a.stars);

    return (
        <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)' }}>
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.push(`/group/${groupId}`)}
                    className="btn btn-secondary mb-6"
                >
                    ← חזרה לקבוצה
                </button>

                {/* Event Header */}
                <div className="glass-card p-8 mb-8">
                    <h1 className="text-4xl font-bold mb-6 text-center rainbow-text">{event.name}</h1>

                    <div className="flex items-center justify-center gap-3 mb-6">
                        <span className="text-3xl">⭐</span>
                        <span className="text-2xl font-bold">יעד: {event.starGoal}</span>
                    </div>

                    {/* Countdown */}
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="glass-card p-4">
                            <div className="text-3xl font-bold">{timeRemaining.days}</div>
                            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>ימים</div>
                        </div>
                        <div className="glass-card p-4">
                            <div className="text-3xl font-bold">{timeRemaining.hours}</div>
                            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>שעות</div>
                        </div>
                        <div className="glass-card p-4">
                            <div className="text-3xl font-bold">{timeRemaining.minutes}</div>
                            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>דקות</div>
                        </div>
                        <div className="glass-card p-4">
                            <div className="text-3xl font-bold">{timeRemaining.seconds}</div>
                            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>שניות</div>
                        </div>
                    </div>
                </div>

                {/* Participants */}
                <div className="space-y-4">
                    {sortedParticipants.map(({ participant, participantId, stars }) => {
                        const progress = Math.min((stars / event.starGoal) * 100, 100);

                        return (
                            <div
                                key={participantId}
                                className="glass-card p-6"
                                style={{ borderRight: `4px solid ${participant.color}` }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-5xl">{participant.icon}</span>
                                        <div>
                                            <h3 className="text-2xl font-bold">{participant.name}</h3>
                                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                גיל {participant.age} {participant.gender === 'male' ? '👦' : '👧'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-semibold">{stars} / {event.starGoal} ⭐</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleAddStar(participantId)}
                                        className="btn btn-primary flex-1 text-xl"
                                    >
                                        ➕ הוסף כוכב
                                    </button>
                                    <button
                                        onClick={() => handleRemoveStar(participantId)}
                                        className="btn btn-secondary flex-1 text-xl"
                                        disabled={stars === 0}
                                        style={{ opacity: stars === 0 ? 0.5 : 1 }}
                                    >
                                        ➖ הסר כוכב
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sad Emoji Animation */}
                {showSadEmoji && (
                    <div className="sad-emoji">
                        😢
                    </div>
                )}
            </div>
        </div>
    );
}
