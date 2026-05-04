import React, { useState } from 'react';
import { 
  Sparkles, 
  Settings2, 
  ArrowLeft, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { ExamParams, QuestionType } from '../types';

interface ExamCreatorProps {
  onBack: () => void;
  onGenerate: (params: ExamParams) => Promise<void>;
  isGenerating: boolean;
}

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
import { ExamParams, QuestionType } from '../types';

interface ExamCreatorProps {
  onBack: () => void;
  onGenerate: (params: ExamParams) => Promise<void>;
  isGenerating: boolean;
}

export const ExamCreator: React.FC<ExamCreatorProps> = ({ onBack, onGenerate, isGenerating }) => {
  const [params, setParams] = useState<ExamParams>({
    topic: '',
    course: 'Programación I',
    semester: '1-2026',
    difficulty: 'medio',
    numQuestions: 5,
    questionTypes: ['multiple_choice']
  });

  const toggleType = (type: QuestionType) => {
    setParams(prev => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type)
        ? prev.questionTypes.filter(t => t !== type)
        : [...prev.questionTypes, type]
    }));
  };

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
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
            Configuración del <span className="text-brand-primary">Instrumento</span>
          </h1>
          <p className="text-slate-500 font-medium">Asistente de Inteligencia Artificial para Evaluación por Evidencias.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Info */}
          <div className="card p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Asignatura</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all text-lg font-bold appearance-none"
                  value={params.course}
                  onChange={e => setParams({...params, course: e.target.value})}
                >
                  <option>Programación I</option>
                  <option>Programación II</option>
                  <option>Informática Educativa</option>
                  <option>Base de Datos</option>
                  <option>Arquitectura de Software</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tema del Examen</label>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Semestre</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all font-bold text-slate-700"
                  value={params.semester}
                  onChange={e => setParams({...params, semester: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Items</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setParams(p => ({...p, numQuestions: Math.max(1, p.numQuestions - 1)}))} className="w-10 h-full hover:bg-slate-200 font-bold">-</button>
                  <span className="flex-1 text-center font-bold">{params.numQuestions}</span>
                  <button type="button" onClick={() => setParams(p => ({...p, numQuestions: Math.min(20, p.numQuestions + 1)}))} className="w-10 h-full hover:bg-slate-200 font-bold">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty & Types */}
          <div className="card p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nivel de Dificultad</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {(['bajo', 'medio', 'alto'] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setParams({...params, difficulty: d})}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipos de Ítem Requeridos</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'multiple_choice', label: 'Opción Múltiple' },
                  { id: 'open_question', label: 'Abierta' },
                  { id: 'case_study', label: 'Estudio de Caso' },
                  { id: 'workshop', label: 'Taller / Ejercicio' },
                  { id: 'true_false', label: 'Verdadero o Falso' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleType(type.id as QuestionType)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      params.questionTypes.includes(type.id as QuestionType)
                        ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' 
                        : 'border-slate-100 hover:border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${params.questionTypes.includes(type.id as QuestionType) ? 'bg-brand-primary animate-pulse' : 'bg-slate-200'}`} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isGenerating || !params.topic || params.questionTypes.length === 0}
          className="btn-primary w-full py-6 text-xl flex items-center justify-center gap-3 group relative overflow-hidden shadow-2xl shadow-brand-primary/30"
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
