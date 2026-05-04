/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestionType = 'multiple_choice' | 'open_question' | 'case_study' | 'workshop' | 'true_false';

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
  course: string;
  semester: string;
  difficulty: string;
  questions: Question[];
  createdAt: number;
}

export interface ExamParams {
  topic: string;
  difficulty: 'bajo' | 'medio' | 'alto';
  numQuestions: number;
  course: string;
  semester: string;
  questionTypes: QuestionType[];
}
