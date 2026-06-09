/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UserRole,
  SaaS_School,
  SaaS_Headmaster,
  SchoolSettings,
  Teacher,
  Student,
  Parent,
  Class,
  Subject,
  StudentAttendance,
  TeacherAttendance,
  AcademicMark,
  TimetableEntry,
  Announcement,
  AuditLog,
  Assignment,
  Notification,
  TeacherComment,
} from './types';

// Helper to simulate simple hashing
export function simulateHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'SHA256-' + Math.abs(hash).toString(16);
}

const INITIAL_SCHOOLS: SaaS_School[] = [
  {
    id: 'SCH-001',
    name: 'Secondary School Level',
    type: 'Secondary',
    category: 'Private',
    optionalContributionsEnabled: true,
    registrationNumber: 'REG-TZ-9921',
    region: 'Arusha',
    district: 'Arusha City',
    ward: 'Neutral Ward',
    address: 'Academic Road',
    email: 'secondary@schoolmanagementsystem.com',
    phone: '0712344556',
    logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
    status: 'ACTIVE',
    createdAt: '2024-02-15T08:00:00Z',
  },
  {
    id: 'SCH-002',
    name: 'Primary School Level',
    type: 'Primary',
    category: 'Government',
    optionalContributionsEnabled: false,
    registrationNumber: 'REG-TZ-8832',
    region: 'Arusha',
    district: 'Meru',
    ward: 'Neutral Primary Ward',
    address: 'Scholars Highway',
    email: 'primary@schoolmanagementsystem.com',
    phone: '0744998811',
    logoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=200',
    status: 'ACTIVE',
    createdAt: '2024-09-01T09:30:00Z',
  },
  {
    id: 'SCH-003',
    name: 'Standard High School Level',
    type: 'Secondary',
    category: 'Private',
    optionalContributionsEnabled: true,
    registrationNumber: 'REG-TZ-2231',
    region: 'Dar es Salaam',
    district: 'Kinondoni',
    ward: 'Neutral High Ward',
    address: 'High School Rd, Plot 14',
    email: 'highschool@schoolmanagementsystem.com',
    phone: '0788665544',
    logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=200',
    status: 'ACTIVE',
    createdAt: '2025-01-10T11:00:00Z',
  }
];

const INITIAL_SAAS_HEADMASTERS: SaaS_Headmaster[] = [
  {
    id: 'HM-001',
    fullName: 'Director Alpha',
    phone: '0711223344',
    email: 'headmaster@ssms.edu',
    nationalId: '19920315-11002-00001-20',
    assignedSchoolId: 'SCH-001',
    username: 'kijenge_head',
    passwordHash: simulateHash('admin123'),
    status: 'ACTIVE',
    lastLogin: '2026-06-08T08:00:00Z',
  },
  {
    id: 'HM-002',
    fullName: 'Dr. Josephat Mrema',
    phone: '0755667788',
    email: 'mrema.j@arushascience.ac.tz',
    nationalId: '19850524-12001-00003-12',
    assignedSchoolId: 'SCH-002',
    username: 'mrema_sc',
    passwordHash: simulateHash('admin123'),
    status: 'ACTIVE',
    lastLogin: '2026-06-07T14:15:00Z',
  },
  {
    id: 'HM-003',
    fullName: 'Sophia Ndazi',
    phone: '0677889900',
    email: 'sophia.n@dsgirls.edu',
    nationalId: '19891212-32104-00005-15',
    assignedSchoolId: 'SCH-003',
    username: 'sophia_dsg',
    passwordHash: simulateHash('admin123'),
    status: 'DISABLED',
    lastLogin: '2026-05-10T10:00:00Z',
  }
];

// Calculate GPS distance using Haversine Formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

// Global default seed data
const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: "School Management System",
  latitude: -3.3869,
  longitude: 36.6829,
  allowedRadiusMeters: 10,
  checkInDeadline: "07:30",
};

