import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export const Notifications = () => {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (!auth.currentUser) return;
        
        console.log("Firestore notifications query started:", { userId: auth.currentUser.uid, path: 'notifications' });
        const q = query(
            collection(db, 'notifications'), 
            where('userId', '==', auth.currentUser.uid)
        );
        
        const unsub = onSnapshot(
            q, 
            snap => {
                setNotifications(snap.docs.map(d => ({id: d.id, ...d.data()})));
            },
            (error) => {
                console.error("Firestore Notification error:", error);
            }
        );
        return () => unsub();
    }, [auth.currentUser]);

    return (
        <div className="relative">
            <button className="p-2 bg-white rounded-full border border-slate-200">
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && 
                    <span className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold px-1.5 rounded-full">
                        {notifications.filter(n => !n.read).length}
                    </span>
                }
            </button>
        </div>
    );
};
