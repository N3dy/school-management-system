/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TRANSLATIONS } from '../translations';
import { Award, Globe, LogOut, Shield, User } from 'lucide-react';
import { DB } from '../db';

interface HeaderProps {
  lang: 'en' | 'sw';
  setLang: (lang: 'en' | 'sw') => void;
  onLogout: () => void;
  currentRole: string;
  userName: string;
}

export default function LanguageToggle({ lang, setLang, onLogout, currentRole, userName }: HeaderProps) {
  const t = TRANSLATIONS[lang];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-xs flex items-center justify-center">
            <Award className="h-6 w-6" id="logo-icon" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">
              {t.systemName}
            </h1>
            <p className="text-xs text-gray-500 font-mono tracking-wider uppercase">
              {t.systemAbbr} • {t.headmaster} Portal v2.6
            </p>
          </div>
        </div>

        {/* Top Actions & Profile Context */}
        <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Language translation switch */}
          <button
            onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 rounded-lg transition-all focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            id="lang-switch-btn"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-600" />
            <span>{t.switchLanguage}</span>
          </button>

          {/* User Context card */}
          {userName && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50/50 border border-emerald-100/60 rounded-xl" id="user-pill">
              <div className="bg-emerald-100 text-emerald-800 p-1 rounded-full">
                {currentRole === 'HEADMASTER' ? (
                  <Shield className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-none">{userName}</p>
                <span className="text-[10px] text-emerald-700 font-mono uppercase tracking-wider font-semibold">
                  {lang === 'en' ? TRANSLATIONS.en[currentRole.toLowerCase() as 'headmaster'|'teacher'|'parent'] : TRANSLATIONS.sw[currentRole.toLowerCase() as 'headmaster'|'teacher'|'parent']}
                </span>
              </div>
            </div>
          )}

          {/* Secure Logout action */}
          {userName && (
            <button
              onClick={onLogout}
              className="flex items-center justify-center p-2 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 hover:border-red-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
              title={t.logout}
              id="logout-btn"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