const INITIAL_CLASSES: Class[] = [
  { id: 'C1', name: 'Form 1', stream: 'A', classTeacherId: 'T1', schoolId: 'SCH-001' },
  { id: 'C2', name: 'Form 1', stream: 'B', classTeacherId: 'T2', schoolId: 'SCH-001' },
  { id: 'C3', name: 'Form 2', stream: 'A', classTeacherId: null, schoolId: 'SCH-001' },
  { id: 'C4', name: 'Form 3', stream: 'A', classTeacherId: null, schoolId: 'SCH-001' },
  { id: 'C5', name: 'Standard 5', stream: 'A', classTeacherId: null, schoolId: 'SCH-002' },
  { id: 'C6', name: 'Standard 2', stream: 'B', classTeacherId: null, schoolId: 'SCH-002' },
];

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'S1', name: 'Mathematics', code: 'MATH101' },
  { id: 'S2', name: 'Kiswahili', code: 'KISW102' },
  { id: 'S3', name: 'English Literature', code: 'ENGL103' },
  { id: 'S4', name: 'Chemistry', code: 'CHEM101' },
  { id: 'S5', name: 'Biology', code: 'BIOL101' },
];

const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'T1',
    fullName: 'Jane Doe',
    teacherNumber: 'TR-1002',
    phone: '0712344556',
    email: 'jane.doe@ssms.edu',
    qualification: 'Bachelor of Education',
    specialization: 'Mathematics & English',
    status: 'ACTIVE',
    isClassTeacherOf: 'C1',
    assignedSubjectIds: ['S1', 'S3'],
    assignedClassIds: ['C1', 'C2', 'C3'],
    registeredAt: '2026-05-10T10:00:00Z',
    passwordHash: simulateHash('password123'),
  },
  {
    id: 'T2',
    fullName: 'John Smith',
    teacherNumber: 'TR-1055',
    phone: '0744998811',
    email: 'john.smith@ssms.edu',
    qualification: 'Diploma in Education',
    specialization: 'Chemistry & Biology',
    status: 'ACTIVE',
    isClassTeacherOf: 'C2',
    assignedSubjectIds: ['S4', 'S5'],
    assignedClassIds: ['C1', 'C2'],
    registeredAt: '2026-05-12T14:20:00Z',
    passwordHash: simulateHash('password123'),
  },
  {
    id: 'T3',
    fullName: 'Pendo Machako',
    teacherNumber: 'TR-1981',
    phone: '0788665544',
    email: 'pendo.m@ssms.edu',
    qualification: 'Bachelor of Kiswahili Literature',
    specialization: 'Kiswahili & History',
    status: 'PENDING',
    isClassTeacherOf: null,
    assignedSubjectIds: ['S2'],
    assignedClassIds: [],
    registeredAt: '2026-06-08T06:15:00Z',
    passwordHash: simulateHash('password123'),
  },
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'ST1',
    admissionNumber: 'ADM-2026-001',
    fullName: 'John William',
    gender: 'Male',
    classId: 'C1',
    stream: 'A',
    dateOfBirth: '2012-05-14',
    parentCode: 'PARENT-7XK92A',
    parentId: null,
    schoolId: 'SCH-001',
  },
  {
    id: 'ST2',
    admissionNumber: 'ADM-2026-002',
    fullName: 'Sarah Joseph',
    gender: 'Female',
    classId: 'C1',
    stream: 'A',
    dateOfBirth: '2012-08-20',
    parentCode: 'PARENT-9MK12B',
    parentId: null,
    schoolId: 'SCH-001',
  },
  {
    id: 'ST3',
    admissionNumber: 'ADM-2026-003',
    fullName: 'Hamisi Zuberi',
    gender: 'Male',
    classId: 'C2',
    stream: 'B',
    dateOfBirth: '2011-11-03',
    parentCode: 'PARENT-3HZ44C',
    parentId: null,
    schoolId: 'SCH-001',
  },
  {
    id: 'ST4',
    admissionNumber: 'ADM-2026-004',
    fullName: 'Anna William',
    gender: 'Female',
    classId: 'C5',
    stream: 'A',
    dateOfBirth: '2015-02-18',
    parentCode: 'PARENT-7XK92A',
    parentId: null,
    schoolId: 'SCH-002',
  },
  {
    id: 'ST5',
    admissionNumber: 'ADM-2026-005',
    fullName: 'Grace William',
    gender: 'Female',
    classId: 'C6',
    stream: 'B',
    dateOfBirth: '2018-09-22',
    parentCode: 'PARENT-7XK92A',
    parentId: null,
    schoolId: 'SCH-002',
  },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'A1',
    titleEn: 'School Mid-Term Break Notice',
    titleSw: 'Tangazo la Mapumziko ya Muhula',
    contentEn: 'All parents are notified that the school will close for high school mid-term exams break on Friday, June 12th. Term classes will resume on Monday, June 22nd. Please check school reports for details.',
    contentSw: 'Wazazi wote mnaarifiwa kuwa shule itafungwa kwa ajili ya mapumziko ya katikati ya muhula siku ya Ijumaa, Juni 12. Masomo yataanza tena Jumatatu, Juni 22. Tafadhali thibitisha ripoti za shule kwa maelezo.',
    date: '2026-06-05',
    addedBy: 'Headmaster',
  },
  {
    id: 'A2',
    titleEn: 'Annual General Parents Meeting',
    titleSw: 'Mkutano Mkuu wa Mwaka wa Wazazi',
    contentEn: 'You are cordially invited to attend the Annual General Meeting (AGM) to discuss academic progress, school development parameters, and the digital SSMS portal launching on June 25th in the main dining hall.',
    contentSw: 'Mnaalikwa kwa dhati kuhudhuria Mkutano Mkuu wa Mwaka wa Wazazi (AGM) kujadili maendeleo ya kitaaluma, miradi ya shule, na uzinduzi wa mfumo mpya wa kidijitali wa SSMS tarehe Juni 25 katika ukumbi mkuu.',
    date: '2026-06-07',
    addedBy: 'Headmaster',
  },
];

