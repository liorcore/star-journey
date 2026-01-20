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
  const [copiedGroupCode, setCopiedGroupCode] = useState<string | null>(null);
  const [hoveredGroupCode, setHoveredGroupCode] = useState<string | null>(null);

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

  const handleCopyGroupCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedGroupCode(code);
    setTimeout(() => setCopiedGroupCode(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 gap-16 sm:gap-20" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0f051d 50%, #16213e 100%)' }}>
      {/* Title Section */}
      <h1 className="rainbow-text text-4xl sm:text-5xl md:text-6xl font-bold text-center fade-in" style={{ animationDelay: '0.1s' }}>
        מסע בין כוכבים
      </h1>

      {/* Buttons Section */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary fade-in min-w-[220px] sm:min-w-[250px] underline"
          style={{ animationDelay: '0.3s' }}
        >
          ✨ צור קבוצה חדשה
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          className="btn btn-secondary fade-in min-w-[220px] sm:min-w-[250px] underline"
          style={{ animationDelay: '0.4s' }}
        >
          🚀 התחבר לקבוצה קיימת
        </button>
      </div>

        {/* Recent groups */}
        {recentGroups.length > 0 && (
          <div className="fade-in px-4 mt-16 sm:mt-20 pt-12 sm:pt-16 w-full max-w-2xl" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl sm:text-2xl font-semibold mb-12 sm:mb-16 text-center" style={{ color: 'var(--text-secondary)' }}>
              קבוצות אחרונות
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {recentGroups.map((group, index) => (
                <div
                  key={group.id}
                  onClick={() => handleRecentGroupClick(group.id)}
                  className="glass-card p-5 sm:p-6 cursor-pointer slide-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                    <div className="flex items-center justify-between gap-4" dir="rtl">
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold truncate">{group.name}</h3>
                      </div>
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={(e) => handleCopyGroupCode(e, group.code)}
                          onMouseEnter={() => setHoveredGroupCode(group.code)}
                          onMouseLeave={() => setHoveredGroupCode(null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-purple-600 hover:bg-opacity-20 active:scale-95"
                          title="לחץ להעתקה"
                        >
                          <span className="text-lg">📋</span>
                          {copiedGroupCode === group.code && (
                            <span className="text-xs sm:text-sm text-green-400 font-semibold animate-pulse">✓ הועתק!</span>
                          )}
                        </button>
                        {hoveredGroupCode === group.code && (
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 glass-card px-3 py-2 whitespace-nowrap z-10 shadow-lg border border-white border-opacity-30">
                            <span className="text-sm font-mono font-bold text-white tracking-wider">{group.code}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl flex-shrink-0">⭐</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 z-50" onClick={() => setShowCreateModal(false)}>
          <div className="flex flex-col items-center gap-8 p-6 sm:p-10 max-w-md w-full fade-in mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl sm:text-3xl font-bold text-center">צור קבוצה חדשה</h2>
            <div className="w-full">
              <input
                type="text"
                placeholder="שם הקבוצה"
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  setError('');
                }}
                className="input w-full"
                dir="rtl"
              />
              {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 z-50" onClick={() => setShowJoinModal(false)}>
          <div className="glass-card p-6 sm:p-10 max-w-md w-full fade-in mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">התחבר לקבוצה</h2>
            <input
              type="text"
              placeholder="הזן קוד קבוצה"
              value={groupCode}
              onChange={(e) => {
                setGroupCode(e.target.value.toUpperCase());
                setError('');
              }}
              className="input mb-6"
              dir="ltr"
              style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '18px', fontWeight: 'bold' }}
              maxLength={6}
            />
            {loading && <p className="text-center mb-6" style={{ color: 'var(--text-secondary)' }}>...מחפש</p>}
            {error && <p className="text-red-400 text-sm mb-6 text-center">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
