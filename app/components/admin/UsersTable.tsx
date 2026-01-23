'use client';

import { useState } from 'react';
import { UserStats } from '@/app/lib/admin-stats';
import { Search, Mail, Calendar, FolderOpen } from 'lucide-react';

interface UsersTableProps {
  users: UserStats[];
  loading?: boolean;
}

export default function UsersTable({ users, loading }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(search) ||
      user.displayName?.toLowerCase().includes(search) ||
      user.userId.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-sm font-black text-slate-400">טוען משתמשים...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-900">רשימת משתמשים</h3>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש משתמש..."
            className="w-full h-10 rounded-xl border-2 border-slate-200 bg-white pr-10 pl-4 text-sm font-black text-slate-900 focus:outline-none focus:border-[#4D96FF]"
            dir="rtl"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-right py-3 px-4 text-xs font-black text-slate-600 uppercase tracking-widest">
                משתמש
              </th>
              <th className="text-right py-3 px-4 text-xs font-black text-slate-600 uppercase tracking-widest">
                תאריך רישום
              </th>
              <th className="text-right py-3 px-4 text-xs font-black text-slate-600 uppercase tracking-widest">
                קבוצות
              </th>
              <th className="text-right py-3 px-4 text-xs font-black text-slate-600 uppercase tracking-widest">
                אירועים
              </th>
              <th className="text-right py-3 px-4 text-xs font-black text-slate-600 uppercase tracking-widest">
                User ID
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm font-black text-slate-400">
                  {searchTerm ? 'לא נמצאו משתמשים' : 'אין משתמשים'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.userId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900">
                          {user.displayName || user.email || 'ללא שם'}
                        </div>
                        {user.email && user.displayName && (
                          <div className="text-xs text-slate-500">{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('he-IL')
                      : 'לא זמין'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 border border-green-200">
                      <FolderOpen className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-black text-green-900">{user.groupsCount}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 border border-purple-200">
                      <Calendar className="w-3 h-3 text-purple-600" />
                      <span className="text-xs font-black text-purple-900">{user.eventsCount}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-xs font-mono text-slate-500">{user.userId.substring(0, 8)}...</code>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredUsers.length > 0 && (
        <div className="mt-4 text-xs font-black text-slate-400 text-center">
          מציג {filteredUsers.length} מתוך {users.length} משתמשים
        </div>
      )}
    </div>
  );
}
