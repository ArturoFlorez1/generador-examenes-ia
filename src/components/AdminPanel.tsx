import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCog, 
  Search, 
  CheckCircle, 
  XCircle,
  Loader2,
  BarChart3,
  FileText,
  GraduationCap
} from 'lucide-react';
import { collection, query, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(query(collection(db, 'users')));
      const examsSnap = await getDocs(query(collection(db, 'exams')));
      const subSnap = await getDocs(query(collection(db, 'submissions')));
      
      const usersData = usersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      const examsData = examsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      const subData = subSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      
      setUsers(usersData);
      setExams(examsData);
      setSubmissions(subData);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        role: newRole,
        roleRequest: 'approved',
        updatedAt: serverTimestamp()
      });
      fetchData();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        roleRequest: 'rejected',
        updatedAt: serverTimestamp()
      });
      fetchData();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const getUserExamCount = (userId: string) => {
    return exams.filter(e => e.creatorId === userId).length;
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    totalExams: exams.length,
    totalSubmissions: submissions.length,
    teachers: users.filter(u => u.role === 'teacher').length,
    students: users.filter(u => u.role === 'student').length,
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom duration-700 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
            Consola de <span className="text-brand-primary">administración</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">Monitoreo de actividad y gestión de la Licenciatura en Informática.</p>
        </div>
        <div className="bg-slate-900 text-white px-6 py-2 rounded-2xl text-[10px] font-black tracking-widest flex items-center gap-3 shadow-lg shadow-slate-900/20">
          <ShieldCheck size={16} /> Panel maestro
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Usuarios Totales', val: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
          { label: 'Exámenes Creados', val: stats.totalExams, icon: FileText, color: 'bg-brand-primary' },
          { label: 'Resultados Registrados', val: stats.totalSubmissions, icon: CheckCircle, color: 'bg-emerald-500' },
          { label: 'Cuerpo Docente', val: stats.teachers, icon: UserCog, color: 'bg-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`${stat.color} text-white p-3 rounded-2xl`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* User List & Role Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <BarChart3 className="text-brand-primary" /> Uso por Usuario
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Filtrar correo..."
                className="w-full bg-white border border-slate-200 rounded-2xl py-2 pl-10 pr-4 outline-none focus:border-brand-primary text-xs"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="animate-spin text-brand-primary" size={48} />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Analizando métricas...</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredUsers.map((user) => (
                  <motion.div 
                    layout
                    key={user.uid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white border border-slate-100 p-5 rounded-3xl hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${
                          user.role === 'admin' ? 'bg-slate-900' : user.role === 'teacher' ? 'bg-brand-primary' : 'bg-blue-500'
                        }`}>
                          {user.role === 'admin' ? <ShieldCheck size={20} /> : user.role === 'teacher' ? <UserCog size={20} /> : <Users size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">{user.email}</h3>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              user.role === 'admin' ? 'bg-slate-900 text-white' : user.role === 'teacher' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Actividad: {getUserExamCount(user.uid)} exámenes creados</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.roleRequest === 'pending' && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleRejectRequest(user.uid)}
                              className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                              title="Rechazar solicitud"
                            >
                              <XCircle size={16} />
                            </button>
                            <button 
                              onClick={() => handleRoleUpdate(user.uid, 'teacher')}
                              className="p-2 bg-brand-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all"
                              title="Aprobar solicitud Docente"
                            >
                              <CheckCircle size={16} />
                            </button>
                          </div>
                        )}
                        <div className="h-6 w-px bg-slate-100 mx-2 hidden sm:block" />
                        <button 
                          onClick={() => handleRoleUpdate(user.uid, user.role === 'teacher' ? 'student' : 'teacher')}
                          disabled={user.role === 'admin'}
                          className="text-[9px] font-black text-slate-400 hover:text-brand-primary uppercase tracking-widest disabled:opacity-0 transition-colors"
                        >
                          Cambiar a {user.role === 'teacher' ? 'Estudiante' : 'Docente'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Side Panel: Quick Actions/Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl shadow-slate-900/30 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <h3 className="text-xl font-black tracking-tight">Estado docente</h3>
              <p className="text-xs text-white/60 font-medium mt-1">Usuarios esperando aprobación para modo diseño.</p>
            </div>
            
            <div className="space-y-4 relative">
              {users.filter(u => u.roleRequest === 'pending').length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Sin solicitudes pendientes</p>
                </div>
              ) : (
                users.filter(u => u.roleRequest === 'pending').map(user => (
                  <div key={user.uid} className="bg-white/10 border border-white/20 p-4 rounded-3xl flex items-center justify-between">
                    <div className="truncate pr-4">
                      <p className="text-xs font-bold truncate">{user.email}</p>
                      <p className="text-[8px] uppercase font-black text-white/40 tracking-widest">Aspirante Docente</p>
                    </div>
                    <button 
                      onClick={() => handleRoleUpdate(user.uid, 'teacher')}
                      className="bg-brand-primary p-2 rounded-xl"
                    >
                      <CheckCircle size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3">Resumen de Facultad</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Exámenes promedio/docente</span>
                <span className="font-black text-slate-900">{(stats.totalExams / (stats.teachers || 1)).toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Ratio Docente/Estudiante</span>
                <span className="font-black text-slate-900">1:{(stats.students / (stats.teachers || 1)).toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-4 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" /> Resultados Recientes
            </h4>
            <div className="space-y-3">
              {submissions.slice(0, 5).map((sub, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="truncate">
                    <p className="text-[10px] font-bold text-slate-900 truncate">Estudiante: {sub.studentId.substring(0, 8)}...</p>
                    <p className="text-[8px] text-slate-400 uppercase font-bold">Puntaje: {sub.score}%</p>
                  </div>
                  <div className={`text-[10px] font-black ${sub.score >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {sub.score >= 60 ? 'APROBADO' : 'REPROBADO'}
                  </div>
                </div>
              ))}
              {submissions.length === 0 && <p className="text-[10px] text-slate-400 italic">No hay resultados aún.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
