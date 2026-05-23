import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Loader2,
  Compass,
  BookOpen,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { ExamAttempt, Exam } from '../types';
import { examAttemptsService } from '../services/firestoreService';

interface AnalyticsPanelProps {
  userId: string;
  role: 'student' | 'teacher' | 'admin';
  exams: Exam[];
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ userId, role, exams }) => {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for teacher view
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedExamId, setSelectedExamId] = useState<string>('all');

  useEffect(() => {
    const fetchAttempts = async () => {
      setLoading(true);
      try {
        let list: ExamAttempt[] = [];
        if (role === 'student') {
          list = await examAttemptsService.getStudentAttempts(userId);
        } else {
          list = await examAttemptsService.getTeacherAttempts(userId);
        }
        setAttempts(list.sort((a, b) => (a.submittedAt || 0) - (b.submittedAt || 0)));
      } catch (err) {
        console.error("Error loaded attempts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, [userId, role]);

  // Unique courses based on exams
  const teacherCourses = React.useMemo(() => {
    const courseMap = new Map<string, string>();
    exams.forEach(exam => {
      if (exam.courseId && exam.course) {
        courseMap.set(exam.courseId, exam.course);
      }
    });
    return Array.from(courseMap.entries()).map(([id, name]) => ({ id, name }));
  }, [exams]);

  // Filtered list of exams based on selected course
  const filteredExams = React.useMemo(() => {
    if (selectedCourseId === 'all') {
      return exams;
    }
    return exams.filter(e => e.courseId === selectedCourseId);
  }, [exams, selectedCourseId]);

  // Reset exam filter if it doesn't belong to the newly selected course
  useEffect(() => {
    if (selectedCourseId !== 'all') {
      const stillValid = filteredExams.some(e => e.id === selectedExamId);
      if (!stillValid && selectedExamId !== 'all') {
        setSelectedExamId('all');
      }
    }
  }, [selectedCourseId, filteredExams, selectedExamId]);

  // Filtered attempts based on active selections
  const filteredAttempts = React.useMemo(() => {
    return attempts.filter(att => {
      const attCourseId = att.courseId || exams.find(e => e.id === att.examId)?.courseId;
      const matchesCourse = selectedCourseId === 'all' || attCourseId === selectedCourseId;
      const matchesExam = selectedExamId === 'all' || att.examId === selectedExamId;
      return matchesCourse && matchesExam;
    });
  }, [attempts, exams, selectedCourseId, selectedExamId]);

  // Aggregate Stats
  const stats = React.useMemo(() => {
    const finalized = filteredAttempts.filter(a => a.status === 'finalized');
    
    if (finalized.length === 0) {
      return { 
        avgScore: 0, 
        totalAttempts: filteredAttempts.length, 
        high: 0, 
        lastScore: 0, 
        passRate: 0,
        mostPopularExam: 'Ninguno'
      };
    }

    const totalAttempts = filteredAttempts.length;
    const scores = finalized.map(a => a.percentageScore);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const high = Math.max(...scores);
    const lastScore = finalized[finalized.length - 1].percentageScore;
    const passCount = finalized.filter(a => a.percentageScore >= 60).length;
    const passRate = (passCount / finalized.length) * 100;

    // Compute most popular exam for teachers based on filtered attempts
    const examCounts: Record<string, number> = {};
    filteredAttempts.forEach(a => {
      examCounts[a.examId] = (examCounts[a.examId] || 0) + 1;
    });
    let maxCount = 0;
    let mostAttemptedExamId = '';
    Object.entries(examCounts).forEach(([eId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostAttemptedExamId = eId;
      }
    });

    const mostExam = exams.find(e => e.id === mostAttemptedExamId);
    const mostPopularExam = mostExam ? (mostExam.topic || mostExam.title) : 'Ninguno';

    return { 
      avgScore, 
      totalAttempts, 
      high, 
      lastScore, 
      passRate, 
      mostPopularExam 
    };
  }, [filteredAttempts, exams]);

  // Performance per Exam for Docents
  const examPerformanceData = React.useMemo(() => {
    const finalized = attempts.filter(a => a.status === 'finalized');
    // Display all exams or only exams belonging to the selected course
    const targetExams = selectedCourseId === 'all' 
      ? exams 
      : exams.filter(e => e.courseId === selectedCourseId);

    return targetExams.map(exam => {
      const examAttempts = finalized.filter(a => a.examId === exam.id);
      const count = examAttempts.length;
      const scores = examAttempts.map(a => a.percentageScore);
      const avg = count > 0 ? (scores.reduce((sum, s) => sum + s, 0) / count) : 0;
      const passCount = examAttempts.filter(a => a.percentageScore >= 60).length;
      const passRate = count > 0 ? (passCount / count) * 100 : 0;
      
      return {
        id: exam.id,
        title: exam.title,
        topic: exam.topic,
        course: exam.course,
        count,
        avgScore: avg,
        passRate
      };
    });
  }, [attempts, exams, selectedCourseId]);

  // Submissions list for the selected exam
  const selectedExamSubmissions = React.useMemo(() => {
    if (selectedExamId === 'all') return [];
    return attempts
      .filter(att => att.examId === selectedExamId && att.status === 'finalized')
      .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
  }, [attempts, selectedExamId]);

  // Grade distribution data for a specific selected exam
  const gradeDistributionData = React.useMemo(() => {
    if (selectedExamId === 'all') return [];
    
    let range1 = 0; // >= 90%
    let range2 = 0; // 80-89%
    let range3 = 0; // 60-79%
    let range4 = 0; // <60%
    
    const examAttempts = attempts.filter(att => att.examId === selectedExamId && att.status === 'finalized');
    examAttempts.forEach(att => {
      const score = att.percentageScore;
      if (score >= 90) range1++;
      else if (score >= 80) range2++;
      else if (score >= 60) range3++;
      else range4++;
    });
    
    return [
      { name: 'Excelente (>=90%)', alumnos: range1, color: '#00843D' },
      { name: 'Sobresaliente (80-89%)', alumnos: range2, color: '#3b82f6' },
      { name: 'Aceptable (60-79%)', alumnos: range3, color: '#f59e0b' },
      { name: 'Por mejorar (<60%)', alumnos: range4, color: '#ef4444' }
    ];
  }, [attempts, selectedExamId]);

  // Recharts Line Chart Data (Progress over time)
  const chartData = React.useMemo(() => {
    const finalized = filteredAttempts.filter(a => a.status === 'finalized');
    return finalized.map((attempt, index) => {
      // Find corresponding exam in the prop exams to get topic/title
      const examObj = exams.find(e => e.id === attempt.examId);
      const title = examObj ? examObj.topic : `Intento ${index + 1}`;
      return {
        name: `I${index + 1}`,
        score: parseFloat(attempt.percentageScore.toFixed(1)),
        displayName: title,
        rawDate: attempt.submittedAt 
          ? new Date(attempt.submittedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
          : ''
      };
    });
  }, [filteredAttempts, exams]);

  // Skills Breakdown mapping based on competencies
  const competencyData = React.useMemo(() => {
    const finalized = filteredAttempts.filter(a => a.status === 'finalized');
    
    const scoresMap: Record<string, { total: number; count: number }> = {
      "Lectura Crítica": { total: 0, count: 0 },
      "Razonamiento Cuantitativo": { total: 0, count: 0 },
      "Competencias Ciudadanas": { total: 0, count: 0 },
      "Inglés": { total: 0, count: 0 },
      "Análisis de Casos": { total: 0, count: 0 }
    };

    finalized.forEach(att => {
      const examObj = exams.find(e => e.id === att.examId);
      let competency = "Análisis de Casos";
      
      if (examObj) {
        const topicLower = examObj.topic.toLowerCase();
        if (topicLower.includes('lectura') || topicLower.includes('crítica') || topicLower.includes('comprensión')) {
          competency = "Lectura Crítica";
        } else if (topicLower.includes('matem') || topicLower.includes('ejercicio') || topicLower.includes('cuant') || topicLower.includes('razonamiento')) {
          competency = "Razonamiento Cuantitativo";
        } else if (topicLower.includes('inglés') || topicLower.includes('english') || topicLower.includes('idioma')) {
          competency = "Inglés";
        } else if (topicLower.includes('ciudadan') || topicLower.includes('ética') || topicLower.includes('constitución')) {
          competency = "Competencias Ciudadanas";
        }
      }
      
      scoresMap[competency].total += att.percentageScore;
      scoresMap[competency].count += 1;
    });

    return Object.keys(scoresMap).map(key => {
      const avg = scoresMap[key].count > 0 ? (scoresMap[key].total / scoresMap[key].count) : 0;
      return {
        subject: key,
        A: parseFloat(avg.toFixed(1)),
        fullMark: 100
      };
    });
  }, [filteredAttempts, exams]);

  // Gamified Badges Tracker List has been removed as per requested

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-[40px] border border-slate-100 shadow-sm">
        <Loader2 size={40} className="animate-spin text-brand-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          {role === 'student' ? 'Analizando tu historial de rendimiento...' : 'Analizando rendimiento de estudiantes...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="space-y-8">
        {/* Docent Filtering Controls */}
        {role === 'teacher' && (
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-brand-primary" />
                  Filtros de Análisis Docente
                </h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  Visualiza estadísticas agrupadas por curso o el rendimiento detallado de una prueba específica
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[280px] md:min-w-[420px]">
                {/* Course Selector */}
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Curso</label>
                  <div className="relative">
                    <select
                      value={selectedCourseId}
                      onChange={(e) => {
                        setSelectedCourseId(e.target.value);
                        setSelectedExamId('all');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer appearance-none pr-8"
                    >
                      <option value="all">📊 Todos los Cursos</option>
                      {teacherCourses.map(c => (
                        <option key={c.id} value={c.id}>🏫 {c.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Exam Selector */}
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Prueba Evaluativa</label>
                  <div className="relative">
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer appearance-none pr-8"
                    >
                      <option value="all">📝 Todas las Pruebas</option>
                      {filteredExams.map(ex => (
                        <option key={ex.id} value={ex.id}>📝 {ex.title} ({ex.topic})</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview KPIs Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {role === 'student' ? (
            <>
              {/* Card 1: Student Attempts */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">
                  Mis Intentos
                </span>
                <div className="flex flex-col mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">{stats.totalAttempts}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Tests Realizados</span>
                </div>
              </div>
              {/* Card 2: Student Avg Score */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">
                  Mi Nota Promedio
                </span>
                <div className="flex flex-col mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-brand-primary leading-none">{stats.avgScore.toFixed(0)}%</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1.5">({(stats.avgScore / 20).toFixed(2)} / 5.0)</span>
                </div>
              </div>
              {/* Card 3: Student Best Score */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">
                  Mi Mejor Puntaje
                </span>
                <div className="flex flex-col mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#00843D] leading-none">{stats.high.toFixed(0)}%</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Eficiencia Máxima</span>
                </div>
              </div>
              {/* Card 4: Student Passing Rate */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">
                  Mi Aprobación
                </span>
                <div className="flex flex-col mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">{stats.passRate.toFixed(0)}%</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 font-sans">Tests Pasados</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Card 1: Teacher Attempts received */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">
                  {selectedExamId !== 'all' ? 'Envíos de la Prueba' : selectedCourseId !== 'all' ? 'Envíos del Curso' : 'Envíos Recibidos'}
                </span>
                <div className="flex flex-col mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 leading-none">{stats.totalAttempts}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Exámenes Resueltos</span>
                </div>
              </div>
              {/* Card 2: Teacher general average */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">
                  {selectedExamId !== 'all' ? 'Promedio de Calificación' : selectedCourseId !== 'all' ? 'Promedio del Curso' : 'Promedio General'}
                </span>
                <div className="flex flex-col mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-brand-primary leading-none">{stats.avgScore.toFixed(0)}%</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1.5">({(stats.avgScore / 20).toFixed(2)} / 5.0)</span>
                </div>
              </div>
              {/* Card 3: Teacher Highest Grade achieved in scope */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">
                  {selectedExamId !== 'all' ? 'Nota Más Alta del Examen' : selectedCourseId !== 'all' ? 'Nota Más Alta del Curso' : 'Nota Máxima Registrada'}
                </span>
                <div className="flex flex-col mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 leading-none">{(stats.high / 20).toFixed(2)}</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1.5 font-sans">Escala de 0 a 5.0 ({stats.high.toFixed(0)}%)</span>
                </div>
              </div>
              {/* Card 4: Teacher passing status */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">
                  Aprobación {selectedExamId !== 'all' ? 'de la Prueba' : selectedCourseId !== 'all' ? 'del Curso' : 'Global'}
                </span>
                <div className="flex flex-col mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#00843D] leading-none">{stats.passRate.toFixed(0)}%</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 font-sans">Aprobado con {'>'}=60%</span>
                </div>
              </div>
            </>
          )}
        </div>

        {attempts.length === 0 ? (
          <div className="bg-slate-50 p-12 rounded-[40px] border border-dashed border-slate-200 text-center space-y-4">
            <Compass size={40} className="mx-auto text-slate-300" />
            <h4 className="font-extrabold text-slate-900 uppercase text-sm tracking-tight">Sin Historial Evaluativo</h4>
            <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
              {role === 'student' 
                ? 'Resuelve un examen de tu curso asignado en la sección "Cursos" para empezar a generar tus gráficos académicos.'
                : 'Diseña exámenes o invita a tus estudiantes a resolver tus exámenes en la sección "Cursos" para empezar a ver sus métricas.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {role === 'student' ? (
              /* Evolution Line Chart - Students Only */
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-brand-primary" size={20} />
                    <h3 className="font-extrabold text-slate-900 uppercase tracking-tight text-sm">
                      Mi Curva de Aprendizaje
                    </h3>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    Evolución temporal de tus resultados académicos
                  </p>
                </div>
                <div className="h-64 w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="900" />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} fontWeight="900" />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px', fontFamily: 'monospace' }}
                          formatter={(value: any, name: any, props: any) => [`${value}%`, props.payload.displayName]}
                        />
                        <Line type="monotone" dataKey="score" stroke="#00843D" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#00843D' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-mono text-[10px]">Esperando datos de entregas...</div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase text-center mt-2">Rendimiento secuencial de exámenes</p>
              </div>
            ) : selectedExamId !== 'all' ? (
              /* Submissions Details per Specific Exam - Teachers Filtered Mode */
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Users className="text-brand-primary" size={20} />
                    <h3 className="font-extrabold text-slate-900 uppercase tracking-tight text-sm">
                      Análisis de Entregas del Examen
                    </h3>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    Resultados individuales por estudiante para esta prueba evaluativa
                  </p>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[290px] pr-1">
                  {selectedExamSubmissions.map((sub, idx) => {
                    const isApproved = sub.percentageScore >= 60;
                    return (
                      <div 
                        key={sub.id || idx} 
                        className="p-4 bg-slate-50/75 hover:bg-slate-100/50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-left transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-xs text-slate-900 uppercase truncate">
                            {sub.studentName || 'Estudiante'}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-450 bg-slate-200/50 px-1 rounded">
                              Intento #{sub.attemptNumber || 1}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[8px] font-bold uppercase text-slate-400">
                              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Sin Fecha'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Resultado</span>
                            <span className="text-xs font-extrabold text-slate-950">{sub.percentageScore.toFixed(0)}%</span>
                          </div>
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md border ${
                            isApproved 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isApproved ? 'Aprobado' : 'Por Mejorar'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {selectedExamSubmissions.length === 0 && (
                    <div className="p-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-xs font-semibold text-slate-400 uppercase">Sin entregas para este examen en particular.</p>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase text-center mt-2">
                  Selecciona otro examen para comparar el rendimiento
                </p>
              </div>
            ) : (
              /* Instrument Performance Summary - Teachers General/Course Mode */
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-brand-primary" size={20} />
                    <h3 className="font-extrabold text-slate-900 uppercase tracking-tight text-sm">
                      Rendimiento de Instrumentos
                    </h3>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    Resumen estadístico de las pruebas creadas
                  </p>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[290px] pr-1">
                  {examPerformanceData.map((examPerf) => {
                    const hasSubmissions = examPerf.count > 0;
                    return (
                      <div 
                        key={examPerf.id} 
                        className="p-4 bg-slate-50/75 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-slate-100/50 transition-all cursor-pointer"
                        onClick={() => setSelectedExamId(examPerf.id)}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md border border-slate-300 inline-block mb-1">
                            {examPerf.topic || 'General'}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase truncate" title={examPerf.title}>
                            {examPerf.title}
                          </h4>
                          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block mt-0.5">
                            Curso: {examPerf.course || 'Global'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 sm:self-center">
                          <div className="text-center sm:text-right">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Envíos</span>
                            <span className="text-xs font-extrabold text-slate-950">{examPerf.count}</span>
                          </div>
                          <div className="text-center sm:text-right">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Promed.</span>
                            <span className={`text-xs font-extrabold ${hasSubmissions ? 'text-brand-primary' : 'text-slate-400'}`}>
                              {hasSubmissions ? `${examPerf.avgScore.toFixed(0)}%` : '—'}
                            </span>
                          </div>
                          <div className="text-center sm:text-right">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Aprob.</span>
                            <span className={`text-xs font-extrabold ${hasSubmissions ? 'text-[#00843D]' : 'text-slate-400'}`}>
                              {hasSubmissions ? `${examPerf.passRate.toFixed(0)}%` : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {examPerformanceData.length === 0 && (
                    <div className="p-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-xs font-semibold text-slate-400 uppercase">Aún no has diseñado exámenes de entrenamiento.</p>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase text-center mt-2">
                  Haz clic en un examen para inspeccionar sus entregas de alumnos
                </p>
              </div>
            )}

            {/* Right block: Radar Chart (General breakdown) or BarChart (Exam grade breakdown) */}
            {role === 'teacher' && selectedExamId !== 'all' ? (
              /* Calification grade distribution - specific exam mode */
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Activity className="text-indigo-500" size={20} />
                    <h3 className="font-extrabold text-slate-900 uppercase tracking-tight text-sm">
                      Distribución de Calificaciones
                    </h3>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    Frecuencia de las notas obtenidas por rangos de rendimiento Saber Pro
                  </p>
                </div>
                <div className="h-64 w-full flex items-center justify-center">
                  {gradeDistributionData.some(g => g.alumnos > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeDistributionData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={7} fontWeight="900" />
                        <YAxis stroke="#94a3b8" fontSize={9} fontWeight="900" allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '11px' }} />
                        <Bar dataKey="alumnos" radius={[8, 8, 0, 0]}>
                          {gradeDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center p-8 space-y-2">
                      <Activity className="mx-auto text-slate-300" size={28} />
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Esperando primeras entregas</span>
                      <span className="block text-[9px] font-medium text-slate-400 italic font-mono text-center leading-relaxed">
                        Los rangos de notas se graficarán cuando los alumnos finalicen esta prueba.
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase text-center mt-2">Distribución dinámica de notas</p>
              </div>
            ) : (
              /* Radar Chart showing competency level */
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Activity className="text-rose-500" size={20} />
                    <h3 className="font-extrabold text-slate-900 uppercase tracking-tight text-sm">
                      {role === 'student' ? 'Mis Competencias Saber Pro' : 'Análisis de Competencias del Alumnado'}
                    </h3>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    {role === 'student' 
                      ? 'Nivel de fortaleza alcanzado por cada competencia' 
                      : 'Fortalezas y áreas de mejora promedio de la cohorte'}
                  </p>
                </div>
                <div className="h-64 w-full flex items-center justify-center">
                  {competencyData.some(c => c.A > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={competencyData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} fontWeight="900" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={8} />
                        <Radar name={role === 'student' ? "Mi Nivel (%)" : "Nivel de Alumnos (%)"} dataKey="A" stroke="#00843D" fill="#00843D" fillOpacity={0.15} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '11px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center p-8 space-y-2">
                      <Activity className="mx-auto text-slate-300" size={28} />
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Suficientes datos requeridos</span>
                      <span className="block text-[9px] font-medium text-slate-400 italic font-mono text-center leading-relaxed">
                        Se actualizará según las pruebas rendidas por los alumnos.
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase text-center mt-2">Distribución temática Saber Pro</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