const INITIAL_TIMETABLES: TimetableEntry[] = [
  // Form 1 A (C1) Timetable
  { id: 'TTE1', classId: 'C1', dayOfWeek: 'Monday', timeSlot: '08:00 AM - 09:00 AM', subjectId: 'S1', teacherId: 'T1' },
  { id: 'TTE2', classId: 'C1', dayOfWeek: 'Monday', timeSlot: '09:00 AM - 10:00 AM', subjectId: 'S3', teacherId: 'T1' },
  { id: 'TTE3', classId: 'C1', dayOfWeek: 'Tuesday', timeSlot: '10:30 AM - 11:30 AM', subjectId: 'S4', teacherId: 'T2' },
  { id: 'TTE4', classId: 'C1', dayOfWeek: 'Wednesday', timeSlot: '08:00 AM - 09:00 AM', subjectId: 'S5', teacherId: 'T2' },
  { id: 'TTE5', classId: 'C1', dayOfWeek: 'Thursday', timeSlot: '11:30 AM - 12:30 PM', subjectId: 'S1', teacherId: 'T1' },
  { id: 'TTE6', classId: 'C1', dayOfWeek: 'Friday', timeSlot: '09:00 AM - 10:00 AM', subjectId: 'S2', teacherId: 'T1' }, // Jane taking Swahili temporarily
];

const INITIAL_ATTENDANCE_TEACHERS: TeacherAttendance[] = [
  { id: 'TA1', teacherId: 'T1', date: '2026-06-05', checkInTime: '07:15:00', checkOutTime: '16:00:00', status: 'ON_TIME', lat: -3.3869, lng: 36.6829, verified: true, distanceMetres: 0.5 },
  { id: 'TA2', teacherId: 'T2', date: '2026-06-05', checkInTime: '07:38:00', checkOutTime: '16:15:00', status: 'LATE', lat: -3.3870, lng: 36.6830, verified: true, distanceMetres: 8.2 },
  { id: 'TA3', teacherId: 'T1', date: '2026-06-08', checkInTime: '07:20:00', checkOutTime: null, status: 'ON_TIME', lat: -3.38685, lng: 36.68285, verified: true, distanceMetres: 3.4 },
];

