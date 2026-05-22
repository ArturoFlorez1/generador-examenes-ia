import React, { useState } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  ShieldAlert, 
  Lightbulb, 
  UserCircle2,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { chatService } from '../services/firestoreService';
import { ChatList } from './Chat/ChatList';
import { ChatWindow } from './Chat/ChatWindow';

type ContactType = 'message' | 'complaint' | 'suggestion';

export const FloatingContact: React.FC = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<'menu' | 'form' | 'chat'>('menu');
  const [selectedType, setSelectedType] = useState<ContactType | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  // Initialize selectedConvId for non-admin users when opening chat
  React.useEffect(() => {
    if (isOpen && activeStep === 'chat' && profile?.role !== 'admin' && profile?.uid) {
        setSelectedConvId(profile.uid);
    }
  }, [isOpen, activeStep, profile]);

  if (!profile) return null;

  const handleOpen = () => {
    setIsOpen(true);
    setActiveStep('menu');
    setStatus('idle');
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveStep('menu');
    setSelectedType(null);
    setMessageContent('');
  };

  const handleSelectType = (type: ContactType) => {
    setSelectedType(type);
    setActiveStep('form');
  };

  const handleSubmit = async () => {
    if (!messageContent || !profile?.uid || !selectedType) return;
    setIsSubmitting(true);
    setStatus('idle');

    const prefixMap: Record<ContactType, string> = {
      message: '[MENSAJE DIRECTO]: ',
      complaint: '[QUEJA/RECLAMO]: ',
      suggestion: '[SUGERENCIA]: '
    };

    const finalMessage = `${prefixMap[selectedType]}${messageContent}`;

    try {
      await chatService.sendMessage(profile.uid, profile.uid, finalMessage);
      setMessageContent('');
      setStatus('success');
      // Briefly show success then switch or close
      setTimeout(() => {
        setActiveStep('chat');
        setStatus('idle');
      }, 1500);
    } catch (error) {
      setStatus('error');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeData = {
    message: {
      title: 'Mensaje al Administrador',
      icon: <UserCircle2 className="text-blue-500" size={24} />,
      desc: 'Consulta directa sobre el sistema o tu cuenta.',
      placeholder: 'Escribe tu mensaje aquí...'
    },
    complaint: {
      title: 'Enviar Queja o Reclamo',
      icon: <ShieldAlert className="text-red-500" size={24} />,
      desc: 'Informa sobre fallos, errores o inconformidades.',
      placeholder: 'Describe detalladamente el problema...'
    },
    suggestion: {
      title: 'Enviar Sugerencia',
      icon: <Lightbulb className="text-amber-500" size={24} />,
      desc: 'Ayúdanos a mejorar EvaluAI con tus ideas.',
      placeholder: '¿Qué nueva funcionalidad te gustaría ver?'
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest leading-none">Canal de Soporte</h3>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-tight mt-1">Estamos para escucharte</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
              {activeStep === 'menu' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">¿Cómo podemos ayudarte?</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Selecciona el tipo de comunicación que deseas iniciar.</p>
                  </div>
                  
                  <div className="space-y-3">
                    {(Object.keys(typeData) as ContactType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSelectType(type)}
                        className="w-full group p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-brand-primary/30 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 group-hover:scale-110 transition-transform">
                            {typeData[type].icon}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{typeData[type].title}</p>
                            <p className="text-[10px] text-slate-500 font-bold mt-1">{typeData[type].desc}</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-primary transition-colors" />
                      </button>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <button 
                      onClick={() => setActiveStep('chat')}
                      className="w-full p-5 rounded-3xl bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em]"
                    >
                      <MessageSquare size={16} />
                      Ver mis mensajes anteriores
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 'form' && selectedType && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                  <button 
                    onClick={() => setActiveStep('menu')}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="rotate-180" size={14} />
                    Volver al menú
                  </button>

                  <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                      {typeData[selectedType].icon}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{typeData[selectedType].title}</p>
                      <p className="text-[10px] text-slate-500 font-bold">Iniciando nueva comunicación</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {status === 'success' ? (
                      <div className="p-8 text-center space-y-4 bg-green-50 rounded-3xl border border-green-100">
                        <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                          <Send size={24} />
                        </div>
                        <div>
                          <p className="text-lg font-black text-green-900 leading-tight">¡Mensaje Enviado!</p>
                          <p className="text-xs font-bold text-green-700/70 mt-1 uppercase tracking-widest">Administración responderá pronto</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contenido</label>
                          <textarea 
                            autoFocus
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            placeholder={typeData[selectedType].placeholder}
                            className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary focus:bg-white transition-all h-40 font-bold text-slate-700 text-sm outline-none"
                          />
                        </div>

                        {status === 'error' && (
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">Error al enviar el mensaje. Inténtalo de nuevo.</p>
                        )}

                        <button 
                          onClick={handleSubmit}
                          disabled={isSubmitting || !messageContent}
                          className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                        >
                          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (
                            <>
                              <Send size={16} />
                              Enviar ahora
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeStep === 'chat' && (
                <div className="h-full flex flex-col space-y-4 animate-in fade-in slide-in-from-right duration-300">
                   <div className="flex items-center justify-between mb-2">
                    <button 
                      onClick={() => selectedConvId && profile.role === 'admin' ? setSelectedConvId(null) : setActiveStep('menu')}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="rotate-180" size={14} />
                      {selectedConvId && profile.role === 'admin' ? 'Volver a la lista' : 'Volver al menú'}
                    </button>
                  </div>

                  <div className="flex-1 min-0 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden flex flex-col">
                    {profile.role === 'admin' && !selectedConvId ? (
                        <ChatList 
                            selectedId={selectedConvId || undefined}
                            onSelect={(id) => setSelectedConvId(id)}
                        />
                    ) : (
                        selectedConvId && (
                            <ChatWindow 
                                conversationId={selectedConvId}
                                onDelete={() => profile.role === 'admin' ? setSelectedConvId(null) : {}}
                                isFloating
                            />
                        )
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isOpen ? handleClose : handleOpen}
        className={`w-16 h-16 rounded-[28px] shadow-2xl flex items-center justify-center transition-all duration-500 relative ${
          isOpen ? 'bg-slate-900 text-white' : 'bg-brand-primary text-white shadow-brand-primary/20 hover:shadow-brand-primary/40'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle size={28} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Unread indicator could go here */}
      </motion.button>
    </div>
  );
};
