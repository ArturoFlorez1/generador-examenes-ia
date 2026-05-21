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
import { Exam, Course } from '../types';
import { jsPDF } from 'jspdf';
import { UNI_LOGO_URL } from '../constants';
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

  const selectedCourse = React.useMemo(() => {
    return [...courses, ...enrolledCourses].find(c => c.id === selectedCourseId);
  }, [selectedCourseId, courses, enrolledCourses]);

  const downloadExam = async (exam: Exam, includeAnswers = false) => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Función auxiliar para cargar imagen y evitar errores de CORS/Firma
    const loadImage = (url: string): Promise<string | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            try {
              resolve(canvas.toDataURL("image/jpeg", 0.9));
            } catch (e) {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    const logoBase64 = await loadImage(UNI_LOGO_URL);

    if (logoBase64) {
      doc.addImage(logoBase64, "JPEG", margin, y, 40, 15, undefined, 'FAST');
    } else {
      // Encabezado alternativo si el logo falla
      doc.setFillColor(0, 132, 61);
      doc.roundedRect(margin, y, 12, 12, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("UC", margin + 3, y + 8);
    }
    
    y += 22;

    // Encabezado Formal
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 132, 61); // Verde Institucional (#00843D)
    doc.text("UNIVERSIDAD DE CÓRDOBA", margin, y);
    
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("FACULTAD DE EDUCACIÓN Y CIENCIAS HUMANAS", margin, y);
    
    y += 12;
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(exam.title.toUpperCase(), margin, y);
    
    y += 8;
    
    // Cuadro de Información del Examen
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 28, 3, 3, "FD");
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text("CURSO:", margin + 5, y + 8);
    doc.text("TEMA:", margin + 5, y + 16);
    doc.text("SEMESTRE:", margin + 5, y + 24);
    
    if (exam.showTeacherInPdf !== false) {
      doc.text("DOCENTE:", (pageWidth / 2) + 5, y + 8);
    }
    doc.text("DIFICULTAD:", (pageWidth / 2) + 5, y + 16);
    doc.text("FECHA:", (pageWidth / 2) + 5, y + 24);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    
    // Truncar o ajustar texto largo en metadatos para evitar superposición de columnas
    const maxMetaWidth = (pageWidth / 2) - margin - 30;
    
    const courseTxt = doc.splitTextToSize(exam.course.toUpperCase(), maxMetaWidth);
    doc.text(courseTxt, margin + 25, y + 8);
    
    const topicTxt = doc.splitTextToSize(exam.topic.toUpperCase(), maxMetaWidth);
    doc.text(topicTxt, margin + 25, y + 16);
    
    const semesterTxt = doc.splitTextToSize(exam.semester.toUpperCase(), maxMetaWidth);
    doc.text(semesterTxt, margin + 25, y + 24);
    
    if (exam.showTeacherInPdf !== false) {
      const teacherDisplay = (exam.teacherName || "DOCENTE ASIGNADO").toUpperCase();
      doc.text(teacherDisplay, (pageWidth / 2) + 30, y + 8);
    }
    
    doc.text(exam.difficulty.toUpperCase(), (pageWidth / 2) + 30, y + 16);
    doc.text(new Date(exam.createdAt).toLocaleDateString(), (pageWidth / 2) + 30, y + 24);

    y += 42;

    if (!includeAnswers) {
      // Espacio para identificación del estudiante
      doc.setDrawColor(200);
      doc.setFont("helvetica", "bold");
      doc.text("NOMBRE COMPLETO: __________________________________________________", margin, y);
      y += 8;
      doc.text("CÓDIGO / ID: ________________________", margin, y);
      y += 15;
      
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("HOJA DE RESPUESTAS Y JUSTIFICACIONES (SOLO PARA USO DOCENTE)", margin, y);
      y += 15;
    }

    // Preguntas
    exam.questions.forEach((q, i) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      
      const promptText = `${i + 1}. ${q.prompt}`;
      const promptLines = doc.splitTextToSize(promptText, pageWidth - (margin * 2));
      doc.text(promptLines, margin, y);
      
      y += (promptLines.length * 5) + 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, optIndex) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          const char = String.fromCharCode(65 + optIndex);
          const optionText = `${char}) ${opt}`;
          const isCorrect = includeAnswers && (String(q.correctAnswer).toLowerCase() === opt.toLowerCase() || String(q.correctAnswer).includes(opt));
          
          if (isCorrect) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 132, 61);
          } else {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
          }

          const optLines = doc.splitTextToSize(optionText, pageWidth - (margin * 2) - 10);
          doc.text(optLines, margin + 10, y);
          
          if (isCorrect) {
            doc.setFontSize(7);
            doc.text(" [CORRECTA]", margin + 10 + doc.getTextWidth(optLines[optLines.length - 1]) + 2, y + ((optLines.length - 1) * 5));
            doc.setFontSize(10);
          }

          y += (optLines.length * 5) + 2;
        });

        if (includeAnswers && q.justification) {
          y += 3;
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(100);
          const justifText = `Justificación: ${q.justification}`;
          const justifLines = doc.splitTextToSize(justifText, pageWidth - (margin * 2) - 15);
          doc.text(justifLines, margin + 10, y);
          y += (justifLines.length * 4) + 5;
        }
      } else {
        // Espacio para respuesta escrita
        doc.setDrawColor(241, 245, 249);
        doc.line(margin + 5, y + 5, pageWidth - margin, y + 5);
        y += 8;
        doc.line(margin + 5, y + 5, pageWidth - margin, y + 5);
        y += 12;
      }

      y += 8;
    });

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Página ${i} de ${pageCount} | Generado por EvaluAI UniCordoba - Calidad Educativa en la Era Digital`, pageWidth / 2, 285, { align: "center" });
    }

    const fileName = `${includeAnswers ? 'Clave_' : 'Examen_'}${exam.topic.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatsCard 
                icon={<FileText className="text-emerald-600" />} 
                label="Exámenes Disponibles" 
                value={exams.length} 
              />
              <StatsCard 
                icon={<BookOpen className="text-amber-600" />} 
                label="Cursos" 
                value={role === 'student' ? enrolledCourses.length : courses.length} 
              />
              <StatsCard 
                icon={<BrainCircuit className="text-blue-600" />} 
                label="Nivel Promedio" 
                value="Intermedio" 
              />
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
                      <div className="card p-8 bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-2xl shadow-amber-500/5 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {[
                            {
                              step: "01",
                              title: "Lectura Crítica del Contexto",
                              desc: "Lee el enunciado detalladamente. En Saber Pro, la respuesta no depende solo de lo que sabes, sino de lo que el texto afirma explícitamente."
                            },
                            {
                              step: "02",
                              title: "Identifica la Competencia",
                              desc: "Define si te piden INTERPRETAR (entender), ARGUMENTAR (validar razones) o PROPONER (solucionar problemas)."
                            },
                            {
                              step: "03",
                              title: "Elimina los Distractores",
                              desc: "Descarta opciones que generalizan demasiado o aquellas que son verdaderas en la realidad pero no se mencionan en el texto."
                            },
                            {
                              step: "04",
                              title: "Selección de Precisión",
                              desc: "Cuando dos opciones parezcan correctas, elige la que sea más completa y responda directamente a la pregunta formulada."
                            }
                          ].map((item, i) => (
                            <div key={i} className="space-y-3 relative group">
                              <span className="text-5xl font-black text-amber-200/50 absolute -top-4 -left-2 select-none group-hover:text-amber-300/50 transition-colors">
                                {item.step}
                              </span>
                              <div className="relative z-10 pt-4">
                                <h4 className="text-xs font-black text-amber-700 uppercase tracking-tight mb-2">
                                  {item.title}
                                </h4>
                                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-amber-100/30 rounded-2xl border border-amber-100/50">
                          <div className="flex items-center gap-3">
                            <Sparkles className="text-amber-500" size={20} />
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                              Recuerda: Razonamiento lógico sobre memorización de datos.
                            </p>
                          </div>
                          <button 
                            onClick={() => setShowSaberProGuide(false)}
                            className="px-6 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                          >
                            Entendido
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="animate-in slide-in-from-bottom duration-500">
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
              <div className="space-y-6 pt-10 border-t border-slate-100">
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
                              Por: {exam.teacherName}
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
