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

export default function AddParticipantPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;

    const [name, setName] = useState('');
    const [icon, setIcon] = useState(ICONS[0]);
    const [age, setAge] = useState(5);
    const [color, setColor] = useState(COLORS[0]);
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

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
            eventCount: 0
        };

        groups[groupIndex].participants.push(newParticipant);
        localStorage.setItem('groups', JSON.stringify(groups));

        router.push(`/group/${groupId}`);
    };

    return (
        <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)' }}>
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => router.push(`/group/${groupId}`)}
                    className="btn btn-secondary mb-6"
                >
                    ← חזרה
                </button>

                <div className="glass-card p-8">
                    <h1 className="text-3xl font-bold mb-8 text-center">הוסף משתתף חדש</h1>

                    {/* Name */}
                    <div className="mb-6">
                        <label className="block mb-2 text-lg font-semibold">שם</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input"
                            placeholder="הזן שם"
                            dir="rtl"
                        />
                    </div>

                    {/* Icon Picker */}
                    <div className="mb-6">
                        <label className="block mb-2 text-lg font-semibold">אייקון</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowIconPicker(!showIconPicker)}
                                className="glass-card p-4 w-full flex items-center justify-center text-4xl hover:scale-105 transition-transform"
                            >
                                {icon}
                            </button>
                            {showIconPicker && (
                                <div className="absolute top-full mt-2 w-full glass-card p-4 grid grid-cols-6 gap-2 z-10 max-h-64 overflow-y-auto">
                                    {ICONS.map((ic) => (
                                        <button
                                            key={ic}
                                            onClick={() => {
                                                setIcon(ic);
                                                setShowIconPicker(false);
                                            }}
                                            className="text-3xl hover:scale-125 transition-transform p-2"
                                        >
                                            {ic}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Age Slider */}
                    <div className="mb-6">
                        <label className="block mb-2 text-lg font-semibold">גיל: {age}</label>
                        <input
                            type="range"
                            min="1"
                            max="18"
                            value={age}
                            onChange={(e) => setAge(parseInt(e.target.value))}
                            className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(age / 18) * 100}%, var(--glass-bg) ${(age / 18) * 100}%, var(--glass-bg) 100%)`
                            }}
                        />
                        <div className="flex justify-between text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                            <span>1</span>
                            <span>18</span>
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div className="mb-6">
                        <label className="block mb-2 text-lg font-semibold">צבע</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="glass-card p-4 w-full flex items-center justify-center"
                            >
                                <div
                                    className="w-12 h-12 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                            </button>
                            {showColorPicker && (
                                <div className="absolute top-full mt-2 w-full glass-card p-4 grid grid-cols-6 gap-3 z-10">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => {
                                                setColor(c);
                                                setShowColorPicker(false);
                                            }}
                                            className="w-12 h-12 rounded-full hover:scale-110 transition-transform"
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gender Switch */}
                    <div className="mb-8">
                        <label className="block mb-2 text-lg font-semibold">מין</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setGender('male')}
                                className={`flex-1 glass-card p-4 text-4xl transition-all ${gender === 'male' ? 'ring-2 ring-blue-400' : ''
                                    }`}
                            >
                                👦
                            </button>
                            <button
                                onClick={() => setGender('female')}
                                className={`flex-1 glass-card p-4 text-4xl transition-all ${gender === 'female' ? 'ring-2 ring-pink-400' : ''
                                    }`}
                            >
                                👧
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="mb-6 glass-card p-6" style={{ borderRight: `4px solid ${color}` }}>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>תצוגה מקדימה</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">{icon}</span>
                            <div>
                                <p className="text-xl font-bold">{name || 'שם המשתתף'}</p>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    גיל {age} {gender === 'male' ? '👦' : '👧'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <button onClick={handleSave} className="btn btn-primary flex-1">
                            ✓ שמור
                        </button>
                        <button
                            onClick={() => router.push(`/group/${groupId}`)}
                            className="btn btn-secondary flex-1"
                        >
                            ביטול
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