const INITIAL_ATTENDANCE_STUDENTS: StudentAttendance[] = [
  { id: 'SA1', studentId: 'ST1', date: '2026-06-05', status: 'PRESENT', recordedBy: 'T1', recordedAt: '2026-06-05T08:15:00Z' },
  { id: 'SA2', studentId: 'ST2', date: '2026-06-05', status: 'PRESENT', recordedBy: 'T1', recordedAt: '2026-06-05T08:15:00Z' },
  { id: 'SA3', studentId: 'ST3', date: '2026-06-05', status: 'ABSENT', recordedBy: 'T2', recordedAt: '2026-06-05T08:30:00Z' },
  { id: 'SA4', studentId: 'ST1', date: '2026-06-08', status: 'PRESENT', recordedBy: 'T1', recordedAt: '2026-06-08T08:10:00Z' },
  { id: 'SA5', studentId: 'ST2', date: '2026-06-08', status: 'LATE', recordedBy: 'T1', recordedAt: '2026-06-08T08:12:00Z' },
  { id: 'SA6', studentId: 'ST4', date: '2026-06-05', status: 'PRESENT', recordedBy: 'T2', recordedAt: '2026-06-05T08:10:00Z' },
  { id: 'SA7', studentId: 'ST4', date: '2026-06-08', status: 'PRESENT', recordedBy: 'T2', recordedAt: '2026-06-08T08:10:00Z' },
  { id: 'SA8', studentId: 'ST5', date: '2026-06-05', status: 'PRESENT', recordedBy: 'T2', recordedAt: '2026-06-05T08:10:00Z' },
  { id: 'SA9', studentId: 'ST5', date: '2026-06-08', status: 'LATE', recordedBy: 'T2', recordedAt: '2026-06-08T08:15:00Z' },
];

