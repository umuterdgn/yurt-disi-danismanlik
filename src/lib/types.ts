import { UserRole } from '@prisma/client'

// ============================================
// USER TYPES
// ============================================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  phoneNumber?: string
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phoneNumber?: string
  profileImage?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================
// STUDENT TYPES
// ============================================

export interface StudentProfile {
  id: string
  userId: string
  grade: string
  school?: string
  targetUniversity?: string
  targetScore?: number
  currentScore?: number
  consultantId?: string
  createdAt: Date
  updatedAt: Date
}

export interface DailyTaskRequest {
  title: string
  description?: string
  subject: string
  taskType: string
  targetQuantity: number
  taskDate: Date
  priority?: string
}

export interface TrialExamRequest {
  examName: string
  examType: string
  examDate: Date
  targetScore: number
  turkishScore?: number
  mathScore?: number
  scienceScore?: number
  socialScore?: number
  notes?: string
}

export interface SubjectProgressRequest {
  subject: string
  topic: string
  status: string
  progressPercent: number
}

// ============================================
// ABROAD EDUCATION TYPES
// ============================================

export interface Country {
  id: string
  name: string
  code: string
  flag?: string
  currency?: string
  language?: string
  visaRequired: boolean
  averageCost?: number
}

export interface University {
  id: string
  countryId: string
  name: string
  city?: string
  ranking?: number
  type?: string
  tuitionFees?: number
  languageRequirement?: string
  requiredScore?: number
  website?: string
  description?: string
}

export interface AbroadApplicationRequest {
  universityId: string
  program: string
  semester: string
  year: number
  estimatedBudget?: number
  languageTest?: string
  languageScore?: number
}

export interface ApplicationDocumentRequest {
  documentType: string
  documentName: string
  expiryDate?: Date
}

// ============================================
// MEETING TYPES
// ============================================

export interface MeetingRequest {
  title: string
  description?: string
  meetingType: string
  startTime: Date
  endTime: Date
  location?: string
  participantIds: string[]
}

export interface AvailabilityRequest {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable?: boolean
}

// ============================================
// REPORTING TYPES
// ============================================

export interface ParentReportData {
  weekStartDate: Date
  weekEndDate: Date
  totalStudyHours: number
  totalQuestionsSolved: number
  netScoreIncrease: number
  currentScore: number
  attendanceRate?: number
  subjectBreakdown?: Record<string, any>
  dailyActivity?: Record<string, any>
  recommendations?: string
  concerns?: string
}

export interface DashboardStats {
  activeApplications: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  visaPending: number
  visaApproved: number
  visaRejected: number
  monthlyRevenue: number
  totalRevenue: number
  totalStudents: number
  activeStudents: number
  newStudentsThisMonth: number
  totalConsultants: number
  activeConsultants: number
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}