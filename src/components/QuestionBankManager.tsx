import React, { useState, useEffect } from 'react';
import { questionBankService } from '../services/firestoreService';
import { QuestionBankEntry } from '../types';
import { CheckCircle2, XCircle, Clock, Trash2, Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function QuestionBankManager({ isAdmin }: { isAdmin: boolean }) {
  const [questions, setQuestions] = useState<QuestionBankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<QuestionBankEntry>>({});

  const loadQuestions = async () => {
    setLoading(true);
    const qs = await questionBankService.getAllQuestions();
    setQuestions(qs);
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    await questionBankService.updateQuestion(id, { status });
    setQuestions(q => q.map(x => x.id === id ? { ...x, status } : x));
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar pregunta del banco institucional?')) {
      await questionBankService.deleteQuestion(id);
      setQuestions(q => q.filter(x => x.id !== id));
    }
  };

  const startEditing = (q: QuestionBankEntry) => {
    setEditingId(q.id);
    setEditForm({ prompt: q.prompt, correctAnswer: q.correctAnswer });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await questionBankService.updateQuestion(editingId, editForm);
    setQuestions(q => q.map(x => x.id === editingId ? { ...x, ...editForm } : x));
    setEditingId(null);
  };

  const filtered = questions.filter(q => q.status === filterMode);

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
          Banco Institucional de Preguntas
        </h2>
        <p className="text-sm font-bold text-slate-500 mt-2">
          Gestiona, aprueba y reutiliza preguntas validadas
        </p>
      </header>

      <div className="flex gap-4 border-b border-slate-200">
        {(['pending', 'approved', 'rejected'] as const).map(m => (
          <button
            key={m}
            className={`pb-4 px-2 flex items-center uppercase tracking-widest text-[10px] font-black transition-colors border-b-2 ${
              filterMode === m ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            onClick={() => setFilterMode(m)}
          >
            {m === 'pending' && <Clock size={14} className="mr-2" />}
            {m === 'approved' && <CheckCircle2 size={14} className="mr-2" />}
            {m === 'rejected' && <XCircle size={14} className="mr-2" />}
            {m === 'pending' ? 'Pendientes' : m === 'approved' ? 'Aprobadas' : 'Rechazadas'}
            <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{questions.filter(q => q.status === m).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No hay preguntas {filterMode}</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {filtered.map(q => (
              <motion.div 
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex gap-2">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase tracking-widest">{q.course}</span>
                    <span className="text-[10px] font-black bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full uppercase tracking-widest">{q.topic}</span>
                  </div>
                  
                  {editingId === q.id ? (
                      <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Enunciado</label>
                          <textarea 
                            value={editForm.prompt} 
                            onChange={e => setEditForm({ ...editForm, prompt: e.target.value })}
                            className="w-full mt-1 p-3 rounded-lg border border-slate-200 bg-white font-medium text-sm"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Respuesta Correcta</label>
                          <input 
                            value={editForm.correctAnswer} 
                            onChange={e => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                            className="w-full mt-1 p-3 rounded-lg border border-slate-200 bg-white font-bold text-emerald-700 text-sm"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                           <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg flex items-center gap-2 uppercase"><X size={14}/> Cancelar</button>
                           <button onClick={saveEdit} className="px-4 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg flex items-center gap-2 uppercase"><Save size={14}/> Guardar</button>
                        </div>
                      </div>
                  ) : (
                      <>
                        <h3 className="font-bold text-lg text-slate-900">{q.prompt}</h3>
                        <div className="space-y-2 text-sm text-slate-600 border-l-2 border-slate-100 pl-4">
                          <p><span className="font-bold">Correcta:</span> {q.correctAnswer}</p>
                          {q.options && q.options.length > 0 && (
                            <p><span className="font-bold">Distractores:</span> {q.options.join(', ')}</p>
                          )}
                          <p><span className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Bloom:</span> {q.bloomLevel}</p>
                        </div>
                      </>
                  )}
                </div>
                
                {(isAdmin || filterMode === 'pending') && editingId !== q.id && (
                  <div className="flex flex-row md:flex-col gap-2 justify-start items-end shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    {filterMode !== 'approved' && (
                      <button onClick={() => handleUpdateStatus(q.id, 'approved')} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-3 rounded-xl text-[10px] font-black w-full uppercase tracking-widest flex justify-center items-center gap-2 transition-colors">
                        <CheckCircle2 size={16} /> Aprobar
                      </button>
                    )}
                    {filterMode !== 'rejected' && (
                      <button onClick={() => handleUpdateStatus(q.id, 'rejected')} className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-3 rounded-xl text-[10px] font-black w-full uppercase tracking-widest flex justify-center items-center gap-2 transition-colors">
                        <XCircle size={16} /> Rechazar
                      </button>
                    )}
                     <button onClick={() => startEditing(q)} className="bg-slate-50 text-slate-700 hover:bg-slate-200 px-4 py-3 rounded-xl text-[10px] font-black w-full uppercase tracking-widest flex justify-center items-center gap-2 transition-colors">
                      <Edit2 size={16} /> Editar
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-4 py-3 rounded-xl text-[10px] font-black w-full uppercase tracking-widest flex justify-center items-center gap-2 transition-colors mt-auto">
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
