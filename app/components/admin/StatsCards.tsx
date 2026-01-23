'use client';

import { Users, FolderOpen, Calendar, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  usersCount: number;
  groupsCount: number;
  eventsCount: number;
  loading?: boolean;
}

export default function StatsCards({ usersCount, groupsCount, eventsCount, loading }: StatsCardsProps) {
  const cards = [
    {
      title: 'משתמשים',
      value: usersCount,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      title: 'קבוצות',
      value: groupsCount,
      icon: FolderOpen,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
    },
    {
      title: 'אירועים',
      value: eventsCount,
      icon: Calendar,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`bg-white rounded-2xl border-2 ${card.borderColor} shadow-sm p-6 ${loading ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${card.bgColor} border ${card.borderColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">
              {loading ? '...' : card.value.toLocaleString('he-IL')}
            </div>
            <div className="text-sm font-black text-slate-600 uppercase tracking-widest">
              {card.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}
