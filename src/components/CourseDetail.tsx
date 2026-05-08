import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Users, 
  Calendar,
  Trash2,
  ChevronRight,
  ClipboardCheck,
  BrainCircuit,
  Key,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, Exam } from '../types';

interface CourseDetailProps {
  course: Course;
  role: 'teacher' | 'student' | 'admin';
  exams: Exam[];
  onBack: () => void;
  onViewExam: (exam: Exam) => void;
  onDeleteExam?: (id: string) => void;
  onCreateExam?: () => void;
  onDownloadExam?: (exam: Exam, includeAnswers: boolean) => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ 
  course, 
  role, 
  exams, 
  onBack, 
  onViewExam,
  onDeleteExam,
  onCreateExam,
  onDownloadExam
}) => {
  const courseExams = exams.filter(e => e.courseId === course.id);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">Detalle del Curso</h2>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{course.name}</h1>
          </div>
        </div>

        {role !== 'student' && (
          <button 
            onClick={onCreateExam}
            className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Examen para este Curso
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Info Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
              <ClipboardCheck size={32} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-xl">Información General</h3>
              <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">{course.description}</p>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400">
                    <Key size={14} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</span>
                </div>
                <span className="text-sm font-black text-brand-primary font-mono select-all">{course.code}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400">
                    <Calendar size={14} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Creado el</span>
                </div>
                <span className="text-sm font-bold text-slate-700">{new Date(course.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[40px] text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-x-12 -translate-y-12" />
            <BrainCircuit size={40} className="text-brand-primary" />
            <div>
              <h3 className="text-xl font-black italic tracking-tight">Potenciado por IA</h3>
              <p className="text-slate-400 text-xs font-medium mt-1">
                Utiliza inteligencia artificial generativa para crear instrumentos de evaluación que midan competencias reales.
              </p>
            </div>
          </div>
        </div>

        {/* Exams List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="text-brand-primary" /> 
              Exámenes del Curso
              <span className="ml-2 bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-400">{courseExams.length}</span>
            </h3>
          </div>

          {courseExams.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-[40px] py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <FileText size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-medium italic">No se han creado exámenes para este curso aún.</p>
              {role !== 'student' && (
                <button 
                  onClick={onCreateExam}
                  className="bg-brand-primary/10 text-brand-primary px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all"
                >
                  Generar Primer Examen
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {courseExams.map((exam) => (
                  <motion.div
                    key={exam.id}
                    layout
                    whileHover={{ scale: 1.01 }}
                    className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between hover:border-brand-primary/30 transition-all cursor-pointer group shadow-sm"
                    onClick={() => onViewExam(exam)}
                  >
                    <div className="flex items-center gap-5">
                      <div className="bg-brand-primary/10 p-4 rounded-2xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900 group-hover:text-brand-primary transition-colors uppercase tracking-tight">{exam.title}</h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">
                          <span className={`${
                            exam.difficulty === 'alto' ? 'text-rose-500' : 
                            exam.difficulty === 'medio' ? 'text-amber-500' : 'text-emerald-500'
                          }`}>{exam.difficulty}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <span>{exam.questions.length} PREGUNTAS</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 md:mt-0" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {role !== 'student' && onDownloadExam && (
                          <>
                            <button 
                              onClick={() => onDownloadExam(exam, true)}
                              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all"
                              title="Respuestas"
                            >
                              <KeyRound size={18} />
                            </button>
                            {onDeleteExam && (
                              <button 
                                onClick={() => onDeleteExam(exam.id)}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Eliminar"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </>
                        )}
                        {onDownloadExam && (
                          <button 
                            onClick={() => onDownloadExam(exam, false)}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all"
                            title="Descargar PDF"
                          >
                            <FileText size={18} />
                          </button>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-300 group-hover:bg-brand-primary group-hover:text-white transition-all">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
