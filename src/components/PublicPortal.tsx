/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../translations';
import { DB, simulateHash } from '../db';
import { UserRole, Teacher, Parent, SaaS_School, SaaS_Headmaster } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  BookOpen, 
  HelpCircle, 
  Home, 
  Mail, 
  Lock, 
  Smartphone, 
  MapPin, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Globe, 
  Award, 
  Clock, 
  Fingerprint, 
  Network, 
  Building,
  DollarSign,
  Calendar,
  Volume2,
  FileText,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

interface PublicPortalProps {
  lang: 'en' | 'sw';
  setLang: (lang: 'en' | 'sw') => void;
  onLoginSuccess: (user: any, role: UserRole) => void;
}

export default function PublicPortal({ lang, setLang, onLoginSuccess }: PublicPortalProps) {
  const t = TRANSLATIONS[lang];
  
  // Public tabs: 'home' | 'teacher_login' | 'parent_login' | 'about' | 'help'
  const [activeTab, setActiveTab] = useState<'home' | 'teacher_login' | 'parent_login' | 'about' | 'help'>('home');
  const [isRegistering, setIsRegistering] = useState(false);

  // Secure Hidden administrative state
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [adminRole, setAdminRole] = useState<'SUPER_ADMIN' | 'HEADMASTER'>('HEADMASTER');
  const [devClicks, setDevClicks] = useState(0);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Specialty fields for Teacher signup
  const [teacherNumber, setTeacherNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');

  // Premium custom flow control states
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmailInput, setForgotEmailInput] = useState('');

  // 2FA state for Super Admin
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // School context selector state for Headmaster context login
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schools, setSchools] = useState<SaaS_School[]>([]);

  // Alerts
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  // Listen to secure URL hash keys to trigger the hidden Admin portal
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin-portal' || window.location.hash === '#admin-secure') {
        setShowAdminPortal(true);
      } else {
        setShowAdminPortal(false);
      }
    };
    window.addEventListener('hashchange', checkHash);
    checkHash();
    
    // Load schools list
    setSchools(DB.getSchools());
    const existingSchools = DB.getSchools();
    if (existingSchools.length > 0) {
      setSelectedSchoolId(existingSchools[0].id);
    }

    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleLogoClick = () => {
    const next = devClicks + 1;
    setDevClicks(next);
    if (next >= 5) {
      window.location.hash = '#admin-portal';
      setShowAdminPortal(true);
      setSuccessText(lang === 'en' ? '🔐 Secure Administrative Gate Activated!' : '🔐 Mlango Mkuu wa Utawala Umewashwa!');
      setDevClicks(0);
      setTimeout(() => setSuccessText(''), 3000);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!email || !password) {
      setErrorText(t.pleaseLogin);
      return;
    }

    const enteredHash = simulateHash(password);

    if (activeTab === 'teacher_login') {
      const teachers = DB.getTeachers();
      // Teacher matches either on email or Teacher Card ID Number
      const matched = teachers.find(
        t => t.email.toLowerCase() === email.toLowerCase() || t.teacherNumber.toLowerCase() === email.toLowerCase()
      );

      if (!matched || matched.passwordHash !== enteredHash) {
        setErrorText(t.invalidCredentials);
        return;
      }

      if (matched.status === 'PENDING') {
        setErrorText(t.registrationSuccess);
        return;
      }

      if (matched.status === 'REJECTED') {
        setErrorText(t.registrationRejected);
        return;
      }

      // Check if school context is active (Not suspended)
      const targetSchoolId = matched.schoolId || 'SCH-001';
      const targetSchool = DB.getSchools().find(s => s.id === targetSchoolId);
      if (targetSchool && targetSchool.status === 'SUSPENDED') {
        setErrorText(
          lang === 'en' 
            ? 'Access Denied: The academic campus node for this school has been suspended by SaaS Governance.'
            : 'Ufikiaji Umekataliwa: Kituo cha masomo cha shule hii kimesitishwa na Utawala.'
        );
        return;
      }

      // Successful teacher sign in
      DB.startSession(matched, 'TEACHER');
      onLoginSuccess(matched, 'TEACHER');

    } else if (activeTab === 'parent_login') {
      const parents = DB.getParents();
      // Parent matches either on phone or email
      const matched = parents.find(
        p => p.email.toLowerCase() === email.toLowerCase() || p.phone === email || p.email === email
      );

      if (!matched || matched.passwordHash !== enteredHash) {
        setErrorText(t.invalidCredentials);
        return;
      }

      // Successful parent sign in
      DB.startSession(matched, 'PARENT');
      onLoginSuccess(matched, 'PARENT');
    }
  };

  // Secure Hidden Administrative Portal Login (Super Admin & Headmasters)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!email || !password) {
      setErrorText(t.pleaseLogin);
      return;
    }

    if (adminRole === 'SUPER_ADMIN') {
      // Direct Super Admin access with optional 2FA check
      if (email.toLowerCase() === 'admin@schoolmanagement.com' && password === 'superadmin') {
        
        // Simulating optional 2FA verification code checking
        if (twoFactorCode && twoFactorCode !== '123456') {
          setErrorText(lang === 'en' ? 'Invalid 2FA Authenticator Token. Try "123456".' : 'Msimbo batili wa 2FA. Jaribu "123456".');
          return;
        }

        const adminSession = { id: 'SA1', fullName: 'SaaS Platform Administrator', email: 'admin@schoolmanagement.com' };
        DB.startSession(adminSession, 'SUPER_ADMIN');
        onLoginSuccess(adminSession, 'SUPER_ADMIN');
      } else {
        setErrorText(t.invalidCredentials);
      }
    } else if (adminRole === 'HEADMASTER') {
      // RULES: Headmaster must log in per specific school context!
      const headmasters = DB.getSaaSHeadmasters();
      // Matches username or email
      const matched = headmasters.find(
        hm => (hm.username.toLowerCase() === email.toLowerCase() || hm.email.toLowerCase() === email.toLowerCase())
      );

      if (!matched || matched.passwordHash !== simulateHash(password)) {
        setErrorText(t.invalidCredentials);
        return;
      }

      if (matched.status === 'DISABLED') {
        setErrorText(lang === 'en' ? 'Administrative identity is deactivated.' : 'Maelezo ya msimamizi yamesitishwa.');
        return;
      }

      // Verify selected school matches headmaster's actual assigned school context
      if (matched.assignedSchoolId !== selectedSchoolId) {
        setErrorText(
          lang === 'en'
            ? 'Context Error: You do not have administrative credentials for the selected academic campus.'
            : 'Mazingira Batili: Huna mamlaka ya kiutawala katika kituo cha shule ulichochagua.'
        );
        return;
      }

      // Check if target school is suspended
      const activeSch = DB.getSchools().find(s => s.id === selectedSchoolId);
      if (activeSch && activeSch.status === 'SUSPENDED') {
        setErrorText(
          lang === 'en' 
            ? 'Access Blocked: This school campus is SUSPENDED. All administrative actions are frozen.'
            : 'Ufikiaji Umesitishwa: Shule hii IMESIMAMISHWA. Vitendo vyote vya kiutawala vimegandishwa.'
        );
        return;
      }

      // Successful Headmaster Contextual match
      DB.startSession(matched, 'HEADMASTER');
      onLoginSuccess(matched, 'HEADMASTER');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!fullName || !email || !password || !confirmPassword || !phone) {
      setErrorText(lang === 'en' ? 'All fields are mandatory.' : 'Maelezo yote yanapaswa kujazwa rasmi.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorText(lang === 'en' ? 'Passwords do not match.' : 'Nywila hazitofautiani kwa kufanana.');
      return;
    }

    const passHash = simulateHash(password);

    if (activeTab === 'teacher_login') {
      if (!teacherNumber || !qualification || !specialization) {
        setErrorText(lang === 'en' ? 'Kindly fill specialized teacher profiles.' : 'Tafadhali jaza sifa zote za ualimu.');
        return;
      }

      const teachers = DB.getTeachers();
      if (teachers.some(t => t.email.toLowerCase() === email.toLowerCase() || t.teacherNumber === teacherNumber)) {
        setErrorText(lang === 'en' ? 'Email or Teacher Number already registered.' : 'Mwalimu mwenye barua pepe hii au namba hii ameshasajiliwa.');
        return;
      }

      const newTeacher: Teacher = {
        id: 'T-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        schoolId: 'SCH-001', // Default sandbox school context
        fullName,
        teacherNumber,
        phone,
        email: email.toLowerCase(),
        qualification,
        specialization,
        status: 'PENDING',
        isClassTeacherOf: null,
        assignedSubjectIds: [],
        assignedClassIds: [],
        registeredAt: new Date().toISOString(),
        passwordHash: passHash,
      };

      teachers.push(newTeacher);
      DB.saveTeachers(teachers);

      DB.addNotification(
        `New teacher registration submitted: ${fullName} (${teacherNumber})`,
        `Ombi jipya la ualimu limepokelewa kutoka kwa ${fullName} (${teacherNumber})`,
        'HEADMASTER'
      );

      DB.addAudit('Teacher Self-Registration', `Teacher ${fullName} requested status.`, fullName);

      setSuccessText(t.registrationSuccess);
      setIsRegistering(false);
      clearForm();
    } else if (activeTab === 'parent_login') {
      const parents = DB.getParents();
      if (parents.some(p => p.email.toLowerCase() === email.toLowerCase() || p.phone === phone)) {
        setErrorText(lang === 'en' ? 'Parent phone or email already registered.' : 'Mzazi mwenye barua pepe hii au namba ya simu tayari amesajiliwa.');
        return;
      }

      const newParent: Parent = {
        id: 'P-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        fullName,
        phone,
        email: email.toLowerCase(),
        passwordHash: passHash,
        verifiedStudentIds: [],
      };

      parents.push(newParent);
      DB.saveParents(parents);

      DB.addAudit('Parent Registration', `Parent account configured for ${fullName}.`, fullName);

      setSuccessText(lang === 'en' ? 'Registration successful! Proceed to secure sign-in.' : 'Usajili umekamilika kikamilifu! Sasa unaweza kuingia.');
      setIsRegistering(false);
      clearForm();
    }
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
    setTeacherNumber('');
    setQualification('');
    setSpecialization('');
    setTwoFactorCode('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative pb-24 md:pb-28" id="portal-root-view">
      {/* Upper Brand Decorative Bar representing our professional brand colors */}
      <div className="bg-gradient-to-r from-[#1E40AF] via-[#38BDF8] to-[#22C55E] h-2.5 w-full"></div>

      {/* Hero Global Grid Navigation Header */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
            <div className="bg-gradient-to-tr from-[#1E40AF] to-[#22C55E] text-white p-2.5 rounded-2xl shadow-md transform hover:rotate-6 transition-transform">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-[#22C55E] tracking-widest leading-none block">Smart Portal</span>
              <h1 className="text-sm md:text-base font-black tracking-tight text-[#1F2937] mt-0.5">
                {t.systemName} <span className="text-[#1E40AF] text-xs font-mono font-bold">{t.systemAbbr}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* English & Kiswahili Flag Language switcher */}
            <div className="flex items-center gap-2" id="language-flag-switcher">
              <button
                onClick={() => { setLang('en'); setErrorText(''); setSuccessText(''); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#1E40AF] text-white shadow-md scale-102'
                    : 'bg-slate-100 text-[#1F2937] hover:bg-slate-200'
                }`}
                title="Switch Language to English"
              >
                <span>English</span>
                <span>🇬🇧</span>
              </button>
              
              <button
                onClick={() => { setLang('sw'); setErrorText(''); setSuccessText(''); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  lang === 'sw'
                    ? 'bg-[#22C55E] text-white shadow-md scale-102'
                    : 'bg-[#F1F5F9] text-[#1F2937] hover:bg-slate-200'
                }`}
                title="Badilisha lugha kuwa Kiswahili"
              >
                <span>Kiswahili</span>
                <span>🇹🇿</span>
              </button>
            </div>

            {/* Hidden admin button notification helper for developers */}
            <button
              onClick={() => {
                setShowAdminPortal(!showAdminPortal);
                if (!showAdminPortal) {
                  window.location.hash = '#admin-portal';
                } else {
                  window.location.hash = '';
                }
              }}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
              title="Toggle Institutional Administrative Console (Secured)"
            >
              <Lock className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Verification Success Notifications */}
        {successText && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-3" id="public-success-notif">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{successText}</span>
          </div>
        )}

        {/* Verification Danger Notifications */}
        {errorText && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-600 text-xs font-semibold flex items-center gap-3" id="public-error-notif">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        {/* SECURE HIDDEN PORTAL ACCESS RENDER */}
        {showAdminPortal ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl shadow-xl overflow-hidden max-w-lg mx-auto"
            id="secured-admin-node"
          >
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 flex items-center gap-3.5">
              <div className="p-3 bg-red-600 text-white rounded-2xl">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-red-500 uppercase">Secured Gate</span>
                <h2 className="text-base font-black tracking-tight">{lang === 'en' ? 'Administrative Access Desk' : 'Ukurasa wa Kiutawala'}</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setAdminRole('HEADMASTER'); setErrorText(''); }}
                  className={`flex-1 py-2 text-xs font-black rounded-lg text-center cursor-pointer ${
                    adminRole === 'HEADMASTER' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  🏫 {lang === 'en' ? 'Headmaster' : 'Mwalimu Mkuu'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdminRole('SUPER_ADMIN'); setErrorText(''); }}
                  className={`flex-1 py-2 text-xs font-black rounded-lg text-center cursor-pointer ${
                    adminRole === 'SUPER_ADMIN' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  🛡️ {lang === 'en' ? 'Super Admin' : 'Msimamizi Mkuu'}
                </button>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
                {/* School Selector Context: REQUIRED FOR HEADMASTER, COMPLY WITH MULTI-TENANT ISOLATION */}
                {adminRole === 'HEADMASTER' && (
                  <div>
                    <label className="block text-xxs font-black uppercase text-slate-400 mb-1">
                      {lang === 'en' ? 'Target School Context Location *' : 'Eneo la Kampasi Shule *'}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Building className="h-4 w-4" />
                      </span>
                      <select
                        value={selectedSchoolId}
                        onChange={e => setSelectedSchoolId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 rounded-xl text-xs font-semibold"
                        required
                      >
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.region}) {s.status === 'SUSPENDED' ? '⚠️ [SUSPENDED]' : '✅ [ACTIVE]'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xxs font-black uppercase text-slate-400 mb-1">
                    {adminRole === 'SUPER_ADMIN' ? (lang === 'en' ? 'Fiscal Email' : 'Barua Pepe') : (lang === 'en' ? 'Personnel Username' : 'Jina la Utawala')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={adminRole === 'SUPER_ADMIN' ? 'admin@ssms.com' : 'e.g. kijenge_head'}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-black uppercase text-slate-400 mb-1">
                    {t.password}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                {/* Optional 2FA Verification input for Super Admin */}
                {adminRole === 'SUPER_ADMIN' && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2">
                    <label className="block text-xxs font-black text-red-800 uppercase flex items-center gap-1">
                      <Fingerprint className="h-3 w-3" />
                      <span>{lang === 'en' ? 'SaaS Core Authenticator Code (2FA)*' : 'Msimbo Maalum wa Uhakiki (2FA)*'}</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      value={twoFactorCode}
                      onChange={e => setTwoFactorCode(e.target.value)}
                      className="w-full p-2.5 bg-white border border-red-200 rounded-xl font-mono text-center tracking-widest text-xs"
                    />
                    <p className="text-[10px] text-red-500 font-medium">
                      {lang === 'en' ? 'Security Notice: Leave empty or write "123456" to simulate.' : 'Ilani ya Usalama: Acha wazi au weka "123456" ili kupitisha.'}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-md shadow-red-500/10 text-center"
                >
                  🛡️ {lang === 'en' ? 'Unlock Secure Dashboard' : 'Fungua Ukurasa salama'}
                </button>
              </form>

              {/* Secure Assist */}
              <div className="mt-5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-800 block">🔑 Credentials Sandbox Assist:</span>
                {adminRole === 'SUPER_ADMIN' ? (
                  <p>Email: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700 select-all">admin@schoolmanagement.com</code> | Code: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700">superadmin</code></p>
                ) : (
                  <div>
                    <p>• <b>Sec Level HM:</b> <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700 select-all">kijenge_head</code> / Password: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700">admin123</code></p>
                    <p>• <b>Prim Level HM:</b> <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700 select-all">mrema_sc</code> / Password: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700">admin123</code></p>
                  </div>
                )}
              </div>

              <div className="text-center mt-4">
                <button 
                  onClick={() => { setShowAdminPortal(false); window.location.hash = ''; }}
                  className="text-xs font-black text-slate-500 hover:text-slate-800 underline block mx-auto cursor-pointer"
                >
                  {lang === 'en' ? '← Return to Portal Page' : '← Rudi kwenye Mwanzo'}
                </button>
              </div>

            </div>
          </motion.div>
        ) : (
          <div className="space-y-12" id="public-portal-contents">
            {activeTab === 'home' && (
              <div className="space-y-12 animate-fade-in text-left" id="public-landing-view">
                
                {/* Premium Dark-Green Hero Showcase Block */}
                <div 
                  className="relative rounded-[32px] overflow-hidden shadow-xl min-h-[480px] flex items-center p-8 md:p-14 text-white premium-gradient-bg" 
                  id="portal-hero-showcase"
                >
                  {/* Decorative Glassmorphism Glowing Orbs */}
                  <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-emerald-550/10 rounded-full blur-[90px] pointer-events-none"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent-green/10 rounded-full blur-[100px] pointer-events-none"></div>
                  
                  {/* Subtle Unsplash background grid overlaid with brand-rich theme */}
                  <div 
                    className="absolute inset-0 opacity-20 mix-blend-overlay bg-cover bg-center"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1920')` }}
                  ></div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full relative z-10 text-left">
                    <div className="lg:col-span-7 space-y-5 text-left">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono uppercase tracking-wider rounded-full">
                        <Activity className="h-3 w-3 animate-pulse text-accent-green" />
                        <span>{lang === 'en' ? 'SaaS Hub • Active Campus Node' : 'Mfumo Imara • Kampasi Shule'}</span>
                      </span>

                      <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white font-sans">
                        {lang === 'en' ? 'School Management System' : 'Mfumo wa Usimamizi Shule'}
                      </h2>

                      <p className="text-xs md:text-sm text-emerald-100 font-medium leading-relaxed max-w-2xl">
                        {lang === 'en' 
                          ? 'Smart School Management System (SSMS) standardizes day-to-day scholastic administration across Tanzania. Explore sandbox multi-tenant school partition parameters, geofenced faculty check-ins, and accurate parent mobile linkages.'
                          : 'Mfumo mahiri wa elimu wa SSMS umeratibiwa kukuza ufanisi wa usimamizi wa shule nchini Tanzania. Fuatilia mahudhudhio ya kijiografia ya walimu, ripoti za matokeo, na mifumo ya wazazi.'}
                      </p>

                      <div className="flex flex-wrap gap-4 pt-2">
                        <button
                          onClick={() => { setActiveTab('teacher_login'); setIsRegistering(false); }}
                          className="px-5 py-3 bg-emerald-550 hover:bg-emerald-600 text-white font-extrabold rounded-2xl hover:scale-102 transition-all cursor-pointer shadow-md text-xs flex items-center gap-1.5"
                        >
                          👩‍🏫 {lang === 'en' ? 'Faculty Portal' : 'Lango la Walimu'}
                        </button>

                        <button
                          onClick={() => { setActiveTab('parent_login'); setIsRegistering(false); }}
                          className="px-5 py-3 bg-slate-900 border border-slate-850 text-white font-extrabold rounded-2xl hover:bg-slate-800 hover:scale-102 transition-all cursor-pointer shadow-md text-xs flex items-center gap-1.5"
                        >
                          👨‍👩‍👧 {lang === 'en' ? 'Guardian Portal' : 'Chumba cha Mzazi'}
                        </button>
                      </div>
                    </div>

                    {/* Right illustrative card overlay */}
                    <div className="lg:col-span-5 hidden lg:flex justify-end text-left">
                      <div className="glass-card rounded-[24px] p-5 max-w-sm w-full space-y-3.5 border border-white/10 shadow-lg text-left">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <span className="text-[9px] uppercase font-bold text-emerald-300 tracking-wider font-mono">Live Campus Monitor</span>
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        </div>

                        <div className="space-y-2 text-xxs font-medium">
                          <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                            <span className="text-slate-300">{lang === 'en' ? 'Isolation Constraint' : 'Ulinzi wa Data'}</span>
                            <span className="font-mono text-emerald-400 font-extrabold">Tenant Active</span>
                          </div>
                          <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                            <span className="text-slate-300">{lang === 'en' ? 'Active School Nodes' : 'Kampasi zilizosajiliwa'}</span>
                            <span className="font-mono text-emerald-400 font-extrabold">3 School Sites</span>
                          </div>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                          <img 
                            src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=150" 
                            alt="African school children" 
                            className="w-8 h-8 rounded-lg object-cover border border-white/10"
                            loading="lazy"
                          />
                          <div className="text-left">
                            <h4 className="text-[10px] font-bold text-white leading-tight">Ufaulu na Malezi Kidijitali</h4>
                            <p className="text-[8px] text-emerald-300 font-mono">Authorized Claims System</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Localized Statistics Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="modular-stats-cards">
                  {[
                    { labelEn: 'Affiliated Schools', labelSw: 'Shule Shirikishi', val: '3+', icon: Building, color: 'text-emerald-600 bg-emerald-50' },
                    { labelEn: 'Faculty Members', labelSw: 'Walimu Waliosajiliwa', val: '15+', icon: Users, color: 'text-emerald-500 bg-emerald-50' },
                    { labelEn: 'Linked Guardians', labelSw: 'Wazazi Waliounganishwa', val: '85+', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
                    { labelEn: 'Geofence Security', labelSw: 'Ulinzi Geofencing', val: '100%', icon: ShieldCheck, color: 'text-green-600 bg-green-50' },
                  ].map((st, i) => {
                    const Icon = st.icon;
                    return (
                      <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3 shadow-3xs text-left">
                        <div className={`p-2.5 rounded-xl ${st.color}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="text-left">
                          <span className="text-base font-black text-slate-950 block tracking-tight">{st.val}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                            {lang === 'en' ? st.labelEn : st.labelSw}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* About the System Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-slate-100 pt-8" id="about-system-overview">
                  <div className="space-y-4 text-left">
                    <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 leading-tight">
                      {lang === 'en' ? 'Architecting Smart Governance in Education' : 'Usimamizi Mahiri na Salama wa Elimu'}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      {lang === 'en'
                        ? 'Smart School Management System (SSMS) is built to digitize daily school operations in Tanzania. By isolating databases per school ID, our multi-tenant cloud safeguards student privacy while allowing seamless centralized auditing.'
                        : 'Mfumo wa Kidijitali wa Shule (SSMS) umeundwa kurahisisha shughuli za shule kila siku nchini Tanzania. Kwa kutenga hifadhidata kwa kila shule, mfumo wetu unalinda usalama wa takwimu huku ukiruhusu ukaguzi mkuu.'}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-3.5 text-left text-xxs">
                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{lang === 'en' ? 'Core Compliance Standards' : 'Mitaala na Viwango vya Usalama'}</h4>
                    <ul className="space-y-3.5 text-slate-600">
                      <li className="flex items-center gap-2 font-medium">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                        <span><b>{lang === 'en' ? 'GPS Attendance Geofencing:' : 'Kujisajili kwa GPS Geofence:'}</b> {lang === 'en' ? 'Teachers verify attendance within school coordinates constraint.' : 'Walimu huthibitisha mahudhurio ndani ya eneo rasmi la shule kisheria.'}</span>
                      </li>
                      <li className="flex items-center gap-2 font-medium">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                        <span><b>{lang === 'en' ? 'Personal Data Protection:' : 'Sheria ya Kulinda Taarifa za Siri:'}</b> {lang === 'en' ? 'Confining guardian details to registered matches.' : 'Kuhifadhi namba na namba ya usajili wa wazazi kulingana na miongozo.'}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Highly Polished Information / Benefits Sections as requested */}
                <div className="space-y-12 pt-6 border-t border-slate-100 text-left" id="benefits-sections">
                  {/* For Parents Section */}
                  <div className="space-y-6 text-left">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-2.5 text-left">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[8px] uppercase font-bold text-emerald-600 tracking-wider font-mono">INTEGRATED ECOSYSTEM</span>
                        <h3 className="text-base md:text-lg font-black text-[#1F2937]">
                          {lang === 'en' ? 'Features & Benefits for Parents' : 'Manufaa na Vipengele kwa Wazazi'}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
                      {[
                        { icon: BookOpen, titleEn: "Academic Progress Tracking", titleSw: "Kufuatilia Maendeleo ya Masomo", descEn: "View academic progressive summaries, term evaluations and general progress indicators.", descSw: "Angalia muhtasari wa kimasomo, tathmini za muhula na viashiria vya maendeleo." },
                        { icon: DollarSign, titleEn: "Fee Payment Monitoring", titleSw: "Kuona Malipo ya Ada", descEn: "Continuous track of school dues status, history logs of transactions, and balance sheets.", descSw: "Angalia usawa wa malipo ya shule na kumbukumbu rasmi za miamala iliyofanyika." },
                        { icon: Calendar, titleEn: "Attendance Tracking", titleSw: "Kufuatilia Mahudhurio", descEn: "Daily and weekly attendance logs tracking classroom participation and teacher presence verification.", descSw: "Fuatilia mahudhurio ya kila siku ya mtoto wako na uthibitisho wa kuwepo kwake darasani." },
                        { icon: Award, titleEn: "Examination Results", titleSw: "Matokeo ya Mitihani", descEn: "Instant grade cards, progressive testing logs, quizzes, finals, and exam breakdown charts.", descSw: "Pata alama za mitihani, mazoezi, na taarifa kamili za ufaulu wa mtoto wako mara moja." },
                        { icon: Volume2, titleEn: "School Announcements", titleSw: "Matangazo ya Shule", descEn: "Instant notice broadcasts from the headmaster and administration direct to your notification list.", descSw: "Soma matangazo yote rasmi yaliyosambazwa na Mwalimu Mkuu au ofisi ya shule yetu." },
                        { icon: Users, titleEn: "Multiple Children Management", titleSw: "Kusimamia Watoto Wengi", descEn: "Link several children profiles under one single parent account and switch with one tap.", descSw: "Unganisha wasifu wa watoto wako wote chini ya akaunti moja ya mzazi na ubadilishe kwa urahisi." }
                      ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <div key={idx} className="bg-white border border-slate-150 p-5 rounded-2xl hover:shadow-xs transition-all duration-300 hover:border-emerald-500/20 space-y-2.5 group text-left text-xxs">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <h4 className="font-extrabold text-[#1F2937] group-hover:text-emerald-700">
                              {lang === 'en' ? item.titleEn : item.titleSw}
                            </h4>
                            <p className="text-slate-500 leading-relaxed font-semibold">
                              {lang === 'en' ? item.descEn : item.descSw}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* For Teachers Section */}
                  <div className="space-y-6 pt-6 text-left">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-2.5 text-left">
                      <div className="p-2 bg-slate-100 text-dark-green rounded-xl">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[8px] uppercase font-bold text-dark-green tracking-wider font-mono">EDUCATOR CORE</span>
                        <h3 className="text-base md:text-lg font-black text-[#1F2937]">
                          {lang === 'en' ? 'Features & Benefits for Teachers' : 'Manufaa na Vipengele kwa Walimu'}
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
                      {[
                        { icon: UserCheck, titleEn: "Student Management", titleSw: "Usimamizi wa Wanafunzi", descEn: "Keep full student profiles, link parents, and review overall classroom registries easily.", descSw: "Hifadhi taarifa kamili za wanafunzi, unganisha wazazi na kagua usajili wa darasa kwa urahisi." },
                        { icon: FileText, titleEn: "Examination Recording", titleSw: "Kurekodi Mitihani", descEn: "Input marks for quizzes, tests, midterm, and terminal examinations directly on a dynamic grid.", descSw: "Weka kwa urahisi alama za mazoezi, mitihani ya katikati, na mtihani wa mwisho." },
                        { icon: MapPin, titleEn: "Attendance Recording", titleSw: "Kurekodi Mahudhurio", descEn: "Verify attendance logs inside campus with exact GPS geofenced coordinates and check-in times.", descSw: "Sajili mahudhurio ya darasani na thibitisha kuwepo shuleni kwa usalama wa kijiografia vya GPS." },
                        { icon: BookOpen, titleEn: "Assignment Management", titleSw: "Usimamizi wa Kazi za Nyumbani", descEn: "Upload homework exercise sheets, instructions, set due dates, and broadcast them instantly.", descSw: "Tengeneza mazoezi ya nyumbani, weka muda wa mwisho, na sambaza mara moja kwa wazazi." },
                        { icon: TrendingUp, titleEn: "Performance Analysis", titleSw: "Uchambuzi wa Maendeleo", descEn: "Automatic grade distributions, average class scores, and statistical trends calculated.", descSw: "Andaa usambazaji wa daraja, alama za wastani wa darasa kwa njia ya takwimu." },
                        { icon: MessageSquare, titleEn: "Communication with Parents", titleSw: "Mawasiliano na Wazazi", descEn: "Post evaluation comments, review student performance, and talk directly via notifications.", descSw: "Weka maoni ya mwalimu ya kitaaluma, fanya tathmini, na wasiliana kwa urahisi na wazazi." }
                      ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <div key={idx} className="bg-white border border-slate-150 p-5 rounded-2xl hover:shadow-xs transition-all duration-300 hover:border-emerald-500/20 space-y-2.5 group text-left text-xxs">
                            <div className="p-2.5 bg-emerald-50 text-dark-green w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <h4 className="font-extrabold text-[#1F2937] group-hover:text-[#14532D]">
                              {lang === 'en' ? item.titleEn : item.titleSw}
                            </h4>
                            <p className="text-slate-500 leading-relaxed font-semibold">
                              {lang === 'en' ? item.descEn : item.descSw}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Security Framework Explanation Banner */}
                <div className="p-6 bg-gradient-to-r from-[#14532D] to-emerald-800 text-white rounded-[24px] space-y-2.5 text-left">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/20 text-emerald-300 rounded-lg">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="font-extrabold text-xs tracking-tight">{lang === 'en' ? 'Standardized Multi-Tenant Compliance' : 'Usimamizi na Usalama wa Juu kwa Kila Kampasi'}</h3>
                  </div>
                  <p className="text-xxs text-emerald-100 leading-relaxed font-semibold">
                    {lang === 'en'
                      ? 'Every academic node exists as a distinct isolated database container. Student records, grades, and parent-phone linkages are partitioned under the primary school_id constraint. Headmasters cannot browse records outside their boundaries, and global parent phone databases are strictly un-searchable, complying with Tanzanian Personal Data Protection guidelines.'
                      : 'Kila kituo cha masomo kina mazingira yake ya kipekee ya kuhifadhi na kusimamia data. Taarifa za wanafunzi, ripoti za kitaaluma, na namba za uunganishaji wa simu za wazazi zinalindwa vikali kulingana na miongozo na mamlaka husika ya data nchini Tanzania.'}
                  </p>
                </div>

              </div>
            )}

            {/* VIEW 2: TEACHER LOGIN PAGE (WRAPPED IN HIGH-FIDELITY MOBILE DEVICE PREVIEW) */}
            {activeTab === 'teacher_login' && (
              <div className="py-6 flex items-center justify-center animate-fade-in" id="teacher-portal-access">
                
                {/* STANDALONE SECURE MOBILE PORTAL CONTAINER */}
                <div className="w-full max-w-[430px] min-w-[320px] bg-[#F8FAFC] rounded-[24px] shadow-xl border border-slate-150 flex flex-col relative overflow-hidden mx-auto p-4 pb-8">
                  
                  {/* App Logo & Header Inside Screen */}
                    <div className="text-center space-y-2 mt-4 mb-3">
                      <div className="bg-[#1E40AF] text-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#1E40AF]">Faculty Portal</span>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">
                        {isRegistering 
                          ? (lang === 'en' ? 'Faculty Application Form' : 'Sajili Ombi la Kazi')
                          : (lang === 'en' ? 'Teacher Identity Gateway' : 'Ingia Kama Mwalimu')}
                      </h3>
                    </div>

                    <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-xs space-y-4 flex-1">
                      {isRegistering ? (
                        /* Registration Form inside phone */
                        <form onSubmit={handleRegister} className="space-y-4 text-xxs">
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{t.fullName}</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Martha Mweli"
                              value={fullName}
                              onChange={e => setFullName(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{t.email}</label>
                              <input
                                type="email"
                                required
                                placeholder="martha@school.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{t.phone}</label>
                              <input
                                type="tel"
                                required
                                placeholder="0755123456"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                              />
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                            <span className="text-[9px] font-bold text-blue-700 block uppercase">📚 Academic Dossier:</span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] font-bold text-slate-600 mb-0.5">{t.teacherNo}</label>
                                <input
                                  type="text"
                                  placeholder="TR-2244"
                                  value={teacherNumber}
                                  onChange={e => setTeacherNumber(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xxs font-mono"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-slate-600 mb-0.5">{t.qualification}</label>
                                <input
                                  type="text"
                                  placeholder="BSc Education"
                                  value={qualification}
                                  onChange={e => setQualification(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xxs"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-slate-600 mb-0.5">{t.specialization}</label>
                              <input
                                type="text"
                                placeholder="e.g. Mathematics"
                                value={specialization}
                                onChange={e => setSpecialization(e.target.value)}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xxs"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{t.password}</label>
                              <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{t.confirmPassword}</label>
                              <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-[#1E40AF] hover:bg-[#1E40AF]/95 text-white font-bold rounded-xl cursor-pointer transition-transform duration-150 hover:scale-[1.01] text-xxs shadow-md shadow-blue-500/10 text-center"
                          >
                            🚀 {lang === 'en' ? 'Register and Submit Application' : 'Jisajili na Wasilisha'}
                          </button>
                        </form>
                      ) : (
                        /* Login Form inside phone */
                        <form onSubmit={handleLogin} className="space-y-4 text-xxs">
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                              {lang === 'en' ? 'Teacher ID or Email' : 'Namba ya Mwalimu au Barua Pepe'}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. TR-1002 or email address"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                              id="input-teacher-email"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t.password}</label>
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                              id="input-teacher-password"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-[#1E40AF] hover:bg-[#1E40AF]/95 text-white font-bold rounded-xl cursor-pointer transition-transform duration-150 hover:scale-[1.01] text-xxs shadow-md shadow-blue-500/20 text-center"
                            id="submit-teacher-login"
                          >
                            🔑 {lang === 'en' ? 'Authorize Faculty Account' : 'Ingia kwenye Ukurasa'}
                          </button>
                        </form>
                      )}

                      {/* Toggle Register/Login Option */}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[10px]">
                        <button
                          onClick={() => { setIsRegistering(!isRegistering); setErrorText(''); }}
                          className="text-[#1E40AF] font-bold hover:underline cursor-pointer"
                          id="teacher-signup-toggle"
                        >
                          {isRegistering 
                            ? (lang === 'en' ? 'Already registered? Sign In' : 'Umekwishajisajili? Ingia hapa') 
                            : (lang === 'en' ? 'Apply as Candidate Teacher' : 'Jisajili kama Mwalimu mpya')}
                        </button>
                      </div>

                      {/* Sandbox credentials details helper inside secure container */}
                      {!isRegistering && (
                        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[9px] text-slate-600 space-y-1">
                          <span className="font-extrabold text-blue-800 block">🔑 Sandbox Faculty Accounts:</span>
                          <div>• Jane Doe (Primary): <code className="font-mono bg-blue-50 px-1 py-0.5 rounded text-blue-900">jane.doe@ssms.edu</code> / password123</div>
                          <div>• Secondary Mwalimu: <code className="font-mono bg-blue-50 px-1 py-0.5 rounded text-blue-900">mrema_math@school.com</code> / password123</div>
                        </div>
                      )}

                    </div>

                </div>
              </div>
            )}

            {/* VIEW 3: PARENT LOGIN PAGE (WRAPPED IN HIGH-FIDELITY MOBILE DEVICE PREVIEW) */}
            {activeTab === 'parent_login' && (
              <div className="py-6 flex items-center justify-center animate-fade-in" id="parent-portal-access">
                
                {/* STANDALONE SECURE MOBILE PORTAL CONTAINER */}
                <div className="w-full max-w-[430px] min-w-[320px] bg-[#F8FAFC] rounded-[24px] shadow-xl border border-slate-150 flex flex-col relative overflow-hidden mx-auto p-4 pb-8">
                  
                  {/* App Logo & Header Inside Screen */}
                    <div className="text-center space-y-2 mt-4 mb-3">
                      <div className="bg-[#22C55E] text-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                        <Users className="h-5 w-5" />
                      </div>
                      <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-emerald-700">Kindred Portal</span>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">
                        {isRegistering 
                          ? (lang === 'en' ? 'Parent Enrolment Registries' : 'Jisajili Kama Mzazi')
                          : (lang === 'en' ? 'Parent Ledger Gateway' : 'Ingia Kama Mzazi')}
                      </h3>
                    </div>

                    <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-xs space-y-4 flex-1">
                      {isRegistering ? (
                        /* Parent Register inside phone */
                        <form onSubmit={handleRegister} className="space-y-4 text-xxs">
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{t.fullName}</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. William Jackson"
                              value={fullName}
                              onChange={e => setFullName(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{t.phone}</label>
                            <input
                              type="tel"
                              required
                              placeholder="0712345678"
                              value={phone}
                              onChange={e => setPhone(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{t.email}</label>
                            <input
                              type="email"
                              required
                              placeholder="william@gmail.com"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xxs"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{t.password}</label>
                              <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{t.confirmPassword}</label>
                              <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-[#22C55E] hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer transition-transform duration-150 hover:scale-[1.01] text-xxs shadow-md shadow-emerald-500/10 text-center"
                          >
                            🚀 {lang === 'en' ? 'Register Parent Node' : 'Jisajili na Hakiki'}
                          </button>
                        </form>
                      ) : (
                        /* Parent Login inside phone */
                        <form onSubmit={handleLogin} className="space-y-4 text-xxs">
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                              {lang === 'en' ? 'Registered Phone Number OR Email' : 'Namba ya Simu au Barua Pepe ya Mzazi'}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 0712345678 or registered email"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                              id="input-parent-email"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase text-[#1F2937] mb-1">{t.password}</label>
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs"
                              id="input-parent-password"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-[#22C55E] hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer transition-transform duration-150 hover:scale-[1.01] text-xxs shadow-md shadow-emerald-500/20 text-center"
                            id="submit-parent-login"
                          >
                            🔑 {lang === 'en' ? 'Authorize Guardian Session' : 'Ingia Kwenye Portal'}
                          </button>
                        </form>
                      )}

                      {/* Toggle Register/Login Option */}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[10px]">
                        <button
                          onClick={() => { setIsRegistering(!isRegistering); setErrorText(''); }}
                          className="text-[#22C55E] font-bold hover:underline cursor-pointer"
                          id="parent-signup-toggle"
                        >
                          {isRegistering 
                            ? (lang === 'en' ? 'Already have parent account? Sign In' : 'Tayari unayo akaunti? Ingia') 
                            : (lang === 'en' ? 'Need parent account? Register here' : 'Jisajili kama mzazi leo')}
                        </button>
                      </div>

                      {/* Sandbox claim keys simulation info */}
                      {!isRegistering && (
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[9px] text-slate-600 space-y-1 leading-relaxed">
                          <span className="font-bold text-emerald-800 block">🔗 Sandbox Testing Steps for Parent Portal:</span>
                          <ol className="list-decimal list-inside space-y-0.5">
                            <li>Click <b>"Need parent account? Register here"</b></li>
                            <li>Register details, then sign-in.</li>
                            <li>Link child using:<br />
                            &nbsp;&nbsp;• ID: <code className="bg-emerald-100 font-mono px-0.5 text-slate-700">ADM-2026-001</code><br />
                            &nbsp;&nbsp;• Code: <code className="bg-emerald-100 font-mono px-0.5 text-slate-700">PARENT-7XK92A</code></li>
                          </ol>
                        </div>
                      )}

                    </div>

                </div>
              </div>
            )}

            {/* VIEW 4: ABOUT SYSTEM PAGE */}
            {activeTab === 'about' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-8" id="about-detailed-view">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{lang === 'en' ? 'About Smart School Management System (SSMS)' : 'Kuhusu Mfumo (SSMS)'}</h2>
                  <p className="text-xs text-slate-500 font-medium">{lang === 'en' ? 'A modern decentralized multi-tenant node portal for Tanzanian institutes.' : 'Mfumo thabiti wa kiutawala na ulinzi wa taarifa za shule.'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 leading-relaxed">
                  <div className="space-y-4 text-xs font-semibold text-slate-600">
                    <p>
                      {lang === 'en'
                        ? 'SSMS serves as a comprehensive visual dashboard designed to maximize operational honesty, eliminate manual student rosters, and trace physical attendance grids using modern Geofencing coordinates.'
                        : 'Mfumo wa SSMS ni mfumo uliotengenezwa mahiri unaolinda uwazi, unarahisisha masomo ya shule na kurekodi mahudhurio ya walimu kwa kutumia kijiografia (GPS).'}
                    </p>
                    <p>
                      {lang === 'en'
                        ? 'By enforcing server-side session validity, role constraints, and context isolation filters, we ensure that administrative staffs only touch students and scores within their assigned physical parameters.'
                        : 'Kwa kuzingatia udhibiti salama wa mifumo yetu, tunazuia uingiaji haramu au uvujaji wa takwimu za wanafunzi na ripoti mbalimbali za watoto nje ya shule yako.'}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-800">{lang === 'en' ? 'Security & Encryption Parameters' : 'Viwango vya Ulinzi na Usiri'}</h3>
                    <div className="space-y-3.5 text-xs">
                      <div className="flex gap-2 text-slate-600 font-medium">
                        <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                        <div>
                          <b className="text-slate-800 block">{lang === 'en' ? 'Multi-tenant database context isolation' : 'Kushughulikia data kwa shule pekee'}</b>
                          <span>{lang === 'en' ? 'Automatic filter isolation using school ID identifiers.' : 'Data zote zinasukumwa kwa kuangazia ID pekee.'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 text-slate-600 font-medium">
                        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div>
                          <b className="text-slate-800 block">{lang === 'en' ? 'Optional 2FA Secure Admin Gate' : 'Mlango Salama wa 2FA kwa Super Admin'}</b>
                          <span>{lang === 'en' ? 'Hardware token simulation protects administrative credentials.' : 'Msimbo wa siri unahitajika kukamilisha ufunguaji mkuu.'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: HELP & FAQ PAGE */}
            {activeTab === 'help' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-8" id="help-faq-view">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{lang === 'en' ? 'Support Desk & FAQ Interactive Center' : 'Kituo cha Msaada na Maswali ya Kawaida'}</h2>
                  <p className="text-xs text-slate-500 font-medium">{lang === 'en' ? 'Find fast solutions to your academic workspace questions' : 'Pata ufumbuzi sahihi kwa haraka zaidi'}</p>
                </div>

                <div className="space-y-4 max-w-3xl">
                  {[
                    {
                      qEn: "How does the GPS Geofenced Clock-In work?",
                      qSw: "Je, mfumo wa mahudhurio wa GPS Geofencing unavyofanya kazi?",
                      aEn: "When a teacher attempts to clock in, SSMS checks their device's GPS against the target school's allowed radius (e.g. 10 meters). The request is authorized only when within boundaries.",
                      aSw: "Mwalimu anapojaribu kujisajili kufika kazini, mfumo unahakiki GPS ya simu yake na ulinganifu na mita zilizoruhusiwa (k.m mita 10). Usajili unakubalika tu mkiwa ndani ya eneo rasmi."
                    },
                    {
                      qEn: "Can my school campus be suspended?",
                      qSw: "Je, akaunti ya shule yetu inaweza kusitishwa?",
                      aEn: "Yes. The SaaS Platform Super Admin has the privilege to suspend a school (e.g. for unpaid bills). A suspended school is immediately frozen; teachers and headmasters get restricted from directories and GPS attendance.",
                      aSw: "Ndiyo. Msimamizi Mkuu ana uwezo wa kusitisha shule (kwa mfano bado hawajalipia huduma). Shule ikisitishwa, walimu na wakuu wanazuiwa kuona orodha na mahudhurio ya kila siku."
                    },
                    {
                      qEn: "How do parents link student profiles?",
                      qSw: "Wazazi wanaunganishaje ripoti za watoto wao?",
                      aEn: "Parents must register an account first, then inputs the Student's unique Admission Number matched with their customized secret Parent Verification Code assigned during enrollment.",
                      aSw: "Majiandikishaji kwanza kwa wazazi, kisha nenda kwenye ukurasa wa mzazi, weka namba ya usajili ya mwanafunzi pamoja na namba ya siri (Parent Code)."
                    }
                  ].map((faq, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl space-y-1 border border-slate-100">
                      <h4 className="font-extrabold text-sm text-slate-800">
                        ❓ {lang === 'en' ? faq.qEn : faq.qSw}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed pl-5">
                        {lang === 'en' ? faq.aEn : faq.aSw}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* MOBILE-FIRST COMPLIANT FIXED BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 py-3.5 px-4 z-50 shadow-2xl backdrop-blur-md bg-opacity-95" id="mobile-navigation-fixed">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          {[
            { key: 'home', labelEn: 'Home', labelSw: 'Mwanzo', icon: Home },
            { key: 'teacher_login', labelEn: 'Teacher Portal', labelSw: 'Walimu', icon: GraduationCap },
            { key: 'parent_login', labelEn: 'Parent Portal', labelSw: 'Wazazi', icon: Users },
            { key: 'about', labelEn: 'About', labelSw: 'Kuhusu', icon: BookOpen },
            { key: 'help', labelEn: 'Help Desk', labelSw: 'Msaada', icon: HelpCircle },
          ].map(it => {
            const Icon = it.icon;
            const isSel = activeTab === it.key && !showAdminPortal;
            return (
              <button
                key={it.key}
                onClick={() => {
                  setActiveTab(it.key as any);
                  setShowAdminPortal(false);
                  window.location.hash = ''; // reset admin route hash
                  setErrorText('');
                  setSuccessText('');
                  setIsRegistering(false);
                }}
                className={`flex flex-col items-center justify-center space-y-1.5 transition-all outline-hidden cursor-pointer flex-1 ${
                  isSel 
                    ? 'text-emerald-400 font-black' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id={`bottom-nav-btn-${it.key}`}
              >
                <div className={`p-1 rounded-xl transition-all ${isSel ? 'bg-emerald-500/10 text-emerald-400 scale-110' : ''}`}>
                  <Icon className="h-5 w-5 shrink-0" />
                </div>
                <span className="text-[9px] uppercase font-bold tracking-tight block">
                  {lang === 'en' ? it.labelEn : it.labelSw}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
