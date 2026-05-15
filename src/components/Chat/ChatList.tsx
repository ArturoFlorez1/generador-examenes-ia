import React, { useEffect, useState } from 'react';
import { MessageSquare, User } from 'lucide-react';
import { chatService } from '../../services/firestoreService';
import { useAuth } from '../../lib/AuthContext';

interface ChatListProps {
    onSelect?: (id: string) => void;
    selectedId?: string;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelect, selectedId }) => {
    const { profile } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);

    useEffect(() => {
        if (!profile?.uid) return;
        const isAdmin = profile.role === 'admin' || profile.email === 'florezarturo1816@gmail.com';
        const unsub = chatService.subscribeToUserConversations(profile.uid, isAdmin, setConversations);
        return () => unsub();
    }, [profile?.uid, profile?.role, profile?.email]);

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
             <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Conversaciones</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <MessageSquare className="mx-auto mb-2 opacity-20" size={32} />
                        <p className="text-xs">No hay conversaciones</p>
                    </div>
                ) : (
                    conversations.map(conv => {
                        const isSelected = selectedId === conv.id;
                        const isAdmin = profile?.role === 'admin' || profile?.email === 'florezarturo1816@gmail.com';
                        const myUnreadId = isAdmin ? 'admin' : profile?.uid;
                        const isUnread = conv.unreadFor?.includes(myUnreadId);

                        return (
                            <div 
                                key={conv.id}
                                onClick={() => onSelect?.(conv.id)}
                                className={`p-4 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-all border-b border-slate-50 ${isSelected ? 'bg-slate-50' : ''} ${isUnread ? 'bg-brand-primary/5' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm relative">
                                    <User size={20} />
                                    {isUnread && (
                                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-sm"></span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm tracking-tight truncate ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                                            {conv.id === profile?.uid ? 'Soporte Administrativo' : `Usuario: ${conv.id.substring(0, 8)}`}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {conv.lastMessageAt && new Date(conv.lastMessageAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}`}>{conv.lastMessage}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
