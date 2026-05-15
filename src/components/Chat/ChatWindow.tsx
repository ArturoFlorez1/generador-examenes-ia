import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, MessageSquare, Trash2 } from 'lucide-react';
import { chatService } from '../../services/firestoreService';
import { useAuth } from '../../lib/AuthContext';

interface ChatWindowProps {
  conversationId: string;
  onDelete?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, onDelete }) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(0);

  useEffect(() => {
    const unsub = chatService.subscribeToConversation(conversationId, (msgs) => {
        setMessages(msgs);
        
        // Throttled mark as read
        const lastRead = sessionStorage.getItem(`lastRead_${conversationId}`);
        const now = Date.now();
        if (!lastRead || now - parseInt(lastRead) > 2000) {
            chatService.markAsRead(conversationId);
            sessionStorage.setItem(`lastRead_${conversationId}`, now.toString());
        }
    });
    return () => unsub();
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
        const container = containerRef.current;
        if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            const lastMessage = messages[messages.length - 1];
            const isMyMessage = lastMessage?.senderId === profile?.uid;

            if (isNearBottom || isMyMessage) {
                // Instantly scroll to bottom without jumping the entire page
                container.scrollTop = container.scrollHeight;
            }
        }
        lastMessageCount.current = messages.length;
    }
  }, [messages, profile?.uid]);

  const handleSend = async () => {
    if (!text.trim() || !profile?.uid || isSubmitting) return;
    setIsSubmitting(true);
    await chatService.sendMessage(conversationId, profile.uid, text);
    setText('');
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de eliminar esta conversación completa?")) {
        await chatService.deleteConversation(conversationId);
        onDelete?.();
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("¿Eliminar este mensaje?")) {
        await chatService.deleteMessage(conversationId, messageId);
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
                <User size={16} />
            </div>
            <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Chat de Soporte</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{conversationId.substring(0, 8)}</p>
            </div>
        </div>
        <button 
            onClick={handleDelete} 
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Borrar Conversación"
        >
            <Trash2 size={18} />
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
      >
        {messages.map(msg => {
            const isMyMessage = msg.senderId === profile?.uid;
            return (
                <div key={msg.id} className={`flex flex-col group ${isMyMessage ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-end gap-2 max-w-[85%]">
                        {!isMyMessage && <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-1 shrink-0"><Bot size={12} /></div>}
                        <div className={`relative p-3 rounded-2xl text-sm shadow-sm transition-all ${isMyMessage ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-900 border border-slate-100 rounded-bl-none'}`}>
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            
                            <button 
                                onClick={() => handleDeleteMessage(msg.id)}
                                className={`absolute -top-2 ${isMyMessage ? '-left-8' : '-right-8'} p-1.5 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm`}
                                title="Eliminar mensaje"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 px-1">
                        {msg.createdAt && new Date(msg.createdAt.toMillis?.() || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            );
        })}
        <div ref={chatEndRef} />
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <div className="flex gap-2">
            <input 
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder="Escribe un mensaje..."
                disabled={isSubmitting}
            />
            <button onClick={handleSend} className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl transition-all" disabled={isSubmitting}>
                <Send size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};
