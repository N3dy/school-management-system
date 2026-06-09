/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../translations';
import { DB, simulateHash, exportToCSVFile } from '../db';
import { SaaS_School, SaaS_Headmaster, Teacher, Student, Parent, AuditLog, Notification, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import EditSchoolModal from './EditSchoolModal';
import { 
  ShieldCheck, 
  School, 
  Users, 
  UserCheck, 
  BookOpen, 
  Calendar, 
  BarChart2, 
  AlertTriangle, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Power, 
  Lock, 
  Download, 
  Bell, 
  Volume2, 
  Compass, 
  Activity, 
  Sliders, 
  Sun, 
  Moon, 
  HelpCircle, 
  Eye, 
  MessageSquare, 
  FileText, 
  Check, 
  Clock, 
  Globe, 
  DollarSign, 
  UserX,
  X,
  Smartphone,
  ChevronRight,
  Sparkles,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface SuperAdminDashboardProps {
  lang: 'en' | 'sw';
}

type MenuTab = 
  | 'dashboard' 
  | 'schools' 
  | 'headmasters' 
  | 'teachers' 
  | 'parents' 
  | 'students' 
  | 'attendance' 
  | 'academics' 
  | 'announcements' 
  | 'logs' 
  | 'reports' 
  | 'settings' 
  | 'profile';

export default function SuperAdminDashboard({ lang }: SuperAdminDashboardProps) {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<MenuTab>('dashboard');
  const [enteredSchoolId, setEnteredSchoolId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ssms_saas_dark') === 'true';
  });

  // DB States
  const [schools, setSchools] = useState<SaaS_School[]>([]);
  const [headmasters, setHeadmasters] = useState<SaaS_Headmaster[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // UI toggles
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action Modals State
  const [schoolModalOpen, setSchoolModalOpen] = useState(false);
  const [editSchoolModalOpen, setEditSchoolModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SaaS_School | null>(null);
  const [headmasterModalOpen, setHeadmasterModalOpen] = useState(false);
  const [selectedHeadmaster, setSelectedHeadmaster] = useState<SaaS_Headmaster | null>(null);
  const [schoolViewerOpen, setSchoolViewerOpen] = useState<SaaS_School | null>(null);
  const [viewingHMDetails, setViewingHMDetails] = useState<SaaS_Headmaster | null>(null);

  // Wizard States for Step-by-Step School Creation (Rule 5 & 6)
  const [wizardActive, setWizardActive] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardCreatedSchoolId, setWizardCreatedSchoolId] = useState<string | null>(null);

  // Forms Fields
  // School Form
  const [schName, setSchName] = useState('');
  const [schType, setSchType] = useState('Secondary');
  const [schCategory, setSchCategory] = useState<'Private' | 'Government'>('Private');
  const [schRegNum, setSchRegNum] = useState('');
  const [schRegion, setSchRegion] = useState('Arusha');
  const [schDistrict, setSchDistrict] = useState('');
  const [schWard, setSchWard] = useState('');
  const [schAddress, setSchAddress] = useState('');
  const [schEmail, setSchEmail] = useState('');
  const [schPhone, setSchPhone] = useState('');
  const [schLogo, setSchLogo] = useState('');

  // Headmaster Form
  const [hmName, setHmName] = useState('');
  const [hmPhone, setHmPhone] = useState('');
  const [hmEmail, setHmEmail] = useState('');
  const [hmNationalId, setHmNationalId] = useState('');
  const [hmSchoolId, setHmSchoolId] = useState('');
  const [hmUsername, setHmUsername] = useState('');
  const [hmPassword, setHmPassword] = useState('');

  // System Settings Configs
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [trialPeriodDays, setTrialPeriodDays] = useState(30);

  // Announcement Form
  const [annTitleEn, setAnnTitleEn] = useState('');
  const [annTitleSw, setAnnTitleSw] = useState('');
  const [annContentEn, setAnnContentEn] = useState('');
  const [annContentSw, setAnnContentSw] = useState('');

  // Load Initial Database Data
  useEffect(() => {
    const fetchDB = () => {
      setSchools(DB.getSchools());
      setHeadmasters(DB.getSaaSHeadmasters());
      setTeachers(DB.getTeachers());
      setStudents(DB.getStudents());
      setParents(DB.getParents());
      setLogs(DB.getAuditLogs());
      setNotifications(DB.getNotifications());
    };
    fetchDB();
    window.addEventListener('ssms_db_update', fetchDB);
    return () => window.removeEventListener('ssms_db_update', fetchDB);
  }, []);

  // Sync Dark Mode Class to document element
  useEffect(() => {
    localStorage.setItem('ssms_saas_dark', String(isDarkMode));
    const container = document.getElementById('smart-school-app-root');
    if (container) {
      if (isDarkMode) {
        container.classList.add('dark');
        container.classList.remove('bg-slate-50');
        container.classList.add('bg-slate-950');
      } else {
        container.classList.remove('dark');
        container.classList.add('bg-slate-50');
        container.classList.remove('bg-slate-950');
      }
    }
  }, [isDarkMode]);

  // Log and Notify action helpers
  const triggerAudit = (action: string, details: string) => {
    DB.addAudit(action, details, 'SaaS Administrator');
  };

  const triggerSaaSNotification = (msgEn: string, msgSw: string) => {
    DB.addNotification(msgEn, msgSw, 'ALL');
  };

  // Create or Edit school
  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schName || !schRegNum || !schEmail || !schPhone) {
      alert(lang === 'en' ? 'Fields marked * are mandatory' : 'Tafadhali jaza maelezo yenye alama ya *');
      return;
    }

    const currentSchools = DB.getSchools();

    if (selectedSchool) {
      // Edit mode
      const updated: SaaS_School[] = currentSchools.map(s => {
        if (s.id === selectedSchool.id) {
          return {
            ...s,
            name: schName,
            type: schType,
            category: schCategory,
            registrationNumber: schRegNum,
            region: schRegion,
            district: schDistrict,
            ward: schWard,
            address: schAddress,
            email: schEmail,
            phone: schPhone,
            logoUrl: schLogo || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
            status: s.status,
            createdAt: s.createdAt,
          };
        }
        return s;
      });
      DB.saveSchools(updated);
      triggerAudit('School Profile Updated', `SaaS Admin adjusted files of ${schName} (${schRegNum}).`);
    } else {
      // Add mode
      const newSchool: SaaS_School = {
        id: 'SCH-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        name: schName,
        type: schType,
        category: schCategory,
        registrationNumber: schRegNum,
        region: schRegion,
        district: schDistrict,
        ward: schWard,
        address: schAddress,
        email: schEmail,
        phone: schPhone,
        logoUrl: schLogo || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      DB.saveSchools([...currentSchools, newSchool]);
      triggerAudit('SaaS New School Registered', `Provisioned school structure: ${schName}`);
      triggerSaaSNotification(
        `New School Setup: Welcome ${schName} to SSMS platform!`,
        `Kituo Kipya cha Elimu kimefunguliwa: Karibuni ${schName} kwenye SSMS!`
      );
    }

    setSchoolModalOpen(false);
    resetSchoolForm();
  };

  // Toggle school status (ACTIVE <-> SUSPENDED)
  const toggleSchoolStatus = (id: string, name: string, current: 'ACTIVE' | 'SUSPENDED') => {
    const nextStatus = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const currentSchools = DB.getSchools();
    const updated: SaaS_School[] = currentSchools.map(s => {
      if (s.id === id) {
        return { ...s, status: nextStatus };
      }
      return s;
    });
    DB.saveSchools(updated);
    triggerAudit(
      nextStatus === 'ACTIVE' ? 'SaaS Reactivated School' : 'SaaS Suspended School',
      `Modified governance bounds for ${name}.`
    );
    triggerSaaSNotification(
      `Governance alert: School ${name} is now ${nextStatus.toLowerCase()}.`,
      `Taarifa: Shule ya ${name} kwa sasa imepewa hadhi ya ${nextStatus === 'ACTIVE' ? 'Amilifu' : 'Kusimamishwa'}.`
    );
  };

  // Delete School
  const handleDeleteSchool = (id: string, name: string) => {
    if (!confirm(lang === 'en' ? `Are you absolutely sure you want to delete ${name}? This cannot be undone.` : `Una uhakika unataka kufuta shule ya ${name}? Kitendo hiki hakirudi nyuma.`)) return;
    const currentSchools = DB.getSchools();
    DB.saveSchools(currentSchools.filter(s => s.id !== id));
    triggerAudit('School Purged', `Deleted school data for ${name} from platform records.`);
  };

  // Create or Edit Headmaster
  const handleSaveHeadmaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hmName || !hmEmail || !hmPhone || !hmSchoolId || !hmUsername) {
      alert(lang === 'en' ? 'Provide mandatory (*) Headmaster values' : 'Weka maelezo ya lazima ya mwalimu mkuu');
      return;
    }

    const currentHms = DB.getSaaSHeadmasters();

    if (selectedHeadmaster) {
      // Edit
      const updated: SaaS_Headmaster[] = currentHms.map(h => {
        if (h.id === selectedHeadmaster.id) {
          return {
            ...h,
            fullName: hmName,
            phone: hmPhone,
            email: hmEmail,
            nationalId: hmNationalId,
            assignedSchoolId: hmSchoolId,
            username: hmUsername,
            passwordHash: hmPassword ? simulateHash(hmPassword) : h.passwordHash,
            status: h.status,
            lastLogin: h.lastLogin,
          };
        }
        return h;
      });
      DB.saveSaaSHeadmasters(updated);
      triggerAudit('Headmaster Modified', `Governance bounds updated for ${hmName}.`);
    } else {
      // Add
      const newHm: SaaS_Headmaster = {
        id: 'HM-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        fullName: hmName,
        phone: hmPhone,
        email: hmEmail,
        nationalId: hmNationalId,
        assignedSchoolId: hmSchoolId,
        username: hmUsername,
        passwordHash: simulateHash(hmPassword || 'admin123'),
        status: 'ACTIVE',
        lastLogin: undefined
      };
      DB.saveSaaSHeadmasters([...currentHms, newHm]);
      triggerAudit('Headmaster Commissioned', `Created credential portfolio for ${hmName}.`);
      triggerSaaSNotification(
        `Headmaster Account Created: ${hmName} assigned to school.`,
        `Akaunti ya Mwalimu Mkuu Imetengenezwa: ${hmName} amekabidhiwa shule.`
      );
    }

    setHeadmasterModalOpen(false);
    resetHeadmasterForm();
  };

  // Toggle headmaster status
  const toggleHMStatus = (id: string, name: string, current: 'ACTIVE' | 'DISABLED') => {
    const nextStatus = current === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const currentHms = DB.getSaaSHeadmasters();
    const updated: SaaS_Headmaster[] = currentHms.map(h => {
      if (h.id === id) {
        return { ...h, status: nextStatus };
      }
      return h;
    });
    DB.saveSaaSHeadmasters(updated);
    triggerAudit(
      nextStatus === 'ACTIVE' ? 'Headmaster Activated' : 'Headmaster Disabled',
      `Locked portal access privilege for ${name}.`
    );
  };

  // Reset Headmaster Password
  const resetHMPassword = (id: string, name: string) => {
    const defaultPass = 'admin123';
    const currentHms = DB.getSaaSHeadmasters();
    const updated = currentHms.map(h => {
      if (h.id === id) {
        return { ...h, passwordHash: simulateHash(defaultPass) };
      }
      return h;
    });
    DB.saveSaaSHeadmasters(updated);
    triggerAudit('Credential Recall', `Reset password for Headmaster ${name} to generic 'admin123'.`);
    alert(lang === 'en' ? `Temporary password has been overwritten to 'admin123' for ${name}` : `Nenosiri la muda limebadilishwa kuwa 'admin123' kwa ${name}`);
  };

  // Purge Headmaster
  const handleDeleteHeadmaster = (id: string, name: string) => {
    if (!confirm(lang === 'en' ? `Delete permanent record for Headmaster ${name}?` : `Je, una uhakika unataka kumfuta permanently ${name}?`)) return;
    const currentHms = DB.getSaaSHeadmasters();
    DB.saveSaaSHeadmasters(currentHms.filter(h => h.id !== id));
    triggerAudit('Headmaster Purge', `Removed ${name} from SaaS rosters.`);
  };

  // Add Portalwide Announcement
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitleEn || !annContentEn) {
      alert('Provide english content title and description.');
      return;
    }
    const currentAnn = DB.getAnnouncements();
    const newAnn = {
      id: 'AN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      titleEn: annTitleEn,
      titleSw: annTitleSw || annTitleEn,
      contentEn: annContentEn,
      contentSw: annContentSw || annContentEn,
      date: new Date().toISOString().split('T')[0],
      addedBy: 'SaaS Platform Administrator'
    };
    DB.saveAnnouncements([newAnn, ...currentAnn]);
    triggerAudit('Broadcasting Triggered', `Admin published broadcast across schools: ${annTitleEn}`);
    triggerSaaSNotification(
      `Notice Board Alert: ${annTitleEn}`,
      `Tangazo Jipya Limetolewa: ${annTitleSw || annTitleEn}`
    );
    setAnnTitleEn('');
    setAnnTitleSw('');
    setAnnContentEn('');
    setAnnContentSw('');
    alert(lang === 'en' ? 'Announcement dispatched!' : 'Tangazo limetumwa!');
  };

  // Reset helper forms
  const resetSchoolForm = () => {
    setSelectedSchool(null);
    setSchName('');
    setSchType('Secondary');
    setSchRegNum('');
    setSchRegion('Arusha');
    setSchDistrict('');
    setSchWard('');
    setSchAddress('');
    setSchEmail('');
    setSchPhone('');
    setSchLogo('');
  };

  const openEditSchool = (sch: SaaS_School) => {
    setSelectedSchool(sch);
    setSchName(sch.name);
    setSchType(sch.type);
    setSchRegNum(sch.registrationNumber);
    setSchRegion(sch.region);
    setSchDistrict(sch.district);
    setSchWard(sch.ward);
    setSchAddress(sch.address);
    setSchEmail(sch.email);
    setSchPhone(sch.phone);
    setSchLogo(sch.logoUrl || '');
    setEditSchoolModalOpen(true);
  };

  const resetHeadmasterForm = () => {
    setSelectedHeadmaster(null);
    setHmName('');
    setHmPhone('');
    setHmEmail('');
    setHmNationalId('');
    setHmSchoolId('');
    setHmUsername('');
    setHmPassword('');
  };

  const openEditHeadmaster = (hm: SaaS_Headmaster) => {
    setSelectedHeadmaster(hm);
    setHmName(hm.fullName);
    setHmPhone(hm.phone);
    setHmEmail(hm.email);
    setHmNationalId(hm.nationalId || '');
    setHmSchoolId(hm.assignedSchoolId);
    setHmUsername(hm.username);
    setHmPassword(''); // keep empty to preserve unless changed
    setHeadmasterModalOpen(true);
  };

  // Export tables to CSV
  const handleExportSchools = () => {
    const headers = 'ID,School Name,Level,Reg Number,Region,District,Email,Phone,Created At,Status\n';
    const rows = schools.map(s => `"${s.id}","${s.name}","${s.type}","${s.registrationNumber}","${s.region}","${s.district}","${s.email}","${s.phone}","${s.createdAt}","${s.status}"`).join('\n');
    exportToCSVFile(headers + rows, 'SaaS_Schools_Report.csv');
    triggerAudit('Bulk Export Requested', 'Downloaded schools database log spreadsheet.');
  };

  const handleExportHeadmasters = () => {
    const headers = 'ID,Full Name,Email,Phone,National ID,Assigned School ID,Username,Status\n';
    const rows = headmasters.map(h => `"${h.id}","${h.fullName}","${h.email}","${h.phone}","${h.nationalId || 'N/A'}","${h.assignedSchoolId}","${h.username}","${h.status}"`).join('\n');
    exportToCSVFile(headers + rows, 'SaaS_Headmasters_Report.csv');
    triggerAudit('Bulk Export Requested', 'Downloaded headmaster roster spreadsheet.');
  };

  // Clean / Clear Notifications list
  const markNotificationRead = (id: string) => {
    const list = DB.getNotifications();
    const updated = list.map(n => n.id === id ? { ...n, isRead: true } : n);
    localStorage.setItem('ssms_notifications', JSON.stringify(updated));
    setNotifications(updated);
  };

  const clearAllNotifications = () => {
    localStorage.setItem('ssms_notifications', JSON.stringify([]));
    setNotifications([]);
  };

  // Filter lists based on querying and school isolation
  const activeSchoolStudents = enteredSchoolId !== null 
    ? students.filter(st => st.schoolId === enteredSchoolId)
    : students;
  const activeSchoolStudentIds = activeSchoolStudents.map(st => st.id);

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHeadmasters = headmasters
    .filter(h => enteredSchoolId === null || h.assignedSchoolId === enteredSchoolId)
    .filter(h => 
      h.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      h.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      h.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredTeachers = teachers
    .filter(t => enteredSchoolId === null || t.schoolId === enteredSchoolId)
    .filter(t => 
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredStudents = activeSchoolStudents.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredParents = parents
    .filter(p => enteredSchoolId === null || p.verifiedStudentIds.some(id => activeSchoolStudentIds.includes(id)))
    .filter(p => 
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats Counters
  const countSchoolsActive = schools.filter(s => s.status === 'ACTIVE').length;
  const countHMsActive = headmasters.filter(h => h.status === 'ACTIVE').length;
  const countTeachersApproved = teachers.filter(t => t.status === 'ACTIVE').length;

  return (
    <div className={`min-h-screen font-sans flex text-slate-800 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`} id="saas-system-layout">
      
      {/* 1. LEFT SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r shadow-xs transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-150 text-slate-800'
        } ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
        id="side-nav-rail"
      >
        {/* LOGO BOX BRANDING */}
        <div className="p-4 border-b flex items-center gap-3 justify-between border-slate-150 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-2.5 rounded-xl bg-orange-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5 animate-pulse" />
            </div>
            {!sidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="leading-tight shrink-0"
              >
                <h1 className="text-sm font-black uppercase tracking-wider text-orange-600">SSMS SaaS</h1>
                <p className="text-[10px] font-mono text-slate-400">Platform Core Controller</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* PROFILE CHIP SHORTCUT */}
        {!sidebarCollapsed && (
          <div className="p-3.5 m-2.5 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-orange-500/10 shrink-0">
              AD
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold truncate">SaaS Administrator</h4>
              <p className="text-[9px] font-mono text-orange-500 font-semibold uppercase">{lang === 'en' ? 'Full Authority' : 'Mamlaka Kamili'}</p>
            </div>
          </div>
        )}

        {/* MENU RAILS NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin">
          {enteredSchoolId !== null && (
            <button 
              onClick={() => {
                setEnteredSchoolId(null);
                setActiveTab('dashboard');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-800 text-orange-400 hover:text-white rounded-xl text-xs font-black cursor-pointer border border-slate-700/50 mb-4 shadow-sm"
              id="exit-school-mode-btn"
            >
              <ArrowLeft className="h-4.5 w-4.5 shrink-0" />
              {!sidebarCollapsed && <span>{lang === 'en' ? 'Exit School View' : 'Toka Shuleni'}</span>}
            </button>
          )}

          {(enteredSchoolId === null
            ? [
                { id: 'dashboard', label: lang === 'en' ? 'Global Overview' : 'Muhtasari wa SaaS', icon: Compass },
                { id: 'schools', label: lang === 'en' ? 'School Directory' : 'Orodha ya Shule', icon: School },
                { id: 'logs', label: lang === 'en' ? 'SaaS Audit Trails' : 'Kumbukumbu za SaaS', icon: Activity },
                { id: 'settings', label: lang === 'en' ? 'Platform Settings' : 'Mipangilio ya Mfumo', icon: Sliders },
                { id: 'profile', label: lang === 'en' ? 'Admin Profile' : 'Profaili ya Msimamizi', icon: ShieldCheck },
              ]
            : [
                { id: 'dashboard', label: lang === 'en' ? 'School Performance' : 'Mwenendo wa Shule', icon: BarChart2 },
                { id: 'headmasters', label: lang === 'en' ? 'Headmaster Detail' : 'Habari za Mkuu', icon: UserCheck },
                { id: 'teachers', label: lang === 'en' ? 'Teachers Roll' : 'Walimu wa Shule', icon: Users },
                { id: 'parents', label: lang === 'en' ? 'Parents Register' : 'Wazazi wa Shule', icon: Users },
                { id: 'students', label: lang === 'en' ? 'Students Register' : 'Wanafunzi Shuleni', icon: BookOpen },
                { id: 'attendance', label: lang === 'en' ? 'Attendance Stats' : 'Takwimu Mahudhurio', icon: Calendar },
                { id: 'academics', label: lang === 'en' ? 'Academic Reports' : 'Ripoti za Masomo', icon: FileText },
                { id: 'announcements', label: lang === 'en' ? 'Announcements' : 'Matangazo ya Shule', icon: Volume2 },
              ]
          ).map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as MenuTab);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive 
                    ? 'bg-orange-600 text-white shadow-xs' 
                    : isDarkMode 
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } cursor-pointer`}
                id={`sidebar-item-${item.id}`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER ACTION CONTROLS */}
        <div className="p-3 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between shrink-0">
          {/* Light / Dark Mode Controls */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg cursor-pointer ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-500'}`}
            title="Switch Dashboard Light/Dark Mode"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {!sidebarCollapsed && (
            <span className="text-[9px] font-mono text-slate-400">v1.4.0 • NodeProduction</span>
          )}

          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-[10px] font-mono text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {sidebarCollapsed ? '➔' : '✕'}
          </button>
        </div>
      </aside>

      {/* 2. MAIN HUB WORKSPACE CONTENT CONTAINER */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'pl-16' : 'pl-64'}`}>
        
        {/* TOP GLASSMORPHISM HEADER */}
        <header className={`sticky top-0 z-25 flex items-center justify-between px-6 py-3.5 border-b backdrop-blur-md shrink-0 transition-colors ${
          isDarkMode 
            ? 'bg-slate-950/80 border-slate-800/80' 
            : 'bg-white/80 border-slate-150'
        }`}>
          {/* TOP CORE HEADER LEFT: DYNAMIC TRACK PATHS */}
          <div className="flex items-center gap-2">
            <span className="text-xxs font-mono uppercase font-black text-orange-600 bg-orange-600/10 px-2 py-0.5 rounded">Platform Admin</span>
            {enteredSchoolId !== null && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xxs font-mono uppercase font-black bg-orange-600/15 text-orange-500 px-2 py-0.5 rounded flex items-center gap-1">
                  🏫 {schools.find(s => s.id === enteredSchoolId)?.name} ({schools.find(s => s.id === enteredSchoolId)?.category || 'Private'})
                </span>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider select-none text-slate-400">
              {activeTab === 'dashboard' && (lang === 'en' ? 'Overview Statistics' : 'Takwimu za Jukwaa')}
              {activeTab === 'schools' && (lang === 'en' ? 'Schools Roster' : 'Shule zilizopo')}
              {activeTab === 'headmasters' && (lang === 'en' ? 'Commanding Officers' : 'Wakuu wa Shule')}
              {activeTab === 'teachers' && (lang === 'en' ? 'Teacher Monitoring Hub' : 'Tovuti ya Walimu')}
              {activeTab === 'parents' && (lang === 'en' ? 'Parent Monitoring Hub' : 'Tovuti ya Wazazi')}
              {activeTab === 'students' && (lang === 'en' ? 'Student Monitoring Hub' : 'Tovuti ya Wanafunzi')}
              {activeTab === 'attendance' && (lang === 'en' ? 'Attendance Rate Audits' : 'Upimaji Mahudhurio')}
              {activeTab === 'academics' && (lang === 'en' ? 'Academics Index Report' : 'Kielezo Kitaaluma')}
              {activeTab === 'announcements' && (lang === 'en' ? 'Broadcast Dispatch' : 'Matangazo Mapya')}
              {activeTab === 'logs' && (lang === 'en' ? 'Audit Security Tickers' : 'Daftari la Usalama')}
              {activeTab === 'reports' && (lang === 'en' ? 'Discharge Logs & Reports' : 'Upakuaji')}
              {activeTab === 'settings' && (lang === 'en' ? 'Platform Core Settings' : 'Mipangilio ya Jukwaa')}
              {activeTab === 'profile' && (lang === 'en' ? 'Profile Management' : 'Nyaraka za Msimamizi')}
            </h2>
          </div>

          {/* TOP CORE HEADER MIDDLE: DYNAMIC SEARCH BAR */}
          <div className="hidden sm:flex items-center gap-2 max-w-xs w-full relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 pointer-events-none">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              placeholder={`${lang === 'en' ? 'Search anything...' : 'Tafuta hapa...'}`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-full border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-600/20"
            />
          </div>

          {/* TOP CORE HEADER RIGHT: CONTROLS */}
          <div className="flex items-center gap-3">
            {/* Notification triggers bell badge */}
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 rounded-lg relative bg-slate-100 dark:bg-slate-900 hover:opacity-85 cursor-pointer text-slate-500"
            >
              <Bell className="h-4.5 w-4.5" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-650 animate-ping"></span>
              )}
            </button>

            {/* Sandbox details */}
            <div className="hidden lg:block leading-none text-right">
              <p className="text-[11px] font-bold">SHA256 Platform Verified</p>
              <span className="text-[9px] font-mono text-emerald-500 font-semibold uppercase tracking-wider">● Online</span>
            </div>
          </div>
        </header>

        {/* NOTIFICATIONS CONTAINER DRAWER PANEL */}
        <AnimatePresence>
          {isNotificationOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`absolute top-16 right-6 z-28 w-96 p-4 rounded-3xl shadow-2xl border ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-150 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="h-4.5 w-4.5 text-orange-600" />
                  <span>{lang === 'en' ? 'Platform Alert Center' : 'Arifa za Mfumo'}</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={clearAllNotifications} className="text-[10px] text-red-500 hover:underline cursor-pointer">
                    {lang === 'en' ? 'Clear All' : 'Futa Zote'}
                  </button>
                  <button onClick={() => setIsNotificationOpen(false)} className="text-slate-400 text-xs cursor-pointer">✕</button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                {notifications.length === 0 ? (
                  <p className="text-xxs text-slate-400 text-center py-6">{lang === 'en' ? 'All notifications are serviced' : 'Arifa zote zimefanyiwa kazi'}</p>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-2 rounded-xl text-xs flex flex-col border transition ${
                        n.isRead 
                          ? 'border-transparent select-none opacity-60' 
                          : 'bg-orange-500/5 border-orange-500/10'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-semibold">{lang === 'en' ? n.messageEn : n.messageSw}</span>
                        {!n.isRead && (
                          <button 
                            onClick={() => markNotificationRead(n.id)}
                            className="text-[10px] text-orange-600 hover:underline shrink-0 font-bold ml-1 cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 mt-1">
                        {new Date(n.timestamp).toLocaleTimeString() || n.timestamp}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WORKSPACE AREA SCROLLABLE */}
        <div className="flex-grow overflow-y-auto px-6 py-6 scrollbar-thin">
          
          {/* SEARCH SUGGESTION TICKER (if search triggered) */}
          {searchQuery && (
            <div className="mb-4 bg-orange-600/10 border border-orange-600/20 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold">
              <span className="text-orange-600">
                🔍 Filtering lists by word: "{searchQuery}"
              </span>
              <button onClick={() => setSearchQuery('')} className="text-xxs uppercase tracking-wider text-slate-400 hover:text-slate-200">
                Clear
              </button>
            </div>
          )}

          {/* DYNAMIC RENDERING TAB FLOW */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              id="workspace-route-view"
            >
              
              {/* === TAB 1: OVERVIEW DASHBOARD === */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6" id="dashboard-tab">
                  {/* TOP ROW OVERVIEW CARDS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="overview-counter-grid">
                    {[
                      { title: lang === 'en' ? 'Total Schools' : 'Jumla ya Shule', count: schools.length, color: 'text-orange-600 bg-orange-600/10', icon: School },
                      { title: lang === 'en' ? 'Active Schools' : 'Shule Amilifu', count: countSchoolsActive, color: 'text-emerald-500 bg-emerald-500/10', icon: Check },
                      { title: lang === 'en' ? 'Total Headmasters' : 'Jumla ya Wakuu', count: headmasters.length, color: 'text-indigo-600 bg-indigo-600/10', icon: UserCheck },
                      { title: lang === 'en' ? 'Active Headmasters' : 'Wakuu Amilifu', count: countHMsActive, color: 'text-teal-600 bg-teal-600/10', icon: ShieldCheck },
                      { title: lang === 'en' ? 'Total Teachers' : 'Jumla ya Walimu', count: teachers.length, color: 'text-sky-600 bg-sky-600/10', icon: Users },
                      { title: lang === 'en' ? 'Total Parents' : 'Jumla ya Wazazi', count: parents.length, color: 'text-pink-650 bg-pink-650/10', icon: Users },
                      { title: lang === 'en' ? 'Total Students' : 'Jumla ya Wanafunzi', count: students.length, color: 'text-teal-650 bg-teal-650/10', icon: BookOpen },
                      { title: lang === 'en' ? 'Active Users Today' : 'Watumiaji Amilifu Leo', count: countSchoolsActive * 12 + 6, color: 'text-yellow-600 bg-yellow-600/10', icon: Activity },
                    ].map((card, i) => {
                      const Icon = card.icon;
                      return (
                        <div key={i} className={`p-4 border rounded-2xl flex items-center justify-between transition hover:shadow-xs shadow-xs ${
                          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                        }`}>
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block leading-3 mb-1">{card.title}</span>
                            <span className="text-2xl font-black">{card.count}</span>
                          </div>
                          <div className={`p-2.5 rounded-xl ${card.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* FIRST ROW DATA VISUALIZATIONS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-charts-grid">
                    
                    {/* Visual Chart 1: Total Students Per School */}
                    <div className={`p-5 border rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Students Register Per School</h3>
                        <span className="text-xxs font-mono text-emerald-500">Live Census Data</span>
                      </div>
                      
                      {/* Interactive CSS Graph */}
                      <div className="space-y-4 py-2">
                        {schools.map((sch, i) => {
                          // Simulate dynamic counts
                          const count = sch.id === 'SCH-001' ? students.length : sch.id === 'SCH-002' ? 62 : 0;
                          const maxCount = 100;
                          const percent = Math.min((count / maxCount) * 100, 100);
                          return (
                            <div key={sch.id} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-bold">{sch.name}</span>
                                <span className="font-mono font-bold text-orange-600">{count} {lang === 'en' ? 'Students' : 'Wanafunzi'}</span>
                              </div>
                              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                  className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                        {schools.length === 0 && <p className="text-xxs text-slate-400 text-center py-6">No schools configured</p>}
                      </div>
                    </div>

                    {/* Visual Chart 2: Regional Platform Growth Map */}
                    <div className={`p-5 border rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Registration Trend & Region Load</h3>
                        <span className="text-xxs font-mono bg-orange-600/10 text-orange-650 px-2 py-0.5 rounded">Platform Core logs</span>
                      </div>
                      
                      {/* Responsive Timeline representation */}
                      <div className="grid grid-cols-4 gap-2 text-center pt-2">
                        {[
                          { period: 'Q1 2026', title: 'Start Bound', count: 1, region: 'Arusha', percentage: '25%' },
                          { period: 'Q2 2026', title: 'Acquisition', count: 2, region: 'Arusha/DSM', percentage: '50%' },
                          { period: 'Q3 2026 (Est)', title: 'Scaling', count: 4, region: 'Coastal', percentage: '75%' },
                          { period: 'Q4 2026 (Est)', title: 'National Launch', count: 9, region: 'DOD/MZA', percentage: '100%' },
                        ].map((q, i) => (
                          <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1 hover:border-orange-500 transition">
                            <span className="text-[10px] font-mono font-bold text-slate-400">{q.period}</span>
                            <span className="text-base font-black block text-orange-600">{q.count}</span>
                            <span className="text-[9px] block text-slate-500 italic truncate">{q.region}</span>
                            <div className="text-[9px] font-mono text-emerald-500 font-bold">{q.percentage} Load</div>
                          </div>
                        ))}
                      </div>

                      {/* System activity indicators */}
                      <div className="mt-5 p-3 rounded-xl border border-dashed text-xxs leading-relaxed flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-600 text-white animate-spin">
                          <RefreshCw className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="font-bold">Automated Database Backups Active</p>
                          <p className="text-slate-400">Durable local state is backed up dynamically to browser cache. System integrity remains 100% compliant.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RECENT PORTAL TICKER ACTIONS & LOGGER */}
                  <div className={`p-4 border rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-orange-600" />
                        <span>SaaS Security Core Audit Trails</span>
                      </h3>
                      <button 
                        onClick={() => setActiveTab('logs')}
                        className="text-xxs text-slate-400 hover:text-orange-600 hover:underline uppercase tracking-wider cursor-pointer"
                      >
                        {lang === 'en' ? 'Open Full Log Viewer' : 'Fungua Daftari Kamili'}
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto scrollbar-thin">
                      {logs.slice(0, 5).map((l) => (
                        <div key={l.id} className="py-2.5 text-xs flex justify-between items-center hover:bg-slate-500/5 px-1 rounded transition">
                          <div>
                            <span className="font-bold text-orange-600 block">{l.action}</span>
                            <span className="text-slate-400 text-xxs truncate block max-w-lg">{l.details}</span>
                          </div>
                          <div className="text-right shrink-0 ml-4 font-mono text-xxs text-slate-400">
                            <span className="block font-semibold text-slate-350">{l.user}</span>
                            <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 2: SCHOOLS MANAGEMENT === */}
              {activeTab === 'schools' && (
                <div className="space-y-5" id="schools-tab">
                  {/* ACTIONS HEADER */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'Global School Portfolio' : 'Orodha ya Shule Jukwaani'}</h3>
                      <p className="text-xs text-slate-400">{lang === 'en' ? 'Configure, suspend, activate or decommission schools easily.' : 'Dhibiti, fanya kazi, au sitisha hadhi ya shule hapa.'}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={handleExportSchools} 
                        className="py-1.5 px-3 bg-slate-100 dark:bg-slate-900 border hover:opacity-85 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-slate-600"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                      </button>
                      <button 
                        onClick={() => {
                          resetSchoolForm();
                          setSchoolModalOpen(true);
                        }}
                        className="py-1.5 px-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="h-4 w-4" />
                        <span>{lang === 'en' ? 'Add School' : 'Ongeza Shule'}</span>
                      </button>
                    </div>
                  </div>

                  {/* WIZARD OR STANDARD LIST GRID (Rule 5 & 6) */}
                  {wizardActive ? (
                    <div className={`p-6 border rounded-3xl space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-805 text-slate-100' : 'bg-white border-slate-150 text-slate-800'}`} id="school-setup-wizard-container">
                      {/* Wizard Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-orange-600" />
                            <span>{lang === 'en' ? 'SaaS Onboarding Wizard' : 'Wizadi ya Usajili ya SaaS'}</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 mt-1 font-medium">
                            {lang === 'en' ? 'Guided 4-step administrative workflow to provision, accredit, and audit campuses.' : 'Mchakato wa hatua kwa hatua wa kuandikisha, kuweka kiongozi, na kuamilisha shule.'}
                          </p>
                        </div>
                        <button 
                          onClick={() => setWizardActive(false)}
                          className="text-xs font-bold text-slate-400 hover:text-red-500 px-3 py-1 bg-slate-500/5 hover:bg-red-500/10 rounded-xl cursor-pointer"
                        >
                          {lang === 'en' ? 'Cancel Wizard' : 'Ghairi Wizadi'}
                        </button>
                      </div>

                      {/* Step Indicator */}
                      <div className="grid grid-cols-4 gap-2 text-center" id="wizard-step-progress-indicator">
                        {[
                          { step: 1, label: lang === 'en' ? '1. Core Details' : '1. Maelezo' },
                          { step: 2, label: lang === 'en' ? '2. Headmaster' : '2. Mwalimu Mkuu' },
                          { step: 3, label: lang === 'en' ? '3. Activation' : '3. Uamilisho' },
                          { step: 4, label: lang === 'en' ? '4. Launch' : '4. Uzinduzi' },
                        ].map((s) => {
                          const isCurrent = wizardStep === s.step;
                          const isCompleted = wizardStep > s.step;
                          return (
                            <div key={s.step} className="space-y-2">
                              <div className={`h-1.5 rounded-full transition-all duration-300 ${
                                isCurrent ? 'bg-orange-600' : isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                              }`} />
                              <span className={`text-[10px] font-bold tracking-wide ${
                                isCurrent ? 'text-orange-600 font-extrabold' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
                              }`}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* STEP 1: CREATE SCHOOL */}
                      {wizardStep === 1 && (
                        <div className="space-y-4 text-xs" id="wizard-step1-body">
                          <div className="p-3.5 bg-orange-600/5 rounded-2xl border border-orange-500/10">
                            <p className="font-bold text-orange-600">Step 1: Create School Portfolio</p>
                            <p className="text-slate-400 text-xxs mt-0.5">Define core institutional specifications, geographic level and regulatory funding structure.</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">School Name *</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Tanzanite Combined Academy"
                                value={schName}
                                onChange={e => setSchName(e.target.value)}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Institutional Level *</label>
                                <select 
                                  value={schType}
                                  onChange={e => setSchType(e.target.value)}
                                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-xs cursor-pointer outline-hidden"
                                >
                                  <option value="Primary">Primary School (Msingi)</option>
                                  <option value="Secondary">Secondary School (Sekondari)</option>
                                  <option value="Combined">Combined Primary & Secondary (Mseto)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Regulatory Category *</label>
                                <select 
                                  value={schCategory}
                                  onChange={e => setSchCategory(e.target.value as any)}
                                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-xs cursor-pointer outline-hidden"
                                >
                                  <option value="Private">Private School (Binafsi)</option>
                                  <option value="Government">Government School (Serikali)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Registration Identifier *</label>
                              <input 
                                type="text" 
                                placeholder="e.g. REG-TZ-8012"
                                value={schRegNum}
                                onChange={e => setSchRegNum(e.target.value)}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Region *</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Dar es Salaam"
                                value={schRegion}
                                onChange={e => setSchRegion(e.target.value)}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">District *</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Kinondoni"
                                value={schDistrict}
                                onChange={e => setSchDistrict(e.target.value)}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Address *</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Sam Nujoma Rd, Plot 4"
                                value={schAddress}
                                onChange={e => setSchAddress(e.target.value)}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Contact Email *</label>
                              <input 
                                type="email" 
                                placeholder="e.g. registrar@domain.sc.tz"
                                value={schEmail}
                                onChange={e => setSchEmail(e.target.value)}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Hotline Phone Number *</label>
                              <input 
                                type="tel" 
                                placeholder="e.g. 0712889100"
                                value={schPhone}
                                onChange={e => setSchPhone(e.target.value)}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button 
                              onClick={() => {
                                if (!schName.trim() || !schRegNum.trim() || !schEmail.trim() || !schPhone.trim() || !schAddress.trim()) {
                                  alert(lang === 'en' ? 'Fields marked * are mandatory' : 'Tafadhali jaza maelezo yenye alama ya *');
                                  return;
                                }
                                const currentSchools = DB.getSchools();
                                const schoolId = 'SCH-' + Math.random().toString(36).substring(2, 9).toUpperCase();
                                const newSchool: SaaS_School = {
                                  id: schoolId,
                                  name: schName.trim(),
                                  type: schType,
                                  category: schCategory,
                                  optionalContributionsEnabled: false,
                                  registrationNumber: schRegNum.trim(),
                                  region: schRegion.trim(),
                                  district: schDistrict.trim(),
                                  ward: schWard.trim() || 'Neutral Ward',
                                  address: schAddress.trim(),
                                  email: schEmail.trim(),
                                  phone: schPhone.trim(),
                                  logoUrl: schLogo.trim() || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
                                  status: 'SUSPENDED', // dormant status initially
                                  createdAt: new Date().toISOString()
                                };
                                DB.saveSchools([...currentSchools, newSchool]);
                                setSchools([...currentSchools, newSchool]);
                                triggerAudit('Wizard School Saved', `Registered dormant profiles for ${schName} (${schoolId}).`);
                                setWizardCreatedSchoolId(schoolId);
                                setWizardStep(2);
                              }}
                              className="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-md transition"
                            >
                              <span>{lang === 'en' ? 'Save & Assign Headmaster' : 'Hifadhi & Teua Mkuu'}</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 2: ASSIGN HEADMASTER */}
                      {wizardStep === 2 && (
                        <div className="space-y-4 text-xs" id="wizard-step2-body">
                          <div className="p-3.5 bg-orange-600/5 rounded-2xl border border-orange-500/10">
                            <p className="font-bold text-orange-600">Step 2: Assign School Headmaster</p>
                            <p className="text-slate-400 text-xxs mt-0.5">Accredit a headmaster commanding officer to manage operations, attendance reports, and student records.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Full Name *</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Dr. Edward William"
                                value={hmName}
                                onChange={e => setHmName(e.target.value)}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Login Username * (Handles)</label>
                              <input 
                                type="text" 
                                placeholder="e.g. edward_william"
                                value={hmUsername}
                                onChange={e => setHmUsername(e.target.value.toLowerCase())}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Direct Phone Number *</label>
                              <input 
                                type="tel" 
                                placeholder="e.g. 0712334455"
                                value={hmPhone}
                                onChange={e => setHmPhone(e.target.value)}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Email *</label>
                              <input 
                                type="email" 
                                placeholder="e.g. edward@ssms.or.tz"
                                value={hmEmail}
                                onChange={e => setHmEmail(e.target.value)}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Representative Password *</label>
                              <input 
                                type="password" 
                                placeholder="Minimum 6 characters"
                                value={hmPassword}
                                onChange={e => setHmPassword(e.target.value)}
                                className="w-full p-2.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/30 outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button 
                              onClick={() => {
                                if (!hmName.trim() || !hmUsername.trim() || !hmPhone.trim() || !hmEmail.trim() || !hmPassword.trim()) {
                                  alert(lang === 'en' ? 'All headmaster parameters with * are required.' : 'Jaza vigezo vyote vyenye alama ya *');
                                  return;
                                }
                                const currentHms = DB.getSaaSHeadmasters();
                                const newHm: SaaS_Headmaster = {
                                  id: 'HM-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
                                  fullName: hmName.trim(),
                                  phone: hmPhone.trim(),
                                  email: hmEmail.trim(),
                                  nationalId: hmNationalId || 'N/A',
                                  assignedSchoolId: wizardCreatedSchoolId || '',
                                  username: hmUsername.trim(),
                                  passwordHash: simulateHash(hmPassword),
                                  status: 'ACTIVE',
                                  lastLogin: undefined
                                };
                                DB.saveSaaSHeadmasters([...currentHms, newHm]);
                                setHeadmasters([...currentHms, newHm]);
                                triggerAudit('Wizard Representative Assigned', `Commissioned headmaster ${hmName} linked on school ID ${wizardCreatedSchoolId}`);
                                triggerSaaSNotification(
                                  `Officer Engaged: Assigned ${hmName} to operational dashboard.`,
                                  `Kiongozi Amewekwa: ${hmName} amekabidhiwa jukumu la shule mpya.`
                                );
                                setWizardStep(3);
                              }}
                              className="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-md transition"
                            >
                              <span>{lang === 'en' ? 'Save & Proceed to Activation' : 'Hifadhi & Amilisha Shule'}</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: ACTIVATE SCHOOL */}
                      {wizardStep === 3 && (
                        <div className="space-y-4 text-xs text-center py-8" id="wizard-step3-body">
                          <div className="mx-auto h-16 w-16 bg-orange-500/10 text-orange-605 rounded-full flex items-center justify-center mb-2 animate-bounce">
                            <Sparkles className="h-8 w-8 text-orange-600" />
                          </div>
                          <h4 className="text-sm font-black uppercase text-slate-700 dark:text-slate-205">Step 3: Activate operational access</h4>
                          <p className="text-slate-400 text-xxs max-w-sm mx-auto leading-relaxed mt-1">
                            Geographic profiles and authorization tokens are compiled. Click the button below to turn school state to ACTIVE and authorize student registers.
                          </p>

                          <div className="pt-6 flex justify-center">
                            <button 
                              onClick={() => {
                                const currentSchools = DB.getSchools();
                                const updated = currentSchools.map(s => {
                                  if (s.id === wizardCreatedSchoolId) {
                                    return { ...s, status: 'ACTIVE' as const };
                                  }
                                  return s;
                                });
                                DB.saveSchools(updated);
                                setSchools(updated);
                                triggerAudit('Wizard Campus Activated', `SaaS Admin authorized operations activation for school ID ${wizardCreatedSchoolId}`);
                                setWizardStep(4);
                              }}
                              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer transition transform hover:scale-[1.02]"
                            >
                              <Check className="h-4.5 w-4.5" />
                              <span>{lang === 'en' ? 'Activate School operations' : 'Amilisha Shule Sasa'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 4: MONITOR SCHOOL */}
                      {wizardStep === 4 && (
                        <div className="space-y-4 text-xs text-center py-8" id="wizard-step4-body">
                          <div className="mx-auto h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-2 ring-4 ring-emerald-500/10 animate-pulse">
                            <ShieldCheck className="h-8 w-8 text-emerald-500" />
                          </div>
                          <h4 className="text-sm font-black uppercase text-emerald-600">Onboarding sequence completed!</h4>
                          <p className="text-slate-400 text-xxs max-w-sm mx-auto leading-relaxed">
                            Campus registered, commanding headmaster accredited, and security databases are operational. You can now launch school-based monitoring.
                          </p>
                          <p className="font-extrabold text-xs text-orange-600 uppercase tracking-wider">
                            Active node: {schools.find(s => s.id === wizardCreatedSchoolId)?.name}
                          </p>

                          <div className="pt-8 flex justify-center gap-3">
                            <button 
                              onClick={() => {
                                setWizardActive(false);
                                setWizardStep(1);
                                setWizardCreatedSchoolId(null);
                              }}
                              className="px-4 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 rounded-xl text-slate-600 font-bold uppercase transition scale-98 hover:scale-100 cursor-pointer text-[10px]"
                            >
                              {lang === 'en' ? 'Return to Roster' : 'Rudi Kwenye Orodha'}
                            </button>
                            <button 
                              onClick={() => {
                                setEnteredSchoolId(wizardCreatedSchoolId);
                                setWizardActive(false);
                                setWizardStep(1);
                                setWizardCreatedSchoolId(null);
                                setActiveTab('dashboard'); // go to active school's overview dashboard
                              }}
                              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 transition"
                            >
                              <span>{lang === 'en' ? 'Enter School Monitor' : 'Ingia Kwenye Shule'}</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* ACTIONS BAR */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-500/5 p-4 rounded-3xl" id="schools-actions-toolbar">
                        <div className="relative max-w-xs w-full">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                            <Search className="h-3.5 w-3.5" />
                          </span>
                          <input 
                            type="text" 
                            placeholder={lang === 'en' ? 'Search school directories...' : 'Tafuta shule...'}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent border border-slate-200 dark:border-slate-800 text-xs text-slate-600 pl-8 pr-3 py-1.5 rounded-xl w-full focus:ring-2 focus:ring-orange-600/20 outline-hidden"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedSchool(null);
                            setWizardStep(1);
                            setWizardCreatedSchoolId(null);
                            setWizardActive(true);
                            setSchName('');
                            setSchRegNum('');
                            setSchDistrict('');
                            setSchWard('');
                            setSchAddress('');
                            setSchEmail('');
                            setSchPhone('');
                            setSchLogo('');
                            setHmName('');
                            setHmUsername('');
                            setHmPhone('');
                            setHmEmail('');
                            setHmPassword('');
                          }}
                          className="py-1.5 px-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-sm transform hover:scale-[1.01] transition"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>{lang === 'en' ? 'Register New School' : 'Sajili Shule Mpya (Wizadi)'}</span>
                        </button>
                      </div>

                      {/* DATA GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="schools-catalog-grid">
                        {filteredSchools.map((sch) => {
                          // Dynamically count associated teachers & students
                          const countHms = headmasters.filter(h => h.assignedSchoolId === sch.id).map(h => h.fullName).join(', ') || 'N/A';
                          const schTeachers = teachers.filter(t => t.schoolId === sch.id).length;
                          const schStudents = students.filter(s => s.schoolId === sch.id).length;

                          return (
                            <div key={sch.id} className={`p-4 border rounded-3xl flex flex-col justify-between hover:shadow-xs transition ${
                              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                            }`}>
                              <div className="space-y-4">
                                {/* Logo + Level badges */}
                                <div className="flex items-start justify-between gap-2">
                                  <img 
                                    src={sch.logoUrl || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200'} 
                                    referrerPolicy="no-referrer"
                                    alt="logo"
                                    className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100 bg-slate-200 shrink-0" 
                                  />
                                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                    <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-600/15 text-orange-600">
                                      {sch.type}
                                    </span>
                                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                      sch.category === 'Government' ? 'bg-teal-500/10 text-teal-600' : 'bg-indigo-500/10 text-indigo-650'
                                    }`}>
                                      {sch.category || 'Private'}
                                    </span>
                                    <span className={`inline-block text-[9px] font-black uppercase rounded px-1.5 py-0.2 ${
                                      sch.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-550' : 'bg-red-500/10 text-red-500'
                                    }`}>
                                      {sch.status}
                                    </span>
                                  </div>
                                </div>

                                {/* Specific properties */}
                                <div>
                                  <h4 className="font-bold text-sm text-slate-850 truncate">{sch.name}</h4>
                                  <p className="text-xxs font-mono text-slate-400 mt-1">Reg Code: {sch.registrationNumber}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-500/5 rounded-2xl text-[11px] leading-tight">
                                  <div>
                                    <span className="text-slate-400 block text-[9px] font-semibold uppercase">{lang === 'en' ? 'Region' : 'Mkoa'}</span>
                                    <span className="font-bold">{sch.region}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[9px] font-semibold uppercase">{lang === 'en' ? 'Commission' : 'Wakuu'}</span>
                                    <span className="font-bold truncate block max-w-[110px]" title={countHms}>{countHms}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[9px] font-semibold uppercase">{lang === 'en' ? 'Teachers' : 'Walimu'}</span>
                                    <span className="font-bold">{schTeachers}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[9px] font-semibold uppercase">{lang === 'en' ? 'Students' : 'Wanafunzi'}</span>
                                    <span className="font-bold">{schStudents}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Quick governance control bars */}
                              <div className="mt-4 pt-3.5 border-t border-slate-500/10 flex items-center justify-between gap-1">
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={() => openEditSchool(sch)}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                                    title="Edit School Details"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => toggleSchoolStatus(sch.id, sch.name, sch.status)}
                                    className={`p-2 rounded-lg cursor-pointer text-white ${
                                      sch.status === 'ACTIVE' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                                    title={sch.status === 'ACTIVE' ? 'Suspend School Operations' : 'Activate School Access'}
                                  >
                                    <Power className="h-3.5 w-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteSchool(sch.id, sch.name)}
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                                    title="Delete School File"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setSchoolViewerOpen(sch)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-650 flex items-center gap-0.5 cursor-pointer hover:underline"
                                  >
                                    <span>Inspect</span>
                                  </button>
                                  
                                  <button 
                                    onClick={() => {
                                      setEnteredSchoolId(sch.id);
                                      setActiveTab('dashboard'); // default to school's dashboard tab
                                    }}
                                    className="px-2.5 py-1.5 bg-orange-600/10 hover:bg-orange-600 text-orange-600 hover:text-white border border-orange-500/15 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0"
                                  >
                                    <span>{lang === 'en' ? 'ENTER CAMPUS' : 'INGIA SHULENI'}</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* === TAB 3: HEADMASTERS REGISTRY === */}
              {activeTab === 'headmasters' && (
                <div className="space-y-5" id="headmasters-tab">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'Administrative Headmasters Officers' : 'Viongozi Wakuu wa Shule'}</h3>
                      <p className="text-xs text-slate-400">{lang === 'en' ? 'Link officers to their assigned study centers securely.' : 'Waunganishe wakuu na dhibiti nenosiri zao.'}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={handleExportHeadmasters}
                        className="py-1.5 px-3 bg-slate-100 dark:bg-slate-900 border text-slate-600 hover:opacity-85 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSVs</span>
                      </button>
                      <button 
                        onClick={() => {
                          resetHeadmasterForm();
                          setHeadmasterModalOpen(true);
                        }}
                        className="py-1.5 px-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="h-4 w-4" />
                        <span>{lang === 'en' ? 'Add Headmaster' : 'Ongeza Mkuu wa Shule'}</span>
                      </button>
                    </div>
                  </div>

                  {/* TABULAR LAYOUT */}
                  <div className={`border rounded-3xl overflow-hidden ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                  }`}>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-500/5 uppercase text-slate-400 text-xxs font-bold tracking-widest">
                          <th className="p-3">Full Name</th>
                          <th className="p-3">Assigned School Assignment</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Phone Line</th>
                          <th className="p-3">National ID Code</th>
                          <th className="p-3">Login Status</th>
                          <th className="p-3 text-center">Actions Controller</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {filteredHeadmasters.map((hm) => {
                          const schoolMatch = schools.find(s => s.id === hm.assignedSchoolId);
                          return (
                            <tr key={hm.id} className="hover:bg-slate-500/5 transition">
                              <td className="p-3 font-bold pr-2 flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                                  {hm.fullName.charAt(0)}
                                </div>
                                <span className="truncate max-w-[130px] block">{hm.fullName}</span>
                              </td>
                              <td className="p-3 font-semibold text-slate-400 truncate max-w-[130px]">
                                <span className="font-bold text-slate-705 dark:text-slate-350">{schoolMatch ? schoolMatch.name : 'Unassigned'}</span>
                              </td>
                              <td className="p-3 font-mono">{hm.email}</td>
                              <td className="p-3 font-mono">{hm.phone}</td>
                              <td className="p-3 font-mono text-slate-400">{hm.nationalId || 'N/A'}</td>
                              <td className="p-3">
                                <span className={`inline-block font-black text-xxs rounded uppercase px-1.5 py-0.2 ${
                                  hm.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-550' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {hm.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => openEditHeadmaster(hm)}
                                    className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                                    title="Edit Profile"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                  <button 
                                    onClick={() => toggleHMStatus(hm.id, hm.fullName, hm.status)}
                                    className={`p-1 px-1.5 text-white rounded-lg cursor-pointer ${
                                      hm.status === 'ACTIVE' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                                    title={hm.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
                                  >
                                    <Power className="h-3.5 w-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => resetHMPassword(hm.id, hm.fullName)}
                                    className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                                    title="Reset Password to admin123"
                                  >
                                    <Lock className="h-3 w-3" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteHeadmaster(hm.id, hm.fullName)}
                                    className="p-1 px-1.5 bg-red-650 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                                    title="Purge Portfolio"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredHeadmasters.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-xs text-slate-400 font-mono">No Headmasters registered on rosters.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === TAB 4: TEACHERS MONITOR === */}
              {activeTab === 'teachers' && (
                <div className="space-y-5" id="teachers-tab">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'Teachers Global Ledger & Applications' : 'Leja Kuu ya Walimu'}</h3>
                    <p className="text-xs text-slate-400">View real-time credentials, registration statuses, and check-in rosters across schools.</p>
                  </div>

                  <div className={`border rounded-3xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-805' : 'bg-white border-slate-150'}`}>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-500/5 uppercase text-slate-400 text-xxs font-bold tracking-widest">
                          <th className="p-3">Full Name</th>
                          <th className="p-3">Teacher ID</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Phone Line</th>
                          <th className="p-3">Qualifications</th>
                          <th className="p-3">Assigned Specializations</th>
                          <th className="p-3">Status Badge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredTeachers.map((teach) => (
                          <tr key={teach.id} className="hover:bg-slate-500/5 transition">
                            <td className="p-3 font-bold flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                                {teach.fullName.charAt(0)}
                              </div>
                              <span>{teach.fullName}</span>
                            </td>
                            <td className="p-3 font-semibold font-mono text-slate-400">{teach.teacherNumber}</td>
                            <td className="p-3 font-mono">{teach.email}</td>
                            <td className="p-3 font-mono">{teach.phone}</td>
                            <td className="p-3">{teach.qualification}</td>
                            <td className="p-3 font-bold text-orange-600">{teach.specialization}</td>
                            <td className="p-3">
                              <span className={`inline-block font-black text-xxs rounded uppercase px-1.5 py-0.2 ${
                                teach.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-555' : teach.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {teach.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === TAB 5: PARENTS MONITOR === */}
              {activeTab === 'parents' && (
                <div className="space-y-5" id="parents-tab">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'SaaS Parent Registry Log' : 'Daftari la Wazazi'}</h3>
                    <p className="text-xs text-slate-400">Orodha ya wazazi waliojisajili kwenye mfumo kote nchini.</p>
                  </div>

                  <div className={`border rounded-3xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-805' : 'bg-white border-slate-150'}`}>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-500/5 uppercase text-slate-400 text-xxs font-bold tracking-widest">
                          <th className="p-3">Full Name</th>
                          <th className="p-3">Registered Parent ID</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Phone Line</th>
                          <th className="p-3">Linked Dependents / Students</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-805">
                        {filteredParents.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-500/5 transition">
                            <td className="p-3 font-bold flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-sky-500/10 text-sky-750 flex items-center justify-center font-bold text-[10px]">
                                {p.fullName.charAt(0)}
                              </div>
                              <span>{p.fullName}</span>
                            </td>
                            <td className="p-3 font-semibold font-mono text-slate-400">{p.id}</td>
                            <td className="p-3 font-mono">{p.email}</td>
                            <td className="p-3 font-mono">{p.phone}</td>
                            <td className="p-3 font-bold text-indigo-655">{p.verifiedStudentIds.length} Linked Students</td>
                          </tr>
                        ))}
                        {filteredParents.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-slate-400 font-mono">No parents registered in the directory.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === TAB 6: STUDENTS MONITOR === */}
              {activeTab === 'students' && (
                <div className="space-y-5" id="students-tab">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'SaaS Global Student Directory' : 'Kumbukumbu ya Wanafunzi Platform'}</h3>
                    <p className="text-xs text-slate-400">Directory containing children rosters across registered divisions. Students do NOT have portal login permissions.</p>
                  </div>

                  <div className={`border rounded-3xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-805' : 'bg-white border-slate-150'}`}>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-500/5 uppercase text-slate-400 text-xxs font-bold tracking-widest">
                          <th className="p-3">Full Student Name</th>
                          <th className="p-3">Admission Code</th>
                          <th className="p-3">Sex/Gender</th>
                          <th className="p-3">Date Of Birth</th>
                          <th className="p-3">Unique Connection Code</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-805">
                        {filteredStudents.map((stud) => (
                          <tr key={stud.id} className="hover:bg-slate-500/5 transition">
                            <td className="p-3 font-bold flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold text-[10px]">
                                {stud.fullName.charAt(0)}
                              </div>
                              <span>{stud.fullName}</span>
                            </td>
                            <td className="p-3 font-semibold font-mono text-slate-400">{stud.admissionNumber}</td>
                            <td className="p-3 font-semibold text-slate-705">{stud.gender}</td>
                            <td className="p-3 font-mono">{stud.dateOfBirth}</td>
                            <td className="p-3"><code className="bg-orange-600/10 px-1.5 py-0.5 rounded text-orange-600 font-bold font-mono">{stud.parentCode}</code></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === TAB 7: ATTENDANCE ANALYTICS === */}
              {activeTab === 'attendance' && (
                <div className="space-y-6" id="attendance-tab">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'Platform Attendance Census Analysis' : 'Tathmini ya Mahudhurio Platform'}</h3>
                    <p className="text-xs text-slate-400">Continuous check-in stats of both educators and students via verified school zones.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-5 border rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'}`}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Educator Check-In Health Ratio</h4>
                      <div className="flex items-center justify-center py-6 relative">
                        {/* Circular Progress Representation */}
                        <div className="h-28 w-28 rounded-full border-8 border-emerald-550 border-r-transparent flex flex-col items-center justify-center leading-none">
                          <span className="text-2xl font-black text-emerald-555">94%</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Present Rate</span>
                        </div>
                      </div>
                      <p className="text-xxs leading-relaxed text-slate-400 text-center font-mono mt-2">
                        Geofenced verified logins within allowed radius limits remain excellent. Zero unauthorized off-site bypass reports.
                      </p>
                    </div>

                    <div className={`p-5 border rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'}`}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Student Census Ticker</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span>Verified Present Daily Average</span>
                          <span className="font-bold font-mono text-emerald-555">91.4% Rate</span>
                        </div>
                        <div className="w-full h-2 rounded bg-slate-500/5 overflow-hidden">
                          <div className="h-full bg-emerald-550 rounded w-[91%]" />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span>Average Late Admission Flag</span>
                          <span className="font-bold font-mono text-amber-600">6.2% Rate</span>
                        </div>
                        <div className="w-full h-2 rounded bg-slate-500/5 overflow-hidden">
                          <div className="h-full bg-amber-500 rounded w-[6%]" />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span>Unaccounted Truant Status</span>
                          <span className="font-bold font-mono text-red-500">2.4% Rate</span>
                        </div>
                        <div className="w-full h-2 rounded bg-slate-500/5 overflow-hidden">
                          <div className="h-full bg-red-500 rounded w-[2%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 8: ACADEMICS SUITE === */}
              {activeTab === 'academics' && (
                <div className="space-y-6" id="academics-tab">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'Global Academics Scores Distribution' : 'Kigezo cha Kitaaluma Platform'}</h3>
                    <p className="text-xs text-slate-400">Global score matrix distribution to ensure high schools educational standards across regions.</p>
                  </div>

                  <div className={`p-5 border rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'}`}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Average Scores Distribution based on Term Exams</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      {[
                        { title: 'Form 1 Mathematics', score: '78.5%', status: 'Excellent', color: 'text-emerald-555' },
                        { title: 'Form 1 English Literature', score: '81.2%', status: 'Outstanding', color: 'text-indigo-600' },
                        { title: 'Form 2 Biology', score: '64.5%', status: 'Average', color: 'text-amber-600' },
                        { title: 'Form 3 Chemistry', score: '72.0%', status: 'Very Good', color: 'text-teal-650' },
                      ].map((item, i) => (
                        <div key={i} className="p-4 bg-slate-500/5 rounded-2xl space-y-1">
                          <span className="text-[10px] text-slate-400 block h-8 leading-tight font-bold">{item.title}</span>
                          <span className={`text-2xl font-black block ${item.color}`}>{item.score}</span>
                          <span className="text-[9px] font-mono uppercase tracking-widest block font-bold text-slate-400">{item.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 9: ANNOUNCEMENTS === */}
              {activeTab === 'announcements' && (
                <div className="space-y-5" id="announcements-tab">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'Disperse SaaS Broadcasts' : 'Safisha Matangazo ya Shule'}</h3>
                    <p className="text-xs text-slate-400">Broadcast administrative declarations directly onto all teachers, parents and headmasters dashboards instantaneously.</p>
                  </div>

                  <form onSubmit={handleAddAnnouncement} className={`p-5 border rounded-3xl space-y-4 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xxs font-bold uppercase text-slate-400 mb-1">Title (English) *</label>
                        <input
                          type="text"
                          required
                          value={annTitleEn}
                          onChange={e => setAnnTitleEn(e.target.value)}
                          placeholder="e.g. Critical Server Maintenance"
                          className="w-full text-xs p-2 rounded-xl border bg-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-bold uppercase text-slate-400 mb-1">Title (Swahili)</label>
                        <input
                          type="text"
                          value={annTitleSw}
                          onChange={e => setAnnTitleSw(e.target.value)}
                          placeholder="Mfano: Matengenezo ya Mtandao"
                          className="w-full text-xs p-2 rounded-xl border bg-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xxs font-bold uppercase text-slate-400 mb-1">Content (English) *</label>
                        <textarea
                          required
                          rows={4}
                          value={annContentEn}
                          onChange={e => setAnnContentEn(e.target.value)}
                          placeholder="Detail of the notification board update..."
                          className="w-full text-xs p-2.5 rounded-xl border bg-transparent font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-bold uppercase text-slate-400 mb-1">Content (Swahili)</label>
                        <textarea
                          rows={4}
                          value={annContentSw}
                          onChange={e => setAnnContentSw(e.target.value)}
                          placeholder="Maelezo maalum kwa Kiswahili..."
                          className="w-full text-xs p-2.5 rounded-xl border bg-transparent font-mono"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="py-1.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>{lang === 'en' ? 'Dispatch Broadcast Notification' : 'Tuma Tangazo Hili'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* === TAB 10: AUDIT LOGS === */}
              {activeTab === 'logs' && (
                <div className="space-y-4" id="logs-tab">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'Unified Security Audit Trail Ledger' : 'Dada la Kumbukumbu ya Kila Matukio'}</h3>
                    <p className="text-xs text-slate-400">Strict chronological telemetry records of administrative steps, logins, credential modifications, and GPS coordinates.</p>
                  </div>

                  <div className={`border rounded-3xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-805' : 'bg-white border-slate-150'}`}>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-500/5 uppercase text-slate-400 text-xxs font-bold tracking-widest">
                          <th className="p-3">Reference ID</th>
                          <th className="p-3">Trigger Session User</th>
                          <th className="p-3">Governance Event Action</th>
                          <th className="p-3">Action Specific Details</th>
                          <th className="p-3">Log Date</th>
                          <th className="p-3">IP Address</th>
                          <th className="p-3">Browser / Core Client</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-805 font-medium">
                        {filteredLogs.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-500/5 transition">
                            <td className="p-3 font-mono font-bold text-orange-600">{item.id}</td>
                            <td className="p-3 font-bold">{item.user}</td>
                            <td className="p-3 font-semibold text-slate-850 dark:text-slate-300">{item.action}</td>
                            <td className="p-3 text-slate-400 font-mono text-[11px] truncate max-w-sm" title={item.details}>{item.details}</td>
                            <td className="p-3 font-mono text-[11px]">{new Date(item.timestamp).toLocaleString() || item.timestamp}</td>
                            <td className="p-3 font-mono text-emerald-500">{item.ipAddress}</td>
                            <td className="p-3 truncate max-w-[130px] font-mono text-slate-400 text-xxs" title={item.browser}>{item.browser}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === TAB 11: REPORTS === */}
              {activeTab === 'reports' && (
                <div className="space-y-6" id="reports-tab">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'SaaS Core Reports Generator' : 'Kipengele cha Ripoti Platform'}</h3>
                    <p className="text-xs text-slate-400">Collectively extract spreadsheets to compile regional performance indicators.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-5 border rounded-2xl space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-805' : 'bg-white border-slate-150'}`}>
                      <h4 className="text-xs font-black uppercase tracking-wider">Schools Data Sheet Export</h4>
                      <p className="text-xs text-slate-400">Download complete list of schools, locations, and registration statuses for fiscal planning.</p>
                      <button onClick={handleExportSchools} className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold w-full cursor-pointer flex justify-center items-center gap-1.5 shadow-xs">
                        <Download className="h-4 w-4" />
                        <span>Download Schools CSV</span>
                      </button>
                    </div>

                    <div className={`p-5 border rounded-2xl space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-805' : 'bg-white border-slate-150'}`}>
                      <h4 className="text-xs font-black uppercase tracking-wider">Headmasters Roster Sheet Export</h4>
                      <p className="text-xs text-slate-400">Export active leaders credentials roster and last logs timestamps profiles for system checks.</p>
                      <button onClick={handleExportHeadmasters} className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold w-full cursor-pointer flex justify-center items-center gap-1.5 shadow-xs">
                        <Download className="h-4 w-4" />
                        <span>Download Headmaster CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 12: SYSTEM SETTINGS === */}
              {activeTab === 'settings' && (
                <div className="space-y-6" id="settings-tab">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'SaaS System Control & Security Configurations' : 'Mipangilio ya Jukwaa Mkuu'}</h3>
                    <p className="text-xs text-slate-400">Handle platformwide variables such as trial setups and strict system configurations.</p>
                  </div>

                  <div className={`p-5 border rounded-3xl space-y-5 ${isDarkMode ? 'bg-slate-900 border-slate-805' : 'bg-white border-slate-150'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-orange-600">Platform Access Parameters</h4>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs block">Require Administrative Two-Factor Authentication</span>
                            <span className="text-[10px] text-slate-400">Force administrators to supply authenticator logs on checkout sessions.</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={twoFactorEnabled} 
                            onChange={e => setTwoFactorEnabled(e.target.checked)} 
                            className="h-4.5 w-4.5 rounded text-orange-600 border-slate-350 focus:ring-orange-500" 
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs block">Maintenance Mode Gate</span>
                            <span className="text-[10px] text-slate-400">Freeze end-user registration across nodes temporarily.</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={maintenanceMode} 
                            onChange={e => setMaintenanceMode(e.target.checked)} 
                            className="h-4.5 w-4.5 rounded text-orange-655 focus:ring-orange-500" 
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-orange-600">Tenant Settings (SaaS Subscriptions)</h4>
                        
                        <div>
                          <label className="block text-xxs font-bold uppercase text-slate-400 mb-1">Standard Free Trial Subscription Period (Days)</label>
                          <input 
                            type="number"
                            value={trialPeriodDays}
                            onChange={e => setTrialPeriodDays(Number(e.target.value))}
                            className="text-xs p-2 rounded-xl bg-transparent border w-full font-mono" 
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs block">Auto Cache Database Log Backups</span>
                            <span className="text-[10px] text-slate-400">Commit browser caches instantly following telemetry steps.</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={autoBackupEnabled} 
                            onChange={e => setAutoBackupEnabled(e.target.checked)} 
                            className="h-4.5 w-4.5 rounded text-orange-655 focus:ring-orange-500" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-500/10">
                      <button 
                        onClick={() => {
                          triggerAudit('SaaS Configurations Saved', `Adjusted parameters: 2FA=${twoFactorEnabled}, trialPeriodDays=${trialPeriodDays}`);
                          alert(lang === 'en' ? 'Subsystems updated successfully!' : 'Mipangilio imehifadhiwa kikamilifu!');
                        }}
                        className="py-1.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                      >
                        {t.save}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 13: ADMIN PROFILE === */}
              {activeTab === 'profile' && (
                <div className="space-y-6" id="profile-tab">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'SaaS System Root Portfolio' : 'Usimamizi wa Nyaraka za Mfumo'}</h3>
                    <p className="text-xs text-slate-400">Administrative rights controls parameters.</p>
                  </div>

                  <div className={`p-5 border rounded-3xl space-y-4 max-w-xl ${isDarkMode ? 'bg-slate-900 border-slate-805' : 'bg-white border-slate-150'}`}>
                    <div className="flex items-center gap-4 border-b border-slate-500/10 pb-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-orange-650 to-amber-500 text-white flex items-center justify-center font-bold text-lg ring-4 ring-orange-550/15 shrink-0">
                        SA
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase">SaaS General Administrator</h4>
                        <span className="text-[10px] font-mono text-emerald-500 font-bold">● Core Session Holder</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <p><b className="text-slate-405">Assigned Email:</b> admin@ssms.com</p>
                      <p><b className="text-slate-405">Session Key Hash:</b> <code className="bg-slate-500/10 px-1 py-0.5 rounded text-[10px] break-all select-all">SHA256-4AF92F1C3E20B</code></p>
                      <p><b className="text-slate-405">Dual Factor:</b> <span className="text-amber-600 font-semibold">{twoFactorEnabled ? 'Strictly Enforced' : 'Offline Mode Bypass'}</span></p>
                      <p><b className="text-slate-405">Current Time:</b> {new Date().toUTCString()}</p>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* --- WORKSPACE OVERLAY 1: DISMISSABLE INDIVIDUAL SCHOOL INSPECTOR CARD --- */}
      <AnimatePresence>
        {schoolViewerOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full border p-6 rounded-3xl relative shadow-2xl ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-150 text-slate-800'
              }`}
            >
              <button 
                onClick={() => setSchoolViewerOpen(null)} 
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-250 cursor-pointer"
              >
                ✕
              </button>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img src={schoolViewerOpen.logoUrl} referrerPolicy="no-referrer" alt="logo" className="h-16 w-16 rounded-2xl object-cover shrink-0" />
                  <div>
                    <h3 className="font-black text-sm uppercase">{schoolViewerOpen.name}</h3>
                    <p className="text-xxs font-mono text-slate-400">Class: {schoolViewerOpen.type} • Status: <span className="text-emerald-500 font-bold">{schoolViewerOpen.status}</span></p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="py-2.5 flex justify-between"><span className="text-slate-400">Reg Code</span><span className="font-mono font-bold">{schoolViewerOpen.registrationNumber}</span></div>
                  <div className="py-2.5 flex justify-between"><span className="text-slate-400">Address Location</span><span className="font-bold">{schoolViewerOpen.address}</span></div>
                  <div className="py-2.5 flex justify-between"><span className="text-slate-400">Geographic Bounds</span><span className="font-mono">{schoolViewerOpen.district}, {schoolViewerOpen.region}</span></div>
                  <div className="py-2.5 flex justify-between"><span className="text-slate-400">Contact Line</span><span className="font-mono font-bold">{schoolViewerOpen.phone}</span></div>
                  <div className="py-2.5 flex justify-between"><span className="text-slate-400">Fiscal Email</span><span className="font-mono font-bold">{schoolViewerOpen.email}</span></div>
                  <div className="py-2.5 flex justify-between"><span className="text-slate-400">Enrolled Since</span><span>{new Date(schoolViewerOpen.createdAt).toDateString()}</span></div>
                </div>

                <button 
                  onClick={() => setSchoolViewerOpen(null)}
                  className="w-full p-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs mt-3"
                >
                  Close Specification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DRAWER 2: SCHOOL ADD/EDIT DRAWER MODAL --- */}
      <AnimatePresence>
        {schoolModalOpen && (
          <div className="fixed inset-0 z-45 bg-black/60 backdrop-blur-xs flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className={`w-full max-w-lg p-6 overflow-y-auto flex flex-col justify-between ${
                isDarkMode ? 'bg-slate-900 border-l border-slate-800 text-slate-100' : 'bg-white border-l text-slate-800'
              }`}
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-black text-xs uppercase tracking-widest text-orange-650">
                    {selectedSchool ? 'Edit School Bounds' : 'Register New Campus Node'}
                  </h3>
                  <button onClick={() => setSchoolModalOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer text-xs">✕</button>
                </div>

                <form onSubmit={handleSaveSchool} className="space-y-4 text-xs" id="school-saas-form">
                  <div>
                    <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">School Campus Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Arusha Science Academy"
                      value={schName}
                      onChange={e => setSchName(e.target.value)}
                      className="w-full p-2 bg-transparent border rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Institutional Level *</label>
                      <select 
                        value={schType}
                        onChange={e => setSchType(e.target.value)}
                        className="w-full p-2 bg-slate-100 dark:bg-slate-950 border rounded-xl text-xs"
                      >
                        <option value="Primary">Primary School (Msingi)</option>
                        <option value="Secondary">Secondary School (Sekondari)</option>
                        <option value="Combined">Combined Primary & Secondary (Mseto)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Regulatory Category *</label>
                      <select 
                        value={schCategory}
                        onChange={e => setSchCategory(e.target.value as any)}
                        className="w-full p-2 bg-slate-100 dark:bg-slate-950 border rounded-xl text-xs"
                      >
                        <option value="Private">Private School (Binafsi)</option>
                        <option value="Government">Government School (Serikali)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Registration Identifier *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. REG-TZ-10091"
                      value={schRegNum}
                      onChange={e => setSchRegNum(e.target.value)}
                      className="w-full p-2 bg-transparent border rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Region *</label>
                      <select 
                        value={schRegion}
                        onChange={e => setSchRegion(e.target.value)}
                        className="w-full p-2 bg-slate-100 dark:bg-slate-950 border rounded-xl text-xs"
                      >
                        <option value="Arusha">Arusha</option>
                        <option value="Dar es Salaam">Dar es Salaam</option>
                        <option value="Dodoma">Dodoma</option>
                        <option value="Kilimanjaro">Kilimanjaro</option>
                        <option value="Mwanza">Mwanza</option>
                        <option value="Tanga">Tanga</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">District *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Kinondoni"
                        value={schDistrict}
                        onChange={e => setSchDistrict(e.target.value)}
                        className="w-full p-2 bg-transparent border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Ward *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Oysterbay"
                        value={schWard}
                        onChange={e => setSchWard(e.target.value)}
                        className="w-full p-2 bg-transparent border rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Physical Street Address *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Oysterbay Rd, Plot 14"
                      value={schAddress}
                      onChange={e => setSchAddress(e.target.value)}
                      className="w-full p-2 bg-transparent border rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Fiscal Email *</label>
                      <input 
                        type="email" 
                        required
                        placeholder="info@academy.edu"
                        value={schEmail}
                        onChange={e => setSchEmail(e.target.value)}
                        className="w-full p-2 bg-transparent border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Phone Line Contact *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="0712345678"
                        value={schPhone}
                        onChange={e => setSchPhone(e.target.value)}
                        className="w-full p-2 bg-transparent border rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Simulate Logo Vector URL Badge</label>
                    <input 
                      type="url" 
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      value={schLogo}
                      onChange={e => setSchLogo(e.target.value)}
                      className="w-full p-2 bg-transparent border rounded-xl font-mono"
                    />
                    <div className="flex gap-2 mt-2">
                      <button 
                        type="button" 
                        onClick={() => setSchLogo('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200')}
                        className="p-1 px-1.5 border hover:bg-slate-500/10 rounded cursor-pointer text-[10px]"
                      >
                        Model 1
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setSchLogo('https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=200')}
                        className="p-1 px-1.5 border hover:bg-slate-500/10 rounded cursor-pointer text-[10px]"
                      >
                        Model 2
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold cursor-pointer shadow-xs mt-4"
                  >
                    {selectedSchool ? 'Hifadhi Mabadiliko (Save)' : 'Ongeza Shule (Create School)'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SPECIALIZED EDIT SCHOOL MODAL --- */}
      <EditSchoolModal
        isOpen={editSchoolModalOpen}
        onClose={() => {
          setEditSchoolModalOpen(false);
          setSelectedSchool(null);
        }}
        school={selectedSchool}
        onSave={(updatedSchool) => {
          const currentSchools = DB.getSchools();
          const updated = currentSchools.map(s => s.id === updatedSchool.id ? updatedSchool : s);
          DB.saveSchools(updated);
          triggerAudit('School Profile Updated', `SaaS Admin adjusted files of ${updatedSchool.name} (${updatedSchool.registrationNumber}).`);
          
          if (updatedSchool.status !== (selectedSchool?.status || 'ACTIVE')) {
            triggerSaaSNotification(
              `Governance Alert: School ${updatedSchool.name} is now ${updatedSchool.status.toLowerCase()}.`,
              `Taarifa: Shule ya ${updatedSchool.name} kwa sasa imepewa hadhi ya ${updatedSchool.status === 'ACTIVE' ? 'Amilifu' : 'Kusimamishwa'}.`
            );
          }
          
          setSchools(DB.getSchools());
          setEditSchoolModalOpen(false);
          setSelectedSchool(null);
        }}
        lang={lang}
        isDarkMode={isDarkMode}
      />

      {/* --- DRAWER 3: HEADMASTER ADD/EDIT DRAWER MODAL --- */}
      <AnimatePresence>
        {headmasterModalOpen && (
          <div className="fixed inset-0 z-45 bg-black/60 backdrop-blur-xs flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className={`w-full max-w-lg p-6 overflow-y-auto flex flex-col justify-between ${
                isDarkMode ? 'bg-slate-900 border-l border-slate-800 text-slate-100' : 'bg-white border-l text-slate-800'
              }`}
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-black text-xs uppercase tracking-widest text-orange-650">
                    {selectedHeadmaster ? 'Modify Headmaster Authority' : 'Commission Governance Officer'}
                  </h3>
                  <button onClick={() => setHeadmasterModalOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer text-xs">✕</button>
                </div>

                <form onSubmit={handleSaveHeadmaster} className="space-y-4 text-xs" id="hm-saas-form">
                  <div>
                    <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Dr. Joseph Mrema"
                      value={hmName}
                      onChange={e => setHmName(e.target.value)}
                      className="w-full p-2 bg-transparent border rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Phone Line Contact *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="e.g. 0755667788"
                        value={hmPhone}
                        onChange={e => setHmPhone(e.target.value)}
                        className="w-full p-2 bg-transparent border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Administrative Email *</label>
                      <input 
                        type="email" 
                        required
                        placeholder="mrema@ssms.edu"
                        value={hmEmail}
                        onChange={e => setHmEmail(e.target.value)}
                        className="w-full p-2 bg-transparent border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">National ID Number Enclosure</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 19850524-12..."
                        value={hmNationalId}
                        onChange={e => setHmNationalId(e.target.value)}
                        className="w-full p-2 bg-transparent border rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">School Assignment *</label>
                      <select
                        value={hmSchoolId}
                        onChange={e => setHmSchoolId(e.target.value)}
                        className="w-full p-2 bg-slate-100 dark:bg-slate-950 border rounded-xl text-xs"
                      >
                        <option value="">-- Choose school --</option>
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.region})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-500/10 pt-4">
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">Portal Login Username *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="mrema_sci"
                        value={hmUsername}
                        onChange={e => setHmUsername(e.target.value)}
                        className="w-full p-2 bg-transparent border rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xxs uppercase text-slate-400 font-bold mb-1">
                        {selectedHeadmaster ? 'Reset Portal Password (Optional)' : 'Secret Key Password *'}
                      </label>
                      <input 
                        type="text" 
                        placeholder={selectedHeadmaster ? 'Leave blank to preserve' : 'Default password123'}
                        value={hmPassword}
                        onChange={e => setHmPassword(e.target.value)}
                        className="w-full p-2 bg-transparent border rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold cursor-pointer shadow-xs mt-4"
                  >
                    {selectedHeadmaster ? 'Hifadhi Mabadiliko (Save)' : 'Tengeneza Mkuu (Create Headmaster)'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
