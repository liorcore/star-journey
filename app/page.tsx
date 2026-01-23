'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Plus, Rocket, Star, Users, X, LogOut, Trash2, Shield } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useAdmin } from '@/app/contexts/AdminContext';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/app/components/AuthGuard';
import { getUserGroups, createGroup, deleteGroup, Group } from '@/app/lib/firestore';

interface RecentGroup {
  id: string;
  name: string;
  code: string;
  lastAccessed: number;
}

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedGroupCode, setCopiedGroupCode] = useState<string | null>(null);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userGroups = await getUserGroups(user.uid);
      setGroups(userGroups);
    } catch (err: any) {
      setError('שגיאה בטעינת קבוצות');
      // Error loading groups
    } finally {
      setLoading(false);
    }
  };

  const generateGroupCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('נא להזין שם קבוצה');
      return;
    }

    if (!user) {
      setError('נא להתחבר תחילה');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const code = generateGroupCode();
      const groupId = await createGroup(user.uid, {
        name: groupName,
        code: code,
        participants: [],
      });

      await loadGroups();
      setLoading(false);
      closeModals();
      router.push(`/group/${groupId}`);
    } catch (err: any) {
      setError('שגיאה ביצירת קבוצה');
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      setError('נא להזין קוד קבוצה');
      return;
    }

    if (!user) {
      setError('נא להתחבר תחילה');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Search for group by code
      const userGroups = await getUserGroups(user.uid);
      const group = userGroups.find((g) => g.code.toUpperCase() === groupCode.toUpperCase());

      if (!group) {
        setError('קבוצה לא נמצאה');
        setLoading(false);
        return;
      }

      setLoading(false);
      closeModals();
      router.push(`/group/${group.id}`);
    } catch (err: any) {
      setError('שגיאה בחיפוש קבוצה');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      // Error logging out
    }
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

  const handleDeleteGroup = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    setGroupToDelete(group);
    setShowDeleteGroupDialog(true);
  };

  const confirmDeleteGroup = async () => {
    if (!user || !groupToDelete) return;

    try {
      await deleteGroup(user.uid, groupToDelete.id);
      await loadGroups();
      setShowDeleteGroupDialog(false);
      setGroupToDelete(null);
    } catch (error: any) {
      // Error deleting group
      alert('שגיאה במחיקת קבוצה');
    }
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
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F5F9] pb-10" dir="rtl">
        <main className="max-w-md mx-auto px-3 pt-10 sm:pt-16">
          {/* Header with logout */}
          <div className="flex items-center justify-between mb-6">
            {user && (
              <div className="text-sm font-black text-slate-900">
                שלום <span className="text-[#4D96FF]">{user.displayName || user.email?.split('@')[0] || 'משתמש'}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 active:scale-95 transition-transform"
            >
              <LogOut className="w-4 h-4" />
              התנתק
            </button>
          </div>

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

        {/* My Groups */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-600 uppercase tracking-widest">
              הקבוצות שלי
            </h2>
            {groups.length > 0 && (
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                לחץ כדי להיכנס
              </div>
            )}
          </div>

          {groups.length > 0 ? (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"
                >
                  <div 
                    onClick={() => handleRecentGroupClick(group.id)}
                    className="cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-black text-slate-900 truncate">{group.name}</div>
                        <div className="mt-1 inline-flex items-center gap-2">
                          <button
                            onClick={(e) => handleCopyGroupCode(e, group.code)}
                            className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-black text-slate-700 tracking-wider active:scale-95 transition-transform inline-flex items-center gap-2 hover:bg-slate-200"
                            title="לחץ להעתקה"
                          >
                            {group.code}
                            {copiedGroupCode === group.code && (
                              <Check className="w-3 h-3 text-green-500" />
                            )}
                          </button>
                          {copiedGroupCode === group.code && (
                            <span className="text-xs font-black text-green-500">הועתק</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 w-12 h-12 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-center justify-center">
                        <Star className="w-6 h-6" fill="currentColor" style={{ color: '#FFD93D' }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleDeleteGroup(e, group)}
                      className="h-8 w-8 rounded-xl bg-white border border-slate-200 text-red-600 hover:bg-slate-50 inline-flex items-center justify-center active:scale-95 transition-transform"
                      title="מחק קבוצה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-black text-slate-400 mb-1">עוד לא יצרת קבוצות</p>
              <p className="text-xs text-slate-400">צור קבוצה חדשה או התחבר לקבוצה קיימת</p>
            </div>
          )}
        </motion.section>

        {/* Actions */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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

          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="h-12 rounded-[2.5rem] w-full border-2 border-slate-300 bg-slate-50 font-black text-slate-700 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-slate-600" />
              דשבורד אדמין
            </button>
          )}
        </motion.section>
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

      {/* Delete Group Dialog */}
      <AnimatePresence>
        {showDeleteGroupDialog && groupToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => {
              setShowDeleteGroupDialog(false);
              setGroupToDelete(null);
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
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-slate-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  מחיקת קבוצה
                </h3>
                <p className="text-slate-600 mb-4">
                  האם אתה בטוח שברצונך למחוק את הקבוצה <strong>{groupToDelete.name}</strong>?
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-right">
                  <p className="text-sm font-black text-slate-700 mb-2">משמעות המחיקה:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• כל הנתונים של הקבוצה יאבדו</li>
                    <li>• כל האירועים והמשתתפים ימחקו</li>
                    <li>• כל הכוכבים וההישגים יאבדו</li>
                    <li>• הפעולה לא ניתנת לביטול</li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowDeleteGroupDialog(false);
                    setGroupToDelete(null);
                  }}
                  className="h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 active:scale-95 transition-transform"
                >
                  ביטול
                </button>
                <button
                  onClick={confirmDeleteGroup}
                  className="h-12 rounded-2xl bg-red-600 text-white font-black active:scale-95 transition-transform hover:bg-red-700"
                >
                  מחק
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </AuthGuard>
  );
}
