'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RecentGroup {
  id: string;
  name: string;
  code: string;
  lastAccessed: number;
}

export default function Home() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [recentGroups, setRecentGroups] = useState<RecentGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load recent groups from localStorage
    const stored = localStorage.getItem('recentGroups');
    if (stored) {
      const groups = JSON.parse(stored);
      setRecentGroups(groups.sort((a: RecentGroup, b: RecentGroup) => b.lastAccessed - a.lastAccessed));
    }
  }, []);

  const generateGroupCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      setError('נא להזין שם קבוצה');
      return;
    }

    setLoading(true);
    const code = generateGroupCode();
    const newGroup = {
      id: Date.now().toString(),
      name: groupName,
      code: code,
      participants: [],
      events: []
    };

    // Save to localStorage
    const groups = JSON.parse(localStorage.getItem('groups') || '[]');
    groups.push(newGroup);
    localStorage.setItem('groups', JSON.stringify(groups));

    // Add to recent groups
    const recent: RecentGroup = {
      id: newGroup.id,
      name: newGroup.name,
      code: newGroup.code,
      lastAccessed: Date.now()
    };
    const recentList = [recent, ...recentGroups.filter(g => g.id !== newGroup.id)].slice(0, 5);
    localStorage.setItem('recentGroups', JSON.stringify(recentList));

    setLoading(false);
    router.push(`/group/${newGroup.id}`);
  };

  const handleJoinGroup = () => {
    if (!groupCode.trim()) {
      setError('נא להזין קוד קבוצה');
      return;
    }

    setLoading(true);
    const groups = JSON.parse(localStorage.getItem('groups') || '[]');
    const group = groups.find((g: any) => g.code.toUpperCase() === groupCode.toUpperCase());

    if (!group) {
      setError('קבוצה לא נמצאה');
      setLoading(false);
      return;
    }

    // Add to recent groups
    const recent: RecentGroup = {
      id: group.id,
      name: group.name,
      code: group.code,
      lastAccessed: Date.now()
    };
    const recentList = [recent, ...recentGroups.filter(g => g.id !== group.id)].slice(0, 5);
    localStorage.setItem('recentGroups', JSON.stringify(recentList));

    setLoading(false);
    router.push(`/group/${group.id}`);
  };

  const handleRecentGroupClick = (groupId: string) => {
    router.push(`/group/${groupId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)' }}>
      <div className="w-full max-w-2xl">
        {/* Title */}
        <h1 className="rainbow-text text-6xl font-bold text-center mb-16 fade-in" style={{ animationDelay: '0.1s' }}>
          מסע בין כוכבים
        </h1>

        {/* Main buttons */}
        <div className="space-y-4 mb-12">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary w-full fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            ✨ צור קבוצה חדשה
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="btn btn-secondary w-full fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            🚀 התחבר לקבוצה קיימת
          </button>
        </div>

        {/* Recent groups */}
        {recentGroups.length > 0 && (
          <div className="fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-2xl font-semibold mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>
              קבוצות אחרונות
            </h2>
            <div className="space-y-3">
              {recentGroups.map((group, index) => (
                <div
                  key={group.id}
                  onClick={() => handleRecentGroupClick(group.id)}
                  className="glass-card p-4 cursor-pointer slide-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold">{group.name}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>קוד: {group.code}</p>
                    </div>
                    <div className="text-3xl">⭐</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50" onClick={() => setShowCreateModal(false)}>
          <div className="glass-card p-8 max-w-md w-full fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold mb-6 text-center">צור קבוצה חדשה</h2>
            <input
              type="text"
              placeholder="שם הקבוצה"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                setError('');
              }}
              className="input mb-4"
              dir="rtl"
            />
            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleCreateGroup}
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? '...יוצר' : 'צור קבוצה'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setGroupName('');
                  setError('');
                }}
                className="btn btn-secondary flex-1"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50" onClick={() => setShowJoinModal(false)}>
          <div className="glass-card p-8 max-w-md w-full fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold mb-6 text-center">התחבר לקבוצה</h2>
            <input
              type="text"
              placeholder="הזן קוד קבוצה"
              value={groupCode}
              onChange={(e) => {
                setGroupCode(e.target.value.toUpperCase());
                setError('');
              }}
              className="input mb-4"
              dir="ltr"
              style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '20px', fontWeight: 'bold' }}
              maxLength={6}
            />
            {loading && <p className="text-center mb-4" style={{ color: 'var(--text-secondary)' }}>...מחפש</p>}
            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleJoinGroup}
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? '...מתחבר' : 'התחבר'}
              </button>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setGroupCode('');
                  setError('');
                }}
                className="btn btn-secondary flex-1"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