const INITIAL_MARKS: AcademicMark[] = [
  // John William
  { id: 'M1', studentId: 'ST1', subjectId: 'S1', classId: 'C1', type: 'QUIZ', totalMarks: 20, obtainedMarks: 18, recordedBy: 'T1', date: '2026-05-15', schoolId: 'SCH-001' },
  { id: 'M2', studentId: 'ST1', subjectId: 'S1', classId: 'C1', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 82, recordedBy: 'T1', date: '2026-05-25', schoolId: 'SCH-001' },
  { id: 'M3', studentId: 'ST1', subjectId: 'S3', classId: 'C1', type: 'QUIZ', totalMarks: 20, obtainedMarks: 15, recordedBy: 'T1', date: '2026-05-18', schoolId: 'SCH-001' },
  { id: 'M4', studentId: 'ST1', subjectId: 'S3', classId: 'C1', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 78, recordedBy: 'T1', date: '2026-05-26', schoolId: 'SCH-001' },
  { id: 'M5', studentId: 'ST1', subjectId: 'S4', classId: 'C1', type: 'QUIZ', totalMarks: 30, obtainedMarks: 24, recordedBy: 'T2', date: '2026-05-14', schoolId: 'SCH-001' },
  { id: 'M6', studentId: 'ST1', subjectId: 'S4', classId: 'C1', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 85, recordedBy: 'T2', date: '2026-05-28', schoolId: 'SCH-001' },

  // Anna William (ST4) - Primary
  { id: 'M41', studentId: 'ST4', subjectId: 'S1', classId: 'C5', type: 'QUIZ', totalMarks: 30, obtainedMarks: 28, recordedBy: 'T2', date: '2026-05-15', schoolId: 'SCH-002' },
  { id: 'M42', studentId: 'ST4', subjectId: 'S1', classId: 'C5', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 92, recordedBy: 'T2', date: '2026-05-25', schoolId: 'SCH-002' },
  { id: 'M43', studentId: 'ST4', subjectId: 'S2', classId: 'C5', type: 'QUIZ', totalMarks: 20, obtainedMarks: 18, recordedBy: 'T2', date: '2026-05-18', schoolId: 'SCH-002' },
  { id: 'M44', studentId: 'ST4', subjectId: 'S2', classId: 'C5', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 87, recordedBy: 'T2', date: '2026-05-26', schoolId: 'SCH-002' },

  // Grace William (ST5) - Primary
  { id: 'M51', studentId: 'ST5', subjectId: 'S1', classId: 'C6', type: 'QUIZ', totalMarks: 30, obtainedMarks: 26, recordedBy: 'T2', date: '2026-05-15', schoolId: 'SCH-002' },
  { id: 'M52', studentId: 'ST5', subjectId: 'S1', classId: 'C6', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 84, recordedBy: 'T2', date: '2026-05-25', schoolId: 'SCH-002' },
  { id: 'M53', studentId: 'ST5', subjectId: 'S2', classId: 'C6', type: 'QUIZ', totalMarks: 20, obtainedMarks: 19, recordedBy: 'T2', date: '2026-05-18', schoolId: 'SCH-002' },
  { id: 'M54', studentId: 'ST5', subjectId: 'S2', classId: 'C6', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 90, recordedBy: 'T2', date: '2026-05-26', schoolId: 'SCH-002' },

  // Sarah Joseph
  { id: 'M7', studentId: 'ST2', subjectId: 'S1', classId: 'C1', type: 'QUIZ', totalMarks: 20, obtainedMarks: 19, recordedBy: 'T1', date: '2026-05-15' },
  { id: 'M8', studentId: 'ST2', subjectId: 'S1', classId: 'C1', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 94, recordedBy: 'T1', date: '2026-05-25' },
  { id: 'M9', studentId: 'ST2', subjectId: 'S3', classId: 'C1', type: 'QUIZ', totalMarks: 20, obtainedMarks: 17, recordedBy: 'T1', date: '2026-05-18' },
  { id: 'M10', studentId: 'ST2', subjectId: 'S3', classId: 'C1', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 88, recordedBy: 'T1', date: '2026-05-26' },
  { id: 'M11', studentId: 'ST2', subjectId: 'S4', classId: 'C1', type: 'QUIZ', totalMarks: 30, obtainedMarks: 27, recordedBy: 'T2', date: '2026-05-14' },
  { id: 'M12', studentId: 'ST2', subjectId: 'S4', classId: 'C1', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 91, recordedBy: 'T2', date: '2026-05-28' },

  // Hamisi Zuberi
  { id: 'M13', studentId: 'ST3', subjectId: 'S1', classId: 'C1', type: 'QUIZ', totalMarks: 20, obtainedMarks: 12, recordedBy: 'T1', date: '2026-05-15' },
  { id: 'M14', studentId: 'ST3', subjectId: 'S1', classId: 'C1', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 58, recordedBy: 'T1', date: '2026-05-25' },
  { id: 'M15', studentId: 'ST3', subjectId: 'S4', classId: 'C2', type: 'QUIZ', totalMarks: 30, obtainedMarks: 18, recordedBy: 'T2', date: '2026-05-14' },
  { id: 'M16', studentId: 'ST3', subjectId: 'S4', classId: 'C2', type: 'MIDTERM', totalMarks: 100, obtainedMarks: 62, recordedBy: 'T2', date: '2026-05-28' },
];

