import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare,
  Loader2
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { ChatList } from './Chat/ChatList';
import { ChatWindow } from './Chat/ChatWindow';
import { chatService } from '../services/firestoreService';

interface ContactProps {
  onBack: () => void;
}

export const Contact: React.FC<ContactProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'form' | 'chat'>('form');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Initialize selectedConvId for non-admin users
  React.useEffect(() => {
    if (profile?.role !== 'admin' && profile?.uid) {
        setSelectedConvId(profile.uid);
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!message || !profile?.uid) return;
    setIsSubmitting(true);
    setStatus('idle');
    try {
        await chatService.sendMessage(profile.uid, profile.uid, message);
        setMessage('');
        setStatus('success');
        // Switch to chat tab after sending
        setActiveTab('chat');
    } catch (error) {
        setStatus('error');
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
      <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
        <button 
          onClick={onBack}
          className="p-3 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 transition-all hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Centro de Soporte
          </h1>
          <p className="text-slate-500 text-sm font-medium">Comunicación directa con la administración académica.</p>
        </div>
      </div>

      <div className="flex items-center bg-slate-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('form')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'form' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Send size={16} />
          Nuevo Mensaje
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'chat' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare size={16} />
          Mis Mensajes
        </button>
      </div>

      {activeTab === 'form' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900">Enviar nuevo mensaje</h2>
            <span className="text-xs font-semibold bg-brand-primary/5 text-brand-primary px-3 py-1 rounded-full border border-brand-primary/10">Para Administración</span>
          </div>

          {status === 'success' && (
            <div className="p-4 mb-6 rounded-xl bg-green-50 text-green-700 border border-green-100 font-medium text-sm flex items-center">
              ¡Tu mensaje ha sido enviado correctamente! Nos pondremos en contacto contigo pronto.
            </div>
          )}
          {status === 'error' && (
            <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-700 border border-red-100 font-medium text-sm">
              Error al enviar el mensaje. Inténtalo de nuevo.
            </div>
          )}
          
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="message" className="text-sm font-semibold text-slate-700 ml-1">Mensaje</label>
              <textarea 
                id="message"
                placeholder="Describe los detalles de tu duda o problema..." 
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all h-40"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !message}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <Send size={18} />
                  Enviar mensaje
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'chat' && profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ChatList 
                selectedId={selectedConvId || undefined} 
                onSelect={(id) => setSelectedConvId(id)} 
            />
            <div className="md:col-span-2">
                {selectedConvId ? (
                    <ChatWindow 
                        conversationId={selectedConvId} 
                        onDelete={() => setSelectedConvId(null)}
                    />
                ) : (
                    <div className="h-[600px] bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400 gap-4">
                        <MessageSquare size={48} className="opacity-20" />
                        <p className="text-sm font-medium">Selecciona una conversación</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );

};
