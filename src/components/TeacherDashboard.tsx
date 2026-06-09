/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS } from '../translations';
import { DB, calculateDistance, getGradeAndPoints } from '../db';
import { Teacher, Student, Class, Subject, AcademicMark, TimetableEntry, Assignment, TeacherComment } from '../types';
import {
  MapPin,
  Clock,
  Navigation,
  Compass,
  CheckCircle,
  FileSpreadsheet,
  BookOpen,
  Calendar,
  AlertOctagon,
  FileText,
  Upload,
  MessageSquare,
  HelpCircle,
  Award,
  ChevronRight,
  TrendingUp,
  Sliders,
  Send,
  LogOut,
  Check,
  UserCheck,
  AlertTriangle,
  User,
  Layers,
  Shield,
  Settings,
  Home,
  Bell,
  Users
} from 'lucide-react';

interface TeacherProps {
  lang: 'en' | 'sw';
  setLang: (lang: 'en' | 'sw') => void;
  teacherId: string;
  onLogout?: () => void;
}

export default function TeacherDashboard({ lang, setLang, teacherId, onLogout }: TeacherProps) {
  const t = TRANSLATIONS[lang];

  // Database dynamic listings
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [marks, setMarks] = useState<AcademicMark[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [comments, setComments] = useState<TeacherComment[]>([]);
  const [settings, setSettings] = useState(DB.getSettings());

  // GPS Simulation variables
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [isInsideMock, setIsInsideMock] = useState<boolean | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  // Active Gradebook selectors
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  // Scoring Editor Forms
  const [scoringStudentId, setScoringStudentId] = useState<string | null>(null);
  const [markType, setMarkType] = useState<'QUIZ' | 'TEST' | 'ASSIGNMENT' | 'MIDTERM' | 'FINAL'>('QUIZ');
  const [obtainedMarks, setObtainedMarks] = useState(0);
  const [totalMarksBound, setTotalMarksBound] = useState(100);

  // Assignment post
  const [asgTitle, setAsgTitle] = useState('');
  const [asgClass, setAsgClass] = useState('');
  const [asgSubject, setAsgSubject] = useState('');
  const [asgDate, setAsgDate] = useState('2026-06-15');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgFile, setAsgFile] = useState<string | null>(null);

  // Comments state
  const [commentStudent, setCommentStudent] = useState('');
  const [commentText, setCommentText] = useState('');

  // Active Sub Tab
  const [activeSubTab, setActiveSubTab] = useState<'home' | 'students' | 'exams' | 'attendance' | 'profile'>('home');
  const [examSubTab, setExamSubTab] = useState<'marks' | 'assignments' | 'comments'>('marks');

  // Load database state
  const reloadTeacherState = () => {
    const list = DB.getTeachers();
    const matched = list.find(x => x.id === teacherId);
    if (matched) {
      setCurrentTeacher(matched);
      const activeSchId = matched.schoolId || 'SCH-001';
      
      setClasses(DB.getClasses().filter(c => (c.schoolId || 'SCH-001') === activeSchId));
      setSubjects(DB.getSubjects().filter(sub => (sub.schoolId || 'SCH-001') === activeSchId));
      setStudents(DB.getStudents().filter(s => (s.schoolId || 'SCH-001') === activeSchId));
      setTimetable(DB.getTimetable().filter(tt => tt.teacherId === teacherId));
      setMarks(DB.getMarks().filter(m => (m.schoolId || 'SCH-001') === activeSchId));
      setAssignments(DB.getAssignments().filter(a => a.uploadedBy === teacherId));
      setComments(DB.getComments().filter(c => c.teacherId === teacherId));
      
      const currentSettings = DB.getSettings();
      setSettings(currentSettings);

      // Verify today check in state of this teacher
      const today = '2026-06-08';
      const attLog = DB.getTeacherAttendance().find(a => a.teacherId === teacherId && a.date === today);
      setTodayAttendance(attLog || null);
    }
  };

  useEffect(() => {
    reloadTeacherState();
    window.addEventListener('ssms_db_update', reloadTeacherState);
    return () => window.removeEventListener('ssms_db_update', reloadTeacherState);
  }, [teacherId]);

  // GPS GEOMETRY VERIFICATIONS & ATTENDANCE RECORDING
  const handleSimulateGPSCoors = (onCampus: boolean) => {
    setGpsErrorMsg('');
    setGpsSuccessMsg('');
    setIsInsideMock(onCampus);

    if (onCampus) {
      // Simulate exact coordinates within 2 meters of school center center
      setUserLat(settings.latitude - 0.00001);
      setUserLng(settings.longitude + 0.00001);
      setGpsSuccessMsg(lang === 'en' ? 'Mock coordinate populated within range!' : 'Eneo la kufikirika lipo ndani ya ukomo wa Shule!');
    } else {
      // Simulate location over 850 meters far off in town
      setUserLat(settings.latitude + 0.005);
      setUserLng(settings.longitude - 0.005);
      setGpsErrorMsg(lang === 'en' ? 'Mock coordinates initialized 850m away from campus.' : 'Uko kilomita 0.85 mbali na Shule.');
    }
  };

  const handlePerformCheckIn = () => {
    setGpsErrorMsg('');
    setGpsSuccessMsg('');

    if (userLat === null || userLng === null) {
      setGpsErrorMsg(lang === 'en' ? 'Kindly select/verify GPS coordinate first.' : 'Tafadhali simulisha eneo lako la GPS kwanza.');
      return;
    }

    const dist = calculateDistance(userLat, userLng, settings.latitude, settings.longitude);

    if (dist > settings.allowedRadiusMeters) {
      setGpsErrorMsg(
        lang === 'en'
          ? `Access Denied! Distance: ${dist.toFixed(1)}m. You must be inside the allowed ${settings.allowedRadiusMeters}m geofence radius.`
          : `Kataa! Umbali wako ni mita ${dist.toFixed(1)}. Lazima uwe ndani ya ukomo wa mita ${settings.allowedRadiusMeters} za shule.`
      );
      DB.addAudit(
        'Teacher Check-In Refused',
        `Teacher check-in rejected due to distance violation (${dist.toFixed(1)} metres away).`,
        currentTeacher?.fullName || 'Teacher'
      );
      return;
    }

    // Process check-in time and check late/on-time status
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const today = '2026-06-08';

    // Parse check in deadline e.g., "07:30"
    const [dlH, dlM] = settings.checkInDeadline.split(':').map(Number);
    const deadlineVal = dlH * 60 + dlM;
    const currentVal = now.getHours() * 60 + now.getMinutes();

    let checkInStatus: 'ON_TIME' | 'LATE' = 'ON_TIME';
    if (currentVal > deadlineVal) {
      checkInStatus = 'LATE';
    }

    const list = DB.getTeacherAttendance();
    const newLog = {
      id: 'TA-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      teacherId: teacherId,
      date: today,
      checkInTime: timeStr,
      checkOutTime: null,
      status: checkInStatus,
      lat: userLat,
      lng: userLng,
      verified: true,
      distanceMetres: dist,
    };

    list.push(newLog);
    DB.saveTeacherAttendance(list);

    DB.addAudit(
      'Teacher Attendance Check-In',
      `Teacher signed in successfully. Distance error: ${dist.toFixed(1)}m. Status: ${checkInStatus}`,
      currentTeacher?.fullName || 'Teacher'
    );

    setGpsSuccessMsg(
      lang === 'en'
        ? `Check-In successful! Registered Status: ${checkInStatus === 'ON_TIME' ? 'On Time' : 'Late'}`
        : `Check-In imefanikiwa! Hali: ${checkInStatus === 'ON_TIME' ? 'Kwa Wakati' : 'Umechelewa'}`
    );
  };

  const handlePerformCheckOut = () => {
    if (!todayAttendance) {
      setGpsErrorMsg('Cannot check out without check-in log.');
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const today = '2026-06-08';

    const list = DB.getTeacherAttendance();
    const idx = list.findIndex(a => a.teacherId === teacherId && a.date === today);
    if (idx !== -1) {
      list[idx].checkOutTime = timeStr;
      list[idx].status = 'CHECKED_OUT';
      DB.saveTeacherAttendance(list);

      DB.addAudit(
        'Teacher Attendance Check-Out',
        `Teacher checked out safely at ${timeStr}.`,
        currentTeacher?.fullName || 'Teacher'
      );

      setGpsSuccessMsg(lang === 'en' ? 'Checked-out successfully! Secure session logs updated.' : 'Sajili Kutoka imefanikiwa!');
    }
  };

  // ACADEMICS SCORE REGISTRATIONS & CALCULATION MATRIX
  const handleRegisterMarks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringStudentId || !selectedClassId || !selectedSubjectId) return;

    const list = DB.getMarks();
    
    // Add or rewrite record
    const newGrade: AcademicMark = {
      id: 'M-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      schoolId: currentTeacher?.schoolId || 'SCH-001',
      studentId: scoringStudentId,
      subjectId: selectedSubjectId,
      classId: selectedClassId,
      type: markType,
      totalMarks: Number(totalMarksBound),
      obtainedMarks: Number(obtainedMarks),
      recordedBy: teacherId,
      date: new Date().toISOString().split('T')[0],
    };

    list.push(newGrade);
    DB.saveMarks(list);

    // Dynamic parent notification
    const stud = students.find(s => s.id === scoringStudentId);
    if (stud) {
      DB.addNotification(
        `Academic update: New ${markType} score published for student ${stud.fullName}`,
        `Mabadiliko ya kitaaluma: Malama ya ${markType} yametangazwa kwa mwanafunzi ${stud.fullName}`,
        'PARENT',
        stud.userId ? stud.userId : 'ALL'
      );
    }

    DB.addAudit(
      'Score Entry Register',
      `Marks input for student ID ${scoringStudentId} in subject ${selectedSubjectId}. Score: ${obtainedMarks}/${totalMarksBound}`,
      currentTeacher?.fullName || 'Teacher'
    );

    setGpsSuccessMsg(lang === 'en' ? 'Academic marks recorded!' : 'Alama zimesajiliwa!');
    setScoringStudentId(null);
  };

  // POST HOMEWORK ASSIGNMENT
  const handlePublishAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle || !asgClass || !asgSubject) return;

    const list = DB.getAssignments();
    const newAsg: Assignment = {
      id: 'AS-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      title: asgTitle,
      description: asgDesc,
      classId: asgClass,
      subjectId: asgSubject,
      dueDate: asgDate,
      uploadedBy: teacherId,
      fileName: asgFile || 'Exercises_Sheet.pdf',
    };

    list.push(newAsg);
    DB.saveAssignments(list);

    DB.addNotification(
      `New assignment uploaded: "${asgTitle}"`,
      `Zoezi jipya la darasa limewekwa: "${asgTitle}"`,
      'PARENT'
    );

    DB.addAudit('Class Assignment uploaded', `Teacher posted assignment "${asgTitle}" for class ${asgClass}`, currentTeacher?.fullName || 'Teacher');
    setGpsSuccessMsg(lang === 'en' ? 'Assignment posted!' : 'Zoezi jipya limetangazwa!');

    setAsgTitle('');
    setAsgDesc('');
    setAsgFile(null);
  };

  // POST ACADEMIC REVIEWS
  const handlePublishComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentStudent || !commentText) return;

    const list = DB.getComments();
    const newCom: TeacherComment = {
      id: 'TC-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      studentId: commentStudent,
      teacherId,
      comment: commentText,
      date: new Date().toISOString().split('T')[0],
    };

    list.push(newCom);
    DB.saveComments(list);

    // Audit and notifications
    const activeStudent = students.find(s => s.id === commentStudent);
    DB.addNotification(
      `Teacher comment published for ${activeStudent?.fullName}`,
      `Maoni ya mwalimu yamewekwa kwa ajili ya mwanafunzi ${activeStudent?.fullName}`,
      'PARENT'
    );

    DB.addAudit('Post Academic Review', `Teacher review note appended to profile ${commentStudent}`, currentTeacher?.fullName || 'Teacher');
    setGpsSuccessMsg(lang === 'en' ? 'Review feedback stored!' : 'Maoni yamehifadhiwa ya kitaaluma!');
    
    setCommentStudent('');
    setCommentText('');
  };

  if (!currentTeacher) return null;

  // Find class and subject intersections of this teacher
  const teacherClasses = classes.filter(c => currentTeacher.assignedClassIds.includes(c.id));
  const teacherSubjects = subjects.filter(s => currentTeacher.assignedSubjectIds.includes(s.id));

  // If teacher is Class Teacher, load class student ledger profiles
  const isClassTeacher = currentTeacher.isClassTeacherOf;
  const classLeaderOfObj = classes.find(c => c.id === isClassTeacher);
  const classTeacherStudents = students.filter(s => s.classId === isClassTeacher);

  // Scholars subset matching selected marks filter choices
  const gradebookStudents = students.filter(s => s.classId === selectedClassId);

  // Compute student-specific averages dynamically to show positions
  const computeStudentOverallGradesOfClass = (classId: string, sId: string) => {
    const subsetMarks = marks.filter(m => m.classId === classId && m.studentId === sId);
    let totalScore = 0;
    let earnedScore = 0;
    
    subsetMarks.forEach(m => {
      totalScore += m.totalMarks;
      earnedScore += m.obtainedMarks;
    });

    const percent = totalScore > 0 ? (earnedScore / totalScore) * 100 : 0;
    const g = getGradeAndPoints(percent);

    return {
      percentage: Math.round(percent),
      grade: totalScore > 0 ? g.grade : '-',
      totalEvaluations: subsetMarks.length,
    };
  };

  // Ranking calculation
  const getRankAndPositionInClass = (classId: string, sId: string) => {
    const classScholars = students.filter(s => s.classId === classId);
    const scoresList = classScholars.map(s => {
      const overall = computeStudentOverallGradesOfClass(classId, s.id);
      return { id: s.id, percentage: overall.percentage };
    });
    // Sort in desc
    scoresList.sort((a, b) => b.percentage - a.percentage);
    const index = scoresList.findIndex(elem => elem.id === sId);
    return {
      index: index !== -1 ? index + 1 : '-',
      total: classScholars.length,
    };
  };

  return (
    <div className="bg-slate-950 min-h-screen w-full flex justify-center text-slate-800 antialiased" id="teacher-mobile-main-wrapper">
      
      {/* NATIVE STANDALONE MOBILE VIEWPORT CONTAINER */}
      <div className="w-full max-w-[430px] min-w-[320px] min-h-screen flex flex-col relative overflow-hidden bg-[#F8FAFC]" id="teacher-phone-container">

        {/* Dynamic Alert Banner Notifications floating inside mobile layout */}
        <div className="absolute top-14 left-3 right-3 z-50 pointer-events-none space-y-2">
          {gpsSuccessMsg && (
            <div className="bg-[#22C55E] text-white font-medium text-[10px] sm:text-xs py-2 px-3 rounded-xl shadow-lg border border-emerald-500/10 flex items-center gap-1.5 animate-bounce pointer-events-auto">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <div className="flex-1">
                <span>{gpsSuccessMsg}</span>
              </div>
              <button type="button" onClick={() => setGpsSuccessMsg('')} className="p-0.5 hover:text-emerald-100 cursor-pointer bg-transparent border-0 text-white leading-none">×</button>
            </div>
          )}

          {gpsErrorMsg && (
            <div className="bg-rose-600 text-white font-medium text-[10px] sm:text-xs py-2 px-3 rounded-xl shadow-lg border border-rose-500/10 flex items-center gap-1.5 animate-bounce pointer-events-auto">
              <AlertOctagon className="h-4 w-4 shrink-0" />
              <div className="flex-1">
                <span>{gpsErrorMsg}</span>
              </div>
              <button type="button" onClick={() => setGpsErrorMsg('')} className="p-0.5 hover:text-rose-100 cursor-pointer bg-transparent border-0 text-white leading-none">×</button>
            </div>
          )}
        </div>

        {/* HEADER NAV BRAND BAR */}
        <div className="bg-[#1E40AF] text-white px-4 py-3 shrink-0 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
              👨‍🏫
            </div>
            <div>
              <h1 className="text-xs font-bold font-mono tracking-tight text-white">{lang === 'en' ? 'Faculty Portal' : 'Tovuti ya Walimu'}</h1>
              <span className="text-[9px] text-[#A7F3D0] block -mt-0.5 leading-none font-sans">SSMS Active Workspace</span>
            </div>
          </div>

          <span className="text-[10px] text-[#A7F3D0] font-extrabold bg-white/10 px-2.5 py-1 rounded-full select-none font-mono">
            Role: Faculty
          </span>
        </div>

        {/* ACTIVE CONTENT VIEW - SCROLLABLE CONTAINER */}
        <div className="flex-grow flex-1 overflow-y-auto p-3 pb-24 space-y-4">

        {/* SUB-VIEW 0: HOME PORTAL / HUB */}
        {activeSubTab === 'home' && (
          <motion.div
            key="home-hub"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
            id="teacher-home-hub-panel"
          >
            {/* Rich Personalized Professional Header nested inside home */}
            <div className="bg-gradient-to-br from-[#1E40AF] to-blue-700 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden text-left">
              <div className="relative z-10">
                <span className="text-[8px] text-[#38BDF8] font-bold uppercase tracking-widest block font-mono">
                  {lang === 'en' ? 'PROFESSIONAL SCOPE' : 'DAUDI YA TAALUMA'}
                </span>
                <strong className="text-base font-extrabold text-white block mt-0.5">{currentTeacher.fullName}</strong>
                <span className="text-[10px] text-sky-105 font-semibold block mt-1">
                  ID: <b className="font-mono">{currentTeacher.teacherNumber}</b> • Specialization: <b>{currentTeacher.specialization}</b>
                </span>
                
                <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                  {classLeaderOfObj && (
                    <span className="bg-[#22C55E]/20 text-emerald-305 text-[8.5px] font-extrabold px-2 py-0.5 rounded border border-[#22C55E]/30">
                      👑 {lang === 'en' ? 'Class Head:' : 'Mkuu:'} {classLeaderOfObj.name} {classLeaderOfObj.stream}
                    </span>
                  )}
                  <span className="bg-white/10 text-slate-100 text-[8.5px] font-bold px-2 py-0.5 rounded">
                    📚 Matches: {teacherSubjects.map(s => s.code).join(', ') || 'None'}
                  </span>
                </div>
              </div>
              
              <div className="absolute right-[-10px] bottom-[-10px] text-white/5 pointer-events-none">
                <Compass className="h-28 w-28 rotate-12" />
              </div>
            </div>
            {/* School details / active status ribbon */}
            {(() => {
              const currentSchool = DB.getSchools().find(s => s.id === (currentTeacher.schoolId || 'SCH-001'));
              return currentSchool ? (
                <div className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center gap-3 shadow-2xs">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-xl">🏫</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-[#1E3A8A] uppercase tracking-wide block font-mono">
                      {currentSchool.type === 'Primary' ? (lang === 'en' ? 'Primary Academy' : 'Chuo cha Msingi') : (lang === 'en' ? 'Secondary Academy' : 'Chuo cha Sekondari')}
                    </span>
                    <b className="text-xs font-extrabold text-slate-900 block truncate">{currentSchool.name}</b>
                    <span className="text-[10px] text-slate-450 block -mt-0.5 font-medium">{currentSchool.region}, {currentSchool.district}</span>
                  </div>
                  <div className="shrink-0 flex flex-col items-end">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[8px] font-mono text-emerald-600 font-bold block mt-1">ONLINE</span>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-gradient-to-tr from-indigo-50 to-indigo-100/30 border border-indigo-100 p-2.5 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-tight block">Classes</span>
                <strong className="text-base font-black text-indigo-900 block mt-0.5">{teacherClasses.length}</strong>
              </div>
              <div className="bg-gradient-to-tr from-emerald-50 to-emerald-100/30 border border-emerald-100 p-2.5 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-tight block">Subjects</span>
                <strong className="text-base font-black text-emerald-900 block mt-0.5">{teacherSubjects.length}</strong>
              </div>
              <div className="bg-gradient-to-tr from-sky-50 to-sky-100/30 border border-sky-100 p-2.5 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-tight block">Students</span>
                <strong className="text-base font-black text-sky-900 block mt-0.5 font-mono">
                  {teacherClasses.reduce((sum, c) => sum + students.filter(s => s.classId === c.id).length, 0)}
                </strong>
              </div>
              <div className={`p-2.5 rounded-xl text-center border transition-all ${
                todayAttendance ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-150 text-amber-800 animate-pulse'
              }`}>
                <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-tight block">GPS Log</span>
                <b className="text-[9px] font-extrabold block mt-1.5 leading-none font-sans">
                  {todayAttendance ? (todayAttendance.status === 'ON_TIME' ? (lang === 'en' ? 'Checked' : 'Nipo') : (lang === 'en' ? 'Late' : 'Nimechelewa')) : (lang === 'en' ? 'Pending' : 'Bado')}
                </b>
              </div>
            </div>

            {/* Card-Based Multi-Portal App Navigation Grid */}
            <div className="space-y-2">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">
                {lang === 'en' ? 'TEACHER SPACE SERVICES' : 'HUDUMA ZA MWALIMU'}
              </span>
              
              <div className="grid grid-cols-2 gap-2.5" id="teacher-card-based-navigation-grid">
                
                {/* 1. GPS Attendance */}
                <button
                  type="button"
                  onClick={() => setActiveSubTab('attendance')}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-left hover:border-[#1E3A8A] transition-all cursor-pointer relative overflow-hidden group shadow-2xs"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <strong className="text-xs font-extrabold text-slate-900 block">{lang === 'en' ? 'GPS Attendance' : 'Mahudhurio ya GPS'}</strong>
                  <span className="text-[9.5px] text-slate-400 mt-0.5 block leading-tight">{lang === 'en' ? 'Sign in/out safely' : 'Sajili kuingia/kutoka'}</span>
                  <ChevronRight className="h-3 w-3 text-slate-350 absolute right-3 bottom-3 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 2. Timetable Schedule */}
                <button
                  type="button"
                  onClick={() => setActiveSubTab('timetable')}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-left hover:border-[#1E3A8A] transition-all cursor-pointer relative overflow-hidden group shadow-2xs"
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <strong className="text-xs font-extrabold text-slate-900 block">{lang === 'en' ? 'Class Schedule' : 'Ratiba ya Vipindi'}</strong>
                  <span className="text-[9.5px] text-slate-400 mt-0.5 block leading-tight">{lang === 'en' ? 'Weekly lesson plans' : 'Vipindi vyako kwa wiki'}</span>
                  <ChevronRight className="h-3 w-3 text-slate-350 absolute right-3 bottom-3 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 3. Academic Marks */}
                <button
                  type="button"
                  onClick={() => setActiveSubTab('marks')}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-left hover:border-[#1E3A8A] transition-all cursor-pointer relative overflow-hidden group shadow-2xs"
                >
                  <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
                    <FileSpreadsheet className="h-4.5 w-4.5" />
                  </div>
                  <strong className="text-xs font-extrabold text-slate-900 block">{lang === 'en' ? 'Academics Marks' : 'Kujaza Alama'}</strong>
                  <span className="text-[9.5px] text-slate-400 mt-0.5 block leading-tight">{lang === 'en' ? 'Input grade sheets' : 'Rekodi alama za mitihani'}</span>
                  <ChevronRight className="h-3 w-3 text-slate-350 absolute right-3 bottom-3 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 4. Homework Broadcast */}
                <button
                  type="button"
                  onClick={() => setActiveSubTab('assignments')}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-left hover:border-[#1E3A8A] transition-all cursor-pointer relative overflow-hidden group shadow-2xs"
                >
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <strong className="text-xs font-extrabold text-slate-900 block">{lang === 'en' ? 'Homework Kazi' : 'Zoezi la Nyumbani'}</strong>
                  <span className="text-[9.5px] text-slate-400 mt-0.5 block leading-tight">{lang === 'en' ? 'Publish homework pdf' : 'Tuma mazoezi ya darasa'}</span>
                  <ChevronRight className="h-3 w-3 text-slate-350 absolute right-3 bottom-3 group-hover:translate-x-0.5 transition-transform" />
                </button>

              </div>
            </div>

            {/* Assigned Classes Grid Panels moved to dedicated Students tab */}

            {/* Notifications Alert Board */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5 text-left animate-fade-in" id="teacher-notif-card-group">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{lang === 'en' ? 'CIRCULARS & NOTIFICATIONS' : 'TANGUZO NA MAARIFA'}</span>
                </span>
                
                <span className="text-[8px] bg-red-100 text-red-750 font-mono font-extrabold px-1.5 py-0.5 rounded">
                  {lang === 'en' ? 'LIVE' : 'SASA'}
                </span>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-none">
                
                {/* 1. Announcements */}
                {(() => {
                  const items = DB.getAnnouncements().filter(
                    ann => (ann.schoolId || 'SCH-001') === (currentTeacher.schoolId || 'SCH-001')
                  );
                  return items.map(ann => (
                    <div key={ann.id} className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100/40 text-left">
                      <div className="flex justify-between items-center text-[7.5px] font-mono text-indigo-700 font-bold mb-1">
                        <span>📣 CIRCULAR BROADCAST</span>
                        <span>{ann.date}</span>
                      </div>
                      <strong className="text-[10px] font-bold text-slate-900 block leading-tight">{lang === 'en' ? ann.titleEn : ann.titleSw}</strong>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">{lang === 'en' ? ann.contentEn : ann.contentSw}</p>
                    </div>
                  ));
                })()}

                {/* 2. Notifications */}
                {(() => {
                  const items = DB.getNotifications().filter(
                    n => n.role === 'TEACHER' || n.role === 'ALL' || n.userId === teacherId
                  );
                  return items.map(notif => (
                    <div key={notif.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-left">
                      <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-400 font-bold mb-1">
                        <span>🔔 LIVE NOTIFICATION</span>
                        <span>{notif.timestamp ? new Date(notif.timestamp).toLocaleDateString() : 'Today'}</span>
                      </div>
                      <p className="text-[9px] text-slate-650 font-semibold leading-normal">{lang === 'en' ? notif.messageEn : notif.messageSw}</p>
                    </div>
                  ));
                })()}

                {DB.getAnnouncements().filter(an => (an.schoolId || 'SCH-001') === (currentTeacher.schoolId || 'SCH-001')).length === 0 && 
                 DB.getNotifications().filter(n => n.role === 'TEACHER' || n.role === 'ALL').length === 0 && (
                   <div className="py-6 text-center text-slate-400 italic text-[10px]">
                     {lang === 'en' ? 'No recent messages.' : 'Hakuna taarifa yoyote sasa.'}
                   </div>
                 )
                }

              </div>
            </div>

          </motion.div>
        )}

        {/* SUB-VIEW: STUDENTS DIRECTORY ROSTER */}
        {activeSubTab === 'students' && (
          <motion.div
            key="students-directory"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 text-left"
            id="teacher-students-sub-panel"
          >
            {/* Classrooms List Grid */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-3xs">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-[#1E40AF]" />
                <span>{lang === 'en' ? 'Classroom Directories' : 'Mavandiko ya Darasa'}</span>
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                {lang === 'en' ? 'Select a classroom below to display the list of active scholar students and credentials.' : 'Chagua darasa chini kuonesha wanafunzi na funguo za kujiunga.'}
              </p>

              <div className="mt-3.5 flex flex-wrap gap-2">
                {teacherClasses.map(cls => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setScoringStudentId(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-[11px] flex items-center gap-1 border border-transparent ${
                      selectedClassId === cls.id 
                        ? 'bg-[#1E40AF] text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>🏫 {cls.name} {cls.stream}</span>
                  </button>
                ))}

                {teacherClasses.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2">{lang === 'en' ? 'No classes assigned.' : 'Huna madarasa uliyopangiwa.'}</p>
                )}
              </div>
            </div>

            {/* Students List details */}
            {selectedClassId ? (
              <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-3xs space-y-3 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-black text-slate-800">
                    {lang === 'en' ? 'Scholars Roster (' : 'Orodha ya Wasomi ('}{students.filter(s => s.classId === selectedClassId).length})
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#1E40AF] uppercase bg-blue-50 px-2 py-0.5 rounded-lg">
                    Class ID: {selectedClassId}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
                  {students.filter(s => s.classId === selectedClassId).map(st => (
                    <div key={st.id} className="py-3 flex flex-col gap-1 text-left">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-extrabold text-slate-900">{st.fullName}</strong>
                        <span className="text-[9px] bg-slate-100 font-mono font-bold px-1.5 py-0.5 rounded text-slate-500 uppercase">{st.admissionNumber}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mt-0.5">
                        <span className="flex items-center gap-1 font-sans">
                          👦 {lang === 'en' ? 'Gender:' : 'Jinsia:'} <b className="text-slate-600 uppercase font-mono">{st.gender}</b>
                        </span>
                        <span className="text-[#1E40AF] font-mono bg-blue-50/50 px-2 py-0.5 rounded border border-blue-105/30">
                          {lang === 'en' ? 'Parent key: ' : 'Funguo wa Mzazi: '} <b className="text-[#1E40AF]">{st.parentCode}</b>
                        </span>
                      </div>
                    </div>
                  ))}

                  {students.filter(s => s.classId === selectedClassId).length === 0 && (
                    <p className="py-8 text-center text-xs text-slate-400 italic">{lang === 'en' ? 'No students enrolled in this classroom stream.' : 'Hakuna wanafunzi waliandikishwa katika mkondo huu.'}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-150 shadow-3xs text-center py-12 text-slate-400">
                <Users className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-bold leading-normal">{lang === 'en' ? 'Select a classroom above to display its students.' : 'Chagua darasa juu kuonesha wanafunzi wake.'}</p>
              </div>
            )}
          </motion.div>
        )}


        {/* SUB-VIEW 1: GEOLOCATION / GEOFENCE ATTENDANCE ATTENDANCE RECORD */}
        {activeSubTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="teacher-attendance-sub-panel">
            
            {/* Box A: Geofence Radar Simulator Visualizer */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Verify geofence and coordinate properties
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click below to choose mock location nodes to simulate your physical GPS proximity bounds in front of security walls.
                </p>
              </div>

              {/* Mock locator buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSimulateGPSCoors(true)}
                  className="flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl transition-all text-left cursor-pointer"
                  id="mock-gps-inside"
                >
                  <div>
                    <span className="block text-xxs font-bold text-emerald-700 uppercase">Preset 1</span>
                    <strong className="text-xs font-bold text-emerald-950 block mt-0.5">{t.insideSchoolPoint}</strong>
                    <span className="text-[10px] text-emerald-600 font-mono mt-0.5 block">{settings.latitude.toFixed(4)}, {settings.longitude.toFixed(4)}</span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateGPSCoors(false)}
                  className="flex items-center justify-between p-3.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl transition-all text-left cursor-pointer"
                  id="mock-gps-outside"
                >
                  <div>
                    <span className="block text-xxs font-bold text-red-700 uppercase">Preset 2</span>
                    <strong className="text-xs font-bold text-red-950 block mt-0.5">{t.outsideSchoolPoint}</strong>
                    <span className="text-[10px] text-red-600 font-mono mt-0.5 block">{(settings.latitude + 0.005).toFixed(4)}, {(settings.longitude - 0.005).toFixed(4)}</span>
                  </div>
                  <AlertOctagon className="h-5 w-5 text-red-600 animate-bounce" />
                </button>
              </div>

              {/* Calculated results metadata block */}
              {userLat !== null && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{t.yourLocation}:</span>
                    <code className="text-[11px] font-mono text-indigo-700 bg-slate-200 px-1 py-0.5 rounded">{userLat.toFixed(5)}, {userLng?.toFixed(5)}</code>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{t.schoolPoint}:</span>
                    <code className="text-[11px] font-mono text-slate-700 bg-slate-200 px-1 py-0.5 rounded">{settings.latitude.toFixed(5)}, {settings.longitude.toFixed(5)}</code>
                  </div>

                  <div className="border-t border-slate-200 my-2 pt-2 flex items-center justify-between text-xs font-extrabold text-slate-800">
                    <span>{t.distance}:</span>
                    <span className={isInsideMock ? "text-emerald-700" : "text-red-600"}>
                      ~ {calculateDistance(userLat, userLng!, settings.latitude, settings.longitude).toFixed(1)} metres
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>Allowed boundary range threshold:</span>
                    <span className="text-indigo-800">{settings.allowedRadiusMeters} meters</span>
                  </div>
                </div>
              )}

              {/* Action record checks triggers */}
              <div className="pt-2 flex justify-between gap-3">
                <button
                  onClick={handlePerformCheckIn}
                  disabled={todayAttendance?.status === 'ON_TIME' || todayAttendance?.status === 'LATE'}
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white font-extrabold text-xs shadow-md rounded-xl hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="gate-check-in-btn"
                >
                  <Navigation className="h-4.5 w-4.5" />
                  <span>{t.checkIn}</span>
                </button>

                <button
                  onClick={handlePerformCheckOut}
                  disabled={!todayAttendance || todayAttendance?.status === 'CHECKED_OUT'}
                  className="flex-1 py-3 px-4 bg-slate-800 text-white font-extrabold text-xs shadow-md rounded-xl hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="gate-check-out-btn"
                >
                  <Clock className="h-4.5 w-4.5" />
                  <span>{t.checkOut}</span>
                </button>
              </div>
            </div>

            {/* Box B: Physical GPS Check Desk status */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                  Today's GPS Attendance Check Desk
                </h4>
              </div>

              {todayAttendance ? (
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 text-white p-2 rounded-full">
                      <Compass className="h-6 w-6 animate-spin-slow" />
                    </div>
                    <div>
                      <span className="text-xxs uppercase tracking-wider font-extrabold text-emerald-800 block">System Verification Pass!</span>
                      <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
                        {todayAttendance.status === 'ON_TIME' ? t.onTime : todayAttendance.status === 'LATE' ? t.late : t.checkedOut}
                      </strong>
                    </div>
                  </div>

                  <div className="border-t border-emerald-250/50 pt-3.5 space-y-2 text-xs font-bold text-slate-800">
                    <div className="flex justify-between">
                      <span>📆 Date Verified:</span>
                      <span className="font-mono">{todayAttendance.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🕗 Check-In Time stamp:</span>
                      <span className="font-mono text-emerald-700">{todayAttendance.checkInTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🕒 Check-Out Time stamp:</span>
                      <span className="font-mono">{todayAttendance.checkOutTime || 'Active (Session open)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📍 Distance logged error:</span>
                      <span className="font-mono text-indigo-850">~ {todayAttendance.distanceMetres?.toFixed(2)} meters</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <AlertOctagon className="h-10 w-10 text-slate-350 mb-2 animate-pulse" />
                  <p className="text-xs font-semibold leading-relaxed max-w-sm">
                    {lang === 'en' ? 'Your attendance has not been registered today. Complete check-in verified on GPS to open active sessions.' : 'Haujasajili hisia zako leo bado. Jaza fomu ya mita ili kuendelea.'}
                  </p>
                </div>
              )}

              {/* Dynamic reminders cards */}
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-2.5">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                <div className="text-xxs text-amber-900 leading-normal">
                  <strong className="font-bold block mb-0.5">⚠️ Rule-based Deadline Notice:</strong>
                  The official school Check-In deadline is configured to <b>{settings.checkInDeadline} AM</b>. Arriving and signing in after this hour automatically flags the ledger record as <b>Late</b>. No-shows map to <b>Absent</b> indices inside Headmaster boards.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SUB-VIEW 2: DYNAMIC SUBJECT TEACHERS PROFILE & ALLOCATION TIMETABLE */}
        {activeSubTab === 'profile' && (
          <div className="space-y-4 text-left" id="teacher-profile-sub-panel">
            
            {/* 1. PROFESSIONAL SPECIFICATIONS CARD */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-3xs text-left space-y-3 animate-fade-in">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-2 mb-1">
                👤 {lang === 'en' ? 'Faculty Credentials' : 'Sifa za Kitaaluma'}
              </span>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-150 text-indigo-700 flex items-center justify-center text-xl shrink-0">
                  👨‍🏫
                </div>
                <div className="truncate">
                  <h3 className="text-sm font-black text-slate-900 leading-tight block truncate">{currentTeacher.fullName}</h3>
                  <span className="text-[10px] font-mono text-slate-450 uppercase block font-bold leading-normal mt-0.5">Faculty Number: {currentTeacher.teacherNumber}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-50 flex flex-col gap-1.5 text-xxs font-semibold text-slate-500 font-mono">
                <div>• SPECIALIZATION: <b className="text-slate-800">{currentTeacher.specialization}</b></div>
                <div>• ASSIGNED CLASS: <b className="text-slate-800">{classLeaderOfObj ? `${classLeaderOfObj.name} ${classLeaderOfObj.stream}` : 'Assistant teacher'}</b></div>
              </div>
            </div>

            {/* 2. DYNAMIC APP LANGUAGE SELECTOR CHANGER */}
            <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs text-left space-y-3">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2 mb-1">
                🌐 App Language switcher
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setLang('en')}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    lang === 'en' 
                      ? 'bg-[#1E40AF] text-white border-[#1E40AF] shadow-3xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🇺🇸 English
                </button>
                <button 
                  type="button"
                  onClick={() => setLang('sw')}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    lang === 'sw' 
                      ? 'bg-[#1E40AF] text-white border-[#1E40AF] shadow-3xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🇹🇿 Swahili
                </button>
              </div>
            </div>

            {/* 3. LESSON TIMETABLE SECTION */}
            <div className="bg-white border border-slate-150 p-4.5 rounded-2xl space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  {lang === 'en' ? 'Class Lessons Schedule' : 'Ratiba ya Vipindi'}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                  {lang === 'en' ? 'Weekly lesson allocations assigned by administrator.' : 'Vipindi vya darasani vilivyopangiwa kwa juma.'}
                </p>
              </div>

              {timetable.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  {t.noRecords}
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {timetable.map(tt => {
                    const sub = subjects.find(s => s.id === tt.subjectId);
                    const cls = classes.find(c => c.id === tt.classId);
                    return (
                      <div key={tt.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-left">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="bg-[#1E40AF]/10 text-[#1E40AF] px-2 py-0.5 rounded uppercase font-mono">
                            {tt.dayOfWeek}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {tt.timeSlot}
                          </span>
                        </div>
                        <strong className="text-[11px] font-black text-slate-850 block text-slate-800">
                          {sub ? sub.name : 'Mathematics'}
                        </strong>
                        <div className="text-[9px] text-slate-400 font-bold border-t border-slate-200/40 pt-1 flex justify-between">
                          <span>Class: <b className="text-slate-600">{cls ? `${cls.name} ${cls.stream}` : 'Form 1'}</b></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. LOG OUT TRIGGER BUTTON */}
            <button
              type="button"
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else {
                  DB.clearSession();
                  window.location.hash = '';
                  window.location.reload();
                }
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-extrabold text-xs cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-md border-none mt-2"
              id="teacher-logout"
            >
              <LogOut className="h-4.5 w-4.5 text-white stroke-[2.5px]" />
              <span>{lang === 'en' ? 'Log Out' : 'Ondoka kwenye Akaunti'}</span>
            </button>

          </div>
        )}

        {/* SUB-VIEW 3: ACADEMICS SCORE REGISTER & GRADEBOOKS */}
        {activeSubTab === 'exams' && (
          <div className="space-y-4 font-sans">
            
            {/* EXAMS SUB-TABS SEGMENTED SELECTOR CONTROL */}
            <div className="bg-white p-1.5 rounded-xl border border-slate-150 shadow-3xs flex justify-around gap-1.5 select-none" id="teacher-exams-pills">
              {[
                { id: 'marks', labelEn: 'Gradebook', labelSw: 'Alama', icon: FileSpreadsheet },
                { id: 'assignments', labelEn: 'Homework', labelSw: 'Zoezi', icon: FileText },
                { id: 'comments', labelEn: 'Reviews', labelSw: 'Maoni', icon: MessageSquare }
              ].map(sub => {
                const Icon = sub.icon;
                const isSel = examSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setExamSubTab(sub.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-0.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border-none outline-hidden ${
                      isSel ? 'bg-[#1E40AF] text-white shadow-3xs' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{lang === 'en' ? sub.labelEn : sub.labelSw}</span>
                  </button>
                );
              })}
            </div>

            {examSubTab === 'marks' && (
              <div className="space-y-6" id="teacher-marks-panel">
            
            {/* Gradebook settings row */}
            <div className="bg-white border border-slate-100 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Active Classroom Selection
                </label>
                <select
                  value={selectedClassId}
                  onChange={e => {
                    setSelectedClassId(e.target.value);
                    setScoringStudentId(null);
                  }}
                  className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl min-w-[150px] font-semibold text-slate-800 focus:ring-1.5 focus:ring-emerald-500/20"
                  id="gradebook-class-dropdown"
                >
                  <option value="">-- Choose Class --</option>
                  {teacherClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.stream}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Assigned Subject Scope
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={e => {
                    setSelectedSubjectId(e.target.value);
                    setScoringStudentId(null);
                  }}
                  className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl min-w-[180px] font-semibold text-slate-800 focus:ring-1.5 focus:ring-emerald-500/20"
                  id="gradebook-subject-dropdown"
                >
                  <option value="">-- Choose Subject --</option>
                  {teacherSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedClassId && selectedSubjectId ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1 & 2: Class evaluation index matrix table */}
                <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden lg:col-span-2">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Active Class Score Registers list
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                      <thead className="bg-slate-50/70 text-slate-550 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="px-4 py-3 text-left">Admission</th>
                          <th className="px-4 py-3 text-left">Legal Name</th>
                          <th className="px-4 py-3 text-left">Evaluations (Total)</th>
                          <th className="px-4 py-3 text-left">Average (%)</th>
                          <th className="px-4 py-3 text-center">Current Grade</th>
                          <th className="px-4 py-3 text-center">Class Position</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-705">
                        {gradebookStudents.map(std => {
                          const evalGrades = computeStudentOverallGradesOfClass(selectedClassId, std.id);
                          const rankObj = getRankAndPositionInClass(selectedClassId, std.id);
                          return (
                            <tr key={std.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-slate-700">
                                {std.admissionNumber}
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900">
                                {std.fullName}
                                <span className="text-[9.5px] text-slate-400 block font-normal">{std.gender}</span>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap font-semibold">
                                {evalGrades.totalEvaluations} records scored
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className="font-extrabold text-slate-900 font-mono">{evalGrades.percentage}%</span>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  evalGrades.grade === 'A' ? 'bg-emerald-100 text-emerald-800' : evalGrades.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {evalGrades.grade}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap text-center text-xs font-bold text-indigo-900 font-mono">
                                {rankObj.index} / {rankObj.total}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                <button
                                  onClick={() => {
                                    setScoringStudentId(std.id);
                                    setObtainedMarks(0);
                                  }}
                                  className="px-2 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md cursor-pointer"
                                  id={`edit-marks-std-${std.id}`}
                                >
                                  Record Score
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Column 3: Edit scoring parameters card */}
                <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs self-start">
                  {scoringStudentId ? (
                    (() => {
                      const activeSt = students.find(s => s.id === scoringStudentId);
                      return (
                        <form onSubmit={handleRegisterMarks} className="space-y-4" id="individual-marks-form">
                          <div className="pb-3 border-b border-slate-100">
                            <span className="text-xxs font-semibold uppercase text-emerald-700 block">Record test metrics</span>
                            <strong className="text-xs font-bold text-slate-900 block mt-1">
                              Scholar: {activeSt?.fullName}
                            </strong>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                              Academics Evaluation Category
                            </label>
                            <select
                              value={markType}
                              onChange={e => setMarkType(e.target.value as any)}
                              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-semibold"
                              id="marks-category-dropdown"
                            >
                              <option value="QUIZ">Quiz / Pop Test</option>
                              <option value="TEST">Monthly Test Paper</option>
                              <option value="ASSIGNMENT">Subject Homework Task</option>
                              <option value="MIDTERM">Midterm Exams</option>
                              <option value="FINAL">Final Semester Exam</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                Obtained Mars
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                max={totalMarksBound}
                                value={obtainedMarks}
                                onChange={e => setObtainedMarks(Number(e.target.value))}
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-emerald-700"
                                id="obtained-marks-field"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                Total out of
                              </label>
                              <input
                                type="number"
                                required
                                min="1"
                                value={totalMarksBound}
                                onChange={e => setTotalMarksBound(Number(e.target.value))}
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                                id="total-marks-field"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 px-4 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer shadow-xs"
                          >
                            Save Score
                          </button>
                        </form>
                      );
                    })()
                  ) : (
                    <div className="text-center p-6 text-slate-400 flex flex-col items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-xs font-semibold leading-relaxed">
                        Select a student from the matrix listing on the left to edit or append new scores. Evaluated ranks compile automatically!
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-white border border-gray-150 py-10 rounded-3xl text-center text-xs text-slate-450 font-semibold leading-relaxed">
                👉 Please select an active Class Room and Subject Assignment scope in the settings header drop-downs above to initialize gradebooks!
              </div>
            )}
          </div>
        )}

        {/* SUB-VIEW 4: EXERCISE ASSIGNMENTS UPLOADER */}
        {examSubTab === 'assignments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="teacher-assignments-sub-panel">
            
            {/* Launch Assignment Form */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs self-start">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Broadcast Homework Task
                </h4>
              </div>

              <form onSubmit={handlePublishAssignment} className="space-y-4" id="upload-assignment-form">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Assignment Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Form 1 Algebra exercise sheet"
                    value={asgTitle}
                    onChange={e => setAsgTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Target Class
                    </label>
                    <select
                      required
                      value={asgClass}
                      onChange={e => setAsgClass(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="">-- Class --</option>
                      {teacherClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.stream}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Subject
                    </label>
                    <select
                      required
                      value={asgSubject}
                      onChange={e => setAsgSubject(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="">-- Course --</option>
                      {teacherSubjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Due Date Period
                  </label>
                  <input
                    type="date"
                    required
                    value={asgDate}
                    onChange={e => setAsgDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Instructions / Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific deadlines, guidelines..."
                    value={asgDesc}
                    onChange={e => setAsgDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-205 rounded-xl"
                  />
                </div>

                {/* Simulated file uploading component */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Simulated PDF Document attachment selection
                  </label>
                  <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 p-4 rounded-2xl text-center cursor-pointer transition-all"
                    onClick={() => setAsgFile('Assignment_Form1A_Math_v1.pdf')}
                  >
                    <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xxs font-bold text-slate-500 block">
                      {asgFile ? `✓ File Attachment: ${asgFile}` : 'Drag & Drop PDF Exercise File here or click to simulate upload'}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded-xl cursor-pointer"
                >
                  Broadcast Assignment
                </button>
              </form>
            </div>

            {/* List columns */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl lg:col-span-2 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active assignments published by you
                </h3>
              </div>

              {assignments.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 italic">
                  No assignments found. Fill form to publish.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {assignments.map(asg => {
                    const cls = classes.find(c => c.id === asg.classId);
                    const sub = subjects.find(s => s.id === asg.subjectId);
                    return (
                      <div key={asg.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center justify-between text-xxs font-semibold text-slate-400 mb-1">
                          <span>Target: <b className="text-indigo-800 uppercase">{cls ? `${cls.name} ${cls.stream}` : 'Form 1'} • {sub?.name}</b></span>
                          <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold font-mono">📅 Due: {asg.dueDate}</span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900">{asg.title}</h5>
                        <p className="text-xs text-slate-500 mt-1">{asg.description || 'No instruction notes.'}</p>
                        <div className="mt-3 bg-white p-2.5 rounded-lg border border-slate-200/60 inline-flex items-center gap-2 text-xxs font-bold text-slate-600">
                          <BookOpen className="h-4 w-4 text-emerald-600" />
                          <span>Attachment file: {asg.fileName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* SUB-VIEW 5: ACADEMICS DISCUSSIONS & COMMENTS */}
        {examSubTab === 'comments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="teacher-comments-sub-panel">
            
            {/* Write feedback form */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs self-start">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                  Write student review comments
                </h4>
              </div>

              <form onSubmit={handlePublishComment} className="space-y-4" id="feedback-post-form">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Select Target Scholar
                  </label>
                  <select
                    required
                    value={commentStudent}
                    onChange={e => setCommentStudent(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(std => {
                      const cls = classes.find(c => c.id === std.classId);
                      return (
                        <option key={std.id} value={std.id}>{std.fullName} ({cls ? `${cls.name}${cls.stream}` : 'Form 1'})</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Performance feedback summary
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Enter academic progressive feedback, areas of improvement..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-205 rounded-xl block"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-xl cursor-pointer"
                >
                  Save Comment Sheet
                </button>
              </form>
            </div>

            {/* Feedback ledger log list */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl lg:col-span-2 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Scholars comment ledger logs
                </h3>
              </div>

              {comments.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 italic">
                  No evaluation logs recorded yet. Fill the left form to append profiles notes.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {comments.map(com => {
                    const matchedSt = students.find(s => s.id === com.studentId);
                    const matchedCls = matchedSt ? classes.find(c => c.id === matchedSt.classId) : null;
                    return (
                      <div key={com.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3 justify-between">
                        <div>
                          <div className="text-xxs text-slate-400 font-mono font-bold">
                            📅 Log Date: {com.date}
                          </div>
                          <strong className="text-xs font-bold text-slate-900 block mt-1">
                            {matchedSt ? matchedSt.fullName : 'Sarah Joseph'} <span className="text-indigo-805 font-medium">({matchedCls ? `${matchedCls.name} ${matchedCls.stream}` : 'Class Code'})</span>
                          </strong>
                          <p className="text-xs text-slate-650 mt-1.5 leading-relaxed bg-white p-2.5 border border-slate-200/50 rounded-xl">
                            " {com.comment} "
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

            </div>
          )}

          </div>

          {/* STICKY BOTTOM APP BAR NAVIGATION BUTTON PANEL */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/85 pt-2 pb-5 px-1.5 flex justify-around items-center z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] shrink-0 select-none" id="teacher-bottom-navigation-bar">
            
            {/* Button 0: Home */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('home');
                setScoringStudentId(null);
                setGpsErrorMsg('');
                setGpsSuccessMsg('');
              }}
              className="relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all duration-300 cursor-pointer select-none active:scale-95 border-0 outline-none bg-transparent flex-1"
            >
              {activeSubTab === 'home' && (
                <motion.div
                  layoutId="activeSubTabPill"
                  className="absolute inset-0 bg-[#1E40AF]/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Home className={`h-5 w-5 z-10 transition-all duration-300 ${activeSubTab === 'home' ? 'text-[#1E40AF] scale-105 stroke-[2.3px]' : 'text-slate-450 hover:text-slate-700 stroke-[1.8px]'}`} />
              <span className={`text-[8.5px] font-extrabold tracking-tight mt-0.5 z-10 transition-colors duration-300 ${activeSubTab === 'home' ? 'text-[#1E40AF]' : 'text-slate-450'}`}>
                {lang === 'en' ? 'Home' : 'Mwanzo'}
              </span>
            </button>

            {/* Button 1: Students */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('students');
                setScoringStudentId(null);
                setGpsErrorMsg('');
                setGpsSuccessMsg('');
              }}
              className="relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all duration-300 cursor-pointer select-none active:scale-95 border-0 outline-none bg-transparent flex-1"
            >
              {activeSubTab === 'students' && (
                <motion.div
                  layoutId="activeSubTabPill"
                  className="absolute inset-0 bg-[#1E40AF]/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Users className={`h-5 w-5 z-10 transition-all duration-300 ${activeSubTab === 'students' ? 'text-[#1E40AF] scale-105 stroke-[2.3px]' : 'text-slate-450 hover:text-slate-700 stroke-[1.8px]'}`} />
              <span className={`text-[8.5px] font-extrabold tracking-tight mt-0.5 z-10 transition-colors duration-300 ${activeSubTab === 'students' ? 'text-[#1E40AF]' : 'text-slate-450'}`}>
                {lang === 'en' ? 'Students' : 'Wasomi'}
              </span>
            </button>

            {/* Button 2: Exams */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('exams');
                setScoringStudentId(null);
                setGpsErrorMsg('');
                setGpsSuccessMsg('');
              }}
              className="relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all duration-300 cursor-pointer select-none active:scale-95 border-0 outline-none bg-transparent flex-1"
            >
              {activeSubTab === 'exams' && (
                <motion.div
                  layoutId="activeSubTabPill"
                  className="absolute inset-0 bg-[#1E40AF]/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Award className={`h-5 w-5 z-10 transition-all duration-300 ${activeSubTab === 'exams' ? 'text-[#1E40AF] scale-105 stroke-[2.3px]' : 'text-slate-450 hover:text-slate-700 stroke-[1.8px]'}`} />
              <span className={`text-[8.5px] font-extrabold tracking-tight mt-0.5 z-10 transition-colors duration-300 ${activeSubTab === 'exams' ? 'text-[#1E40AF]' : 'text-slate-450'}`}>
                {lang === 'en' ? 'Exams' : 'Mitihani'}
              </span>
            </button>

            {/* Button 3: Attendance */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('attendance');
                setScoringStudentId(null);
                setGpsErrorMsg('');
                setGpsSuccessMsg('');
              }}
              className="relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all duration-300 cursor-pointer select-none active:scale-95 border-0 outline-none bg-transparent flex-1"
            >
              {activeSubTab === 'attendance' && (
                <motion.div
                  layoutId="activeSubTabPill"
                  className="absolute inset-0 bg-[#1E40AF]/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <MapPin className={`h-5 w-5 z-10 transition-all duration-300 ${activeSubTab === 'attendance' ? 'text-[#1E40AF] scale-105 stroke-[2.3px]' : 'text-slate-450 hover:text-slate-700 stroke-[1.8px]'}`} />
              <span className={`text-[8.5px] font-extrabold tracking-tight mt-0.5 z-10 transition-colors duration-300 ${activeSubTab === 'attendance' ? 'text-[#1E40AF]' : 'text-slate-450'}`}>
                {lang === 'en' ? 'Check' : 'Wepo'}
              </span>
            </button>

            {/* Button 4: Profile */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('profile');
                setScoringStudentId(null);
                setGpsErrorMsg('');
                setGpsSuccessMsg('');
              }}
              className="relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all duration-300 cursor-pointer select-none active:scale-95 border-0 outline-none bg-transparent flex-1"
            >
              {activeSubTab === 'profile' && (
                <motion.div
                  layoutId="activeSubTabPill"
                  className="absolute inset-0 bg-[#1E40AF]/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <User className={`h-5 w-5 z-10 transition-all duration-300 ${activeSubTab === 'profile' ? 'text-[#1E40AF] scale-105 stroke-[2.3px]' : 'text-slate-450 hover:text-slate-700 stroke-[1.8px]'}`} />
              <span className={`text-[8.5px] font-extrabold tracking-tight mt-0.5 z-10 transition-colors duration-300 ${activeSubTab === 'profile' ? 'text-[#1E40AF]' : 'text-slate-450'}`}>
                {lang === 'en' ? 'Profile' : 'Profaili'}
              </span>
            </button>

          </div>

      </div>
    </div>
  );
}
