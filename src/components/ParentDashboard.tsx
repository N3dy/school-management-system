/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS } from '../translations';
import { DB, getGradeAndPoints } from '../db';
import { Parent, Student, Class, Subject, AcademicMark, StudentAttendance, TeacherComment, Assignment, Announcement } from '../types';
import {
  Home,
  Award,
  Calendar,
  DollarSign,
  User,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  Volume2,
  Lock,
  LogOut,
  BookOpen,
  ArrowRight,
  CheckSquare,
  MessageSquare,
  Sparkles,
  Phone,
  Mail,
  ChevronRight,
  School,
  FileSpreadsheet,
  Download,
  Check,
  UserCheck,
  Smartphone
} from 'lucide-react';

interface ParentProps {
  lang: 'en' | 'sw';
  setLang: (lang: 'en' | 'sw') => void;
  parentId: string;
  onLogout?: () => void;
}

interface FeeStructure {
  total: number;
  paid: number;
  currency: string;
  isGovernmentContribution?: boolean;
  transactions: { date: string; amount: number; reference: string; method: string }[];
}

export default function ParentDashboard({ lang, setLang, parentId, onLogout }: ParentProps) {
  const t = TRANSLATIONS[lang];

  // Tab control inside the mobile interface
  const [activeTab, setActiveTab] = useState<'home' | 'exams' | 'attendance' | 'fees' | 'ai' | 'profile'>('home');

  // Database dynamic states
  const [currentParent, setCurrentParent] = useState<Parent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<AcademicMark[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [comments, setComments] = useState<TeacherComment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Selected child state
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  // Link Child modal/inputs
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [inputAdmissionId, setInputAdmissionId] = useState('');
  const [inputParentCode, setInputParentCode] = useState('');

  // Status notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pay Simulation
  const [paySuccessLog, setPaySuccessLog] = useState<string | null>(null);

  // AI Assistant Tab States (Rule 4)
  const [userMessage, setUserMessage] = useState('');
  const [aiChatLogs, setAiChatLogs] = useState<{ sender: 'user' | 'assistant'; text: string; timestamp: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const reloadParentScope = () => {
    const list = DB.getParents();
    const matched = list.find(p => p.id === parentId);
    if (matched) {
      setCurrentParent(matched);
      
      // Multi-tenant isolation: Parent only sees students linked to their verified ID list
      const linkedStudents = DB.getStudents().filter(s => matched.verifiedStudentIds.includes(s.id));
      setStudents(linkedStudents);

      const activeStudent = linkedStudents.find(s => s.id === activeStudentId) || linkedStudents[0];
      const activeStudentSchId = activeStudent?.schoolId || 'SCH-001';
      const activeStudentClassId = activeStudent?.classId || '';

      // Clean cache states
      setClasses(DB.getClasses());
      setSubjects(DB.getSubjects());
      
      // Filter marks & attendance specifically to active child
      if (activeStudent) {
        setMarks(DB.getMarks().filter(m => m.studentId === activeStudent.id));
        setAttendance(DB.getStudentAttendance().filter(a => a.studentId === activeStudent.id));
        setComments(DB.getComments().filter(c => c.studentId === activeStudent.id));
        setAssignments(DB.getAssignments().filter(asg => asg.classId === activeStudentClassId));
        setAnnouncements(DB.getAnnouncements().filter(ann => (ann.schoolId || 'SCH-001') === activeStudentSchId));
      } else {
        setMarks([]);
        setAttendance([]);
        setComments([]);
        setAssignments([]);
        setAnnouncements([]);
      }

      // Try setting active student id if parent has links and none selected
      if (matched.verifiedStudentIds.length > 0 && !activeStudentId) {
        setActiveStudentId(matched.verifiedStudentIds[0]);
      }
    }
  };

  useEffect(() => {
    reloadParentScope();
    // Watch for updates
    window.addEventListener('ssms_db_update', reloadParentScope);
    return () => window.removeEventListener('ssms_db_update', reloadParentScope);
  }, [parentId, activeStudentId]);

  // Handle formal secure card link validation
  const handleLinkChildFormal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!inputAdmissionId || !inputParentCode) {
      setErrorMsg(lang === 'en' ? 'Kindly fill all claim criteria.' : 'Tafadhali jaza maelezo yote ya uhakiki.');
      return;
    }

    const allGlobalStudents = DB.getStudents();
    const matchedSt = allGlobalStudents.find(
      s =>
        s.admissionNumber.replace(/\s+/g, '').toLowerCase() === inputAdmissionId.replace(/\s+/g, '').toLowerCase() &&
        s.parentCode.trim().toUpperCase() === inputParentCode.trim().toUpperCase()
    );

    if (!matchedSt) {
      setErrorMsg(lang === 'en' ? 'No child record matched these codes.' : 'Hakuna mwanafunzi aliyepatikana kwa namba hizo.');
      return;
    }

    if (!currentParent) return;

    if (currentParent.verifiedStudentIds.includes(matchedSt.id)) {
      setErrorMsg(lang === 'en' ? 'This student is already linked.' : 'Mwanafunzi huyu ashaunganishwa tayari.');
      return;
    }

    // Connect them
    const allParents = DB.getParents();
    const pIdx = allParents.findIndex(p => p.id === parentId);
    if (pIdx !== -1) {
      allParents[pIdx].verifiedStudentIds.push(matchedSt.id);
      DB.saveParents(allParents);
    }

    const allStudents = DB.getStudents();
    const sIdx = allStudents.findIndex(s => s.id === matchedSt.id);
    if (sIdx !== -1) {
      allStudents[sIdx].parentId = parentId;
      DB.saveStudents(allStudents);
    }

    DB.addAudit(
      'Connect Parent to Scholar',
      `Parent ${currentParent.fullName} linked child ${matchedSt.fullName} via direct code authentication.`,
      currentParent.fullName
    );

    setSuccessMsg(lang === 'en' ? 'Scholar Profile linked successfully!' : 'Maelezo yameunganishwa kwa mafanikio!');
    setActiveStudentId(matchedSt.id);
    setIsLinkingOpen(false);
    setInputAdmissionId('');
    setInputParentCode('');
    
    // Dispatch db update event so sidebars reload
    window.dispatchEvent(new Event('ssms_db_update'));
  };

  const handleUnlinkStudent = (studentId: string, name: string) => {
    if (!currentParent) return;
    if (!window.confirm(lang === 'en' ? `Are you sure you want to unlink ${name}?` : `Je, una uhakika unataka kumfuta ${name}?`)) return;

    const allParents = DB.getParents();
    const pIdx = allParents.findIndex(p => p.id === parentId);
    if (pIdx !== -1) {
      allParents[pIdx].verifiedStudentIds = allParents[pIdx].verifiedStudentIds.filter(id => id !== studentId);
      DB.saveParents(allParents);
    }

    const allStudents = DB.getStudents();
    const sIdx = allStudents.findIndex(s => s.id === studentId);
    if (sIdx !== -1) {
      allStudents[sIdx].parentId = null;
      DB.saveStudents(allStudents);
    }

    setSuccessMsg(lang === 'en' ? 'Student unlinked successfully.' : 'Mwanafunzi ameondolewa kwa mafanikio.');
    
    // reset selection
    const nextList = currentParent.verifiedStudentIds.filter(id => id !== studentId);
    setActiveStudentId(nextList.length > 0 ? nextList[0] : null);
    
    window.dispatchEvent(new Event('ssms_db_update'));
  };

  if (!currentParent) return null;

  // Load connected children
  const linkedChildIds = currentParent.verifiedStudentIds;
  const verifiedChildren = students.filter(s => linkedChildIds.includes(s.id));
  const activeStudent = verifiedChildren.find(s => s.id === activeStudentId) || verifiedChildren[0];

  // Fee computation metrics (Rule 2: Fees Module Rules)
  const feesMap = activeStudent ? (() => {
    const studentSchool = DB.getSchools().find(s => s.id === activeStudent.schoolId);
    const isGovernment = studentSchool?.category === 'Government';

    if (isGovernment) {
      if (studentSchool?.optionalContributionsEnabled) {
        return {
          total: 35000,
          paid: 15000,
          currency: 'TZS',
          isGovernmentContribution: true,
          transactions: [
            { date: '2026-03-05', amount: 15000, reference: 'TXN-CONT-558Y', method: 'M-PESA Michango' }
          ]
        };
      } else {
        return {
          total: 0,
          paid: 0,
          currency: 'TZS',
          isGovernmentContribution: false,
          transactions: []
        };
      }
    }

    const defaultFees: Record<string, FeeStructure> = {
      'ST1': {
        total: 1200000,
        paid: 850000,
        currency: 'TZS',
        transactions: [
          { date: '2026-03-10', amount: 500000, reference: 'TXN-99827B', method: 'M-PESA' },
          { date: '2026-05-02', amount: 350000, reference: 'TXN-10192A', method: 'NMB Bank Pay' }
        ]
      },
      'ST4': {
        total: 800000,
        paid: 800005,
        currency: 'TZS',
        transactions: [
          { date: '2026-02-15', amount: 800000, reference: 'TXN-88217X', method: 'CRDB Agent' }
        ]
      },
      'ST5': {
        total: 800000,
        paid: 450000,
        currency: 'TZS',
        transactions: [
          { date: '2026-02-15', amount: 450000, reference: 'TXN-88219K', method: 'Tigo Pesa' }
        ]
      }
    };
    return defaultFees[activeStudent.id] || {
      total: 1000000,
      paid: 600000,
      currency: 'TZS',
      transactions: [
        { date: '2026-01-20', amount: 600000, reference: 'TXN-77312Z', method: 'Aza/Bank Transfer' }
      ]
    };
  })() : null;

  // Active student calculations
  const getActiveStudentAnalytics = () => {
    if (!activeStudent) return null;

    const classObj = classes.find(c => c.id === activeStudent.classId);
    const kidMarks = marks.filter(m => m.studentId === activeStudent.id);
    const kidAtt = attendance.filter(a => a.studentId === activeStudent.id);
    
    let totalMax = 0;
    let totalObt = 0;
    kidMarks.forEach(m => {
      totalMax += m.totalMarks;
      totalObt += m.obtainedMarks;
    });

    const averagePct = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;
    const gradeObj = getGradeAndPoints(averagePct);

    const totalDaysRecorded = kidAtt.length;
    const presentDays = kidAtt.filter(x => x.status === 'PRESENT' || x.status === 'LATE').length;
    const attendancePercentage = totalDaysRecorded > 0 ? (presentDays / totalDaysRecorded) * 100 : 100;

    const kidComments = comments.filter(c => c.studentId === activeStudent.id);
    const kidAssignments = assignments.filter(a => a.classId === activeStudent.classId);

    return {
      classObj,
      marksList: kidMarks,
      attendanceList: kidAtt,
      averagePct: Math.round(averagePct),
      grade: gradeObj.grade,
      points: gradeObj.points,
      comment: gradeObj.comment,
      commentSw: gradeObj.commentSw,
      presents: presentDays,
      totalDays: totalDaysRecorded,
      attendancePct: Math.round(attendancePercentage),
      commentsList: kidComments,
      assignmentsList: kidAssignments,
    };
  };

  const dashboardCtx = getActiveStudentAnalytics();

  // Load class teacher for Parent view context (Rule 3)
  const activeTeacher = (() => {
    if (!activeStudent || !dashboardCtx || !dashboardCtx.classObj) return null;
    const teacherId = dashboardCtx.classObj.classTeacherId;
    if (!teacherId) return null;
    return DB.getTeachers().find(t => t.id === teacherId) || null;
  })();

  // Simulated mobile transaction triggering
  const simulatePayment = () => {
    if (!feesMap || !activeStudent) return;
    const payAmt = feesMap.total - feesMap.paid;
    if (payAmt <= 0) {
      alert(lang === 'en' ? 'School fees already fully cleared!' : 'Ada ya shule tayari imelipwa kikamilifu!');
      return;
    }

    const receiptRef = `TXN-${Math.floor(100000 + Math.random() * 900000)}Y`;
    setPaySuccessLog(receiptRef);
    
    // Simulate updating paid amount globally for this view session
    feesMap.paid = feesMap.total;
    feesMap.transactions.unshift({
      date: new Date().toISOString().split('T')[0],
      amount: payAmt,
      reference: receiptRef,
      method: 'Simulated Mobile Payment Gateway'
    });

    DB.addAudit(
      'Online Fees Cleared',
      `Parent ${currentParent.fullName} authorized settlement of outstanding school balance of TZS ${payAmt.toLocaleString()} for student ${activeStudent.fullName}.`,
      currentParent.fullName
    );

    setTimeout(() => {
      setPaySuccessLog(null);
      setSuccessMsg(lang === 'en' ? 'Simulated payment processed! Account updated.' : 'Malipo yaliyofananishwa yamekamilika! Ada imesasishwa.');
      reloadParentScope();
    }, 4500);
  };

  // Language & child reactive AI welcome log initialization (Rule 4)
  useEffect(() => {
    setAiChatLogs([
      {
        sender: 'assistant',
        text: lang === 'en' 
          ? `Habari! I am your SSMS AI parent counselor. Nimechambua matokeo ya **${activeStudent ? activeStudent.fullName : 'mwanafunzi'}** (GPA ya **${dashboardCtx ? dashboardCtx.averagePct : 75}%**, kiwango cha mahudhurio ya **${dashboardCtx ? dashboardCtx.attendancePct : 90}%**, kazi za nyumbani **${dashboardCtx ? dashboardCtx.assignmentsList.length : 0}**).\n\nNipo tayari kukupatia mbinu bora za ufaulu na kukuongoza katika masuala ya:\n\n• 📅 **Attendance & Morning routine**\n• 📈 **Academic Marks & GPA Growth**\n• 📝 **NECTA Exam Preparation Blueprint**\n• 🛡️ **Habits, Discipline & Digital rules**\n• ⏳ **Time Management & Study Timetable**\n\nNifahamishe ungependa nianze na kipengele gani sasa!`
          : `Habari! Mimi ni Mshauri wako wa AI wa kusaidia Wazazi. Nimechambua taarifa za **${activeStudent ? activeStudent.fullName : 'mwanafunzi'}** mtawalia (GPA ya masomo ni **${dashboardCtx ? dashboardCtx.averagePct : 75}%**, mahudhurio ni **${dashboardCtx ? dashboardCtx.attendancePct : 90}%**, kazi za nyumbani ni **${dashboardCtx ? dashboardCtx.assignmentsList.length : 0}**).\n\nNipo tayari kukupa uchambuzi thabiti wa malezi kusaidia masuala ya:\n\n• 📅 **Mahudhurio na Ratiba za asubuhi**\n• 📈 **Ufaulu na Kupandisha Alama (GPA)**\n• 📝 **Kujiandaa vizuri na Mitihani (NECTA Prep)**\n• 🛡️ **Nidhamu, nidhamu na mipaka ya simu**\n• ⏳ **Usimamizi wa muda na Ratiba za kujisomea**\n\nChagua mada au niandikie hapa chini nikutolee miongozo na mapendekezo yoyote sasa!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [lang, activeStudentId]);

  // Expert keyword parser for dynamic parents support chatbot (Rule 4)
  const triggerAiResponse = (userQuery: string) => {
    if (!userQuery.trim()) return;
    setIsAiLoading(true);
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgObj = { sender: 'user' as const, text: userQuery, timestamp };
    
    setAiChatLogs(prev => [...prev, userMsgObj]);
    setUserMessage('');
    
    setTimeout(() => {
      const q = userQuery.toLowerCase();
      let response = "";
      
      const attendance = dashboardCtx ? dashboardCtx.attendancePct : 85;
      const gpa = dashboardCtx ? dashboardCtx.averagePct : 70;
      const childName = activeStudent ? activeStudent.fullName : (lang === 'en' ? "your child" : "mwanafunzi");
      const classLevel = dashboardCtx && dashboardCtx.classObj ? dashboardCtx.classObj.name : "Form / Standard";
      
      if (q.includes('attendance') || q.includes('mahudhurio') || q.includes('siku') || q.includes('shule') || q.includes('late') || q.includes('absent')) {
        response = lang === 'en'
          ? `🔍 **AI Attendance Analysis for ${childName}:** \n\n` +
            `Your child's attendance rate is currently **${attendance}%**. \n\n` +
            (attendance >= 90 
              ? "This is highly satisfactory! Maintaining an attendance rate of over 95% ensures continuous lesson cohesion and outstanding academic results."
              : "This is critical! Frequent absenteeism disrupts the learning rhythm. \n\n" +
                "**Recommended Action Plan:**\n" +
                "1. **Morning Routine:** Build a strict sleeping timeline so they rise refreshed.\n" +
                "2. **Transit Contingency:** Connect with transport providers in Tanzania regions to ensure reliable travel.\n" +
                "3. **Discipline & Habits:** Ensure they understand that attendance contributes directly to school records and confidence.")
          : `🔍 **Uchambuzi wa Mahudhurio kwa ${childName}:** \n\n` +
            `Kiwango cha mahudhurio ya mwanafunzi ni **${attendance}%**. \n\n` +
            (attendance >= 90
              ? "Kiwango hiki kinakidhi vigezo kwa asilimia mia moja! Kuendelea na mahudhurio thabiti yatamfanya aendelee kufaham mwendo mzuri wa masomo."
              : "Hali hii inahitaji usimamizi wa karibu sana! Vipindi vya kukosa shule vinaathiri kiwango cha ufaulu. \n\n" +
                "**Mkakati wetu Pendekezwa:**\n" +
                "1. **Muda wa Kulala na Kuamka:** Weka utaratibu wa kulala mapema ili asilete uchelewaji.\n" +
                "2. **Ratiba ya Usafiri:** Wasiliana na huduma za basi au madereva wa maeneo ya karibu.\n" +
                "3. **Ushirikiano wakaribu:** Mshirikishe Mwalimu wake kujua kama kuna sababu nyingine za kiafya.");
      } 
      else if (q.includes('performance') || q.includes('gpa') || q.includes('marks') || q.includes('ufaulu') || q.includes('alama') || q.includes('masomo') || q.includes('math') || q.includes('english') || q.includes('hesabu')) {
        response = lang === 'en'
          ? `📈 **AI Performance & GPA Diagnosis for ${childName}:** \n\n` +
            `Your child currently holds a term average of **${gpa}%** with unified grade **${dashboardCtx?.grade || 'B'}**. \n\n` +
            "**Strategic Recommendations for Academic Improvement:**\n" +
            "1. **Weekly Topic Review:** Set aside 2 hours every Sunday to review difficult subjects such as Mathematics or Science.\n" +
            "2. **Avoid Exam Panic:** Solve previous NECTA standard mock questions to familiarize them with structural exam patterns. \n" +
            "3. **Class Teacher Alignment:** Connect with their class teacher using the direct contact tools on your Home tab to request extra remedial review sheets."
          : `📈 **Uchambuzi wa Ufaulu wa Kitaaluma kwa ${childName}:** \n\n` +
            `Wastani wa sasa wa mwanafunzi ni **${gpa}%** yenye daraja la **${dashboardCtx?.grade || 'B'}**. \n\n` +
            "**Mapendekezo ya Kitaaluma:**\n" +
            "1. **Mapitio ya Kila Wiki:** Tenga masaa 2 kila Jumapili kupitia masomo magumu kama Hesabu au Sayansi.\n" +
            "2. **Kujiandaa na Mitihani:** Tumia mifano ya mitihani iliyopita ya NECTA kwa mazoezi ya vitendo nyumbani.\n" +
            "3. **Shirikiana na Mwalimu:** Tumia vitufe vya kupiga simu au kutuma barua pepe kwenye ukurasa wa nyumbani kuomba mazoezi ya ziada kwa mwalimu wake.";
      }
      else if (q.includes('exam') || q.includes('test') || q.includes('necta') || q.includes('mitihani') || q.includes('mtihani')) {
        response = lang === 'en'
          ? `📝 **AI Exam & NECTA Preparation Blueprint:** \n\n` +
            `For ${childName} in ${classLevel}, exam stress can be minimized through deliberate, spaced learning.\n\n` +
            "**NECTA Prep Checkpoints for Parents:**\n" +
            "1. **Mock Tests:** Let them attempt timed practice papers in a quiet environment without electronic devices.\n" +
            "2. **Formula Sheets:** Create physical index cards for math equations and scientific formulas, posting them on their bedroom wall.\n" +
            "3. **Sustenance & Rest:** Ensure high-protein nutrition and 8+ hours of sleep during exam weeks to optimize cognitive output."
          : `📝 **Mwongozo wa AI wa Maandalizi ya Mitihani na NECTA ya ${childName}:** \n\n` +
            `Kwa mwanafunzi katika daraja la ${classLevel}, hofu ya mtihani inaweza kupunguzwa kwa kuanza maandalizi mapema.\n\n` +
            "**Orodha ya Maandalizi ya Mitihani:**\n" +
            "1. **Mazingira Tulivu:** Tenga sehemu maalum ya kusomea isiyo na kelele wala vifaa vya kielektroniki.\n" +
            "2. **Kadi za Kanuni za Hesabu:** Tofautisha kanuni na fomyula za muhimu na msaidie kuziandika kwenye kadi ndogo za kubeba mfukoni.\n" +
            "3. **Chakula na Kulala:** Hakikisha anapata usingizi wa kutosha na mlo wenye afya kipindi cha mitihani ili kuweka akili timamu.";
      }
      else if (q.includes('habit') || q.includes('discipline') || q.includes('nidhamu') || q.includes('tabia') || q.includes('mwenendo')) {
        response = lang === 'en'
          ? `🛡️ **AI Habit & Social-Emotional Discipline Guide:** \n\n` +
            `Academic success stems directly from emotional stability and consistency.\n\n` +
            "**Recommended Habits Strategy:**\n" +
            "1. **Digital Limits:** Limit entertainment screens (TikTok, games, YouTube) to weekends only.\n" +
            "2. **Household Chores Alignment:** Assign light morning duties to reinforce personal responsibility and neatness.\n" +
            "3. **Positive Praise:** Acknowledge efforts, not just flawless marks. Celebrate incremental improvements to build strong learner confidence."
          : `🛡️ **Mwongozo wa AI wa Nidhamu na Tabia Bora za Kijamii:** \n\n` +
            `Ufaulu wa masomoni unatokana na nidhamu imara, mienendo ya kila siku, na utulivu wa kisaikolojia.\n\n` +
            "**Mbinu za Kujenga Tabia Muhimu:**\n" +
            "1. **Kudhibiti Skrini za Simu & Televisheni:** Zuia matumizi yasiyo na tija wakati wa juma; ruhusu wikendi tu.\n" +
            "2. **Majukumu Ndani ya Nyumba:** Mpe mtoto kazi ndogondogo kulingana na umri kumsaidia kuelewa wajibu na nidhamu.\n" +
            "3. **Kupongeza Jitihada:** Mshauri mtoto na mpongeze pale anapopandisha ufaulu hata kwa kiwango kidogo ili kumjengea morali ya masomo.";
      }
      else if (q.includes('time') || q.includes('schedule') || q.includes('homework') || q.includes('muda') || q.includes('ratiba') || q.includes('kazi za nyumbani') || q.includes('timemanagement')) {
        response = lang === 'en'
          ? `⏳ **AI Time Management & Homework Routine planner:** \n\n` +
            `Efficient time budget management prevents last-minute panic.\n\n` +
            "**Homework Focus Routine:**\n" +
            "1. **The 'Golden Hour':** Start homework exactly 1 hour after arriving from school. This allows short downtime without breaking studying mental momentum.\n" +
            "2. **Pomodoro Technique:** Encourage studying in 25-minute absolute focus blocks, followed by short 5-minute movement breaks.\n" +
            "3. **Workspace Sanitation:** Keep the homework desk free of clutter, ensuring pens, books, and calculators are prepared beforehand."
          : `⏳ **Mwongozo wa AI wa Kusimamia Muda na Ratiba za Nyumbani:** \n\n` +
            `Usimamizi thabiti wa muda huondoa mrundikano na hofu ya mwisho wa muhula.\n\n` +
            "**Ratiba ya Mazoezi ya Shuleni (Homework):**\n" +
            "1. **Muda Bora (Golden Hour):** Kazi za shule zianze saa 1 tu baada ya kurudi kutoka shuleni ili kubaki na nguvu za darasani.\n" +
            "2. **Mbinu ya Pomodoro:** Mfundishe kusoma kwa vizuizi vya dakika 25 kisha anapumzika dakika 5 ili kurejesha umakini.\n" +
            "3. **Mazingira Safi:** Hakikisha eneo lake linavutia na halina vikwazo wala michezo.";
      }
      else {
        response = lang === 'en'
          ? `🏫 **SSMS Parent Guide AI Response:**\n\n` +
            `Thank you for asking about **${childName}** index status. As a parent of a **${classLevel}** pupil, your primary lever of influence is consistent household environment support.\n\n` +
            "For specific targeted guidance, please write a request enclosing terms like:\n" +
            "- **'attendance'** to review transit and morning routine audits.\n" +
            "- **'performance'** to track current GPAs and target exam improvements.\n" +
            "- **'exam'** to see standard study checklists.\n" +
            "- **'discipline'** to manage screen time boundaries.\n" +
            "- **'time'** to set up a robust homework study timetable."
          : `🏫 **Msaada wa Ushauri wa Wazazi wa AI:**\n\n` +
            `Asante kwa kuniuliza kuhusu maendeleo ya **${childName}** katika daraja lake la **${classLevel}**. Kama mzazi, ushirikiano wako nyumbani ndio msingi mkuu wa malezi bora.\n\n` +
            "Ili upate majibu maalum, tafadhali uliza ukitumia maneno kama:\n" +
            "- **'mahudhurio'** kuangalia mienendo ya uchelewaji.\n" +
            "- **'ufaulu'** kupata mbinu za kupandisha GPA ya mtihani.\n" +
            "- **'mtihani'** au **'necta'** kupokea orodha ya kujiandaa.\n" +
            "- **'nidhamu'** kupanga tabia bora na kuzuia simu.\n" +
            "- **'muda'** au **'ratiba'** kusanidi meza ya kujisomea.";
      }
      
      const assistantMsgObj = {
        sender: 'assistant' as const,
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setAiChatLogs(prev => [...prev, assistantMsgObj]);
      setIsAiLoading(false);
    }, 1250);
  };

  return (
    <div className="bg-slate-950 min-h-screen w-full flex justify-center text-slate-800 antialiased" id="parent-mobile-main-wrapper">
      
      {/* NATIVE STANDALONE MOBILE VIEWPORT CONTAINER */}
      <div className="w-full max-w-[430px] min-w-[320px] min-h-screen flex flex-col relative overflow-hidden bg-[#F8FAFC]" id="parent-phone-container">

        {/* MOBILE COMPONENT HEADER BAR */}
        <div className="bg-[#1E40AF] text-white px-4 py-3 shrink-0 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-[#38BDF8] text-blue-900 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
              {lang === 'en' ? 'P' : 'M'}
            </div>
            <div className="truncate font-sans">
              <h1 className="text-xs font-bold leading-tight truncate">{lang === 'en' ? 'Parent Mobile App' : 'App ya Mzazi'}</h1>
              <span className="text-[9px] text-sky-205 font-bold block leading-none">{currentParent ? currentParent.fullName : 'Parent Area'}</span>
            </div>
          </div>

          <button 
            onClick={() => setIsLinkingOpen(true)}
            className="px-2.5 py-1.5 bg-white/10 hover:bg-white/25 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all"
            id="parent-header-action"
          >
            <Plus className="h-3 w-3" />
            <span>{lang === 'en' ? 'Link Kid' : 'Unganisha'}</span>
          </button>
        </div>

        {/* ACTIVE Student Picker view inside phone slider */}
        {verifiedChildren.length > 0 && (
          <div className="bg-white border-b border-slate-150 p-2 shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-none select-none">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider font-mono shrink-0 pr-1">{lang === 'en' ? 'Child:' : 'Mtoto:'}</span>
            {verifiedChildren.map(child => {
              const isCur = child.id === activeStudentId;
              const initials = child.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <button
                  key={child.id}
                  onClick={() => {
                    setActiveStudentId(child.id);
                    window.dispatchEvent(new Event('ssms_db_update'));
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-bold transition-all shrink-0 hover:bg-slate-100 cursor-pointer ${
                    isCur 
                      ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs scale-102' 
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[8px] font-black ${isCur ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {initials}
                  </div>
                  <span className="truncate max-w-[80px] font-black">{child.fullName.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ACTIVE ALERT BANNER IN PHONE CONTAINER */}
        {(successMsg || errorMsg) && (
          <div className="p-2 space-y-1 animate-fade-in shrink-0">
            {successMsg && (
              <div className="bg-emerald-600 text-white font-medium text-[9.5px] py-1.5 px-3 rounded-lg shadow-md flex items-center justify-between border border-emerald-500/10">
                <span className="truncate">{successMsg}</span>
                <button onClick={() => setSuccessMsg('')} className="font-bold cursor-pointer text-xs ml-2">×</button>
              </div>
            )}
            {errorMsg && (
              <div className="bg-rose-600 text-white font-medium text-[9.5px] py-1.5 px-3 rounded-lg shadow-md flex items-center justify-between border border-rose-500/10">
                <span className="truncate">{errorMsg}</span>
                <button onClick={() => setErrorMsg('')} className="font-bold cursor-pointer text-xs ml-2">×</button>
              </div>
            )}
          </div>
        )}

        {/* INTERNAL MOBILE VIEWPORT WITH TAB ROUTING */}
        <div className="flex-1 overflow-y-auto p-3.5 pb-20 space-y-4">
          <AnimatePresence mode="wait">
            
            {/* -------------------- TAB 1: PHONE APP HOME PAGE -------------------- */}
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
                id="parent-home-panel-view"
              >
                {/* 1. VERIFIED CONNECTED CARD STATS */}
                {activeStudent && dashboardCtx ? (
                  <div className="bg-gradient-to-br from-[#1E3A8A] to-[#0D1E4A] text-white p-4 rounded-3xl shadow-md space-y-3.5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-black text-sky-200 font-mono tracking-wider">{lang === 'en' ? 'SCHOLAR METRIC' : 'KIELEZO CHA MWANAFUNZI'}</span>
                        <h2 className="text-base font-black truncate max-w-[180px] mt-0.5">{activeStudent.fullName}</h2>
                        <span className="text-[10px] font-mono font-medium text-slate-300 block -mt-0.5">
                          {lang === 'en' ? 'Admission Code:' : 'Namba ya Usajili:'} {activeStudent.admissionNumber}
                        </span>
                      </div>
                      
                      <span className="bg-white/10 border border-white/15 text-white text-[9px] font-bold px-2.5 py-1 rounded-full text-right shrink-0">
                        {dashboardCtx.classObj ? `${dashboardCtx.classObj.name} ${activeStudent.stream}` : 'No Class'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/10 justify-items-center">
                      <div className="text-center">
                        <span className="text-[8px] text-sky-200 uppercase block font-black">{lang === 'en' ? 'Attendance' : 'Mahudhurio'}</span>
                        <strong className="text-sm font-extrabold text-[#22C55E] block mt-0.5">{dashboardCtx.attendancePct}%</strong>
                      </div>
                      <div className="text-center border-l border-white/10 px-1.5">
                        <span className="text-[8px] text-sky-200 uppercase block font-black">{lang === 'en' ? 'GPA Avg' : 'Wastani'}</span>
                        <strong className="text-sm font-extrabold text-[#38BDF8] block mt-0.5">{dashboardCtx.averagePct}%</strong>
                      </div>
                      <div className="text-center border-l border-white/10 pl-1.5">
                        <span className="text-[8px] text-sky-200 uppercase block font-black">{lang === 'en' ? 'Tuition Paid' : 'Ada iliyolipwa'}</span>
                        <strong className="text-[10px] font-extrabold text-white block mt-1">
                          {feesMap ? `${Math.round((feesMap.paid / feesMap.total) * 100)}%` : '0%'}
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-center space-y-3 shadow-3xs">
                    <div className="h-10 w-10 text-sky-600 bg-white shadow-3xs rounded-full flex items-center justify-center mx-auto text-base">ℹ️</div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 uppercase">{lang === 'en' ? 'Connect Pupil Profile' : 'Munganishe Mtoto wako'}</h4>
                      <p className="text-[10px] text-slate-505 leading-relaxed">
                        {lang === 'en' ? 'To display academic performance reports, attendance rates, and fee statements, please connect child profile using parental codes.' : 'Ili uweze kuona ripoti za mwanafunzi na ada zake tafadhali munganishe kwanza.'}
                      </p>
                    </div>

                    <button
                      onClick={() => setIsLinkingOpen(true)}
                      className="w-full py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{lang === 'en' ? 'Connect Child Now' : 'Munganishe Sasa'}</span>
                    </button>
                  </div>
                )}

                {/* 2. SCHOOL BULLETINS BANNER BOARD */}
                <div className="bg-white border border-slate-150 rounded-2xl p-3.5 shadow-2xs space-y-3 text-left">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <Volume2 className="h-4.5 w-4.5 text-[#1E3A8A] shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        📢 {lang === 'en' ? 'School Campus Bulletins' : 'Matangazo ya Shuleni'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 divide-y divide-slate-50">
                    {announcements.map((ann, i) => (
                      <div key={ann.id} className={`pt-2.5 ${i === 0 ? 'pt-0' : ''} space-y-1`}>
                        <div className="flex items-center justify-between text-[8px] font-mono">
                          <span className="text-slate-400">{ann.publishedDate}</span>
                          <span className="text-indigo-600 font-extrabold uppercase bg-indigo-50 px-1.5 py-0.2 rounded">{lang === 'en' ? 'Office' : 'Ofisi'}</span>
                        </div>
                        <h4 className="text-[10.5px] font-bold text-slate-900 leading-tight">{lang === 'en' ? ann.titleEn : ann.titleSw}</h4>
                        <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{lang === 'en' ? ann.contentEn : ann.contentSw}</p>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-400 italic">
                        {lang === 'en' ? 'No active bulletins.' : 'Hakuna matangazo kwa sasa.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* CLASS TEACHER PROFILE CARD (Rule 3) */}
                {activeStudent && dashboardCtx && activeTeacher && (
                  <div className="bg-white border border-slate-150 rounded-2xl p-3.5 shadow-2xs space-y-3 text-left" id="class-teacher-info-card">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        🧑‍🏫 {lang === 'en' ? 'Class Teacher Profile' : 'Mwalimu wa Darasa'}
                      </span>
                      <span className="text-[8px] uppercase font-black tracking-wider bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded font-mono">Contact Info</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150`} 
                        referrerPolicy="no-referrer"
                        alt="Teacher" 
                        className="h-11 w-11 rounded-xl object-cover ring-2 ring-emerald-500/10 bg-slate-100 shrink-0"
                      />
                      <div className="leading-tight space-y-0.5">
                        <strong className="text-xs font-black text-slate-900 block">{activeTeacher.fullName}</strong>
                        <p className="text-[9.5px] text-slate-550 font-medium">
                          {activeTeacher.qualification}
                        </p>
                        <span className="inline-block text-[8.5px] font-bold bg-indigo-50/70 text-indigo-700 px-1.5 py-0.2 rounded-md font-mono mt-0.5">
                          📚 {lang === 'en' ? 'Teaches:' : 'Masomo:'} {activeTeacher.specialization || 'All Subjects'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (direct links for mobile browsers) */}
                    <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                      <a 
                        href={`tel:${activeTeacher.phone}`}
                        className="p-1.8 bg-slate-50 hover:bg-[#1E3A8A] hover:text-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 rounded-xl text-[9.5px] font-extrabold flex items-center justify-center gap-1 transition-all border border-slate-200 dark:border-slate-800"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{lang === 'en' ? 'Call Teacher' : 'Piga Simu'}</span>
                      </a>
                      <a 
                        href={`mailto:${activeTeacher.email}`}
                        className="p-1.8 bg-slate-50 hover:bg-[#1E3A8A] hover:text-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 rounded-xl text-[9.5px] font-extrabold flex items-center justify-center gap-1 transition-all border border-slate-200 dark:border-slate-800"
                      >
                        <Mail className="h-3 w-3" />
                        <span>{lang === 'en' ? 'Email Teacher' : 'Tuma Barua'}</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* 3. DYNAMIC WORK & FEEDBACK LOG QUOTIENT ON HOME PAGE */}
                {activeStudent && dashboardCtx && (
                  <div className="bg-sky-50 border border-sky-100 p-3.5 rounded-2xl space-y-1.5 text-center">
                    <Sparkles className="h-4.5 w-4.5 text-[#1E3A8A] mx-auto animate-pulse" />
                    <span className="text-[8px] uppercase font-black text-slate-400 block">{lang === 'en' ? 'Daily Work Quotient' : 'Kipimo cha Zoezi la Masomo'}</span>
                    <strong className="text-xs font-black text-slate-900 block">
                      {lang === 'en' ? `${dashboardCtx.assignmentsList.length} Active Homework Sheets` : `${dashboardCtx.assignmentsList.length} Kazi za Mazoezi ya Nyumbani`}
                    </strong>
                    <p className="text-[9px] text-slate-500 leading-tight">
                      {lang === 'en' ? 'Check the "Activity" tab to see teacher feedback, daily attendance sheets, lists of class projects, and comments.' : 'Angalia sehemu ya "Mahudhurio" kuona maoni ya walimu, ripoti, na kazi za nyumbani.'}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* -------------------- TAB 2: ACADEMIC PERFORMANCE SUMMARY -------------------- */}
            {activeTab === 'exams' && (
              <motion.div
                key="exams"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
                id="parent-exams-panel"
              >
                {activeStudent && dashboardCtx ? (
                  <div className="space-y-4">
                    {/* ACADEMIC INDEX RING */}
                    <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs text-center space-y-2 relative overflow-hidden text-left">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#1E3A8A]"></div>
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider font-mono block text-center">{lang === 'en' ? 'CONSOLIDATED SEMESTER SUMMARY' : 'MUHTASARI WA KITAALUMA'}</span>
                      <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-sm font-black mx-auto shadow-2xs">
                        {dashboardCtx.grade}
                      </div>
                      <div className="leading-tight text-center">
                        <strong className="text-xs font-black text-slate-900 block">{lang === 'en' ? 'GPA Points Ratio' : 'Kiwango cha Sifa'}: {dashboardCtx.points}</strong>
                        <p className="text-[9.5px] text-slate-500 font-semibold mt-1">
                          "{lang === 'en' ? dashboardCtx.comment : dashboardCtx.commentSw}"
                        </p>
                      </div>
                    </div>

                    {/* SCORES DETAILED SHEET LIST */}
                    <div className="bg-white border border-slate-150 rounded-2xl shadow-3xs overflow-hidden text-left">
                      <div className="px-3.5 py-2.5 border-b border-slate-50 bg-slate-50 flex items-center justify-between">
                        <span className="text-[9px] font-extrabold text-[#1E3A8A] uppercase tracking-wider font-mono">
                          📊 {lang === 'en' ? 'Topic Marks Register' : 'Daftari la Alama za Mitihani'}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400 pr-1">Total: {dashboardCtx.marksList.length} subjects</span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {dashboardCtx.marksList.map(m => {
                          const sub = subjects.find(s => s.id === m.subjectId);
                          const scorePct = m.totalMarks > 0 ? (m.obtainedMarks / m.totalMarks) * 100 : 0;
                          const gd = getGradeAndPoints(scorePct);

                          return (
                            <div key={m.id} className="p-3 hover:bg-slate-50 text-xs flex justify-between items-center transition-transform duration-200 hover:scale-[1.01]">
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-[#1E3A8A] uppercase block font-mono text-[9.5px] truncate max-w-[150px]">{sub ? sub.name : 'Subject'}</span>
                                <span className="text-[8.5px] text-slate-450 block font-mono">{m.type} • Checked</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="text-right leading-tight">
                                  <span className="font-black text-slate-950 block">{m.obtainedMarks}/{m.totalMarks}</span>
                                  <span className="text-[8px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">{scorePct.toFixed(0)}% avg</span>
                                </div>

                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                  scorePct >= 75 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : scorePct >= 50
                                    ? 'bg-amber-50 text-amber-570 border border-amber-100'
                                    : 'bg-rose-50 text-rose-600 border border-rose-105'
                                }`}>
                                  {gd.grade}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {dashboardCtx.marksList.length === 0 && (
                          <div className="p-8 text-center text-xs text-slate-400 italic">
                            No academic assessment score cards have been entered yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border rounded-2xl p-8 text-center">
                    <span className="text-3xl block">📊</span>
                    <h3 className="text-xs font-bold text-slate-800 mt-2">Marks Statement Locked</h3>
                    <p className="text-[10px] text-slate-450 mt-1">Pupil selection is empty.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* -------------------- TAB 3: ATTENDANCE & ACTIVITY TRACKER -------------------- */}
            {activeTab === 'attendance' && (
              <motion.div
                key="attendance"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
                id="parent-attendance-panel-view"
              >
                {activeStudent && dashboardCtx ? (
                  <div className="space-y-4">
                    {/* RADIAL CHART METRIC ATTENDANCE VIEW */}
                    <div className="bg-white border border-slate-150 rounded-2xl p-3.5 shadow-3xs flex items-center gap-3.5 text-left relative overflow-hidden">
                      <div className="absolute top-0 left-1 w-1 h-full bg-[#22C55E]"></div>
                      <div className="h-14 w-14 shrink-0 rounded-full border-4 border-[#22C55E]/10 border-t-[#22C55E] flex items-center justify-center font-black text-slate-900 text-xs text-center">
                        {dashboardCtx.attendancePct}%
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[8px] uppercase font-bold text-slate-400 block">{lang === 'en' ? 'ATTENDANCE EFFICIENCY RATE' : 'KIWANGO CHA MAHURHURIO'}</span>
                        <strong className="text-[11px] font-extrabold text-slate-900 block leading-tight">
                          {lang === 'en' ? `${dashboardCtx.presents} days present / ${dashboardCtx.totalDays} sessions` : `${dashboardCtx.presents} siku za shule kati ya ${dashboardCtx.totalDays}`}
                        </strong>
                        <p className="text-[8.5px] text-slate-500 font-medium font-sans">Validated by daily registration cards.</p>
                      </div>
                    </div>

                    {/* DYNAMIC ACTIVITY SECTIONS as elegant horizontal row items or single scroll layout inside phone frame (responsive grids) */}
                    <div className="grid grid-cols-1 gap-4" id="parent-dashboard-container">
                      
                      {/* SUB SECTION 1: ATTENDANCE ROLL LIST - Clean card with interactive hover scale transform durability */}
                      <div className="bg-white border border-slate-150 rounded-2xl p-3.5 shadow-2xs transition-transform duration-200 hover:scale-105" id="parent-subtab-check-logs">
                        <span className="text-[9px] font-black text-[#1E3A8A] uppercase tracking-wider block border-b border-slate-50 pb-2 mb-3 font-mono text-left">
                          📅 {lang === 'en' ? 'Check-in History logs' : 'Daftari la Mahudhurio'}
                        </span>

                        <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                          {dashboardCtx.attendanceList.map(att => (
                            <div key={att.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                              <div className="space-y-0.5">
                                <span className="text-[9.5px] font-bold text-slate-900 block font-mono text-left">📅 {att.date}</span>
                                <span className="text-[8px] text-slate-400 block text-left">{att.recordedBy}</span>
                              </div>

                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                                att.status === 'PRESENT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {att.status}
                              </span>
                            </div>
                          ))}
                          {dashboardCtx.attendanceList.length === 0 && (
                            <div className="text-center py-4 text-[9px] text-slate-400 italic">No attendance records yet.</div>
                          )}
                        </div>
                      </div>

                      {/* SUB SECTION 2: CLASS HOMEWORK - Clean card with interactive hover scale transform durability */}
                      <div className="bg-white border border-slate-150 rounded-2xl p-3.5 shadow-2xs transition-transform duration-200 hover:scale-105" id="parent-subtab-homework-logs">
                        <span className="text-[9px] font-black text-[#1E3A8A] uppercase tracking-wider block border-b border-slate-50 pb-2 mb-3 font-mono text-left">
                          📝 {lang === 'en' ? 'Homework assignments' : 'Mazoezi ya Nyumbani'}
                        </span>

                        <div className="space-y-2.5 max-h-[140px] overflow-y-auto scrollbar-thin text-left">
                          {dashboardCtx.assignmentsList.map(asg => {
                            const sub = subjects.find(s => s.id === asg.subjectId);
                            return (
                              <div key={asg.id} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between space-y-1">
                                <div className="flex justify-between items-center text-[7.5px] font-mono">
                                  <span className="text-[#1E3A8A] font-extrabold uppercase truncate max-w-[80px]">{sub ? sub.name : 'SUBJECT'}</span>
                                  <span className="text-rose-600 font-bold bg-rose-50 px-1 py-0.2 rounded">Due: {asg.dueDate}</span>
                                </div>
                                <h4 className="text-[9.5px] font-bold text-slate-900 leading-tight">{asg.title}</h4>
                                <p className="text-[8.5px] text-slate-500 leading-tight line-clamp-2">{asg.description}</p>
                              </div>
                            );
                          })}
                          {dashboardCtx.assignmentsList.length === 0 && (
                            <div className="text-center py-4 text-[9px] text-slate-400 italic">No homework worksheets assigned.</div>
                          )}
                        </div>
                      </div>

                      {/* SUB SECTION 3: TEACHER REMARKS - Clean card with interactive hover scale transform durability */}
                      <div className="bg-white border border-slate-150 rounded-2xl p-3.5 shadow-2xs transition-transform duration-200 hover:scale-105" id="parent-subtab-reviews-logs">
                        <span className="text-[9px] font-black text-[#1E3A8A] uppercase tracking-wider block border-b border-slate-50 pb-2 mb-3 font-mono text-left">
                          💬 {lang === 'en' ? 'Teacher Conduct Remarks' : 'Maoni ya Tabia'}
                        </span>

                        <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin text-left">
                          {dashboardCtx.commentsList.map(c => (
                            <div key={c.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-left space-y-1.5">
                              <p className="text-[9px] text-slate-600 leading-normal font-medium">"{lang === 'en' ? c.commentEn : c.commentSw}"</p>
                              <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[8px] font-mono text-slate-450">
                                <span>{c.teacherName}</span>
                                <span>📅 {c.date}</span>
                              </div>
                            </div>
                          ))}
                          {dashboardCtx.commentsList.length === 0 && (
                            <div className="text-center py-4 text-[9px] text-slate-400 italic">No teacher reviews found.</div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border rounded-2xl p-8 text-center">
                    <span className="text-3xl block">📅</span>
                    <h3 className="text-xs font-bold text-slate-800 mt-2">Activity Data Locked</h3>
                    <p className="text-[10px] text-slate-450 mt-1">Pupil selection is empty.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* -------------------- TAB 4: FEES METRIC LOGS AND TRANSACTIONS -------------------- */}
            {activeTab === 'fees' && (
              <motion.div
                key="fees"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
                id="parent-fees-panel-view"
              >
                {activeStudent && feesMap ? (
                  <div className="space-y-4">
                    {/* FEES INVOICE BRIEF CARDS */}
                    <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs space-y-3 flex flex-col text-left relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#1E3A8A]"></div>
                      <span className="text-[9px] uppercase font-black text-slate-400 block font-mono tracking-wider">
                        {feesMap.isGovernmentContribution 
                          ? (lang === 'en' ? 'GOVERNMENT CONTRIBUTIONS LEDGER' : 'DAFTARI LA MICHANGO YA SERIKALI')
                          : (lang === 'en' ? 'TUITION STATEMENT LEDGER' : 'DAFTARI LA ADA MAALUM')}
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-[9.5px] text-slate-550 font-bold block">
                          {feesMap.isGovernmentContribution 
                            ? (lang === 'en' ? 'Outstanding Contribution Balance' : 'Michango Sugu ya Hiari')
                            : (lang === 'en' ? 'Outstanding Tuition Balance' : 'Baki la Ada ya Masomo')}
                        </span>
                        <strong className="text-xl font-black text-slate-900 block font-mono">
                          {(feesMap.total - feesMap.paid).toLocaleString()} TZS
                        </strong>
                      </div>

                      {/* FEE CLEARANCE PERCENT BAR */}
                      <div className="space-y-1 pt-1 border-t border-slate-50">
                        <div className="flex justify-between text-[8px] font-mono text-slate-450">
                          <span>
                            {feesMap.isGovernmentContribution 
                              ? (lang === 'en' ? 'Contributed: ' : 'Iliyochangwa: ') 
                              : (lang === 'en' ? 'Paid: ' : 'Iliyolipwa: ')}
                            {feesMap.paid.toLocaleString()} TZS
                          </span>
                          <span>
                            {feesMap.isGovernmentContribution 
                              ? (lang === 'en' ? 'Target: ' : 'Malengo: ') 
                              : (lang === 'en' ? 'Total: ' : 'Jumla ya Ada: ')}
                            {feesMap.total.toLocaleString()} TZS
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${feesMap.total > 0 ? Math.min(100, (feesMap.paid / feesMap.total) * 100) : 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* REALTIME MOBILE PAYMENTS INTEGRATION */}
                    <div className="bg-white border border-slate-150 rounded-2xl p-3.5 shadow-3xs text-left space-y-2.5">
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-4 w-4 text-[#1E3A8A] shrink-0" />
                        <span className="text-[9px] font-black uppercase text-slate-400 block font-mono tracking-wider">
                          {feesMap.isGovernmentContribution 
                            ? (lang === 'en' ? 'Contribution Gateway Pay' : 'Lipia Michango ya Shule')
                            : (lang === 'en' ? 'Realtime Mobile Payment' : 'Lipia Ada kwa Simu')}
                        </span>
                      </div>

                      <div>
                        <p className="text-[9px] text-slate-500 leading-normal font-medium">
                          {feesMap.isGovernmentContribution 
                            ? (lang === 'en' ? 'Instantly disburse designated parent contributions directly to school development accounts.' : 'Safirisha michango ya hiari ya wazazi papo hapo kwenda akaunti zilizokasimiwa za maendeleo ya shule.')
                            : (lang === 'en' ? 'Secure instant school fee clearance via simulated Mobile money API (E-Money gateway Integration).' : 'Lipia ada ya shule kwa usalama kupitia mfumo wetu thabiti wa malipo ya simu (M-Pesa/Tigo Pesa/Airtel Money).')}
                        </p>
                      </div>

                      {paySuccessLog && (
                        <div className="bg-[#1E3A8A]/10 text-[#1E3A8A] border border-[#1E3A8A]/20 rounded-xl p-2.5 text-center space-y-1 animate-pulse">
                          <span className="text-[8px] uppercase tracking-wider text-[#1E3A8A] font-extrabold block">Processing with Network Gateway...</span>
                          <div className="text-[9.5px] font-mono font-medium">Communicating with Airplay Networks...</div>
                          <div className="text-[8px] text-slate-450 font-mono">Auth-token: {paySuccessLog}</div>
                        </div>
                      )}

                      {!paySuccessLog && (feesMap.total - feesMap.paid > 0) && (
                        <button
                          onClick={simulatePayment}
                          className="w-full py-2.5 bg-[#22C55E] hover:bg-emerald-600 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-3xs"
                        >
                          <DollarSign className="h-4 w-4" />
                          <span>Pay {(feesMap.total - feesMap.paid).toLocaleString()} TZS Instantly</span>
                        </button>
                      )}

                      {!paySuccessLog && (feesMap.total - feesMap.paid <= 0) && (
                        <div className="bg-emerald-50 text-emerald-800 text-center py-2 px-3 rounded-xl border border-emerald-100 font-bold text-[10px] flex items-center justify-center gap-1.5 font-sans">
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span>Invoice Settled In Full. No outstanding dues.</span>
                        </div>
                      )}
                    </div>

                    {/* RECENT SETTLEMENT RECEIPTS */}
                    <div className="bg-white border border-slate-150 rounded-2xl shadow-3xs overflow-hidden text-left">
                      <div className="px-3 py-2 border-b border-slate-50 bg-slate-50">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-mono">
                          Recent Receipts Logs
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 font-mono">
                        {feesMap.transactions.map((tx, i) => (
                          <div key={i} className="p-2.5 hover:bg-slate-50/50 flex justify-between items-center text-xs font-sans">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-900 block font-mono text-[10px]">+{tx.amount.toLocaleString()} TZS</span>
                              <span className="text-[8px] text-sky-700 font-bold block font-mono">{tx.method} • {tx.reference}</span>
                            </div>

                            <div className="text-right leading-tight">
                              <span className="text-[9px] font-mono text-slate-400 block">{tx.date}</span>
                              <span className="inline-flex items-center gap-0.5 text-[#22C55E] text-[8px] font-bold font-mono">
                                Verified ✔
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border rounded-2xl p-8 text-center">
                    <span className="text-3xl block">💰</span>
                    <h3 className="text-xs font-bold text-slate-800 mt-2">Payment Services Locked</h3>
                    <p className="text-[10px] text-slate-450 mt-1">Pupil selection is empty.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* -------------------- TAB AI: PARENTS ACADEMIC ADVISORY CENTER (Rule 4) -------------------- */}
            {activeTab === 'ai' && (
              <motion.div
                key="ai_advisor"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
                id="parent-ai-panel"
              >
                {/* 1. Pupil Metric Diagnostic Header Card */}
                {activeStudent && dashboardCtx ? (
                  <div className="bg-gradient-to-r from-emerald-600/10 to-indigo-600/10 border border-slate-205 p-3 rounded-2xl space-y-2 text-left relative overflow-hidden" id="ai-child-metric-tracker">
                    <div className="absolute -right-3 -top-3 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl"></div>
                    <div className="flex items-center gap-1.5 text-[9.5px] font-black tracking-widest text-[#1E3A8A] font-mono">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                      <span>{lang === 'en' ? 'PUPIL DIAGNOSTIC PROFILE' : 'UTAMBUZI WA MWANAFUNZI'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{activeStudent.fullName}</span>
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-mono">{lang === 'en' ? 'GPA' : 'Alama'} Avg: {dashboardCtx.averagePct}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${dashboardCtx.attendancePct >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span>{lang === 'en' ? 'Attendance' : 'Mahudhurio'}: {dashboardCtx.attendancePct}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>{lang === 'en' ? 'Active Homeworks' : 'Zoezi la Nyumbani'}: {dashboardCtx.assignmentsList.length}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 2. Chat Bubble Stream Portal */}
                <div className="bg-white border border-slate-150 rounded-2xl p-3 shadow-3xs flex flex-col h-[300px] overflow-hidden" id="ai-chat-portal">
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1.5 scrollbar-thin text-left">
                    {aiChatLogs.map((chat, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col max-w-[85%] ${
                          chat.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div 
                          className={`p-2.5 rounded-2xl text-[10.5px] leading-relaxed whitespace-pre-wrap ${
                            chat.sender === 'user' 
                              ? 'bg-[#1E3A8A] text-white rounded-br-2xs' 
                              : 'bg-slate-100 text-slate-800 rounded-bl-2xs border border-slate-150'
                          }`}
                        >
                          {chat.text}
                        </div>
                        <span className="text-[7.5px] text-slate-400 font-mono mt-0.5">{chat.timestamp}</span>
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="flex items-center gap-2 text-[9px] text-slate-400 italic font-mono pl-1">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span>{lang === 'en' ? 'Analyzing metrics...' : 'Mshauri AI anachambua taarifa...'}</span>
                      </div>
                    )}
                  </div>

                  {/* 3. One-Tap Instant Guidance Trigger Chips (Excellent User Experience!) */}
                  <div className="border-t border-slate-100 pt-2 bg-slate-50/50 rounded-b-xl flex gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
                    {[
                      { key: 'attendance', labelEn: '📅 Attendance Tips', labelSw: '📅 Mahudhurio' },
                      { key: 'performance', labelEn: '📈 Performance Avg', labelSw: '📈 Mbinu za Ufaulu' },
                      { key: 'exams', labelEn: '📝 NECTA Checklist', labelSw: '📝 Maandalizi NECTA' },
                      { key: 'discipline', labelEn: '🛡️ Habits & Screen time', labelSw: '🛡️ Nidhamu ya Tabia' },
                      { key: 'time', labelEn: '⏳ Study Routine Planner', labelSw: '⏳ Usimamizi wa Muda' },
                    ].map(chip => (
                      <button
                        key={chip.key}
                        onClick={() => triggerAiResponse(lang === 'en' ? chip.labelEn : chip.labelSw)}
                        disabled={isAiLoading}
                        className="text-[8.5px] font-black text-slate-600 bg-white border border-slate-200 px-2.5 py-1.2 rounded-full shadow-3xs whitespace-nowrap hover:bg-[#1E3A8A] hover:text-white transition cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {lang === 'en' ? chip.labelEn : chip.labelSw}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Rich TextInput Message Dispatcher Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!userMessage.trim() || isAiLoading) return;
                    triggerAiResponse(userMessage);
                  }}
                  className="flex items-center gap-1.5"
                  id="parent-ai-form-bar"
                >
                  <input 
                    type="text" 
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    disabled={isAiLoading}
                    placeholder={lang === 'en' ? 'Ask SSMS Advisor (e.g. necta prep)...' : 'Uliza kuhusu ufaulu au maendeleo...'}
                    className="flex-1 p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1.5 focus:ring-[#1E3A8A]/30 text-slate-800 placeholder-slate-400 font-medium"
                    id="parent-ai-input"
                  />
                  <button
                    type="submit"
                    disabled={isAiLoading || !userMessage.trim()}
                    className="h-9 w-9 bg-[#1E3A8A] hover:bg-[#142A65] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition shadow-xs shrink-0 cursor-pointer border-none"
                    id="parent-ai-submit-btn"
                  >
                    <ArrowRight className="h-4.5 w-4.5 text-white" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* -------------------- TAB 5: PROFILE & SYSTEM SETTINGS -------------------- */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
                id="parent-profile-panel-view"
              >
                {/* 1. Detail details */}
                <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs text-center relative overflow-hidden text-left">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1E3A8A]"></div>
                  
                  <div className="h-12 w-12 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center mx-auto mb-2 text-base shadow-2xs">
                    👨‍👩‍
                  </div>

                  <span className="text-[8px] uppercase font-black text-slate-400 tracking-wider block text-center">Verified Parent Node</span>
                  <h3 className="text-xs font-bold text-slate-900 mt-1 text-center">{currentParent ? currentParent.fullName : 'Verified Parent'}</h3>
                  
                  <div className="mt-3.5 pt-3 border-t border-slate-50 flex flex-col gap-1.5 text-[9.5px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400 font-mono" /> {currentParent ? currentParent.phone : ''}</span>
                    <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400 font-mono" /> {currentParent ? currentParent.email : ''}</span>
                  </div>
                </div>

                {/* 2. DYNAMIC APP LANGUAGE SYSTEM SWITCHER (NATIVE CHANGER inside the mobile viewport) */}
                <div className="bg-white border border-slate-150 rounded-2xl p-3 shadow-3xs text-left space-y-2.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-2 mb-1 font-mono">
                    🌐 App Language switcher
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setLang('en')}
                      className={`py-1.5 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        lang === 'en' 
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-3xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🇺🇸 English
                    </button>
                    <button 
                      onClick={() => setLang('sw')}
                      className={`py-1.5 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        lang === 'sw' 
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-3xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🇹🇿 Swahili
                    </button>
                  </div>
                </div>

                {/* 3. LINKED CHILDREN MANAGEMENT */}
                <div className="bg-white border border-slate-150 rounded-2xl p-3 shadow-3xs space-y-2 text-left">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-2 mb-1 font-mono">
                    👦 {lang === 'en' ? 'Linked Children' : 'Watoto Waliounganishwa'}
                  </span>

                  <div className="divide-y divide-slate-50 font-mono">
                    {verifiedChildren.map(child => (
                      <div key={child.id} className="py-2 flex items-center justify-between text-xs font-sans">
                        <div>
                          <strong className="text-[10px] font-black text-slate-900 block">{child.fullName}</strong>
                          <span className="text-[8px] text-slate-400 font-mono block">ID: {child.admissionNumber}</span>
                        </div>

                        <button 
                          onClick={() => handleUnlinkStudent(child.id, child.fullName)}
                          className="text-rose-600 bg-rose-50 hover:bg-rose-100 font-extrabold text-[8px] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          {lang === 'en' ? 'Unlink' : 'Ondoa'}
                        </button>
                      </div>
                    ))}

                    {verifiedChildren.length === 0 && (
                      <p className="py-3 text-center text-[9px] text-slate-400 italic font-sans">No students linked to this parent account.</p>
                    )}
                  </div>
                </div>

                {/* 4. EXIT MOBILE SPLICER */}
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
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-extrabold text-xs cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-md border-none"
                  id="parent-logout"
                >
                  <LogOut className="h-4.5 w-4.5 text-white stroke-[2.5px]" />
                  <span>{lang === 'en' ? 'Log Out' : 'Ondoka kwenye Akaunti'}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FIXED MOBILE PHONE NAVBAR AT THE BOTTOM OF THE VIEWPORT PREVIEW (TACTICAL AND TOUCH FRIENDLY) */}
        <div className="absolute bottom-0 left-0 right-0 h-[64px] bg-white border-t border-slate-200 px-1 flex justify-around items-center z-40 select-none shadow-md">
          {(() => {
            const activeSch = activeStudent ? DB.getSchools().find(s => s.id === activeStudent.schoolId) : null;
            const isGov = activeSch?.category === 'Government';
            const showFees = !isGov || activeSch?.optionalContributionsEnabled;

            const tabItems = [
              { id: 'home', label: 'Mwanzo', labelEn: 'Home', icon: Home },
              { id: 'exams', label: 'Mitihani', labelEn: 'Exams', icon: Award },
              { id: 'attendance', label: 'Zoezi', labelEn: 'Activity', icon: Calendar },
              ...(showFees ? [{
                id: 'fees',
                label: isGov ? 'Michango' : 'Ada ya Shule',
                labelEn: isGov ? 'Contributions' : 'Fees',
                icon: DollarSign
              }] : []),
              { id: 'ai', label: 'Mshauri AI', labelEn: 'AI Advice', icon: Sparkles },
              { id: 'profile', label: 'Wasifu', labelEn: 'Profile', icon: User },
            ];

            return tabItems.map(tab => {
              const Icon = tab.icon;
              const isSel = activeTab === tab.id;
              const labelStr = lang === 'en' ? tab.labelEn : tab.label;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSuccessMsg('');
                    setErrorMsg('');
                  }}
                  className={`flex flex-col items-center justify-center w-11 h-12 rounded-xl transition-all relative ${
                    isSel ? 'text-[#1E3A8A]' : 'text-slate-400'
                  }`}
                  id={`parent-bottom-bar-link-${tab.id}`}
                >
                  {/* Micro animation dynamic background slide highlight */}
                  {isSel && (
                    <motion.div 
                      layoutId="parent-bottom-bar-bg"
                      className="absolute inset-0 bg-[#1E3A8A]/5 border-t border-t-[#1E3A8A]/25 rounded-xl animate-fade-in"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className={`h-4.2 w-4.2 shrink-0 ${isSel ? 'scale-105 text-[#1E3A8A]' : 'scale-95 text-slate-400'}`} />
                  <span className="text-[7.8px] font-black mt-1 block tracking-tight line-clamp-1 select-none">{labelStr}</span>
                </button>
              );
            });
          })()}
        </div>

        {/* MODAL WINDOWS INSIDE THE VIEWPORT (Pristine bottom-sheet style sheets) */}
        {isLinkingOpen && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xs z-50 flex items-end animate-fade-in" id="parent-linking-overlay">
            <div className="bg-white rounded-t-[32px] w-full p-5 max-h-[85%] overflow-y-auto space-y-4 shadow-2xl relative border-t border-slate-100 animate-slide-up text-left">
              
              <div className="flex justify-between items-center border-b border-slate-150 pb-2.5">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">{t.parentVerifyTitle}</h4>
                  <span className="text-[8.5px] text-slate-400 block mt-1">Formal verification credentials matching</span>
                </div>
                <button 
                  onClick={() => setIsLinkingOpen(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 font-bold text-sm cursor-pointer border-0 outline-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleLinkChildFormal} className="space-y-3 pb-3">
                <div>
                  <label className="block text-[8.5px] font-mono font-black uppercase text-slate-450 mb-1">
                    Student ID Key (Admission ID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADM-2026-001"
                    value={inputAdmissionId}
                    onChange={e => setInputAdmissionId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-855 placeholder-slate-400 focus:outline-none focus:border-sky-450"
                  />
                </div>

                <div>
                  <label className="block text-[8.5px] font-mono font-black uppercase text-slate-450 mb-1">
                    Parent Claim Secret Key (Claim Code)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PARENT-7XK92A"
                    value={inputParentCode}
                    onChange={e => setInputParentCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#1E3A8A] placeholder-slate-450 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-3xs"
                >
                  {t.connectBtn}
                </button>
              </form>

              {/* Sandbox Cheat values */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1 font-mono text-[8px] text-slate-500 text-left shrink-0">
                <span className="font-bold text-slate-850 block text-[9px] font-sans">Quick Sandbox claim keys:</span>
                <div>• Secondary child: <span className="text-[#1E3A8A] font-bold">ADM-2026-001 / PARENT-7XK92A</span></div>
                <div>• Primary level: <span className="text-[#1E3A8A] font-bold">ADM-2026-004 / PARENT-7XK92A</span></div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
