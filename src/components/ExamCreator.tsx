import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  BrainCircuit,
  FileSearch,
  Plus,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExamParams, QuestionType, QuestionDistribution, Course } from '../types';

interface ExamCreatorProps {
  onBack: () => void;
  onGenerate: (params: ExamParams) => Promise<void>;
  isGenerating: boolean;
  courses: Course[];
  initialCourseId?: string;
}

const SABER_PRO_COMPETENCIES = [
  'Lectura crítica',
  'Razonamiento cuantitativo',
  'Competencias ciudadanas',
  'Comunicación escrita',
  'Inglés'
];

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
    maxAttempts: 1,
    questionTypes: ['multiple_choice'],
    selectedCompetencies: [],
    distribution: {
      multiple_choice: 0,
      open_question: 0,
      case_study: 0,
      workshop: 0,
      true_false: 0,
      icfes_multiple_choice: 0,
      saber_pro_reading_critical: 0,
      saber_pro_quantitative_reasoning: 0,
      saber_pro_citizen_competencies: 0,
      saber_pro_written_communication: 0,
      saber_pro_english: 0,
      saber_pro_info_interpretation: 0,
      saber_pro_context_based: 0,
      saber_pro_graphics_interpretation: 0,
      saber_pro_case_analysis: 0
    }
  });

  const [showSaberPro, setShowSaberPro] = useState(false);
  const isSaberPro = params.course === 'Saber Pro';

  const handleCourseChange = (courseId: string) => {
    if (courseId === 'saber_pro') {
      setParams({ 
        ...params, 
        courseId: 'saber_pro', 
        course: 'Saber Pro',
        selectedCompetencies: [],
        distribution: Object.keys(params.distribution!).reduce((acc, key) => ({
            ...acc,
            [key]: 0
        }), {} as QuestionDistribution)
      });
      return;
    }
    const selectedCourse = courses.find(c => c.id === courseId);
    if (selectedCourse) {
      setParams({ 
        ...params, 
        courseId: selectedCourse.id, 
        course: selectedCourse.name,
        difficulty: params.difficulty === 'integral' ? 'medio' : params.difficulty,
        distribution: Object.keys(params.distribution!).reduce((acc, key) => ({
            ...acc,
            [key]: 0
        }), {} as QuestionDistribution)
      });
    }
  };

  const updateDistribution = (type: keyof QuestionDistribution, value: number) => {
    const newCount = Math.max(0, value);
    setParams(prev => {
      const prevDist = { ...prev.distribution! };
      const newDistribution = { ...prevDist, [type]: newCount };
      
      let totalInDist = Object.values(newDistribution).reduce((a, b) => a + b, 0);

      // Rebalancing logic:
      if (totalInDist > prev.numQuestions) {
          let overflow = totalInDist - prev.numQuestions;
          const keys = Object.keys(newDistribution) as (keyof QuestionDistribution)[];
          
          for (const key of keys) {
              if (key === type) continue;
              
              if (newDistribution[key] > 0) {
                  const reduceAmount = Math.min(overflow, newDistribution[key]);
                  newDistribution[key] -= reduceAmount;
                  overflow -= reduceAmount;
              }
              if (overflow === 0) break;
          }
      }
      
      return {
        ...prev,
        distribution: newDistribution,
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

  const toggleCompetency = (comp: string) => {
    setParams(prev => {
      const current = prev.selectedCompetencies || [];
      const updated = current.includes(comp)
        ? current.filter(c => c !== comp)
        : [...current, comp];
      return { ...prev, selectedCompetencies: updated };
    });
  };

  const traditionalTypes = [
      { id: 'multiple_choice', label: 'Opción Múltiple' },
      { id: 'open_question', label: 'Abierta / Respuesta Corta' },
      { id: 'case_study', label: 'Estudio de Caso' },
      { id: 'workshop', label: 'Taller / Ejercicio' },
      { id: 'true_false', label: 'Verdadero o Falso' }
  ];

  const saberProTypes = [
      { id: 'icfes_multiple_choice', label: 'Selección múltiple ICFES' },
      { id: 'saber_pro_case_analysis', label: 'Análisis de caso' },
      { id: 'saber_pro_info_interpretation', label: 'Interpretación de información' },
      { id: 'saber_pro_context_based', label: 'Preguntas contextualizadas' }
  ];

  const renderQuestionType = (type: {id: string, label: string}) => (
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
  );

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
                  <option value="saber_pro">Saber Pro</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {courses.length === 0 && <option value="">No tienes cursos creados</option>}
                </select>
              </div>

              {!isSaberPro ? (
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
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 tracking-widest px-1 uppercase">Área Evaluada</label>
                        <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold uppercase">Requerido</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {SABER_PRO_COMPETENCIES.map(comp => (
                            <button
                                key={comp}
                                type="button"
                                onClick={() => {
                                    toggleCompetency(comp);
                                    // Update topic automatically for Saber Pro to pass validation
                                    if (!params.topic || params.topic === 'Saber Pro Prep') {
                                        setParams(prev => ({ ...prev, topic: 'Saber Pro Prep' }));
                                    }
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                    params.selectedCompetencies?.includes(comp)
                                        ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-brand-primary'
                                }`}
                            >
                                {comp}
                            </button>
                        ))}
                    </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 tracking-widest px-1 uppercase">Máximo de intentos</label>
                <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all font-bold text-slate-700 appearance-none"
                    value={params.maxAttempts || 1}
                    onChange={e => setParams({...params, maxAttempts: parseInt(e.target.value) || 1})}
                >
                    <option value={1}>1 intento</option>
                    <option value={2}>2 intentos</option>
                    <option value={999}>Ilimitados</option>
                </select>
              </div>
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
                <label className="text-[10px] font-black text-slate-400 tracking-widest px-1 uppercase">
                    {isSaberPro ? 'Nivel de competencia' : 'Dificultad'}
                </label>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  {(isSaberPro ? (['bajo', 'medio', 'alto', 'integral'] as const) : (['bajo', 'medio', 'alto'] as const)).map(d => (
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
                      <span>
                        {isSaberPro ? (
                            d === 'bajo' ? 'Interpretativo' :
                            d === 'medio' ? 'Argumentativo' : 
                            d === 'alto' ? 'Propositivo' : 'Integral'
                        ) : d}
                      </span>
                    </button>
                  ))}
                </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                {isSaberPro ? 'Estructura de la prueba (Formato)' : 'Tipos de preguntas requeridas'}
              </label>
              <div className="space-y-3">
                {!isSaberPro ? (
                    <>
                        {traditionalTypes.map(renderQuestionType)}
                        <div className="pt-2 border-t border-slate-100">
                             <button 
                                type="button"
                                onClick={() => setShowSaberPro(!showSaberPro)}
                                className="w-full flex items-center justify-between p-3 bg-brand-primary/5 text-brand-primary rounded-2xl border border-brand-primary/20 text-xs font-black uppercase tracking-tight"
                            >
                                {showSaberPro ? 'Ocultar preguntas Saber Pro' : 'Incluir preguntas Saber Pro'}
                                <Plus className={`transition-transform ${showSaberPro ? 'rotate-45' : ''}`} size={16} />
                            </button>

                            {showSaberPro && (
                                <div className="space-y-3 pt-3">
                                   {saberProTypes.map(renderQuestionType)}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="space-y-3">
                        <div className="p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 mb-4">
                            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={14} /> Modo Saber Pro Activado
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium mt-1">Solo tipos de preguntas compatibles con el marco ICFES.</p>
                        </div>
                        {saberProTypes.map(renderQuestionType)}
                    </div>
                )}
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
          disabled={isGenerating || !params.topic || totalDistributed === 0 || isOverLimit || (isSaberPro && (params.selectedCompetencies?.length || 0) === 0)}
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
              <span>Generar Examen</span>
            </>
          )}
        </button>
      </form>
    </div>
  );};
