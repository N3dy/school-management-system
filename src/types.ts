/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'SUPER_ADMIN' | 'HEADMASTER' | 'TEACHER' | 'PARENT';

export interface SaaS_School {
  id: string;
  name: string;
  type: string; // 'Primary' | 'Secondary' | 'Combined'
  category?: 'Private' | 'Government';
  optionalContributionsEnabled?: boolean; // Toggle optional contributions for Government
  registrationNumber: string;
  region: string;
  district: string;
  ward: string;
  address: string;
  email: string;
  phone: string;
  logoUrl?: string; // uploads or placeholders
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface SaaS_Headmaster {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nationalId?: string;
  assignedSchoolId: string; // school relationship
  username: string;
  passwordHash: string;
  status: 'ACTIVE' | 'DISABLED';
  lastLogin?: string;
}

export interface SchoolSettings {
  schoolName: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  checkInDeadline: string; // "HH:MM" e.g., "07:30"
}

export interface Teacher {
  id: string;
  schoolId?: string; // Multi-tenant isolation context
  fullName: string;
  teacherNumber: string;
  phone: string;
  email: string;
  qualification: string;
  specialization: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  isClassTeacherOf: string | null; // Class ID or null
  assignedSubjectIds: string[]; // List of subject IDs
  assignedClassIds: string[]; // List of class IDs
  registeredAt: string;
  passwordHash: string; // Simulated secure password storage
}

export interface Student {
  id: string;
  schoolId?: string; // Multi-tenant isolation context
  admissionNumber: string;
  fullName: string;
  gender: 'Male' | 'Female';
  classId: string;
  stream: string; // e.g. "A" or "B"
  dateOfBirth: string;
  parentCode: string; // "PARENT-XXXXXX"
  parentId?: string | null; // Set when parent verifies
}

export interface Parent {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  passwordHash: string;
  verifiedStudentIds: string[];
}

export interface Class {
  id: string;
  schoolId?: string; // Multi-tenant isolation context
  name: string; // e.g., "Form 1", "Class 5"
  stream: string; // e.g., "A", "B"
  classTeacherId: string | null; // Teacher ID
}

export interface Subject {
  id: string;
  schoolId?: string; // Multi-tenant isolation context
  name: string; // e.g., "Mathematics", "Kiswahili"
  code: string; // e.g., "MATH101"
}

export interface StudentAttendance {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  recordedBy: string; // Teacher or Headmaster ID
  recordedAt: string;
}

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string | null; // HH:MM:SS
  checkOutTime: string | null; // HH:MM:SS
  status: 'ON_TIME' | 'LATE' | 'ABSENT' | 'CHECKED_OUT';
  lat: number | null;
  lng: number | null;
  verified: boolean;
  distanceMetres: number | null;
}

export interface AcademicMark {
  id: string;
  schoolId?: string; // Multi-tenant isolation context
  studentId: string;
  subjectId: string;
  classId: string;
  type: 'QUIZ' | 'TEST' | 'ASSIGNMENT' | 'MIDTERM' | 'FINAL';
  totalMarks: number;
  obtainedMarks: number;
  recordedBy: string; // Teacher ID
  date: string; // YYYY-MM-DD
}

export interface TimetableEntry {
  id: string;
  schoolId?: string; // Multi-tenant isolation context
  classId: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  timeSlot: string; // e.g., "08:00 AM - 09:00 AM"
  subjectId: string;
  teacherId: string;
}

export interface Announcement {
  id: string;
  schoolId?: string; // Multi-tenant isolation context
  titleEn: string;
  titleSw: string;
  contentEn: string;
  contentSw: string;
  date: string;
  addedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string; // Email or Full Name + Role
  ipAddress: string;
  browser: string;
}

export interface Assignment {
  id: string;
  schoolId?: string; // Multi-tenant isolation context
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  dueDate: string;
  uploadedBy: string; // Teacher ID
  fileName: string;
}

export interface Notification {
  id: string;
  userId: string; // Role-based or User ID
  role: UserRole | 'ALL';
  messageEn: string;
  messageSw: string;
  timestamp: string;
  isRead: boolean;
}

export interface TeacherComment {
  id: string;
  studentId: string;
  teacherId: string;
  comment: string;
  date: string;
}
