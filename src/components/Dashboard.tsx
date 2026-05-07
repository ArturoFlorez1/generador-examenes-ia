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
  const downloadExam = (exam: Exam, includeAnswers = false) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header Decoration
    doc.setFillColor(0, 132, 61); // Brand Primary
    doc.rect(0, 0, 210, 40, 'F');
    
    // Header Text - White contrast
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("UNIVERSIDAD DE CÓRDOBA", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("FACULTAD DE EDUCACIÓN Y CIENCIAS HUMANAS | LICENCIATURA EN INFORMÁTICA", 105, 30, { align: "center" });
    
    y = 55;

    // Exam Metadata Banner
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 5, 170, 25, 'F');
    
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(includeAnswers ? "CLAVE DE RESPUESTAS OFICIAL" : "INSTRUMENTO DE EVALUACIÓN ACADÉMICA", margin + 5, y + 5);
    y += 12;
    
    doc.setFontSize(11);
    doc.text(exam.title.toUpperCase(), margin + 5, y + 5);
    y += 15;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(`Asignatura: ${exam.course}`, margin, y);
    doc.text(`Semestre: ${exam.semester}`, 90, y);
    doc.text(`Dificultad: ${exam.difficulty.toUpperCase()}`, 150, y);
    y += 6;
    doc.text(`Tema Principal: ${exam.topic}`, margin, y);
    doc.text(`Fecha: ${new Date(exam.createdAt).toLocaleDateString()}`, 150, y);
    y += 12;

    // Divider
    doc.setDrawColor(220);
    doc.line(margin, y, 210 - margin, y);
    y += 10;

    if (!includeAnswers) {
      // Student Fields
      doc.setDrawColor(200);
      doc.text("Nombre del Estudiante: __________________________________________________", margin, y);
      y += 7;
      doc.text("Fecha: _________________    Cédula: _________________", margin, y);
      y += 15;
    }

    // Questions
    exam.questions.forEach((q, i) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      const promptLines = doc.splitTextToSize(`${i + 1}. ${q.prompt}`, 170);
      doc.text(promptLines, margin, y);
      y += (promptLines.length * 5) + 3;

      doc.setFont("helvetica", "normal");
      if (q.options) {
        q.options.forEach((opt, idx) => {
          const char = String.fromCharCode(65 + idx);
          const isCorrect = includeAnswers && String(q.correctAnswer).includes(opt);
          if (isCorrect) {
            doc.setFillColor(230, 255, 230);
            doc.rect(margin + 3, y - 4, 160, 5, 'F');
            doc.setTextColor(0, 100, 0);
          }
          doc.text(`${char}) ${opt} ${isCorrect ? ' [CORRECTA]' : ''}`, margin + 5, y);
          doc.setTextColor(0);
          y += 6;
        });
      } else if (q.type === 'true_false') {
        doc.text(`(   ) Verdadero ${includeAnswers && q.correctAnswer === 'true' ? ' [CORRECTA]' : ''}`, margin + 5, y);
        y += 6;
        doc.text(`(   ) Falso ${includeAnswers && q.correctAnswer === 'false' ? ' [CORRECTA]' : ''}`, margin + 5, y);
        y += 6;
      } else {
        if (includeAnswers) {
          doc.setTextColor(0, 100, 0);
          const ansLines = doc.splitTextToSize(`Respuesta Sugerida: ${q.correctAnswer}`, 160);
          doc.text(ansLines, margin + 5, y);
          doc.setTextColor(0);
          y += (ansLines.length * 5) + 5;
        } else {
          doc.line(margin + 5, y+5, 180, y+5);
          y += 8;
          doc.line(margin + 5, y+5, 180, y+5);
          y += 8;
        }
      }
      
      if (includeAnswers && q.justification) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        const justLines = doc.splitTextToSize(`Justificación: ${q.justification}`, 160);
        doc.text(justLines, margin + 5, y);
        doc.setFontSize(10);
        doc.setTextColor(0);
        y += (justLines.length * 4) + 5;
      }
      
      y += 5;
    });

    doc.save(`${includeAnswers ? 'Clave_' : 'Examen_'}${exam.topic.replace(/\s+/g, '_')}.pdf`);
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
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">{exam.course}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">{exam.semester}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className={`px-2 py-0.5 rounded ${
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
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadExam(exam, true);
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
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadExam(exam, false);
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
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  </div>
);
