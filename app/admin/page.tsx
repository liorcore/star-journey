'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useAdmin } from '@/app/contexts/AdminContext';
import { ArrowRight, Shield, Home } from 'lucide-react';
import AuthGuard from '@/app/components/AuthGuard';
import TelegramSettings from '@/app/components/admin/TelegramSettings';
import StatsCards from '@/app/components/admin/StatsCards';
import UsageCharts from '@/app/components/admin/UsageCharts';
import UsersTable from '@/app/components/admin/UsersTable';
import { getAllUsers, getAllGroups, getAllEvents, getUsageStats, UserStats, UsageStats } from '@/app/lib/admin-stats';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin: userIsAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [groupsCount, setGroupsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [statsPeriod, setStatsPeriod] = useState<'day' | 'hour' | 'month'>('day');

  useEffect(() => {
    if (!adminLoading && !userIsAdmin) {
      router.push('/');
    }
  }, [adminLoading, userIsAdmin, router]);

  useEffect(() => {
    if (userIsAdmin) {
      loadData();
    }
  }, [userIsAdmin, statsPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, groupsData, eventsData, statsData] = await Promise.all([
        getAllUsers(),
        getAllGroups(),
        getAllEvents(),
        getUsageStats(statsPeriod),
      ]);

      setUsers(usersData);
      setGroupsCount(groupsData.length);
      setEventsCount(eventsData.length);
      setUsageStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm font-black text-slate-400">טוען דשבורד אדמין...</div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!userIsAdmin) {
    return null;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F5F9] pb-10" dir="rtl">
        <main className="max-w-7xl mx-auto px-3 pt-10 sm:pt-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#4D96FF]" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">דשבורד אדמין</h1>
                <p className="text-sm text-slate-500">ניהול והתראות</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-700 active:scale-95 transition-transform"
            >
              <Home className="w-4 h-4" />
              חזור לאפליקציה
            </button>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <StatsCards
              usersCount={users.length}
              groupsCount={groupsCount}
              eventsCount={eventsCount}
              loading={loading}
            />
          </div>

          {/* Telegram Settings */}
          <div className="mb-8">
            <TelegramSettings />
          </div>

          {/* Usage Charts */}
          <div className="mb-8">
            <UsageCharts stats={usageStats} loading={loading} />
          </div>

          {/* Users Table */}
          <div className="mb-8">
            <UsersTable users={users} loading={loading} />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
