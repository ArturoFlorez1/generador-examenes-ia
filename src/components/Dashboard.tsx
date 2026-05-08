import React from 'react';
import { 
  Plus, 
  FileText, 
  Trash2, 
  ChevronRight, 
  BrainCircuit, 
  BookOpen, 
  Users, 
  Settings,
  GraduationCap,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Exam } from '../types';
import { jsPDF } from 'jspdf';

interface DashboardProps {
  exams: Exam[];
  role: 'teacher' | 'student' | 'admin';
  onCreateNew: () => void;
  onViewExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ exams, role, onCreateNew, onViewExam, onDeleteExam }) => {
  const downloadExam = async (exam: Exam, includeAnswers = false) => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Función auxiliar para cargar imagen y evitar errores de CORS/Firma
    const loadImage = (url: string): Promise<string | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    const logoBase64 = await loadImage("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Logo_Universidad_de_Cordoba.png/512px-Logo_Universidad_de_Cordoba.png");

    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", margin, y, 45, 18, undefined, 'FAST');
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
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Instrumentos de Evaluación</h1>
          <p className="text-slate-500 font-medium">Repositorio institucional de exámenes basados en evidencias.</p>
        </div>
        
        {role !== 'student' && (
          <button 
            onClick={onCreateNew}
            className="btn-primary group flex items-center gap-2 self-start"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Nuevo Instrumento
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          icon={<FileText className="text-emerald-600" />} 
          label="Total Exámenes" 
          value={exams.length} 
          trend={exams.length > 0 ? `+ ${exams.length} esta semana` : undefined}
        />
        <StatsCard 
          icon={<BookOpen className="text-amber-600" />} 
          label="Cursos Activos" 
          value={new Set(exams.map(e => e.course)).size} 
        />
        <StatsCard 
          icon={<BrainCircuit className="text-blue-600" />} 
          label="Nivel Promedio" 
          value="Intermedio" 
        />
        <StatsCard 
          icon={<GraduationCap className="text-indigo-600" />} 
          label="Evidencias Totales" 
          value={exams.reduce((acc, e) => acc + e.questions.length, 0)} 
        />
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-2 h-8 bg-brand-primary rounded-full" />
            Explorar Instrumentos
          </h2>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button className="px-3 py-1 text-xs font-bold text-slate-600 bg-white rounded shadow-sm">Todos</button>
            <button className="px-3 py-1 text-xs font-bold text-slate-400">Programación</button>
            <button className="px-3 py-1 text-xs font-bold text-slate-400">Informática</button>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="card p-12 text-center space-y-4">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <FileText size={32} />
            </div>
            <div className="max-w-xs mx-auto">
              <h3 className="text-lg font-medium text-slate-900">No hay exámenes aún</h3>
              <p className="text-slate-500 text-sm">Comienza generando tu primer examen basado en evidencias para tu curso.</p>
            </div>
            {role !== 'student' && (
              <button 
                onClick={onCreateNew}
                className="btn-secondary"
              >
                Generar ahora
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {exams.map((exam) => (
                <motion.div
                  key={exam.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="card p-5 flex flex-col md:flex-row md:items-center justify-between hover:border-brand-primary/50 transition-colors cursor-pointer group gap-4"
                  onClick={() => onViewExam(exam)}
                >
                  <div className="flex items-center gap-5">
                    <div className="bg-brand-primary/10 p-4 rounded-2xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-slate-900 group-hover:text-brand-primary transition-colors">{exam.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-semibold tracking-wider">
                        <span className="bg-slate-100 px-2 py-0.5 rounded italic">{exam.course}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">{exam.semester}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className={`px-2 py-0.5 rounded capitalize ${
                          exam.difficulty === 'alto' ? 'bg-red-50 text-red-600' : 
                          exam.difficulty === 'medio' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>{exam.difficulty}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {role !== 'student' && (
                      <>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            await downloadExam(exam, true);
                          }}
                          className="p-3 text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all border border-brand-primary/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                          title="Descargar con respuestas"
                        >
                          <Key size={14} /> Respuestas
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteExam(exam.id);
                          }}
                          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-slate-100 shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        await downloadExam(exam, false);
                      }}
                      className="p-3 text-slate-500 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all border border-slate-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                      title="Descargar para impresión"
                    >
                      <FileText size={14} /> PDF
                    </button>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
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