const INITIAL_COMMENTS: TeacherComment[] = [
  { id: 'TC1', studentId: 'ST1', teacherId: 'T1', comment: 'Excellent focus in classes. John needs to polish on Geometry section.', date: '2026-06-04' },
  { id: 'TC2', studentId: 'ST2', teacherId: 'T1', comment: 'A stellar student! Consistently leading class averages in Mathematics.', date: '2026-06-04' },
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  { id: 'AS1', title: 'Algebra Equations Exercise 4', description: 'Solve all questions from Page 45 of Mathematics Text Book. Upload before Sunday.', subjectId: 'S1', classId: 'C1', dueDate: '2026-06-14', uploadedBy: 'T1', fileName: 'Form1A_Algebra_Ex4.pdf' },
  { id: 'AS2', title: 'Organic Carbon Structures', description: 'Draw and explain primary organic carbon compounds. Grade weighting is 5%.', subjectId: 'S4', classId: 'C1', dueDate: '2026-06-16', uploadedBy: 'T2', fileName: 'Chemistry_Structures_A1.pdf' },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'AL1', timestamp: '2026-06-08T06:00:00Z', action: 'System Initialization', details: 'SSMS Bootstrapped with pre-seeded data rules.', user: 'SYSTEM', ipAddress: '127.0.0.1', browser: 'System Service' },
  { id: 'AL2', timestamp: '2026-06-08T06:15:00Z', action: 'Teacher Registration Request', details: 'Teacher Pendo Machako (TR-1981) applied.', user: 'Pendo Machako (Teacher)', ipAddress: '196.43.12.98', browser: 'Chrome Mobile / Android' },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'N1',
    userId: 'ALL',
    role: 'ALL',
    messageEn: 'Welcome to the brand new Smart School Management System (SSMS)!',
    messageSw: 'Karibuni kwenye Mfumo mpya kabisa wa Kidijitali wa Shule (SSMS)!',
    timestamp: '2026-06-08T06:00:00Z',
    isRead: false,
  },
  {
    id: 'N2',
    userId: 'HEADMASTER',
    role: 'HEADMASTER',
    messageEn: 'New teacher registration application received from Pendo Machako.',
    messageSw: 'Maombi mapya ya usajili wa Mwalimu yamepokelewa kutoka kwa Pendo Machako.',
    timestamp: '2026-06-08T06:15:00Z',
    isRead: false,
  },
];

// Database Manager
export class DB {
  static get<T>(key: string, fallback: T): T {
    const data = localStorage.getItem(`ssms_${key}`);
    return data ? JSON.parse(data) : fallback;
  }

  static set(key: string, val: any) {
    localStorage.setItem(`ssms_${key}`, JSON.stringify(val));
    window.dispatchEvent(new Event('ssms_db_update'));
  }

  static getSettings(): SchoolSettings {
    return this.get<SchoolSettings>('settings', DEFAULT_SETTINGS);
  }

  static saveSettings(settings: SchoolSettings) {
    this.set('settings', settings);
    this.addAudit('Settings configuration updated', `Allowed radius set to ${settings.allowedRadiusMeters}m, center set to ${settings.latitude}, ${settings.longitude}`, 'Headmaster');
  }

  static getTeachers(): Teacher[] {
    return this.get<Teacher[]>('teachers', INITIAL_TEACHERS);
  }

  static saveTeachers(teachers: Teacher[]) {
    this.set('teachers', teachers);
  }

  static getStudents(): Student[] {
    return this.get<Student[]>('students', INITIAL_STUDENTS);
  }

  static saveStudents(students: Student[]) {
    this.set('students', students);
  }

  static getClasses(): Class[] {
    return this.get<Class[]>('classes', INITIAL_CLASSES);
  }

  static saveClasses(classes: Class[]) {
    this.set('classes', classes);
  }

  static getSubjects(): Subject[] {
    return this.get<Subject[]>('subjects', INITIAL_SUBJECTS);
  }

  static saveSubjects(subjects: Subject[]) {
    this.set('subjects', subjects);
  }

  static getStudentAttendance(): StudentAttendance[] {
    return this.get<StudentAttendance[]>('attendance_students', INITIAL_ATTENDANCE_STUDENTS);
  }

  static saveStudentAttendance(att: StudentAttendance[]) {
    this.set('attendance_students', att);
  }

  static getTeacherAttendance(): TeacherAttendance[] {
    return this.get<TeacherAttendance[]>('attendance_teachers', INITIAL_ATTENDANCE_TEACHERS);
  }

  static saveTeacherAttendance(att: TeacherAttendance[]) {
    this.set('attendance_teachers', att);
  }

