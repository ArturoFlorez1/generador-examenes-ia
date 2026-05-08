import React, { useState } from 'react';
import { 
  Save, 
  Trash2, 
  ArrowLeft, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  FileText,
  Sparkles,
  Check,
  RefreshCw,
  Send,
  Loader2,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, Exam } from '../types';
import { UNI_LOGO_URL } from '../constants';
import { reformulateQuestion } from '../services/geminiService';

interface QuestionReviewProps {
  exam: Partial<Exam>;
  onSave: (finalExam: Exam) => void;
  onCancel: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  'multiple_choice': 'Opción Múltiple',
  'true_false': 'Falso o Verdadero',
  'open_question': 'Pregunta Abierta',
  'case_study': 'Estudio de Caso',
  'workshop': 'Taller Práctico'
};

export const QuestionReview: React.FC<QuestionReviewProps> = ({ exam, onSave, onCancel }) => {
  const [questions, setQuestions] = useState<Question[]>(exam.questions || []);
  const [title, setTitle] = useState(exam.title || `Examen de ${exam.topic}`);
  const [teacherName, setTeacherName] = useState(exam.teacherName || '');
  const [showTeacherInPdf, setShowTeacherInPdf] = useState(exam.showTeacherInPdf !== false);
  const [reformulatingId, setReformulatingId] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleReformulate = async (id: string) => {
    if (!instructions.trim()) return;
    setIsProcessing(true);
    try {
      const question = questions.find(q => q.id === id);
      if (!question) return;
      
      const newQuestion = await reformulateQuestion(question, instructions);
      setQuestions(prev => prev.map(q => q.id === id ? newQuestion : q));
      setReformulatingId(null);
      setInstructions('');
    } catch (error) {
      console.error("Error reformulating:", error);
      alert("No se pudo reformular la pregunta. Inténtalo de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...exam,
      id: exam.id || Date.now().toString(),
      title,
      questions,
      teacherName,
      showTeacherInPdf,
      createdAt: Date.now(),
      courseId: exam.courseId || '',
      creatorId: exam.creatorId || ''
    } as Exam);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <button 
            onClick={onCancel}
            className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 hover:shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          
          <img 
            src={UNI_LOGO_URL} 
            alt="UniCordoba Logo" 
            className="h-14 w-auto object-contain hidden sm:block"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-2 py-0.5 rounded-md">VET-EVAL SYSTEM</span>
                <span className="text-[10px] font-black text-slate-400 tracking-widest bg-slate-100 px-2 py-0.5 rounded-md italic">Borrador</span>
              </div>
              <input 
                type="text" 
                className="text-3xl font-black text-slate-900 bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-brand-primary outline-none px-1 transition-all tracking-tighter"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
        </div>
        <button 
          onClick={handleSave}
          className="btn-primary group flex items-center gap-2 px-8 py-4 shadow-xl shadow-brand-primary/20"
        >
          <Check size={20} className="group-hover:scale-110 transition-transform" />
          Publicar Instrumento
        </button>
      </header>

      <div className="space-y-10">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} className="text-brand-primary" /> Nombre del Docente (Opcional)
            </label>
            <input 
              type="text"
              placeholder="Ej: Florez Arturo"
              className="w-full bg-white border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-slate-700"
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
             <button 
               onClick={() => setShowTeacherInPdf(!showTeacherInPdf)}
               className={`flex-1 w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
                 showTeacherInPdf 
                   ? 'bg-brand-primary/5 border-brand-primary text-brand-primary' 
                   : 'bg-slate-50 border-slate-200 text-slate-400'
               }`}
             >
               <CheckCircle2 size={18} className={showTeacherInPdf ? 'opacity-100' : 'opacity-20'} />
               {showTeacherInPdf ? 'Nombre visible en PDF' : 'Nombre oculto en PDF'}
             </button>
             <div className="flex-1 text-[10px] font-medium text-slate-400 italic leading-snug">
               * Define si quieres que tu nombre aparezca en el encabezado del examen impreso.
             </div>
          </div>
        </div>

        <AnimatePresence>
          {questions.map((q, index) => (
            <motion.div
              key={q.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card relative group overflow-hidden"
            >
              <div className="h-2 w-full absolute top-0 left-0 bg-brand-primary/20" />
              
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="bg-brand-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-brand-primary/10">
                      {index + 1}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black bg-brand-primary/5 text-brand-primary px-3 py-1.5 rounded-xl border border-brand-primary/20 tracking-widest uppercase">{TYPE_LABELS[q.type] || q.type.replace('_', ' ')}</span>
                      <span className="text-[10px] font-black bg-brand-primary text-white px-3 py-1.5 rounded-xl tracking-widest">Bloom: {q.bloomLevel}</span>
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl tracking-widest border ${
                        q.difficulty === 'alto' ? 'bg-red-50 text-red-600 border-red-100' : 
                        q.difficulty === 'medio' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>Dificultad: {q.difficulty}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setReformulatingId(q.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                    >
                      <RefreshCw size={14} className={reformulatingId === q.id && isProcessing ? 'animate-spin' : ''} />
                      Reformular con IA
                    </button>
                    <button 
                      onClick={() => deleteQuestion(q.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      title="Eliminar ítem"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {reformulatingId === q.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 space-y-4">
                        <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">
                          ¿Cómo quieres que sea la nueva versión de esta pregunta?
                        </label>
                        <div className="flex gap-3">
                          <textarea 
                            autoFocus
                            placeholder="Ej: Hazla más difícil, enfócate en el subtema X, cámbiala a estudio de caso..."
                            className="flex-1 bg-white border border-emerald-200 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium resize-none shadow-sm"
                            rows={3}
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                          />
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => handleReformulate(q.id)}
                              disabled={isProcessing || !instructions.trim()}
                              className="bg-brand-primary text-white p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-primary/20 disabled:grayscale disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                            <button 
                              onClick={() => {
                                setReformulatingId(null);
                                setInstructions('');
                              }}
                              className="bg-white text-slate-400 p-4 rounded-2xl hover:text-slate-900 transition-all border border-slate-200 shadow-sm"
                            >
                              <XCircle size={20} />
                            </button>
                          </div>
                        </div>
                        <p className="text-[9px] font-bold text-emerald-600/70 italic">* La IA mantendrá el contexto del curso pero aplicará tus cambios específicos.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14}/> Enunciado del Instrumento
                  </label>
                  <textarea
                    rows={Math.max(3, Math.ceil(q.prompt.length / 60))}
                    className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-3xl p-8 focus:border-brand-primary focus:bg-white outline-none min-h-[140px] transition-all font-bold text-xl text-slate-900 leading-relaxed shadow-inner resize-none overflow-hidden"
                    value={q.prompt}
                    onChange={e => {
                      const newQs = [...questions];
                      newQs[index].prompt = e.target.value;
                      setQuestions(newQs);
                    }}
                  />
                </div>

                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    {q.options.map((opt, i) => (
                      <div 
                        key={i}
                        className={`p-5 rounded-2xl border-2 text-sm flex items-start justify-between gap-4 group/opt ${
                          opt === q.correctAnswer 
                            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700 font-bold shadow-sm' 
                            : 'border-slate-50 bg-white text-slate-600'
                        }`}
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ring-1 shrink-0 mt-0.5 ${
                            opt === q.correctAnswer ? 'bg-emerald-500 text-white ring-emerald-600' : 'bg-slate-100 text-slate-400 ring-slate-200'
                          }`}>{String.fromCharCode(65 + i)}</span>
                          <textarea 
                            rows={Math.max(1, Math.ceil(opt.length / 80))}
                            className="bg-transparent border-none outline-none flex-1 font-medium resize-none leading-relaxed h-auto"
                            value={opt}
                            onChange={(e) => {
                              const newQs = [...questions];
                              newQs[index].options![i] = e.target.value;
                              setQuestions(newQs);
                            }}
                          />
                        </div>
                        {opt === q.correctAnswer && <Check size={20} className="shrink-0 mt-1" />}
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Check size={14} className="text-emerald-500" /> Respuesta Oficial
                      </label>
                      <input
                        className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-black text-emerald-700"
                        value={q.correctAnswer}
                        onChange={e => {
                          const newQs = [...questions];
                          newQs[index].correctAnswer = e.target.value;
                          setQuestions(newQs);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} className="text-brand-primary" /> Competencia / Proceso
                      </label>
                      <input
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:border-brand-primary outline-none transition-all font-medium text-slate-600"
                        value={q.competence}
                        onChange={e => {
                          const newQs = [...questions];
                          newQs[index].competence = e.target.value;
                          setQuestions(newQs);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 p-6 bg-slate-900 rounded-3xl text-white shadow-2xl">
                    <div className="flex items-center gap-2 text-brand-secondary font-black text-[10px] uppercase tracking-widest mb-2">
                      <BrainCircuit size={18} /> Justificación Pedagógica (Docente)
                    </div>
                    <textarea
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:bg-white/10 transition-all text-xs text-slate-300 leading-relaxed italic resize-none overflow-hidden min-h-[120px]"
                      rows={Math.max(4, Math.ceil(q.justification.length / 50))}
                      value={q.justification}
                      onChange={e => {
                        const newQs = [...questions];
                        newQs[index].justification = e.target.value;
                        setQuestions(newQs);
                      }}
                    />
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                       <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Recomendación:</span>
                       <p className="text-[10px] text-brand-secondary italic">"{q.teacherRecommendation}"</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={12} /> Criterios de Evaluación por IA:
                  </span>
                  {Object.entries(q.qualityCriteria).map(([key, val]) => (
                    <span key={key} className="text-[9px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                      {key.toUpperCase()}: <span className="text-brand-primary uppercase">{val as string}</span>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {questions.length === 0 && (
          <div className="text-center py-32 card bg-slate-50 border-dashed border-2 flex flex-col items-center gap-6">
            <div className="bg-slate-200 p-6 rounded-full text-slate-400">
              <AlertCircle size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Instrumento Vacío</h3>
              <p className="text-slate-500 font-medium italic">No hay preguntas para revisar. Regresa para generar nuevas evidencias.</p>
            </div>
            <button onClick={onCancel} className="btn-secondary px-10">Volver al Dashboard</button>
          </div>
        )}
      </div>

      <div className="fixed bottom-10 right-10 z-50">
        <button 
          onClick={handleSave}
          className="btn-primary shadow-2xl scale-110 flex items-center gap-3 px-12 py-5 font-black uppercase tracking-widest text-[10px] bg-slate-900 text-white rounded-full transition-transform hover:scale-115 active:scale-105"
        >
          <Save size={24} />
          Finalizar Validación
        </button>
      </div>
    </div>
  );
};
