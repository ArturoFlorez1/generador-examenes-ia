/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestionType = 
  | 'multiple_choice' 
  | 'open_question' 
  | 'case_study' 
  | 'workshop' 
  | 'true_false'
  | 'icfes_multiple_choice'
  | 'saber_pro_reading_critical'
  | 'saber_pro_quantitative_reasoning'
  | 'saber_pro_citizen_competencies'
  | 'saber_pro_written_communication'
  | 'saber_pro_english'
  | 'saber_pro_info_interpretation'
  | 'saber_pro_context_based'
  | 'saber_pro_graphics_interpretation'
  | 'saber_pro_case_analysis'
  | 'mixed_icfes';

export interface QualityCriteria {
  clarity: string;
  coherence: string;
  pertinence: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  justification: string;
  competence: string;
  learningOutcome: string;
  bloomLevel: string;
  difficulty: 'bajo' | 'medio' | 'alto' | 'integral';
  difficultyJustification: string;
  qualityCriteria: QualityCriteria;
  teacherRecommendation: string;
}

export interface Exam {
  id: string;
  title: string;
  topic: string;
  course: string; // Course name for legacy/display
  courseId: string; // Foreign key to Course
  semester: string;
  difficulty: string;
  questions: Question[];
  createdAt: number;
  creatorId: string;
  teacherName?: string;
  showTeacherInPdf?: boolean;
  maxAttempts: number;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  code: string; // Unique code for enrollment
  creatorId: string;
  createdAt: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  studentName?: string; // Cache for teacher display
  enrolledAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName?: string;
  role: 'student' | 'teacher' | 'admin';
  roleRequest: 'none' | 'pending' | 'approved' | 'rejected';
  enrolledCourseIds: string[];
  createdAt: any;
}

export interface ExamResults {
  id: string;
  examId: string;
  studentId: string;
  studentName?: string;
  score: number;
  answers: Record<string, string>;
  submittedAt: number;
}

export interface Conversation {
  id: string;
  userId: string;
  lastMessageAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  userId: string;
  text: string;
  createdAt: number;
  read: boolean;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  studentName?: string;
  courseId: string;
  answers: Record<string, string>;
  score: number;
  attemptNumber: number;
  status: 'pending' | 'in_progress' | 'finalized';
  submittedAt?: number;
  percentageScore: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: number;
}

export interface QuestionDistribution {
  multiple_choice: number;
  open_question: number;
  case_study: number;
  workshop: number;
  true_false: number;
  icfes_multiple_choice: number;
  saber_pro_reading_critical: number;
  saber_pro_quantitative_reasoning: number;
  saber_pro_citizen_competencies: number;
  saber_pro_written_communication: number;
  saber_pro_english: number;
  saber_pro_info_interpretation: number;
  saber_pro_context_based: number;
  saber_pro_graphics_interpretation: number;
  saber_pro_case_analysis: number;
}

export interface ExamParams {
  topic: string;
  difficulty: 'bajo' | 'medio' | 'alto' | 'integral';
  numQuestions: number;
  course: string;
  courseId: string;
  semester: string;
  questionTypes: QuestionType[];
  distribution?: QuestionDistribution;
  selectedCompetencies?: string[];
  maxAttempts: number;
}