  static getMarks(): AcademicMark[] {
    return this.get<AcademicMark[]>('marks', INITIAL_MARKS);
  }

  static saveMarks(marks: AcademicMark[]) {
    this.set('marks', marks);
  }

  static getComments(): TeacherComment[] {
    return this.get<TeacherComment[]>('comments', INITIAL_COMMENTS);
  }

  static saveComments(comments: TeacherComment[]) {
    this.set('comments', comments);
  }

  static getAssignments(): Assignment[] {
    return this.get<Assignment[]>('assignments', INITIAL_ASSIGNMENTS);
  }

  static saveAssignments(assignments: Assignment[]) {
    this.set('assignments', assignments);
  }

  static getAnnouncements(): Announcement[] {
    return this.get<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
  }

  static saveAnnouncements(ann: Announcement[]) {
    this.set('announcements', ann);
  }

  static getTimetable(): TimetableEntry[] {
    return this.get<TimetableEntry[]>('timetable', INITIAL_TIMETABLES);
  }

  static saveTimetable(tt: TimetableEntry[]) {
    this.set('timetable', tt);
  }

  static getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
  }

  static addAudit(action: string, details: string, user: string) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'AL-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      action,
      details,
      user,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
      browser: navigator.userAgent.substring(0, 50),
    };
    logs.unshift(newLog);
    this.set('audit_logs', logs);
  }

  static getNotifications(): Notification[] {
    return this.get<Notification[]>('notifications', INITIAL_NOTIFICATIONS);
  }

  static addNotification(messageEn: string, messageSw: string, role: UserRole | 'ALL', userId: string = 'ALL') {
    const notifications = this.getNotifications();
    const newNotif: Notification = {
      id: 'NF-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      userId,
      role,
      messageEn,
      messageSw,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    notifications.unshift(newNotif);
    this.set('notifications', notifications);
  }

  static getParents(): Parent[] {
    return this.get<Parent[]>('parents', []);
  }

  static saveParents(parents: Parent[]) {
    this.set('parents', parents);
  }

  static getSchools(): SaaS_School[] {
    return this.get<SaaS_School[]>('saas_schools', INITIAL_SCHOOLS);
  }

  static saveSchools(schools: SaaS_School[]) {
    this.set('saas_schools', schools);
  }

  static getSaaSHeadmasters(): SaaS_Headmaster[] {
    return this.get<SaaS_Headmaster[]>('saas_headmasters', INITIAL_SAAS_HEADMASTERS);
  }

  static saveSaaSHeadmasters(hms: SaaS_Headmaster[]) {
    this.set('saas_headmasters', hms);
  }

  // Session Helper
  static getCurrentSession(): { user: any; role: UserRole } | null {
    return this.get<any>('session', null);
  }

  static startSession(user: any, role: UserRole) {
    this.set('session', { user, role });
    this.addAudit('User Login', `Successfully authenticated into session with role: ${role}`, user.email || user.fullName);
  }

  static clearSession() {
    const session = this.getCurrentSession();
    if (session) {
      this.addAudit('User Logout', 'System session closed securely.', session.user.email || session.user.fullName);
    }
    this.set('session', null);
  }
}

// Compute Grade based on score percentage
export function getGradeAndPoints(percentage: number): { grade: string; points: number; comment: string; commentSw: string } {
  if (percentage >= 80) return { grade: 'A', points: 5, comment: 'Excellent', commentSw: 'Bora weza' };
  if (percentage >= 70) return { grade: 'B', points: 4, comment: 'Very Good', commentSw: 'Vizuri sana' };
  if (percentage >= 60) return { grade: 'C', points: 3, comment: 'Good', commentSw: 'Vizuri' };
  if (percentage >= 50) return { grade: 'D', points: 2, comment: 'Average', commentSw: 'Wastani' };
  return { grade: 'F', points: 1, comment: 'Fail', commentSw: 'Kufeli' };
}

// Export simulation utilities
export function exportToCSVFile(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
