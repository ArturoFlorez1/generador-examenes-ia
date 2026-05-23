import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  User,
  Search,
  BookOpen,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { Course, Exam, ExamAttempt, Enrollment } from '../types';
import { examAttemptsService, coursesService } from '../services/firestoreService';

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
  const courseExams = useMemo(() => {
    return exams.filter(e => e.courseId === course.id);
  }, [exams, course.id]);

  const [activeTab, setActiveTab] = useState<'exams' | 'roster' | 'grades'>('exams');
  const [students, setStudents] = useState<Enrollment[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // States for grades tracking
  const [selectedResultsExamId, setSelectedResultsExamId] = useState<string>('');
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch student roster if user is teacher/admin
  useEffect(() => {
    if (role === 'student') return;

    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const roster = await coursesService.getStudentsForCourse(course.id);
        setStudents(roster.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || '')));
      } catch (err) {
        console.error("Error loading roster for course detail view:", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [course.id, role]);

  // Automatically select the first exam in tracker once exams list updates
  useEffect(() => {
    if (courseExams.length > 0 && !selectedResultsExamId) {
      setSelectedResultsExamId(courseExams[0].id);
    }
  }, [courseExams, selectedResultsExamId]);

  // Subscribe to attempt data for the active tracking exam
  useEffect(() => {
    if (!selectedResultsExamId || role === 'student') {
      setAttempts([]);
      return;
    }

    setAttemptsLoading(true);
    const unsub = examAttemptsService.subscribeToAttempts(
      selectedResultsExamId,
      (data) => {
        setAttempts(data);
        setAttemptsLoading(false);
      },
      { teacherId: auth.currentUser?.uid || undefined }
    );

    return () => unsub();
  }, [selectedResultsExamId, role]);

  // Determine active display name of a selected exam
  const selectedExamData = useMemo(() => {
    return courseExams.find(e => e.id === selectedResultsExamId);
  }, [courseExams, selectedResultsExamId]);

  // Build the unified list of students and their corresponding score/status for the selected exam
  const mergedGradesList = useMemo(() => {
    if (role === 'student') return [];

    // Map each enrolled student to their corresponding latest/best attempt
    const enrolledResults = students.map(student => {
      const studentAttempts = attempts.filter(a => a.studentId === student.studentId);
      // Sort to get best score / latest finalized status
      const latestAttempt = [...studentAttempts].sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))[0];
      const bestAttempt = [...studentAttempts].sort((a, b) => b.score - a.score)[0];

      return {
        studentId: student.studentId,
        studentName: student.studentName || 'Estudiante sin registrar',
        attempt: latestAttempt || null,
        bestScore: bestAttempt ? bestAttempt.score : null,
        attemptsCount: studentAttempts.length,
        isEnrolled: true,
      };
    });

    // Capture any extraneous student attempt results that completed the exam but metadata isn't explicitly in roster
    const enrolledIds = new Set(students.map(s => s.studentId));
    const extraneousAttempts = attempts.filter(a => !enrolledIds.has(a.studentId));

    const groupedExtranous: Record<string, ExamAttempt[]> = {};
    extraneousAttempts.forEach(a => {
      if (!groupedExtranous[a.studentId]) {
        groupedExtranous[a.studentId] = [];
      }
      groupedExtranous[a.studentId].push(a);
    });

    const extraneousResults = Object.keys(groupedExtranous).map(studentId => {
      const studentAttempts = groupedExtranous[studentId];
      const latestAttempt = [...studentAttempts].sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))[0];
      const bestAttempt = [...studentAttempts].sort((a, b) => b.score - a.score)[0];

      return {
        studentId,
        studentName: latestAttempt.studentName || 'Estudiante Externo',
        attempt: latestAttempt,
        bestScore: bestAttempt ? bestAttempt.score : null,
        attemptsCount: studentAttempts.length,
        isEnrolled: false,
      };
    });

    const combined = [...enrolledResults, ...extraneousResults];

    // Apply search filter if typed
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return combined.filter(row => row.studentName.toLowerCase().includes(q));
    }

    return combined;
  }, [students, attempts, role, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            id="course-back-btn"
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
            id="course-create-exam-btn"
            onClick={onCreateExam}
            className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Examen para este Curso
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Course General Info */}
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
                    <User size={14} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente</span>
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {course.creatorName && course.creatorName !== 'Docente' ? course.creatorName : 'Docente Asignado'}
                </span>
              </div>

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
              <h3 className="text-xl font-black italic tracking-tight">Especializado en Informática</h3>
              <p className="text-slate-400 text-xs font-medium mt-1 leading-relaxed">
                Utiliza inteligencia artificial generativa con taxonomía de Bloom para pre-evaluar de forma objetiva con especificaciones del ICFES Saber Pro.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Stateful Tabs or Student Action View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs switch panel (Only displayed for Teachers / Admins to maintain privacy for students) */}
          {role !== 'student' ? (
            <div className="flex border-b border-slate-100 pb-2 gap-6" id="teacher-course-tabs">
              <button
                id="tab-exams-button"
                onClick={() => setActiveTab('exams')}
                className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'exams' 
                    ? 'border-brand-primary text-brand-primary' 
                    : 'border-transparent text-slate-405 text-slate-400 hover:text-slate-900'
                }`}
              >
                Instrumentos ({courseExams.length})
              </button>

              <button
                id="tab-roster-button"
                onClick={() => setActiveTab('roster')}
                className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'roster' 
                    ? 'border-brand-primary text-brand-primary' 
                    : 'border-transparent text-slate-405 text-slate-400 hover:text-slate-900'
                }`}
              >
                Inscritos ({students.length})
              </button>

              <button
                id="tab-grades-button"
                onClick={() => setActiveTab('grades')}
                className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'grades' 
                    ? 'border-brand-primary text-brand-primary' 
                    : 'border-transparent text-slate-405 text-slate-400 hover:text-slate-900'
                }`}
              >
                Resultados y Notas
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="text-brand-primary" /> 
                Exámenes Disponibles del Curso
                <span className="ml-2 bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-400">{courseExams.length}</span>
              </h3>
            </div>
          )}

          {/* Tab Content Display */}
          {(activeTab === 'exams' || role === 'student') && (
            <div className="space-y-4 animate-in fade-in duration-300">
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
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">
                              {(() => {
                                const rawTeacher = exam.teacherName || course.creatorName;
                                const displayTeacher = rawTeacher && rawTeacher !== 'Docente' ? rawTeacher : 'Docente Asignado';
                                return (
                                  <span className="text-brand-primary">Docente: {displayTeacher}</span>
                                );
                              })()}
                              {(exam.teacherName || course.creatorName) && <span className="w-1 h-1 bg-slate-200 rounded-full"></span>}
                              <span className={`${
                                exam.difficulty === 'alto' ? 'text-rose-500' : 
                                exam.difficulty === 'medio' ? 'text-amber-500' : 'text-emerald-500'
                              }`}>{exam.difficulty}</span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                              <span>{exam.questions.length} PREGUNTAS</span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                              <span className="text-slate-900">{exam.maxAttempts || 1} INTENTOS PERMITIDOS</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 md:mt-0" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {role !== 'student' && onDownloadExam && (
                              <>
                                <button 
                                  onClick={() => onDownloadExam(exam, true)}
                                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all animate-pulse"
                                  title="Ver Respuestas de Docente"
                                >
                                  <KeyRound size={18} />
                                </button>
                                {onDeleteExam && (
                                  <button 
                                    onClick={() => onDeleteExam(exam.id)}
                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Eliminar Examen permanentemente"
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
                                title="Descargar PDF de Evaluación"
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
          )}

          {activeTab === 'roster' && role !== 'student' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-slate-800 uppercase tracking-wider">Lista Oficial de Estudiantes ({students.length})</h4>
              </div>

              {loadingStudents ? (
                <div className="py-12 flex justify-center items-center gap-3">
                  <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando nómina...</span>
                </div>
              ) : students.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 text-center text-slate-400 italic text-sm">
                  <Users size={28} className="mx-auto text-slate-300 mb-2" />
                  No hay estudiantes matriculados en esta aula virtual todavía.
                  <p className="not-italic text-xs text-brand-primary font-bold mt-2">Código para compartir: {course.code}</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                    {students.map((student, idx) => (
                      <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50/55 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-mono w-6 font-black">{idx + 1}.</span>
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase">{student.studentName || 'Estudiante sin Nombre'}</p>
                            <p className="text-[9px] font-mono text-slate-400">UUID: {student.studentId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Inscripción</p>
                          <p className="text-[10px] text-slate-500 font-bold">
                            {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'grades' && role !== 'student' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
              
              {/* Left Sub-Column: Exams list selector */}
              <div className="lg:col-span-1 space-y-3 bg-slate-50/80 p-4 rounded-3xl border border-slate-100 h-fit">
                <div className="border-b border-slate-200/50 pb-2 mb-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Exámenes ({courseExams.length})
                  </h4>
                </div>

                {courseExams.length === 0 ? (
                  <p className="text-[10px] font-bold text-slate-400 italic text-center py-4">No hay exámenes</p>
                ) : (
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {courseExams.map((exam) => (
                      <button
                        key={exam.id}
                        onClick={() => setSelectedResultsExamId(exam.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                          selectedResultsExamId === exam.id
                            ? 'bg-white border-brand-primary shadow-sm text-brand-primary'
                            : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="font-extrabold line-clamp-2 uppercase tracking-tight break-all leading-snug">
                          {exam.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold block uppercase tracking-widest mt-0.5">
                          {exam.topic}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Sub-Column: Deliveries Tracking and Student Scores list (Up to 40 rows per page layout) */}
              <div className="lg:col-span-3 space-y-4">
                {selectedExamData ? (
                  <div className="space-y-4">
                    {/* Selected Exam Information Row */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md">
                          Examen Seleccionado
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 mt-1 uppercase break-words leading-tight">{selectedExamData.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{selectedExamData.topic} • {selectedExamData.questions.length} preguntas</p>
                      </div>

                      {/* Simple query filtering inside list */}
                      <div className="relative shrink-0 w-full sm:w-48">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Search size={14} />
                        </span>
                        <input
                          type="text"
                          placeholder="Buscar alumno..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand-primary transition-colors font-bold text-slate-705"
                        />
                      </div>
                    </div>

                    {/* Results / Submissions Table Container */}
                    <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm">
                      {attemptsLoading ? (
                        <div className="py-12 flex justify-center items-center gap-3">
                          <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando entregas...</span>
                        </div>
                      ) : mergedGradesList.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-medium italic text-sm">
                          {searchQuery ? 'Ningún alumno coincide con la búsqueda.' : 'No hay alumnos registrados con entregas o pendientes.'}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-5 py-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest w-12">#</th>
                                <th className="px-5 py-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Estudiante</th>
                                <th className="px-5 py-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Estado de Entrega</th>
                                <th className="px-5 py-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Nº Intentos</th>
                                <th className="px-5 py-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Calificación</th>
                                <th className="px-5 py-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Fecha Entrega</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {mergedGradesList.slice(0, 40).map((row, index) => {
                                const scoreColorClass = row.bestScore !== null 
                                  ? row.bestScore >= 3.0 
                                    ? 'text-emerald-700 bg-emerald-50' 
                                    : 'text-rose-700 bg-rose-50'
                                  : 'text-slate-400 bg-slate-50';

                                return (
                                  <tr key={row.studentId} className="hover:bg-slate-50/40 transition-colors">
                                    <td className="px-5 py-4 font-mono text-[10px] text-slate-400 font-black">
                                      {index + 1}
                                    </td>
                                    
                                    {/* Student Name */}
                                    <td className="px-5 py-4">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 text-xs font-bold">
                                          {row.studentName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="truncate max-w-[170px]">
                                          <p className="text-xs font-extrabold text-slate-800 uppercase truncate" title={row.studentName}>
                                            {row.studentName}
                                          </p>
                                          {!row.isEnrolled && (
                                            <span className="inline-block text-[8px] font-mono font-black text-rose-500 bg-rose-50 px-1 py-0.2 rounded mt-0.5 uppercase">
                                              No Matriculado
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </td>

                                    {/* Submissions Status badged appropriately */}
                                    <td className="px-5 py-4 text-center">
                                      {row.attempt ? (
                                        row.attempt.status === 'finalized' ? (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-bold uppercase tracking-wider mx-auto">
                                            <CheckCircle size={10} /> Finalizado
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-105 bg-amber-100 text-amber-850 rounded-full text-[9px] font-bold uppercase tracking-wider mx-auto">
                                            <Clock size={10} /> En Curso
                                          </span>
                                        )
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-450 text-[9px] font-bold uppercase tracking-wider mx-auto text-slate-400">
                                          <AlertCircle size={10} /> Sin Presentar
                                        </span>
                                      )}
                                    </td>

                                    {/* Attempts Number */}
                                    <td className="px-5 py-4 text-center text-xs font-bold text-slate-600">
                                      {row.attemptsCount > 0 ? (
                                        <span className="font-mono">{row.attemptsCount} / {selectedExamData.maxAttempts || 1}</span>
                                      ) : (
                                        <span className="text-slate-300">—</span>
                                      )}
                                    </td>

                                    {/* Final Score normalized exactly to 0-5.0 scale */}
                                    <td className="px-5 py-4 text-right">
                                      {row.bestScore !== null ? (
                                        <div className="inline-flex flex-col items-end">
                                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${scoreColorClass}`}>
                                            {Number(row.bestScore).toFixed(2)}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-300 font-bold block text-center">—</span>
                                      )}
                                    </td>

                                    {/* Last submission date */}
                                    <td className="px-5 py-4 text-right text-[10px] font-bold text-slate-500 whitespace-nowrap">
                                      {row.attempt?.submittedAt ? (
                                        new Date(row.attempt.submittedAt).toLocaleDateString(undefined, {
                                          day: 'numeric',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })
                                      ) : (
                                        <span className="text-slate-300 font-bold">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50/70 py-16 border rounded-3xl flex flex-col items-center justify-center text-slate-400 italic">
                    <Award size={36} className="text-slate-200 mb-2" />
                    Selecciona un examen de la lista lateral para visualizar el seguimiento de notas de los estudiantes.
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
