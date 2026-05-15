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
  KeyRound,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, Exam, ExamAttempt } from '../types';
import { examAttemptsService } from '../services/firestoreService';

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

const ExamResultsToggle: React.FC<{ examId: string }> = ({ examId }) => {
    const [showResults, setShowResults] = useState(false);

    return (
        <div className="space-y-4">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setShowResults(!showResults);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    showResults 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
            >
                <Users size={14} />
                {showResults ? 'Ocultar Resultados' : 'Ver Resultados de Estudiantes'}
            </button>

            {showResults && (
                <div onClick={e => e.stopPropagation()}>
                    <StudentResultsTable examId={examId} />
                </div>
            )}
        </div>
    );
};

const StudentResultsTable: React.FC<{ examId: string }> = ({ examId }) => {
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        setLoading(true);
        const unsub = examAttemptsService.subscribeToAttempts(examId, (data) => {
            setAttempts(data.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0)));
            setLoading(false);
        });
        return () => unsub();
    }, [examId]);
    
    if (loading) return (
        <div className="flex items-center gap-2 py-4">
            <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando resultados...</span>
        </div>
    );

    if (attempts.length === 0) return (
        <div className="py-6 px-4 bg-white/50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 mt-4">
            <AlertCircle size={20} className="text-slate-300" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Aún no hay intentos registrados.</p>
        </div>
    );

    return (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Estudiante</th>
                            <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                            <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Puntaje</th>
                            <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                            <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Intento</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {attempts.map(attempt => (
                            <tr key={attempt.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-900 uppercase truncate max-w-[150px]">
                                            {attempt.studentName || 'Estudiante'}
                                        </span>
                                        <span className="text-[9px] font-mono text-slate-400">ID: {attempt.studentId.substring(0, 8)}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        {attempt.status === 'finalized' ? (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-black uppercase flex items-center gap-1">
                                                <CheckCircle size={10}/> Finalizado
                                            </span>
                                        ) : attempt.status === 'in_progress' ? (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[8px] font-black uppercase flex items-center gap-1">
                                                <Clock size={10}/> En curso
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[8px] font-black uppercase flex items-center gap-1">
                                                <AlertCircle size={10}/> Pendiente
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-black ${attempt.percentageScore >= 60 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {attempt.percentageScore.toFixed(1)}%
                                        </span>
                                        <span className="text-[10px] text-slate-300 font-bold">({attempt.score}/5.0)</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-[10px] font-bold text-slate-500">
                                        {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'En curso'}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <span className="bg-slate-100 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-900 mx-auto border border-slate-200 shadow-sm">
                                        {attempt.attemptNumber}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

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
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-slate-900 group-hover:text-brand-primary transition-colors uppercase tracking-tight">{exam.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">
                          {exam.teacherName && (
                            <span className="text-brand-primary">Docente: {exam.teacherName}</span>
                          )}
                          {exam.teacherName && <span className="w-1 h-1 bg-slate-200 rounded-full"></span>}
                          <span className={`${
                            exam.difficulty === 'alto' ? 'text-rose-500' : 
                            exam.difficulty === 'medio' ? 'text-amber-500' : 'text-emerald-500'
                          }`}>{exam.difficulty}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <span>{exam.questions.length} PREGUNTAS</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <span className="text-slate-900">{exam.maxAttempts || 1} INTENTOS PERMITIDOS</span>
                        </div>
                        {role === 'teacher' && (
                            <div className="mt-4">
                                <ExamResultsToggle examId={exam.id} />
                            </div>
                        )}
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
                        <FileText size={20} />
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
