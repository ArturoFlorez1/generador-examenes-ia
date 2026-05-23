import React from 'react';
import { 
  Plus, 
  FileText, 
  Trash2, 
  ChevronRight, 
  BrainCircuit, 
  BookOpen, 
  GraduationCap,
  Key,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Exam, Course, ExamAttempt } from '../types';
import { pdfService } from '../services/pdfService';
import { examAttemptsService } from '../services/firestoreService';
import { auth } from '../lib/firebase';
import { CourseManager } from './CourseManager';
import { EnrollmentManager } from './EnrollmentManager';
import { CourseDetail } from './CourseDetail';

interface DashboardProps {
  exams: Exam[];
  role: 'teacher' | 'student' | 'admin';
  courses: Course[];
  enrolledCourses: Course[];
  onCreateNew: (courseId?: string) => void;
  onViewExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onCreateCourse: (name: string, description: string) => Promise<void>;
  onDeleteCourse: (id: string) => Promise<void>;
  onEnroll: (code: string) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  exams, 
  role, 
  courses, 
  enrolledCourses,
  onCreateNew, 
  onViewExam, 
  onDeleteExam,
  onCreateCourse,
  onDeleteCourse,
  onEnroll
}) => {
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(null);
  const [showSaberProGuide, setShowSaberProGuide] = React.useState(false);
  const [activeGuideTab, setActiveGuideTab] = React.useState<'steps' | 'levels' | 'traps'>('steps');

  const selectedCourse = React.useMemo(() => {
    return [...courses, ...enrolledCourses].find(c => c.id === selectedCourseId);
  }, [selectedCourseId, courses, enrolledCourses]);

  const downloadExam = async (exam: Exam, includeAnswers = false) => {
    await pdfService.generateExamPdf(exam, includeAnswers);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">EvaluAI</h1>
          <p className="text-slate-500 font-medium">Sistema académico inteligente para la gestión de cursos y evaluaciones.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Removed global Nuevo Examen button - exams must be created within courses now */}
        </div>
      </header>

      <div className="space-y-6">
        {selectedCourse ? (
          <CourseDetail 
            course={selectedCourse}
            role={role}
            exams={exams}
            onBack={() => setSelectedCourseId(null)}
            onViewExam={onViewExam}
            onDeleteExam={onDeleteExam}
            onCreateExam={() => onCreateNew(selectedCourse.id)}
            onDownloadExam={downloadExam}
          />
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Exams */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-emerald-500/20 hover:bg-emerald-50/[0.01] transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                      <FileText size={22} className="stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-650 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                      {role === 'student' ? 'Evaluaciones' : 'Instrumentos'}
                    </span>
                  </div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-5">
                    {role === 'student' ? 'Mis Evaluaciones Activas' : 'Exámenes Disponibles'}
                  </h3>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">{exams.length}</p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-50">
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                    {role === 'student' 
                      ? 'Pruebas diseñadas y asignadas por tus docentes de informática.' 
                      : 'Evaluaciones diseñadas mediante IA publicadas en tus aulas.'}
                  </p>
                </div>
              </div>

              {/* Card 2: Courses */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-amber-500/20 hover:bg-amber-50/[0.01] transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                      <BookOpen size={22} className="stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                      Aulas Académicas
                    </span>
                  </div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-5">
                    {role === 'student' ? 'Mis Cursos Inscritos' : 'Cursos Asignados'}
                  </h3>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">
                    {role === 'student' ? enrolledCourses.length : courses.length}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-50">
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                    {role === 'student'
                      ? 'Salones de clase a los que te has matriculado oficialmente.'
                      : 'Grupos y asignaturas de la Licenciatura que diriges actualmente.'}
                  </p>
                </div>
              </div>

              {/* Card 3: Performance Level */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-blue-500/20 hover:bg-blue-50/[0.01] transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                      <BrainCircuit size={22} className="stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                      Metas ICFES
                    </span>
                  </div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-5">
                    Nivel Promedio Proyectado
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-black text-blue-600 tracking-tight">NIVEL 3</p>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">(Satisfactorio)</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100/80">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <span>💡 ¿Qué significa esta métrica?</span>
                    </p>
                    <p className="text-[10.5px] font-bold text-slate-600 leading-relaxed">
                      El ICFES clasifica el desempeño de <span className="font-extrabold">1 a 4</span>. El <span className="font-extrabold text-blue-700">Nivel 3</span> indica un dominio satisfactorio de competencias críticas Saber Pro, estimado según los resultados históricos agregados del portal.
                    </p>
                  </div>
                </div>
              </div>
            </div>



            {role === 'student' && (
              <div className="animate-in slide-in-from-top-4 duration-500">
                <button
                  onClick={() => setShowSaberProGuide(!showSaberProGuide)}
                  className={`w-full group flex items-center justify-between p-6 rounded-[32px] border transition-all ${
                    showSaberProGuide 
                      ? 'bg-amber-500 border-amber-500 text-white shadow-xl shadow-amber-500/20' 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-amber-200 hover:bg-amber-50/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${showSaberProGuide ? 'bg-white/20' : 'bg-amber-50 text-amber-600'}`}>
                      <HelpCircle size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className={`text-lg font-black uppercase tracking-tight ${showSaberProGuide ? 'text-white' : 'text-slate-900'}`}>
                        Guía Maestra: Éxito en Saber Pro
                      </h3>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${showSaberProGuide ? 'text-white/80' : 'text-slate-400'}`}>
                        {showSaberProGuide ? 'Haz clic para ocultar la guía' : 'Estrategias y consejos para responder preguntas ICFES'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`transition-transform duration-300 ${showSaberProGuide ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {showSaberProGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="card p-8 bg-gradient-to-br from-indigo-50/40 via-amber-50/10 to-white border-amber-200/60 shadow-2xl space-y-6">
                        {/* Selector de sub-vistas */}
                        <div className="flex border-b border-slate-200/80 pb-1 overflow-x-auto gap-2">
                          <button
                            onClick={() => setActiveGuideTab('steps')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                              activeGuideTab === 'steps'
                                ? 'border-amber-500 text-amber-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            ⭐ Método de las 4 Fases
                          </button>
                          <button
                            onClick={() => setActiveGuideTab('levels')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                              activeGuideTab === 'levels'
                                ? 'border-amber-500 text-amber-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            📊 Niveles de Desempeño
                          </button>
                          <button
                            onClick={() => setActiveGuideTab('traps')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                              activeGuideTab === 'traps'
                                ? 'border-amber-500 text-amber-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            🚨 Trampas del Diseñador
                          </button>
                        </div>

                        {/* Contenidos de acuerdo al Tab activo */}
                        {activeGuideTab === 'steps' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                              {
                                step: "01",
                                title: "Mapea el Contexto Técnico",
                                desc: "No te apresures. Lee despacio el caso técnico o la línea de código provista. Subraya mentalmente el problema de fondo, sus restricciones y los actores involucrados."
                              },
                              {
                                step: "02",
                                title: "Filtra la Intención Crítica",
                                desc: "¿Qué competencia te pide el ítem? Identifícala claramente: si te pide justificar decisiones, diseñar una solución sostenible o reconocer datos literales."
                              },
                              {
                                step: "03",
                                title: "Aniquilación por Descarte",
                                desc: "No busques de inmediato la correcta. Descarta primero las respuestas contradictorias, las que aplican malas prácticas o las que requieren recursos fuera de margen."
                              },
                              {
                                step: "04",
                                title: "Coherencia de Especificidad",
                                desc: "Si dudas entre dos opciones válidas, relee minuciosamente: una de ellas responderá de forma integral la meta última, la otra será verdadera pero inconexa."
                              }
                            ].map((item, i) => (
                              <div key={i} className="space-y-2 relative group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                <span className="text-4xl font-black text-amber-500/20 absolute top-2 right-4 select-none">
                                  {item.step}
                                </span>
                                <h4 className="text-xs font-black text-amber-800 uppercase tracking-tight pr-8">
                                  {item.title}
                                </h4>
                                <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                                  {item.desc}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeGuideTab === 'levels' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              {
                                level: "Nivel Interpretativo (Dificultad Baja)",
                                target: "Comprensión semántica y literal directa.",
                                guide: "La respuesta está contenida o se deriva de forma estricta y directa de los datos o fragmentos provistos en el escenario, sin dar lugar a segundas lecturas.",
                                risk: "No agregues suposiciones ni saques conclusiones apresuradas que no estén escritas."
                              },
                              {
                                level: "Nivel Argumentativo (Dificultad Media)",
                                target: "Análisis causal, justificación y validez.",
                                guide: "Aquí debes justificar racionalmente decisiones técnicas o metodológicas. Requiere validar el por qué un argumento es lógicamente superior al resto.",
                                risk: "Cuidado con las falacias circulares que repiten el problema sin aportar argumentos de valor."
                              },
                              {
                                level: "Nivel Propositivo (Dificultad Alta)",
                                target: "Planteamiento de alternativas viables.",
                                guide: "Abordas el diseño de sistemas de información o dilemas docentes con restricciones del mundo real. Elige optimizar según el margen propuesto.",
                                risk: "Desconecta las nociones ideales y elige la solución práctica y sostenible que mitiga el riesgo de raíz."
                              },
                              {
                                level: "Nivel Integral (Dificultad Compleja)",
                                target: "Hibridación ética, legal y técnica.",
                                guide: "Se examina la capacidad de actuar éticamente como docente u profesional TI, considerando regulaciones y el impacto social del software.",
                                risk: "Evita soluciones egoístas, que vulneren accesibilidad o que violen normativas estándar."
                              }
                            ].map((item, i) => (
                              <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-2">
                                <span className="text-[9px] bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 font-bold uppercase font-mono">
                                  {item.level}
                                </span>
                                <h4 className="text-xs font-black text-slate-800 mt-1">Foco: {item.target}</h4>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                  {item.guide}
                                </p>
                                <div className="border-t border-slate-50 pt-2 text-[10px] text-amber-700 italic font-semibold">
                                  💡 Estrategia: {item.risk}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeGuideTab === 'traps' && (
                          <div className="space-y-4">
                            <p className="text-xs text-slate-500 font-medium italic">
                              Reconocer los patrones de distracción en el diseño de preguntas de exámenes estatales es el 50% del éxito. Conoce las trampas de diseño más frecuentes:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {[
                                {
                                  trapName: "La Verdad Ajena / Hecho Plausible",
                                  description: "Una de las opciones te ofrece una afirmación teórica impecable y verídica en ciencias computacionales, pero completamente deslindada de las necesidades del caso planteado.",
                                  antidote: "Pregúntate siempre: ¿Esta solución responde explícitamente a la problemática del enunciado, o solo expresa algo verdadero a nivel general?"
                                },
                                {
                                  trapName: "La Solución Idealizada / Utópica",
                                  description: "Se te sugiere la mejor arquitectura mágica o didáctica jamás creada, pero que viola flagrantemente el presupuesto restringido o las competencias del personal dadas en el texto.",
                                  antidote: "Elige siempre la opción viable y contextualizada sobre la utopía inalcanzable."
                                },
                                {
                                  trapName: "La Exclusión Absoluta",
                                  description: "Afirmaciones categóricas estructuradas alrededor de términos de control irrestrictos como siempre, nunca o únicamente.",
                                  antidote: "Sospecha de la rigidez. En informática y pedagogía, las respuestas completas contemplan matices adaptativos."
                                }
                              ].map((trap, i) => (
                                <div key={i} className="p-5 rounded-2xl border border-rose-100 bg-rose-50/20 flex flex-col justify-between">
                                  <div>
                                    <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                                      {trap.trapName}
                                    </span>
                                    <p className="text-xs text-slate-700 font-medium mt-3 leading-relaxed">
                                      {trap.description}
                                    </p>
                                  </div>
                                  <div className="border-t border-rose-100/50 mt-4 pt-2 text-[10px] text-rose-700 font-bold">
                                    🛡️ Antídoto: {trap.antidote}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-amber-100/30 rounded-2xl border border-amber-100/50 pt-2">
                          <div className="flex items-center gap-3">
                            <Sparkles className="text-amber-500 shrink-0" size={18} />
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">
                              La excelencia no proviene de memorizar, sino de aprender a decodificar enunciados complejos.
                            </p>
                          </div>
                          <button 
                            onClick={() => setShowSaberProGuide(false)}
                            className="px-6 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 shrink-0"
                          >
                            Entendido, ¡Listo para practicar!
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div id="teacher-courses" className="animate-in slide-in-from-bottom duration-500">
              {role === 'student' ? (
                <EnrollmentManager 
                  enrolledCourses={enrolledCourses} 
                  onEnroll={onEnroll} 
                  onSelectCourse={(id) => setSelectedCourseId(id)}
                />
              ) : (
                <CourseManager 
                  courses={courses} 
                  exams={exams}
                  onCreateCourse={onCreateCourse} 
                  onDeleteCourse={onDeleteCourse} 
                  onSelectCourse={(id) => setSelectedCourseId(id)}
                />
              )}
            </div>

            {/* Global Exams for Teachers/Admins */}
            {(role === 'teacher' || role === 'admin') && exams.length > 0 && (
              <div id="explore-instruments" className="space-y-6 pt-10 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <BrainCircuit size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Explorar Instrumentos</h2>
                      <p className="text-slate-500 text-sm font-medium">Banco de exámenes generados por la comunidad docente.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.slice(0, 6).map((exam) => (
                    <motion.div 
                      key={exam.id}
                      whileHover={{ y: -5 }}
                      className="bg-white border border-slate-100 p-6 rounded-[32px] hover:shadow-xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl -translate-x-8 -translate-y-8" />
                      
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                          <FileText size={20} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                          {exam.difficulty}
                        </span>
                      </div>

                        <div className="space-y-2 relative z-10">
                          <h4 className="font-black text-slate-900 leading-tight line-clamp-2 uppercase tracking-tight h-10">
                            {exam.topic}
                          </h4>
                          {exam.teacherName && (
                            <p className="text-[9px] font-bold text-brand-primary uppercase tracking-widest -mt-1">
                              Por: {exam.teacherName === 'Docente' ? 'Docente Asignado' : exam.teacherName}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <BookOpen size={12} />
                            {exam.course}
                          </div>
                        </div>

                      <div className="flex items-center gap-2 pt-6 mt-6 border-t border-slate-50 relative z-10">
                        <button 
                          onClick={() => onViewExam(exam)}
                          className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all flex items-center justify-center gap-2"
                        >
                          Ver Detalles
                        </button>
                        <button 
                          onClick={() => downloadExam(exam)}
                          className="w-11 h-11 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100"
                          title="Descargar PDF"
                        >
                          <FileText size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {exams.length > 6 && (
                  <div className="text-center pt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Se muestran los últimos {exams.length} instrumentos disponibles
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatsCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; trend?: string }> = ({ icon, label, value, trend }) => (
  <div className="card p-6 flex flex-col gap-3 group hover:border-brand-primary/30 hover:bg-brand-primary/[0.02]">
    <div className="flex items-center justify-between">
      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors">
        {icon}
      </div>
      {trend && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{trend}</span>}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 tracking-wider capitalize">{label}</p>
      <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  </div>
);
