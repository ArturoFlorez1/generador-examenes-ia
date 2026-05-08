import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  BrainCircuit,
  FileSearch,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { ExamParams, QuestionType, QuestionDistribution, Course } from '../types';

interface ExamCreatorProps {
  onBack: () => void;
  onGenerate: (params: ExamParams) => Promise<void>;
  isGenerating: boolean;
  courses: Course[];
  initialCourseId?: string;
}

export const ExamCreator: React.FC<ExamCreatorProps> = ({ 
  onBack, 
  onGenerate, 
  isGenerating, 
  courses,
  initialCourseId
}) => {
  const initialCourse = initialCourseId ? courses.find(c => c.id === initialCourseId) : courses[0];

  const [params, setParams] = useState<ExamParams>({
    topic: '',
    course: initialCourse?.name || 'Sin curso',
    courseId: initialCourse?.id || '',
    semester: '2026-1',
    difficulty: 'medio',
    numQuestions: 5,
    questionTypes: ['multiple_choice'],
    distribution: {
      multiple_choice: 5,
      open_question: 0,
      case_study: 0,
      workshop: 0,
      true_false: 0
    }
  });

  const handleCourseChange = (courseId: string) => {
    const selectedCourse = courses.find(c => c.id === courseId);
    if (selectedCourse) {
      setParams({ ...params, courseId: selectedCourse.id, course: selectedCourse.name });
    }
  };

  const updateDistribution = (type: keyof QuestionDistribution, value: number) => {
    const newCount = Math.max(0, value);
    setParams(prev => {
      const newDistribution = { ...prev.distribution!, [type]: newCount };
      const totalInDist = Object.values(newDistribution).reduce((a, b) => a + b, 0);
      
      return {
        ...prev,
        distribution: newDistribution,
        // Optional: keep numQuestions in sync or just use it as a cap
        // In this case, I'll keep the actual total questions as the sum of distribution if the user wants flexibility
        // but the prompt said "obviamente que no superen el numero que ya se estableció antes"
      };
    });
  };

  const totalDistributed = params.distribution ? Object.values(params.distribution).reduce((a, b) => a + b, 0) : 0;
  const isOverLimit = totalDistributed > params.numQuestions;
  const isUnderLimit = totalDistributed < params.numQuestions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (params.questionTypes.length === 0) return;
    onGenerate(params);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 hover:shadow-sm"
          disabled={isGenerating}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            Generador de <span className="text-brand-primary">exámenes</span>
          </h1>
          <p className="text-slate-500 font-medium">Diseña instrumentos de evaluación basados en evidencias.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Info */}
          <div className="card p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 tracking-widest pl-1 uppercase">Curso</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm font-bold appearance-none"
                  value={params.courseId}
                  onChange={e => handleCourseChange(e.target.value)}
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {courses.length === 0 && <option value="">No tienes cursos creados</option>}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 tracking-widest pl-1 uppercase">Tema del examen</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 pointer-events-none">
                    <BrainCircuit size={20} />
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Recursividad, POO, SQL..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all text-lg font-medium"
                    value={params.topic}
                    onChange={e => setParams({...params, topic: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 tracking-widest px-1 uppercase">Semestre</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all font-bold text-slate-700 appearance-none"
                  value={params.semester}
                  onChange={e => setParams({...params, semester: e.target.value})}
                >
                  <option>2026-1</option>
                  <option>2026-2</option>
                  <option>2025-1</option>
                  <option>2025-2</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Número de preguntas</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setParams(p => ({...p, numQuestions: Math.max(1, p.numQuestions - 1)}))} className="w-10 h-full hover:bg-slate-200 font-bold">-</button>
                  <input 
                    type="number"
                    min="1"
                    max="50"
                    className="flex-1 bg-transparent text-center font-bold outline-none border-none py-2"
                    value={params.numQuestions}
                    onChange={e => setParams(p => ({...p, numQuestions: parseInt(e.target.value) || 1}))}
                  />
                  <button type="button" onClick={() => setParams(p => ({...p, numQuestions: Math.min(50, p.numQuestions + 1)}))} className="w-10 h-full hover:bg-slate-200 font-bold">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty & Types */}
          <div className="card p-8 space-y-8">
            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 tracking-widest px-1 uppercase">Dificultad</label>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  {(['bajo', 'medio', 'alto'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setParams({...params, difficulty: d})}
                      className={`flex-1 py-3 rounded-xl text-xs font-black capitalize tracking-tight transition-all ${
                        params.difficulty === d 
                          ? 'bg-white shadow-lg text-brand-primary' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <span>{d}</span>
                    </button>
                  ))}
                </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipos de preguntas requeridas</label>
              <div className="space-y-3">
                {[
                  { id: 'multiple_choice', label: 'Opción Múltiple' },
                  { id: 'open_question', label: 'Abierta / Respuesta Corta' },
                  { id: 'case_study', label: 'Estudio de Caso' },
                  { id: 'workshop', label: 'Taller / Ejercicio' },
                  { id: 'true_false', label: 'Verdadero o Falso' }
                ].map(type => (
                  <div key={type.id} className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">{type.label}</span>
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden h-8">
                      <button 
                        type="button" 
                        onClick={() => updateDistribution(type.id as keyof QuestionDistribution, (params.distribution?.[type.id as keyof QuestionDistribution] || 0) - 1)}
                        className="px-2 hover:bg-slate-100 font-bold text-xs"
                      >-</button>
                      <input 
                        type="number"
                        className="w-10 text-center text-xs font-bold outline-none border-none"
                        value={params.distribution?.[type.id as keyof QuestionDistribution] || 0}
                        onChange={e => updateDistribution(type.id as keyof QuestionDistribution, parseInt(e.target.value) || 0)}
                      />
                      <button 
                        type="button" 
                        onClick={() => updateDistribution(type.id as keyof QuestionDistribution, (params.distribution?.[type.id as keyof QuestionDistribution] || 0) + 1)}
                        className="px-2 hover:bg-slate-100 font-bold text-xs"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
              {isOverLimit && (
                <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                  <AlertCircle size={16} />
                  <p className="text-[10px] font-bold">La suma ({totalDistributed}) supera el total de preguntas ({params.numQuestions})</p>
                </div>
              )}
              {isUnderLimit && totalDistributed > 0 && (
                <div className="flex items-center gap-2 text-amber-500 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <AlertCircle size={16} />
                  <p className="text-[10px] font-bold">Distribución incompleta: faltan {params.numQuestions - totalDistributed} preguntas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isGenerating || !params.topic || totalDistributed === 0 || isOverLimit}
          className="btn-primary w-full py-6 text-xl flex items-center justify-center gap-3 group relative overflow-hidden shadow-2xl shadow-brand-primary/30 disabled:grayscale disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          {isGenerating ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span>Docente IA está estructurando el examen...</span>
            </>
          ) : (
            <>
              <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
              <span>Generar Instrumento Maestro</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
