'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Plus, Rocket, Star, Users, X } from 'lucide-react';

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

  const closeModals = () => {
    setShowCreateModal(false);
    setShowJoinModal(false);
    setGroupName('');
    setGroupCode('');
    setError('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-10" dir="rtl">
      <main className="max-w-md mx-auto px-3 pt-10 sm:pt-16">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm mb-4">
            <Rocket className="w-7 h-7 text-[#4D96FF]" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black rainbow-text leading-tight">
            מסע בין כוכבים
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-3">
            יוצרים קבוצה, יוצאים להרפתקה, וצוברים כוכבים.
          </p>
        </motion.section>

        {/* Actions */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-8 grid grid-cols-1 gap-3"
        >
          <button
            onClick={() => {
              setError('');
              setShowCreateModal(true);
            }}
            className="btn-star h-12 rounded-[2.5rem] w-full flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            צור קבוצה חדשה
          </button>

          <button
            onClick={() => {
              setError('');
              setShowJoinModal(true);
            }}
            className="h-12 rounded-[2.5rem] w-full border-2 border-slate-200 bg-white font-black text-slate-800 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-[#4D96FF]" />
            התחבר לקבוצה קיימת
          </button>
        </motion.section>

        {/* Recent groups */}
        {recentGroups.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-600 uppercase tracking-widest">
                קבוצות אחרונות
              </h2>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                לחץ כדי להיכנס
              </div>
            </div>

            <div className="space-y-3">
              {recentGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => handleRecentGroupClick(group.id)}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-black text-slate-900 truncate">{group.name}</div>
                      <div className="mt-1 inline-flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-black text-slate-700 tracking-wider">
                          {group.code}
                        </span>
                        <button
                          onClick={(e) => handleCopyGroupCode(e, group.code)}
                          className="h-9 px-3 rounded-xl bg-slate-100 border border-slate-200 font-black text-slate-700 active:scale-95 transition-transform inline-flex items-center gap-2"
                          title="העתק קוד"
                        >
                          {copiedGroupCode === group.code ? (
                            <>
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-xs">הועתק</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span className="text-xs">העתק</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-center justify-center">
                      <Star className="w-6 h-6" fill="currentColor" style={{ color: '#FFD93D' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </main>

      {/* Create Group Sheet */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={closeModals}
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
                <div>
                  <div className="text-[11px] font-black text-slate-600 uppercase tracking-widest">צור קבוצה</div>
                  <div className="text-xl font-black text-slate-900">קבוצה חדשה</div>
                </div>
                <button
                  type="button"
                  onClick={closeModals}
                  className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 inline-flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="סגור"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
                  <div className="text-[11px] font-black text-slate-600 uppercase tracking-widest">שם קבוצה</div>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => {
                      setGroupName(e.target.value);
                      setError('');
                    }}
                    placeholder="למשל: משפחת ליאור"
                    className="mt-2 w-full h-11 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-black text-slate-900 focus:outline-none focus:border-[#4D96FF]"
                    dir="rtl"
                    autoFocus
                  />
                </div>

                {error && <p className="text-red-600 text-sm font-black text-center">{error}</p>}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleCreateGroup}
                    disabled={loading}
                    className="btn-star h-12 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
                  >
                    {loading ? 'יוצר...' : 'צור'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Group Sheet */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={closeModals}
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
                <div>
                  <div className="text-[11px] font-black text-slate-600 uppercase tracking-widest">התחברות</div>
                  <div className="text-xl font-black text-slate-900">הזן קוד קבוצה</div>
                </div>
                <button
                  type="button"
                  onClick={closeModals}
                  className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 inline-flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="סגור"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
                  <div className="text-[11px] font-black text-slate-600 uppercase tracking-widest">קוד</div>
                  <input
                    type="text"
                    value={groupCode}
                    onChange={(e) => {
                      setGroupCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    placeholder="ABC123"
                    className="mt-2 w-full h-11 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-black text-slate-900 focus:outline-none focus:border-[#4D96FF]"
                    dir="ltr"
                    style={{ textAlign: 'center', letterSpacing: '2px' }}
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {loading && <p className="text-center text-sm font-black text-slate-500">מחפש...</p>}
                {error && <p className="text-red-600 text-sm font-black text-center">{error}</p>}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleJoinGroup}
                    disabled={loading}
                    className="btn-star h-12 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
                  >
                    התחבר
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
