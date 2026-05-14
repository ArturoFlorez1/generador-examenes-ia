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
  difficulty: 'bajo' | 'medio' | 'alto';
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
}

export interface ExamParams {
  topic: string;
  difficulty: 'bajo' | 'medio' | 'alto';
  numQuestions: number;
  course: string;
  courseId: string;
  semester: string;
  questionTypes: QuestionType[];
  distribution?: QuestionDistribution;
}
