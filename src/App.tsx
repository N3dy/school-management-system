/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DB } from './db';
import { UserRole } from './types';
import LanguageToggle from './components/LanguageToggle';
import PublicPortal from './components/PublicPortal';
import HeadmasterDashboard from './components/HeadmasterDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ParentDashboard from './components/ParentDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';

export default function App() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [session, setSession] = useState<{ user: any; role: UserRole } | null>(null);

  useEffect(() => {
    // Check if initial session exists
    const current = DB.getCurrentSession();
    if (current) {
      setSession(current);
    }
  }, []);

  const handleLogout = () => {
    DB.clearSession();
    setSession(null);
    window.location.hash = ''; // Clear secret hash state on logout
  };

  const handleLoginSuccess = (user: any, role: UserRole) => {
    setSession({ user, role });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800" id="smart-school-app-root">
      {/* Top Navbar Header (Display only if authenticated web session) */}
      {session && (session.role === 'SUPER_ADMIN' || session.role === 'HEADMASTER') && (
        <LanguageToggle
          lang={lang}
          setLang={setLang}
          onLogout={handleLogout}
          currentRole={session.role}
          userName={session.user.fullName || 'System User'}
        />
      )}

      {/* Main Body Routing based on roles */}
      <main className="flex-grow flex flex-col">
        {!session ? (
          <PublicPortal
            lang={lang}
            setLang={setLang}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          (() => {
            switch (session.role) {
              case 'SUPER_ADMIN':
                return <SuperAdminDashboard lang={lang} />;
              case 'HEADMASTER':
                return (
                  <HeadmasterDashboard 
                    lang={lang} 
                    headmasterId={session.user.id} 
                    schoolId={session.user.assignedSchoolId} 
                  />
                );
              case 'TEACHER':
                return <TeacherDashboard lang={lang} setLang={setLang} teacherId={session.user.id} onLogout={handleLogout} />;
              case 'PARENT':
                return <ParentDashboard lang={lang} setLang={setLang} parentId={session.user.id} onLogout={handleLogout} />;
              default:
                return (
                  <div className="p-8 text-center" id="session-fallback-error">
                    <p className="text-red-500 font-bold">Scope Context Error. Resetting session.</p>
                    <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
                      Reset
                    </button>
                  </div>
                );
            }
          })()
        )}
      </main>

      {/* Persistent Tiny Footer - Hidden for Mobile app viewports */}
      {(!session || (session && (session.role === 'SUPER_ADMIN' || session.role === 'HEADMASTER'))) && (
        <footer className="bg-white border-t border-gray-150 py-4 text-center text-[11px] text-gray-400 font-mono animate-fade-in" id="app-footer">
          © 2026 Smart School Management System (SSMS) • Secure RBAC Environment • All Rights Reserved.
        </footer>
      )}
    </div>
  );
}

