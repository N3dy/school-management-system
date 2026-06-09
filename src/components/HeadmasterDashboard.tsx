/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../translations';
import { DB, getGradeAndPoints, exportToCSVFile } from '../db';
import { Teacher, Student, Class, Subject, Announcement, AuditLog, SchoolSettings } from '../types';
import {
  Users,
  ShieldCheck,
  UserCheck,
  MapPin,
  Calendar,
  Layers,
  Search,
  Plus,
  Trash2,
  FileText,
  Volume2,
  Settings,
  HelpCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Download,
  AlertTriangle,
  BookOpen,
  LogOut
} from 'lucide-react';

interface HMProps {
  lang: 'en' | 'sw';
  headmasterId?: string;
  schoolId?: string;
}

export default function HeadmasterDashboard({ lang, headmasterId, schoolId }: HMProps) {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<'kpis' | 'teachers' | 'classes' | 'students' | 'announcements' | 'settings' | 'reports'>('kpis');

  // Database dynamic states
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>(DB.getSettings());

  // School Type and Optional Contributions states (Rule 1 & Rule 2)
  const [currentSchool, setCurrentSchool] = useState<any>(null);
  const [schLevel, setSchLevel] = useState<'Primary' | 'Secondary' | 'Combined'>('Primary');
  const [schCategory, setSchCategory] = useState<'Private' | 'Government'>('Private');
  const [optionalContributionsEnabled, setOptionalContributionsEnabled] = useState<boolean>(true);

  // Search and Filter states
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('');

  // Form Inputs
  // 1. Teachers Assign details
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignIsClassTeacherOf, setAssignIsClassTeacherOf] = useState('');

  // 2. Classes and Streams
  const [newClassName, setNewClassName] = useState('');
  const [newClassStream, setNewClassStream] = useState('');

  // 3. Subjects
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  // 4. Students
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Male' | 'Female'>('Male');
  const [newStudentClass, setNewStudentClass] = useState('');
  const [newStudentStream, setNewStudentStream] = useState('A');
  const [newStudentDOB, setNewStudentDOB] = useState('2013-01-01');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('');

  // 5. Announcements
  const [newAnnTitleEn, setNewAnnTitleEn] = useState('');
  const [newAnnTitleSw, setNewAnnTitleSw] = useState('');
  const [newAnnContentEn, setNewAnnContentEn] = useState('');
  const [newAnnContentSw, setNewAnnContentSw] = useState('');

  // 6. GPS Configuration Settings Form
  const [setSchoolName, setSetSchoolName] = useState('');
  const [setSchoolLat, setSetSchoolLat] = useState(-3.3869);
  const [setSchoolLng, setSetSchoolLng] = useState(36.6829);
  const [setSchoolRadius, setSetSchoolRadius] = useState(10);
  const [setSchoolDeadline, setSetSchoolDeadline] = useState('07:30');

  // Trigger notification / feedback alerts
  const [alertSuccess, setAlertSuccess] = useState('');

  // Fetch updated data with strict school-isolation filter
  const loadDatabaseState = () => {
    const activeSchoolId = schoolId || 'SCH-001';
    
    setTeachers(DB.getTeachers().filter(t => (t.schoolId || 'SCH-001') === activeSchoolId));
    setStudents(DB.getStudents().filter(s => (s.schoolId || 'SCH-001') === activeSchoolId));
    setClasses(DB.getClasses().filter(c => (c.schoolId || 'SCH-001') === activeSchoolId));
    setSubjects(DB.getSubjects().filter(sub => (sub.schoolId || 'SCH-001') === activeSchoolId));
    setAnnouncements(DB.getAnnouncements().filter(a => (a.schoolId || 'SCH-001') === activeSchoolId));
    
    // Scoping audit trails for the active school context
    setAuditLogs(DB.getAuditLogs().filter(log => log.details.includes(activeSchoolId) || log.user.includes('Headmaster') || log.user === 'SYSTEM'));
    
    // Fetch and bind active School entity characteristics (Rule 1 & Rule 2)
    const schoolsList = DB.getSchools();
    const activeSch = schoolsList.find(s => s.id === activeSchoolId);
    if (activeSch) {
      setCurrentSchool(activeSch);
      setSchLevel(activeSch.type || 'Primary');
      setSchCategory(activeSch.category || 'Private');
      setOptionalContributionsEnabled(activeSch.optionalContributionsEnabled ?? true);
    }

    const currentSettings = DB.getSettings();
    setSettings(currentSettings);
    // Initialize settings fields
    setSetSchoolName(activeSch ? activeSch.name : currentSettings.schoolName);
    setSetSchoolLat(currentSettings.latitude);
    setSetSchoolLng(currentSettings.longitude);
    setSetSchoolRadius(currentSettings.allowedRadiusMeters);
    setSetSchoolDeadline(currentSettings.checkInDeadline);
  };

  useEffect(() => {
    loadDatabaseState();
    window.addEventListener('ssms_db_update', loadDatabaseState);
    return () => window.removeEventListener('ssms_db_update', loadDatabaseState);
  }, []);

  const triggerAlert = (msg: string) => {
    setAlertSuccess(msg);
    setTimeout(() => {
      setAlertSuccess('');
    }, 4000);
  };

  // TEACHER APPROVAL & WORKFLOW
  const handleApproveTeacher = (teacherId: string) => {
    const list = [...teachers];
    const index = list.findIndex(t => t.id === teacherId);
    if (index !== -1) {
      list[index].status = 'ACTIVE';
      DB.saveTeachers(list);
      DB.addNotification(
        `Teacher profile approved: ${list[index].fullName}`,
        `Uhakiki wa Mwalimu umethibitishwa: ${list[index].fullName}`,
        'TEACHER',
        list[index].id
      );
      DB.addAudit('Approved Teacher Profile', `Approved teacher number ${list[index].teacherNumber} (${list[index].fullName})`, 'Headmaster');
      triggerAlert(lang === 'en' ? 'Teacher approved successfully!' : 'Mwalimu amethibitishwa kikamilifu!');
    }
  };

  const handleRejectTeacher = (teacherId: string) => {
    const list = [...teachers];
    const index = list.findIndex(t => t.id === teacherId);
    if (index !== -1) {
      list[index].status = 'REJECTED';
      DB.saveTeachers(list);
      DB.addAudit('Rejected Teacher Profile', `Rejected teacher number ${list[index].teacherNumber} (${list[index].fullName})`, 'Headmaster');
      triggerAlert(lang === 'en' ? 'Teacher profile application rejected.' : 'Ombi la Mwalimu limekataliwa rasmi.');
    }
  };

  // TEACHER SUBJECTS & CLASS ASSIGNMENT HANDLER
  const handleAssignTeacherScope = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;

    const list = [...teachers];
    const index = list.findIndex(t => t.id === selectedTeacherId);
    if (index !== -1) {
      // Add subjectId if selected and not already in assigning
      if (assignSubjectId && !list[index].assignedSubjectIds.includes(assignSubjectId)) {
        list[index].assignedSubjectIds.push(assignSubjectId);
      }
      // Add classId if selected and not already assigning
      if (assignClassId && !list[index].assignedClassIds.includes(assignClassId)) {
        list[index].assignedClassIds.push(assignClassId);
      }
      // Set Class Teacher role if requested
      if (assignIsClassTeacherOf) {
        list[index].isClassTeacherOf = assignIsClassTeacherOf === 'NONE' ? null : assignIsClassTeacherOf;
        
        // Update Class record with this class teacher
        if (assignIsClassTeacherOf !== 'NONE') {
          const allClasses = DB.getClasses();
          const classIdx = allClasses.findIndex(c => c.id === assignIsClassTeacherOf);
          if (classIdx !== -1) {
            allClasses[classIdx].classTeacherId = selectedTeacherId;
            DB.saveClasses(allClasses);
          }
        }
      }

      DB.saveTeachers(list);
      DB.addAudit('Assign Teacher Scope', `Updated subjects, classes, and roles assignment for ${list[index].fullName}`, 'Headmaster');
      triggerAlert(lang === 'en' ? 'Teacher assignments updated!' : 'Sifa na Majukumu ya Mwalimu yamesajiliwa!');
      
      // Clear assigning form inputs
      setAssignSubjectId('');
      setAssignClassId('');
      setAssignIsClassTeacherOf('');
    }
  };

  const handleRemoveSubjectFromTeacher = (teacherId: string, subId: string) => {
    const list = [...teachers];
    const idx = list.findIndex(t => t.id === teacherId);
    if (idx !== -1) {
      list[idx].assignedSubjectIds = list[idx].assignedSubjectIds.filter(id => id !== subId);
      DB.saveTeachers(list);
      DB.addAudit('Teacher Subject Revocation', `Removed subject code ${subId} from teacher ${list[idx].fullName}`, 'Headmaster');
      triggerAlert(lang === 'en' ? 'Subject assignment revoked.' : 'Somo limeondolewa.');
    }
  };

  const handleRemoveClassFromTeacher = (teacherId: string, clsId: string) => {
    const list = [...teachers];
    const idx = list.findIndex(t => t.id === teacherId);
    if (idx !== -1) {
      list[idx].assignedClassIds = list[idx].assignedClassIds.filter(id => id !== clsId);
      if (list[idx].isClassTeacherOf === clsId) {
        list[idx].isClassTeacherOf = null;
        // Update Class schema mapping
        const allClasses = DB.getClasses();
        const cIdx = allClasses.findIndex(c => c.id === clsId);
        if (cIdx !== -1) {
          allClasses[cIdx].classTeacherId = null;
          DB.saveClasses(allClasses);
        }
      }
      DB.saveTeachers(list);
      DB.addAudit('Teacher Class Revocation', `Removed class ${clsId} from teacher ${list[idx].fullName}`, 'Headmaster');
      triggerAlert(lang === 'en' ? 'Class assignment revoked.' : 'Darasa limeondolewa.');
    }
  };

  // ADD NEW CLASS & STREAM
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newClassStream) return;

    const currentClasses = DB.getClasses();
    const newClass: Class = {
      id: 'C-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      schoolId: schoolId || 'SCH-001',
      name: newClassName,
      stream: newClassStream.toUpperCase(),
      classTeacherId: null,
    };

    currentClasses.push(newClass);
    DB.saveClasses(currentClasses);
    DB.addAudit('Create Class Room', `Configured class stream: ${newClassName} ${newClassStream.toUpperCase()} inside context ${schoolId || 'SCH-001'}`, 'Headmaster');
    triggerAlert(lang === 'en' ? 'New class configured!' : 'Darasa jipya limeundwa!');
    setNewClassName('');
    setNewClassStream('');
  };

  // ADD NEW SUBJECT
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName || !newSubjectCode) return;

    const currentSubjects = DB.getSubjects();
    const newSub: Subject = {
      id: 'S-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      schoolId: schoolId || 'SCH-001',
      name: newSubjectName,
      code: newSubjectCode.toUpperCase(),
    };

    currentSubjects.push(newSub);
    DB.saveSubjects(currentSubjects);
    DB.addAudit('Create Subject Course', `Added academic course: ${newSubjectName} (${newSubjectCode.toUpperCase()}) inside context ${schoolId || 'SCH-001'}`, 'Headmaster');
    triggerAlert(lang === 'en' ? 'New subject registered!' : 'Somo jipya limesajiliwa!');
    setNewSubjectName('');
    setNewSubjectCode('');
  };

  // ADD NEW STUDENT
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentClass) return;

    // Generate unique claim code
    const uniqueParentCode = 'PARENT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const admissionNumber = 'ADM-2026-' + Math.floor(Math.random() * 899 + 100);

    const list = DB.getStudents();
    const matchedClass = classes.find(c => c.id === newStudentClass);

    const newStudent: Student = {
      id: 'ST-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      schoolId: schoolId || 'SCH-001',
      admissionNumber,
      fullName: newStudentName,
      gender: newStudentGender,
      classId: newStudentClass,
      stream: matchedClass ? matchedClass.stream : newStudentStream,
      dateOfBirth: newStudentDOB,
      parentCode: uniqueParentCode,
      parentId: null,
    };

    list.push(newStudent);
    DB.saveStudents(list);
    DB.addAudit('Register Student Profile', `Admitted Student ${newStudentName} with Parent Code [${uniqueParentCode}] inside context ${schoolId || 'SCH-001'}`, 'Headmaster');
    triggerAlert(lang === 'en' ? `Student registered! Code: ${uniqueParentCode}` : `Mwanafunzi amesajiliwa! Msimbo wa Mzazi: ${uniqueParentCode}`);

    // Clear inputs
    setNewStudentName('');
    setNewStudentParentPhone('');
  };

  // BROADCAST ANNOUNCEMENT
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitleEn || !newAnnContentEn) return;

    const list = DB.getAnnouncements();
    const newAnn: Announcement = {
      id: 'A-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      schoolId: schoolId || 'SCH-001',
      titleEn: newAnnTitleEn,
      titleSw: newAnnTitleSw || newAnnTitleEn,
      contentEn: newAnnContentEn,
      contentSw: newAnnContentSw || newAnnContentEn,
      date: new Date().toISOString().split('T')[0],
      addedBy: 'Headmaster',
    };

    list.unshift(newAnn);
    DB.saveAnnouncements(list);

    // Trigger notification to users
    DB.addNotification(
      `New school announcement: "${newAnnTitleEn}"`,
      `Tangazo jipya la Shule: "${newAnnTitleSw || newAnnTitleEn}"`,
      'ALL'
    );

    DB.addAudit('Publish Announcement', `Published broadcast title: ${newAnnTitleEn} inside context ${schoolId || 'SCH-001'}`, 'Headmaster');
    triggerAlert(lang === 'en' ? 'Announcement published!' : 'Tangazo limetangazwa kikamilifu!');

    // Clear
    setNewAnnTitleEn('');
    setNewAnnTitleSw('');
    setNewAnnContentEn('');
    setNewAnnContentSw('');
  };

  const handleDeleteAnnouncement = (id: string) => {
    let list = DB.getAnnouncements();
    list = list.filter(a => a.id !== id);
    DB.saveAnnouncements(list);
    DB.addAudit('Deprecate Announcement', `Deleted school announcement ID ${id}`, 'Headmaster');
    triggerAlert(lang === 'en' ? 'Announcement deprecated.' : 'Tangazo limefutwa ya shule.');
  };

  const handleDeleteStudent = (studentId: string) => {
    let list = DB.getStudents();
    const target = list.find(s => s.id === studentId);
    list = list.filter(s => s.id !== studentId);
    DB.saveStudents(list);
    DB.addAudit('Delete Student Profile', `Terminated Student ID ${studentId} (${target?.fullName})`, 'Headmaster');
    triggerAlert(lang === 'en' ? 'Student deleted.' : 'Mwanafunzi amefutwa kwenye orodha.');
  };

  // SAVE GPS SETTINGS
  const handleSaveGPSSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SchoolSettings = {
      schoolName: setSchoolName || settings.schoolName,
      latitude: Number(setSchoolLat),
      longitude: Number(setSchoolLng),
      allowedRadiusMeters: Number(setSchoolRadius),
      checkInDeadline: setSchoolDeadline,
    };
    DB.saveSettings(updated);

    // Save School regulatory types dynamically (Rule 1 & Rule 2)
    const activeSchoolId = schoolId || 'SCH-001';
    const allSchools = DB.getSchools();
    const targetIdx = allSchools.findIndex(s => s.id === activeSchoolId);
    if (targetIdx !== -1) {
      allSchools[targetIdx].name = setSchoolName || allSchools[targetIdx].name;
      allSchools[targetIdx].type = schLevel;
      allSchools[targetIdx].category = schCategory;
      allSchools[targetIdx].optionalContributionsEnabled = optionalContributionsEnabled;
      DB.saveSchools(allSchools);
      DB.addAudit('Updated School Configuration', `Headmaster modified school regulatory classification to [Type: ${schLevel}, Category: ${schCategory}, Optional Contributions: ${optionalContributionsEnabled}]`, 'Headmaster');
    }

    triggerAlert(t.savedSuccessful);
  };

  // DB STATISTICS PRE-COMPUTATIONS
  const totalStudentsCount = students.length;
  const activeTeachers = teachers.filter(t => t.status === 'ACTIVE');
  const pendingTeachers = teachers.filter(t => t.status === 'PENDING');
  const totalTeachersCount = activeTeachers.length;

  // Let's lookup today's student attendance logs (`2026-06-08`)
  const todayStr = '2026-06-08';
  const studentAttLogs = DB.getStudentAttendance().filter(a => a.date === todayStr);
  const presentStudentsToday = studentAttLogs.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
  const lateStudentsToday = studentAttLogs.filter(a => a.status === 'LATE').length;
  const absentStudentsToday = totalStudentsCount - presentStudentsToday;

  // Teachers Attendance logs
  const teacherAttLogs = DB.getTeacherAttendance().filter(a => a.date === todayStr);
  const presentTeachersToday = teacherAttLogs.filter(a => a.status === 'ON_TIME' || a.status === 'LATE').length;
  const lateTeachersToday = teacherAttLogs.filter(a => a.status === 'LATE').length;
  const absentTeachersToday = Math.max(0, totalTeachersCount - presentTeachersToday);

  // Compute classroom benchmarks (top performing classes using grades averages)
  const computeTopClasses = () => {
    const marks = DB.getMarks();
    const classSums: { [clsId: string]: { sum: number; count: number } } = {};
    
    marks.forEach(m => {
      const percentage = (m.obtainedMarks / m.totalMarks) * 100;
      if (!classSums[m.classId]) {
        classSums[m.classId] = { sum: 0, count: 0 };
      }
      classSums[m.classId].sum += percentage;
      classSums[m.classId].count += 1;
    });

    const results = Object.keys(classSums).map(cid => {
      const cls = classes.find(c => c.id === cid);
      const avg = classSums[cid].count > 0 ? (classSums[cid].sum / classSums[cid].count) : 0;
      return {
        id: cid,
        className: cls ? `${cls.name} ${cls.stream}` : `Class ${cid}`,
        average: Math.round(avg),
      };
    });

    return results.sort((a, b) => b.average - a.average);
  };

  const topClassesRanks = computeTopClasses();

  // EXCEL / SPREADSHEET EXPORTS SIMULATION
  const handleExportStudents = () => {
    let csv = "Admission Number,Full Name,Gender,Class,Stream,Date of Birth,Parent Association Code\n";
    students.forEach(s => {
      const cls = classes.find(c => c.id === s.classId);
      csv += `"${s.admissionNumber}","${s.fullName}","${s.gender}","${cls ? cls.name : ''}","${s.stream}","${s.dateOfBirth}","${s.parentCode}"\n`;
    });
    exportToCSVFile(csv, "SSMS_Students_Directory_Report.csv");
    DB.addAudit('Spreadsheet Report Export', `Downloaded comprehensive Student register (${students.length} records)`, 'Headmaster');
  };

  const handleExportPerformance = () => {
    let csv = "Student Number,Student Name,Class,Stream,Academic Subject,Examination Type,Total Marks,Obtained Marks,Score Percentage,Grade,Position Points\n";
    const marks = DB.getMarks();
    marks.forEach(m => {
      const std = students.find(s => s.id === m.studentId);
      const sub = subjects.find(s => s.id === m.subjectId);
      const cls = classes.find(c => c.id === m.classId);
      const percentage = (m.obtainedMarks / m.totalMarks) * 100;
      const g = getGradeAndPoints(percentage);
      csv += `"${std?.admissionNumber}","${std?.fullName}","${cls?.name}","${std?.stream}","${sub?.name}","${m.type}",${m.totalMarks},${m.obtainedMarks},${percentage.toFixed(1)}%,"${g.grade}",${g.points}\n`;
    });
    exportToCSVFile(csv, "SSMS_Academic_Performance_Scores.csv");
    DB.addAudit('Spreadsheet Report Export', `Downloaded Academic Performance matrices`, 'Headmaster');
  };

  const handleExportTeacherAttendance = () => {
    let csv = "Date,Teacher Number,Teacher Name,Qualification,Check-In Time,Check-Out Time,Attendance Status,Lat,Lng,Radius Verification,Distance Error (metres)\n";
    const attList = DB.getTeacherAttendance();
    attList.forEach(a => {
      const teach = teachers.find(t => t.id === a.teacherId);
      csv += `"${a.date}","${teach?.teacherNumber}","${teach?.fullName}","${teach?.qualification}","${a.checkInTime || 'Absent'}","${a.checkOutTime || '-'}","${a.status}",${a.lat || ''},${a.lng || ''},${a.verified ? 'VERIFIED' : 'FAILED'},${a.distanceMetres?.toFixed(1) || ''}\n`;
    });
    exportToCSVFile(csv, "SSMS_Teacher_GPS_Attendance_Report.csv");
    DB.addAudit('Spreadsheet Report Export', `Downloaded Teacher Attendance ledger logs`, 'Headmaster');
  };

  // Search validations
  const filteredTeachers = teachers.filter(t =>
    t.fullName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.teacherNumber.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.specialization.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const filteredStudents = students.filter(s => {
    const matchesKeyword = s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = studentClassFilter ? s.classId === studentClassFilter : true;
    return matchesKeyword && matchesClass;
  });

  return (
    <div className="bg-slate-50 min-h-screen flex text-slate-800" id="hm-dashboard-panel">
      {/* Dynamic Alerts notification header banner */}
      {alertSuccess && (
        <div className="bg-emerald-600 text-white font-semibold text-center text-xs py-2 shadow-md animate-fade-in-down fixed top-0 left-0 right-0 z-50" id="hm-temporary-alert">
          🔥  {alertSuccess}
        </div>
      )}

      {/* FULL DESKTOP SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#1E3A8A] text-white flex flex-col shrink-0 select-none shadow-xl border-r border-indigo-950/20" id="hm-sidebar">
        {/* Sidebar Header Brand */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#38BDF8] text-blue-900 flex items-center justify-center font-black text-base shadow-md">
            HM
          </div>
          <div className="truncate">
            <h2 className="text-xs font-bold leading-tight uppercase tracking-wider text-sky-200">ERP Workspace</h2>
            <span className="text-[10px] text-slate-300 font-medium block truncate leading-none mt-1">
              {settings.schoolName || 'Arusha Campus'}
            </span>
          </div>
        </div>

        {/* Dynamic Nav Tabs List */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'kpis', label: t.dashboard, icon: TrendingUp },
            { id: 'teachers', label: t.manageTeachers, icon: Users, badge: pendingTeachers.length },
            { id: 'classes', label: t.manageClasses, icon: Layers },
            { id: 'students', label: t.manageStudents, icon: Layers },
            { id: 'announcements', label: t.announcements, icon: Volume2 },
            { id: 'reports', label: t.reports, icon: FileText },
            { id: 'settings', label: t.settings, icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedTeacherId(null);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSel
                    ? 'bg-[#38BDF8] text-slate-950 shadow-md animate-fade-in'
                    : 'text-slate-100 hover:bg-white/10'
                }`}
                id={`hm-tab-link-${tab.id}`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </div>
                
                {!!tab.badge && (
                  <span className="bg-red-500 text-white text-[10px] h-4.5 min-w-4.5 px-1.5 flex items-center justify-center rounded-full font-mono font-bold animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Safe Logout area inside the sidebar */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <button 
            onClick={() => {
              DB.clearSession();
              window.location.hash = '';
              window.location.reload();
            }}
            className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out Workspace</span>
          </button>
        </div>
      </aside>

      {/* Main Content viewport */}
      <main className="flex-1 overflow-y-auto p-8 relative flex flex-col" id="hm-content-container">
        
        {/* Dynamic main header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#1E3A8A] tracking-widest block font-mono animate-pulse">
              ★ {lang === 'en' ? 'Verified Workspace Portal' : 'Lango la Kazi Lililohakikiwa'}
            </span>
            <h1 className="text-xl font-black text-slate-900 uppercase mt-1">
              {activeTab === 'kpis' && (lang === 'en' ? 'School Dashboard Analytics' : 'Kipimo cha Uchambuzi')}
              {activeTab === 'teachers' && (lang === 'en' ? 'Staff Registries & Applications' : 'Wasifu wa Walimu')}
              {activeTab === 'classes' && (lang === 'en' ? 'Academic Classrooms & Streams' : 'Madarasa na Masomo')}
              {activeTab === 'students' && (lang === 'en' ? 'Scholars Enrollment Office' : 'Kusajili Wanafunzi')}
              {activeTab === 'announcements' && (lang === 'en' ? 'Global Campus Broadcasting' : 'Matangazo ya Shule')}
              {activeTab === 'reports' && (lang === 'en' ? 'Administrative Spreadsheet Hub' : 'Tovuti ya Excel Ripoti')}
              {activeTab === 'settings' && (t.settings)}
            </h1>
          </div>
        </header>

        {/* Dashboard Panels rendering */}
        <div className="flex-1">

        {/* TAB 1: EXECUTIVE KPIs SUMMARY PANEL */}
        {activeTab === 'kpis' && (
          <div className="space-y-8" id="hm-kpi-tab-panel">
            {/* Realtime dynamic KPI values widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              {/* Stat Card 1: Students present overview */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.totalStudents}</span>
                    <strong className="text-3xl font-extrabold tracking-tight text-slate-900 block mt-1">{totalStudentsCount}</strong>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="border-t border-slate-50 mt-4 pt-3 flex items-center justify-between text-xxs font-semibold">
                  <span className="text-emerald-700">{presentStudentsToday} {t.active}</span>
                  <span className="text-slate-400 font-mono">Today: {todayStr}</span>
                </div>
              </div>

              {/* Stat Card 2: Student Absentees */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.absentStudents}</span>
                    <strong className="text-3xl font-extrabold tracking-tight text-red-650 block mt-1">{absentStudentsToday}</strong>
                  </div>
                  <div className="bg-red-50 text-red-600 p-2.5 rounded-xl">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="border-t border-slate-50 mt-4 pt-3 flex items-center justify-between text-xxs font-semibold">
                  <span className="text-red-600">{lateStudentsToday} {t.late}</span>
                  <span className="text-slate-400">Absence Rate: {totalStudentsCount > 0 ? Math.round((absentStudentsToday / totalStudentsCount) * 100) : 0}%</span>
                </div>
              </div>

              {/* Stat Card 3: Teachers Active KPI */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.totalTeachers}</span>
                    <strong className="text-3xl font-extrabold tracking-tight text-slate-900 block mt-1">{totalTeachersCount}</strong>
                  </div>
                  <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="border-t border-slate-50 mt-4 pt-3 flex items-center justify-between text-xxs font-semibold">
                  <span className="text-indigo-700">{presentTeachersToday} {t.active} Today</span>
                  <span className="text-slate-400 font-mono">Present</span>
                </div>
              </div>

              {/* Stat Card 4: Teacher check-in parameters */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.lateTeachers}</span>
                    <strong className="text-3xl font-extrabold tracking-tight text-amber-600 block mt-1">{lateTeachersToday}</strong>
                  </div>
                  <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <div className="border-t border-slate-50 mt-4 pt-3 flex items-center justify-between text-xxs font-semibold">
                  <span className="text-amber-700">{absentTeachersToday} {t.absent}</span>
                  <span className="text-slate-400">Deadline: {settings.checkInDeadline} AM</span>
                </div>
              </div>
            </div>

            {/* BENTO LAYOUT GRIDS: CLASS RANKINGS & PENDING TEACHER VERIFICATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Box A: Classroom averages benchmarks */}
              <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
                    <span>{t.topClasses}</span>
                  </h4>
                  <span className="text-xxs font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                    School rankings
                  </span>
                </div>

                {topClassesRanks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium">
                    {t.noRecords}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topClassesRanks.map((cls, idx) => (
                      <div key={cls.id} className="flex items-center gap-3">
                        <span className={`h-6.5 w-6.5 rounded-full font-mono text-center flex items-center justify-center font-bold text-xs ${
                          idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-gray-800 mb-1">
                            <span>{cls.className}</span>
                            <span>{cls.average}% {lang === 'en' ? 'Avg' : 'Wastani'}</span>
                          </div>
                          {/* Visual progress bar */}
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                cls.average >= 75 ? 'bg-emerald-500' : cls.average >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${cls.average}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Box B: Fast Teacher Verification Workflow Queue */}
              <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="h-4.5 w-4.5 text-orange-600" />
                    <span>{lang === 'en' ? 'Teachers Pending Approval' : 'Maombi Mapya ya Walimu'}</span>
                  </h4>
                  <span className="text-xxs font-mono bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-full">
                    {pendingTeachers.length} {lang === 'en' ? 'Awaiting' : 'Yanasubiri'}
                  </span>
                </div>

                {pendingTeachers.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium leading-relaxed">
                    🎉 {lang === 'en' ? 'All teacher registrations have been processed!' : 'Maombi yote ya usajili wa walimu yamekamilishwa!'}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[310px] overflow-y-auto pr-1">
                    {pendingTeachers.map(tr => (
                      <div key={tr.id} className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                        <div>
                          <p className="text-xs font-bold text-slate-850">{tr.fullName}</p>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            No: <b>{tr.teacherNumber}</b> • {tr.qualification} • Specialization: <b>{tr.specialization}</b>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button
                            onClick={() => handleRejectTeacher(tr.id)}
                            className="px-2.5 py-1 text-[10px] font-bold text-red-700 bg-white border border-red-200 hover:bg-red-100 hover:border-red-300 rounded-lg transition-colors cursor-pointer"
                          >
                            {t.reject}
                          </button>
                          <button
                            onClick={() => handleApproveTeacher(tr.id)}
                            className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 hover:border-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            {t.approve}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE TEACHERS PANEL */}
        {activeTab === 'teachers' && (
          <div className="space-y-6" id="hm-teachers-panel">
            {/* Upper Action search row */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder={lang === 'en' ? 'Search teachers by name, number, specialization...' : 'Tafuta walimu kwa majina, specialization...'}
                  value={teacherSearch}
                  onChange={e => setTeacherSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-1.5 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl"
                  id="teacher-search-field"
                />
              </div>

              {selectedTeacherId && (
                <button
                  onClick={() => setSelectedTeacherId(null)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-black bg-slate-100 rounded-lg cursor-pointer"
                >
                  {lang === 'en' ? 'Close Assignment Form' : 'Funga Alama'}
                </button>
              )}
            </div>

            {/* SPLIT SCREEN LAYOUT IF TEACHER IS SELECTED FOR SUBJECT BINDING */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Column 1 & 2: Interactive Teachers Ledger Table */}
              <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden lg:col-span-2">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'en' ? 'Staff Members ledger' : 'Orodha ya Walimu'}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-xs">
                    <thead className="bg-slate-50/70 text-slate-550 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3 text-left">Staff Name</th>
                        <th className="px-4 py-3 text-left">Phone & Email</th>
                        <th className="px-4 py-3 text-left">Assigned Load</th>
                        <th className="px-4 py-3 text-left">Scope Roles</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {filteredTeachers.map(tr => {
                        const isClassT = classes.find(c => c.id === tr.isClassTeacherOf);
                        return (
                          <tr key={tr.id} className={`hover:bg-slate-50/50 transition-colors ${selectedTeacherId === tr.id ? 'bg-emerald-50/40' : ''}`}>
                            <td className="px-4 py-4.5 whitespace-nowrap">
                              <p className="font-bold text-slate-900">{tr.fullName}</p>
                              <span className="text-[10px] text-slate-405 block mt-0.5">No: <b>{tr.teacherNumber}</b></span>
                              <span className="text-[10px] text-indigo-700 italic">{tr.qualification}</span>
                            </td>
                            <td className="px-4 py-4.5">
                              <p className="font-semibold">{tr.phone}</p>
                              <span className="text-[10px] text-slate-400 block">{tr.email}</span>
                            </td>
                            <td className="px-4 py-4.5 max-w-[200px]">
                              {/* Subject load labels */}
                              <div className="flex flex-wrap gap-1 mb-1">
                                {tr.assignedSubjectIds.map(sid => {
                                  const sub = subjects.find(s => s.id === sid);
                                  return (
                                    <span key={sid} className="bg-emerald-50 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-1 shrink-0">
                                      <span>{sub ? sub.name : sid}</span>
                                      <button
                                        onClick={() => handleRemoveSubjectFromTeacher(tr.id, sid)}
                                        className="hover:bg-emerald-200/50 p-0.5 rounded text-red-600 font-bold"
                                        title="Revoke subject"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                })}
                                {tr.assignedSubjectIds.length === 0 && (
                                  <span className="text-gray-400 italic text-[10px]">{lang === 'en' ? 'No subjects' : 'Somo halipo'}</span>
                                )}
                              </div>
                              {/* Class load labels */}
                              <div className="flex flex-wrap gap-1">
                                {tr.assignedClassIds.map(cid => {
                                  const cls = classes.find(c => c.id === cid);
                                  return (
                                    <span key={cid} className="bg-indigo-50 text-indigo-800 text-[9px] px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-1 shrink-0">
                                      <span>{cls ? `${cls.name} ${cls.stream}` : cid}</span>
                                      <button
                                        onClick={() => handleRemoveClassFromTeacher(tr.id, cid)}
                                        className="hover:bg-indigo-200/50 p-0.5 rounded text-red-600 font-bold"
                                        title="Revoke class"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-4.5 whitespace-nowrap">
                              {isClassT ? (
                                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full select-none">
                                  {lang === 'en' ? 'Class Teacher' : 'Mwl wa Darasa'}: {isClassT.name} {isClassT.stream}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">Subject Teacher</span>
                              )}
                            </td>
                            <td className="px-4 py-4.5 text-center whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                tr.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : tr.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {tr.status === 'ACTIVE' ? t.active : tr.status === 'PENDING' ? t.pending : t.rejected}
                              </span>
                            </td>
                            <td className="px-4 py-4.5 text-right whitespace-nowrap">
                              {tr.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => setSelectedTeacherId(tr.id)}
                                  className="px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer flex items-center gap-1 inline-flex shadow-xs"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>{lang === 'en' ? 'Configure Load' : 'Rekebisha'}</span>
                                </button>
                              ) : tr.status === 'PENDING' ? (
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={() => handleRejectTeacher(tr.id)}
                                    className="p-1 hover:bg-red-50 text-red-600 rounded"
                                    title={t.reject}
                                  >
                                    ×
                                  </button>
                                  <button
                                    onClick={() => handleApproveTeacher(tr.id)}
                                    className="p-1 hover:bg-emerald-50 text-emerald-600 rounded font-bold"
                                    title={t.approve}
                                  >
                                    ✓
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Column 3: Active Class Role Assignment forms */}
              <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs">
                {selectedTeacherId ? (
                  (() => {
                    const matchedTr = teachers.find(t => t.id === selectedTeacherId);
                    if (!matchedTr) return null;
                    return (
                      <form onSubmit={handleAssignTeacherScope} className="space-y-5" id="assign-teacher-form">
                        <div className="pb-3 border-b border-slate-100">
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-tight block">
                            Assign teaching Load
                          </h4>
                          <strong className="text-sm font-extrabold text-slate-900 block mt-1">
                            {matchedTr.fullName} ({matchedTr.teacherNumber})
                          </strong>
                        </div>

                        {/* Assign subject list */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Assign Academics subject
                          </label>
                          <select
                            value={assignSubjectId}
                            onChange={e => setAssignSubjectId(e.target.value)}
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                            id="assign-subject-dropdown"
                          >
                            <option value="">{lang === 'en' ? '-- Select Subject --' : '-- Chagua Somo --'}</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                          </select>
                        </div>

                        {/* Assign Class stream load */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Assign Class level load
                          </label>
                          <select
                            value={assignClassId}
                            onChange={e => setAssignClassId(e.target.value)}
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                            id="assign-class-dropdown"
                          >
                            <option value="">{lang === 'en' ? '-- Select Class --' : '-- Chagua Darasa --'}</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.id}>{c.name} {c.stream}</option>
                            ))}
                          </select>
                        </div>

                        {/* Assign Class Teacher status */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Appoint as official "Class Teacher"
                          </label>
                          <select
                            value={assignIsClassTeacherOf}
                            onChange={e => setAssignIsClassTeacherOf(e.target.value)}
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                            id="assign-class-teacher-role"
                          >
                            <option value="">{lang === 'en' ? '-- Leave unchanged --' : '-- Usibadilishe --'}</option>
                            <option value="NONE">{lang === 'en' ? 'None (Subject Teacher only)' : 'Hakuna'}</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.id}>{c.name} {c.stream}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded-xl cursor-pointer"
                        >
                          {lang === 'en' ? 'Submit Loading Matrix' : 'Wasilisha Matokeo'}
                        </button>
                      </form>
                    );
                  })()
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <HelpCircle className="h-8 w-8 text-slate-350 mb-2" />
                    <p className="text-xs font-semibold leading-relaxed">
                      {lang === 'en' ? 'Select any active staff member to configure their academic teaching subjects, class scopes and class teacher roles.' : 'Chagua mwalimu mmoja mmoja kurekebisha masomo anayofundisha au darasa lake.'}
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: CLASSES & SUBJECTS SETUP */}
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="hm-classes-panel">
            
            {/* Left box: Classes and streams */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {lang === 'en' ? 'School Classes & Streams' : 'Madarasa na Mikondo'}
                </h4>
              </div>

              {/* Class insertion form */}
              <form onSubmit={handleCreateClass} className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="create-class-form">
                <input
                  type="text"
                  required
                  placeholder="e.g. Form 1, Class 6"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1.5 focus:ring-emerald-500/20"
                  id="new-class-name-input"
                />
                <input
                  type="text"
                  required
                  placeholder="Stream (A, B, C)"
                  value={newClassStream}
                  onChange={e => setNewClassStream(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1.5 focus:ring-emerald-500/20"
                  id="new-class-stream-input"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  id="submit-new-class"
                >
                  {t.add} Class
                </button>
              </form>

              {/* Classes lists */}
              <div className="space-y-3">
                {classes.map(cls => {
                  const classTeacher = teachers.find(t => t.id === cls.classTeacherId);
                  return (
                    <div key={cls.id} className="p-3.5 bg-slate-50 border border-slate-100/80 rounded-xl flex items-center justify-between">
                      <div>
                        <strong className="text-sm text-slate-900 font-extrabold">{cls.name}</strong> • Stream: <span className="font-bold text-indigo-700 text-xs">{cls.stream}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {t.classTeacher}: {classTeacher ? <b className="text-slate-700">{classTeacher.fullName}</b> : <span className="italic">Unassigned</span>}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                        ID: {cls.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right box: Subjects configuration */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {lang === 'en' ? 'Academic Subjects registry' : 'Orodha ya Masomo ya Kitaaluma'}
                </h4>
              </div>

              {/* Subject registration form */}
              <form onSubmit={handleCreateSubject} className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="create-subject-form">
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1.5 focus:ring-emerald-500/20"
                  id="new-subject-name-input"
                />
                <input
                  type="text"
                  required
                  placeholder="Code (MATH101)"
                  value={newSubjectCode}
                  onChange={e => setNewSubjectCode(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1.5 focus:ring-emerald-500/20"
                  id="new-subject-code-input"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  id="submit-new-subject"
                >
                  {t.add} Course
                </button>
              </form>

              {/* Subjects List */}
              <div className="space-y-3">
                {subjects.map(s => (
                  <div key={s.id} className="p-3.5 bg-slate-50 border border-slate-100/80 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="text-sm text-slate-900 font-extrabold">{s.name}</strong>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Course Code Identifier: <b className="font-mono text-indigo-700">{s.code}</b>
                      </p>
                    </div>
                    <span className="text-[10.5px] font-mono bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                      {s.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: STUDENTS MODULE */}
        {activeTab === 'students' && (
          <div className="space-y-6" id="hm-students-panel">
            
            {/* Student action card layout split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Box 1: Create Student Profile Form */}
              <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs self-start">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                    {lang === 'en' ? 'Admission Registry' : 'Kushajili Mwanafunzi Mpya'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Students do not have user logins. Registered entries automatically generate unique parent codes.
                  </p>
                </div>

                <form onSubmit={handleCreateStudent} className="space-y-4" id="create-student-form">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Joseph"
                      value={newStudentName}
                      onChange={e => setNewStudentName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      id="student-name-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Gender
                      </label>
                      <select
                        value={newStudentGender}
                        onChange={e => setNewStudentGender(e.target.value as any)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                        id="student-gender-select"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        required
                        value={newStudentDOB}
                        onChange={e => setNewStudentDOB(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                        id="student-dob-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Class Scope
                      </label>
                      <select
                        required
                        value={newStudentClass}
                        onChange={e => setNewStudentClass(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                        id="student-class-select"
                      >
                        <option value="">-- Choose Class --</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.stream}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Parent Mobile
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0712345678"
                        value={newStudentParentPhone}
                        onChange={e => setNewStudentParentPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        id="student-parent-phone-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded-xl cursor-pointer"
                    id="submit-student-btn"
                  >
                    Admit New scholar
                  </button>
                </form>
              </div>

              {/* Box 2 & 3: Master Student ledger table and claim parameters summaries */}
              <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden lg:col-span-2">
                <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'en' ? 'Search Scholars listing' : 'Kutafuta na kusajili wanafunzi'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search name or Admission..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg max-w-[150px]"
                      id="scholars-table-search"
                    />
                    <select
                      value={studentClassFilter}
                      onChange={e => setStudentClassFilter(e.target.value)}
                      className="text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg max-w-[120px]"
                      id="scholars-table-class-filter"
                    >
                      <option value="">All Classes</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.stream}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-xs">
                    <thead className="bg-slate-50/70 text-slate-550 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3 text-left">Admission Number</th>
                        <th className="px-4 py-3 text-left">Legal Name</th>
                        <th className="px-4 py-3 text-left">Class Scope</th>
                        <th className="px-4 py-3 text-left font-mono">Parent Code (Claim token)</th>
                        <th className="px-4 py-3 text-left">Parent Verified</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {filteredStudents.map(std => {
                        const clsObj = classes.find(c => c.id === std.classId);
                        return (
                          <tr key={std.id} className="hover:bg-slate-50/40">
                            <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-slate-800">
                              {std.admissionNumber}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900">
                              {std.fullName}
                              <span className="text-[10px] text-slate-400 block font-normal">{std.gender} • DOB: {std.dateOfBirth}</span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap font-semibold">
                              {clsObj ? `${clsObj.name} ${clsObj.stream}` : 'Unmapped'}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold border border-emerald-100 select-all">
                                {std.parentCode}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {std.parentId ? (
                                <span className="bg-blue-100 text-blue-800 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                                  ✓ Connected
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">Unconnected</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-right">
                              <button
                                onClick={() => handleDeleteStudent(std.id)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                title="Remove scholar"
                              >
                                <Trash2 className="h-4 w-4 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-xs text-slate-400 font-medium">
                            {t.noRecords}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 5: BROADCAST ANNOUNCEMENTS CODES */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="hm-announcements-panel">
            
            {/* Announcement form columns */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs self-start">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                  {lang === 'en' ? 'Launch Announcement' : 'Chapisha Tangazo Jipya'}
                </h4>
                <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                  Provide localized English and Kiswahili templates. System automatically triggers real-time alerts to linked Parents and active Instructors.
                </p>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4" id="announcement-form">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    English Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. End of term sports festival"
                    value={newAnnTitleEn}
                    onChange={e => setNewAnnTitleEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Kiswahili Title (Swahili)
                  </label>
                  <input
                    type="text"
                    placeholder="Mfano: Sherehe za michezo za mwisho wa muhula"
                    value={newAnnTitleSw}
                    onChange={e => setNewAnnTitleSw(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    English Announcement Content
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Type details in English..."
                    value={newAnnContentEn}
                    onChange={e => setNewAnnContentEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Kiswahili Content (Swahili)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Andika kwa ufasaha wa Kiswahili..."
                    value={newAnnContentSw}
                    onChange={e => setNewAnnContentSw(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-xl cursor-pointer"
                >
                  Broadcast Circular
                </button>
              </form>
            </div>

            {/* List of active board circulars */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl lg:col-span-2 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active school circular bulletins
                </h3>
              </div>

              {announcements.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 italic">
                  {t.noRecords}
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {announcements.map(ann => (
                    <div key={ann.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:border-slate-200 transition-all relative">
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="absolute top-4 right-4 text-slate-350 hover:text-red-650 cursor-pointer p-1"
                        title="Remove Broadcast"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>

                      <div className="text-xxs text-slate-405 font-semibold font-mono mb-2">
                        📅 Post Date: {ann.date} • Published by Administrative Desk
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* English scope description */}
                        <div className="p-3 bg-white border border-slate-100 rounded-xl">
                          <span className="text-[9px] font-semibold tracking-wider uppercase text-emerald-700 block mb-1">English Desk</span>
                          <strong className="text-xs font-bold text-slate-900 block">{ann.titleEn}</strong>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ann.contentEn}</p>
                        </div>

                        {/* Swahili scope description */}
                        <div className="p-3 bg-white border border-slate-100 rounded-xl">
                          <span className="text-[9px] font-semibold tracking-wider uppercase text-indigo-700 block mb-1">Kiswahili Desk</span>
                          <strong className="text-xs font-bold text-slate-900 block">{ann.titleSw}</strong>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ann.contentSw}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 6: REPORTS & SPREADSHEETS HUB */}
        {activeTab === 'reports' && (
          <div className="space-y-8" id="hm-reports-panel">
            {/* Analytical dashboard summary headers */}
            <div className="bg-white border border-slate-150 p-6 rounded-3xl max-w-4xl">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-650" />
                <span>School administrative reporting & analytics dashboard</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Export real-time generated academic logs, personnel tracking metrics, student registrations and grade distributions. System outputs clean standards spreadsheets (Excel CSV) and dynamically structured PDF formatting templates.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
              
              {/* Report 1: Student Register */}
              <div className="bg-white border border-slate-100/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                <div>
                  <div className="bg-emerald-50 text-emerald-700 h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm mb-3">
                    ST
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Scholars Register Ledger
                  </h4>
                  <p className="text-xxs text-slate-400 mt-1 leading-normal">
                    Includes Full Legal Names, Admission ID sequences, Gender stats, current linked Classroom levels, Streams, and parent code credentials.
                  </p>
                </div>
                <div className="mt-5 space-y-2">
                  <button
                    onClick={handleExportStudents}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xxs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer border border-emerald-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{t.exportExcel}</span>
                  </button>
                </div>
              </div>

              {/* Report 2: School Academic Grades & Performance charts sheet */}
              <div className="bg-white border border-slate-100/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                <div>
                  <div className="bg-indigo-50 text-indigo-700 h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm mb-3">
                    AC
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Subjects Score matrices
                  </h4>
                  <p className="text-xxs text-slate-400 mt-1 leading-normal">
                    Contains master grading indices, subject percentage ranks, positional weightings, quiz components and final examination records.
                  </p>
                </div>
                <div className="mt-5 space-y-2">
                  <button
                    onClick={handleExportPerformance}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xxs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer border border-indigo-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{t.exportExcel}</span>
                  </button>
                </div>
              </div>

              {/* Report 3: Instructors Geofence metrics */}
              <div className="bg-white border border-slate-100/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                <div>
                  <div className="bg-amber-50 text-amber-700 h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm mb-3">
                    ST
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    GPS Attendance Log files
                  </h4>
                  <p className="text-xxs text-slate-400 mt-1 leading-normal">
                    Daily Check-In/Out summaries, timestamps, verified school distance errors, physical sign-in longitude mappings, and tardiness flags.
                  </p>
                </div>
                <div className="mt-5 space-y-2">
                  <button
                    onClick={handleExportTeacherAttendance}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xxs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all cursor-pointer border border-amber-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{t.exportExcel}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS & ACTIVE AUDIT SECURE LOGS */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="hm-settings-panel">
            
            {/* Left Col: School identity and GPS Geofencing boundaries setting form */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs self-start space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  {t.geofenceSettings}
                </h4>
                <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                  Teachers must be physically located inside the defined allowed school radius meters to check-in. Late threshold times apply automatically.
                </p>
              </div>

              <form onSubmit={handleSaveGPSSettings} className="space-y-4" id="school-gps-config-form">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    School Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={setSchoolName}
                    onChange={e => setSetSchoolName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>

                {/* Institutional Level and Regulatory Category (Rule 1 & Rule 2) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Institutional Level
                    </label>
                    <select
                      value={schLevel}
                      onChange={e => setSchLevel(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden"
                    >
                      <option value="Primary">Primary (Msingi)</option>
                      <option value="Secondary">Secondary (Sekondari)</option>
                      <option value="Combined">Combined (Mseto)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Regulatory Type
                    </label>
                    <select
                      value={schCategory}
                      onChange={e => setSchCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden"
                    >
                      <option value="Private">Private (Binafsi)</option>
                      <option value="Government">Government (Serikali)</option>
                    </select>
                  </div>
                </div>

                {/* Optional Contributions policies (Rule 2) */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-700 uppercase">
                      Optional Contributions
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={optionalContributionsEnabled}
                        onChange={e => setOptionalContributionsEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all"></div>
                    </label>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal font-medium">
                    {lang === 'en' 
                      ? 'Allows optional contributions for parent-initiated school projects (crucial for Government schools where formal academic tuition fees are hidden).' 
                      : 'Huruhusu michango ya hiari kwa miradi ya shule (muhimu kwa shule za Serikali ambazo ada rasmi za muhula hazitozwi).'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Center {t.latitude}
                    </label>
                    <input
                      type="number"
                      step="0.0000001"
                      required
                      value={setSchoolLat}
                      onChange={e => setSetSchoolLat(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Center {t.longitude}
                    </label>
                    <input
                      type="number"
                      step="0.0000001"
                      required
                      value={setSchoolLng}
                      onChange={e => setSetSchoolLng(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Allowed Radius (Meters)
                    </label>
                    <input
                      type="number"
                      required
                      value={setSchoolRadius}
                      onChange={e => setSetSchoolRadius(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Daily Check-In Deadline
                    </label>
                    <input
                      type="time"
                      required
                      value={setSchoolDeadline}
                      onChange={e => setSetSchoolDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded-xl cursor-pointer"
                >
                  {t.save}
                </button>
              </form>

              {/* Help reference center coordinate definitions info card */}
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xxs leading-relaxed text-blue-900 space-y-1 select-none">
                <span className="font-bold flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-blue-700" />
                  <span>GPS Coordinate Presets Guidance:</span>
                </span>
                <p>
                  1. Current default school location: <b>-3.3869, 36.6829</b> (e.g. Arusha/Kilimanjaro zone).<br />
                  2. Teacher portals allow them to simulate their physical mock positions as "Inside School Point" (yielding 0m error, checking-in On-Time/Late depending on local clocks) or "Far Off-Campus" to fail radius constraints.
                </p>
              </div>
            </div>

            {/* Right Col: Massive Realtime active Audit Logs tables */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl lg:col-span-2 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Real-Time Security Incident Audit ledger</span>
                </h3>
                <span className="text-xxs font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                  {auditLogs.length} Entries
                </span>
              </div>

              <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl text-xs space-y-1 hover:bg-slate-100/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-400 font-semibold font-mono">
                      <span>🕒 Time: {new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})</span>
                      <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">Log ID: {log.id}</span>
                    </div>
                    <div className="font-bold text-slate-850 flex items-center gap-1">
                      <span className="text-emerald-700 font-extrabold">[{log.action}]</span>
                      <span>- {log.details}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 block leading-tight">
                      Actor Context: <b className="text-indigo-805 select-all">{log.user}</b> • Simulated Node IP: <code className="bg-gray-100 px-1 rounded">{log.ipAddress}</code> • Client Agent: <span className="italic">{log.browser}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        </div>
      </main>
    </div>
  );
}
