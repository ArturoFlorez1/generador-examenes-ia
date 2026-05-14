import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Send,
  Timer,
  BookOpen,
  Award,
  ChevronRight,
  ChevronLeft,
  XCircle,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Exam, Question } from '../types';
import { UNI_LOGO_URL } from '../constants';

interface ExamPlayerProps {
  exam: Exam;
  onClose: () => void;
  mode?: 'teacher' | 'student' | 'admin';
}

const TYPE_LABELS: Record<string, string> = {
  'multiple_choice': 'Opción Múltiple',
  'true_false': 'Falso o Verdadero',
  'open_question': 'Pregunta Abierta',
  'case_study': 'Estudio de Caso',
  'workshop': 'Taller Práctico',
  'icfes_multiple_choice': 'Selección Múltiple (ICFES)',
  'saber_pro_reading_critical': 'Saber Pro: Lectura Crítica',
  'saber_pro_quantitative_reasoning': 'Saber Pro: Razonamiento Cuantitativo',
  'saber_pro_citizen_competencies': 'Saber Pro: Competencias Ciudadanas',
  'saber_pro_written_communication': 'Saber Pro: Comunicación Escrita',
  'saber_pro_english': 'Saber Pro: Inglés'
};

export const ExamPlayer: React.FC<ExamPlayerProps> = ({ exam, onClose, mode = 'teacher' }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [viewMode, setViewMode] = useState<'player' | 'questions'>(mode === 'student' ? 'player' : 'questions');

  const q = exam.questions[currentIdx];
  const isLast = currentIdx === exam.questions.length - 1;

  const handleSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [q.id]: option }));
  };

  const calculateGrade = async () => {
    let correctCount = 0;
    exam.questions.forEach(question => {
      const userAnswer = answers[question.id]?.trim().toLowerCase();
      const correctAnswer = String(question.correctAnswer).trim().toLowerCase();
      if (userAnswer === correctAnswer) {
        correctCount++;
      }
    });
    const finalScore = Number(((correctCount / exam.questions.length) * 5).toFixed(1));
    setScore(finalScore);
    setIsFinished(true);

    if (auth.currentUser && mode === 'student') {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const studentName = userDoc.exists() ? userDoc.data()?.fullName : undefined;
        
        await addDoc(collection(db, 'submissions'), {
          examId: exam.id,
          studentId: auth.currentUser.uid,
          studentName,
          score: finalScore,
          answers: answers,
          submittedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error saving submission:", err);
      }
    }
  };

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in duration-500">
        <div className="card p-12 text-center space-y-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
            score >= 60 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            <Award size={48} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">
              {mode === 'student' ? 'Examen Enviado' : 'Examen Finalizado'}
            </h1>
            <p className="text-slate-500">
              {mode === 'student' 
                ? 'Tus respuestas han sido registradas correctamente.' 
                : `Has completado el examen de ${exam.topic}.`}
            </p>
          </div>
          
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
              <div className="text-5xl font-black text-slate-900 mb-2">{score}<span className="text-2xl text-slate-400">/5.0</span></div>
              <div className="text-sm font-medium text-slate-500 tracking-widest">Puntaje final</div>
            </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="card p-4 bg-emerald-50 border-emerald-100">
              <p className="text-xs font-bold text-emerald-600">Aciertos</p>
              <p className="text-xl font-bold text-emerald-700">{Math.round((score / 100) * exam.questions.length)} / {exam.questions.length}</p>
            </div>
            <div className="card p-4 bg-slate-50">
              <p className="text-xs font-bold text-slate-500">Estado</p>
              <p className="text-xl font-bold text-slate-700">{score >= 60 ? 'Aprobado' : 'Reprobado'}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn-primary w-full py-4 text-lg"
          >
            Volver al Menú
          </button>
        </div>

        {mode === 'teacher' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Revisión de Evidencias (Solo Docente)</h2>
            {exam.questions.map((question, idx) => {
              const isCorrect = answers[question.id]?.trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
              return (
                <div key={question.id} className={`card p-6 border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900">{idx + 1}. {question.prompt}</h3>
                    {isCorrect ? <CheckCircle2 className="text-green-500 shrink-0" size={20} /> : <XCircle className="text-red-500 shrink-0" size={20} />}
                  </div>
                  <div className="text-sm space-y-2">
                    <p className="text-slate-600"><span className="font-bold">Respuesta del usuario:</span> {answers[question.id] || '(Sin responder)'}</p>
                    
                    {question.type === 'multiple_choice' || question.type === 'true_false' ? (
                      <>
                        {!isCorrect && <p className="text-green-600"><span className="font-bold">Respuesta correcta:</span> {String(question.correctAnswer)}</p>}
                      </>
                    ) : null}

                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs italic text-slate-500 border border-slate-100">
                      <div className="flex items-center gap-1 mb-1 text-brand-primary font-bold">
                        <BrainCircuit size={12} />
                        Justificación pedagógica:
                      </div>
                      {question.justification}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-[10px] text-brand-primary font-bold">Bloom: {question.bloomLevel}</div>
                      <div className="text-[10px] text-brand-primary font-bold text-right">Dificultad: {question.difficulty}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-900 leading-none">{exam.title}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
               {exam.topic} • {exam.course} {exam.teacherName && ` • Docente: ${exam.teacherName}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {mode !== 'student' && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setViewMode('questions')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'questions' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Preguntas
              </button>
              <button 
                onClick={() => setViewMode('player')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'player' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Simulador
              </button>
            </div>
          )}
          
          {viewMode === 'player' && (
            <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Timer size={16} />
                <span>00:00</span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <BookOpen size={16} />
                <span>Pregunta {currentIdx + 1} de {exam.questions.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'player' ? (
        <>
          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / exam.questions.length) * 100}%` }}
              className="bg-brand-primary h-full transition-all duration-300"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card p-8 md:p-12 space-y-8"
            >
              <div className="space-y-4">
                <span className="text-[10px] font-black tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full uppercase">
                  {TYPE_LABELS[q.type] || q.type.replace('_', ' ')}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight break-words">
                  {q.prompt}
                </h2>
              </div>

              <div className="space-y-3">
                {q.type === 'multiple_choice' && q.options?.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-start justify-between group gap-4 ${
                      answers[q.id] === option 
                        ? 'border-brand-primary bg-brand-primary/5 text-slate-900 shadow-md' 
                        : 'border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-10 h-10 shrink-0 rounded-lg border flex items-center justify-center font-bold text-sm ${
                        answers[q.id] === option ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-400 border-slate-200'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="font-medium pt-2 leading-snug">{option}</span>
                    </div>
                    {answers[q.id] === option && <CheckCircle2 className="text-brand-primary shrink-0 mt-3" size={24} />}
                  </button>
                ))}

                {q.type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-4">
                    {['Verdadero', 'Falso'].map(option => (
                      <button
                        key={option}
                        onClick={() => handleSelect(option)}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 group ${
                          answers[q.id] === option 
                            ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-400'
                        }`}
                      >
                        {option === 'Verdadero' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                        <span className="font-bold text-lg">{option}</span>
                      </button>
                    ))}
                  </div>
                )}

                {(q.type === 'open_question' || q.type === 'case_study' || q.type === 'workshop') && (
                  <textarea
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 focus:border-brand-primary outline-none min-h-[150px] transition-colors"
                    placeholder="Escribe tu respuesta aquí..."
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                <button
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-0"
                >
                  <ChevronLeft size={18} />
                  Anterior
                </button>
                
                {isLast ? (
                  <button
                    onClick={calculateGrade}
                    className="btn-primary px-8 py-3 flex items-center gap-2 bg-slate-900"
                  >
                    Finalizar Examen
                    <Send size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="btn-primary px-8 py-3 flex items-center gap-2"
                  >
                    Siguiente
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {exam.questions.map((question, idx) => (
            <div key={question.id} className="card p-6 border-l-4 border-l-brand-primary space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-lg">{idx + 1}. {question.prompt}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[question.type]}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      question.difficulty === 'alto' ? 'bg-rose-50 text-rose-500' :
                      question.difficulty === 'medio' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                    }`}>
                      {question.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              
              {question.options && question.options.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {question.options.map((opt, oIdx) => {
                    const isCorrect = String(question.correctAnswer).toLowerCase() === opt.toLowerCase() || String(question.correctAnswer).includes(opt);
                    return (
                      <div 
                        key={oIdx} 
                        className={`text-sm p-3 rounded-xl border flex items-center gap-3 break-words ${
                          isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'
                        }`}
                      >
                        <span className={`w-6 h-6 shrink-0 rounded flex items-center justify-center text-[10px] font-bold ${
                          isCorrect ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                        {isCorrect && <CheckCircle2 size={14} className="ml-auto" />}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 border-t border-slate-50 space-y-3">
                <div className="p-4 bg-slate-50/50 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-brand-primary font-black uppercase tracking-widest text-[9px]">
                    <BrainCircuit size={14} />
                    Justificación Pedagógica y Evidencia
                  </div>
                  <p className="text-slate-600 leading-relaxed italic break-words">{question.justification}</p>
                </div>
                
                <div className="flex flex-wrap gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><BookOpen size={12} /> Bloom: {question.bloomLevel}</div>
                  <div className="flex items-center gap-1.5 font-bold text-brand-primary">Competencia: {question.competence}</div>
                </div>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setViewMode('player')}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2 group"
          >
            <Send size={18} className="group-hover:translate-x-1 transition-transform" />
            Abrir Simulador Interactivo
          </button>
        </motion.div>
      )}
    </div>
  );
};
