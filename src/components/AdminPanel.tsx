import React, { useState, useEffect, useMemo } from 'react';
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
  GraduationCap,
  History,
  PieChart as PieChartIcon,
  MessageSquare,
  Mail,
  Trash2,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { collection, query, getDocs, updateDoc, doc, serverTimestamp, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';

import { useAuth } from '../lib/AuthContext';
import { ChatList } from './Chat/ChatList';
import { ChatWindow } from './Chat/ChatWindow';
import { chatService, usersService, examsService } from '../services/firestoreService';

export const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'exams' | 'messages'>('metrics');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin' && profile?.email !== 'florezarturo1816@gmail.com') return;

    // Real-time users
    const unsubUsers = usersService.subscribeToAllUsers(setUsers);
    
    // Real-time exams
    const unsubExams = examsService.subscribeToExams(setExams);

    // Initial load for attempts (they will stay in sync if we had a subscribeAllAttempts)
    // For now we'll do a one-time fetch or better, we can add subscribeToAllAttempts
    const attemptsPath = 'exam_attempts';
    const unsubAttempts = onSnapshot(collection(db, attemptsPath), (snap) => {
        setSubmissions(snap.docs.map(doc => ({...doc.data(), id: doc.id})));
    });

    const unsubConversations = chatService.subscribeToUserConversations(profile.uid, true, setConversations);

    setLoading(false);

    return () => {
        unsubUsers();
        unsubExams();
        unsubAttempts();
        unsubConversations();
    };
  }, [profile?.uid, profile?.role, profile?.email]);

  const stats = useMemo(() => {
    const totalScore = submissions.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const avgScore = submissions.length > 0 ? (totalScore / submissions.length).toFixed(1) : '0';
    
    // Most active courses
    const courseStats: Record<string, number> = {};
    exams.forEach(e => {
      if (e.course) {
        courseStats[e.course] = (courseStats[e.course] || 0) + 1;
      }
    });
    const topCourses = Object.entries(courseStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalUsers: users.length,
      totalExams: exams.length,
      totalSubmissions: submissions.length,
      teachers: users.filter(u => u.role === 'teacher').length,
      students: users.filter(u => u.role === 'student').length,
      pendingRequests: users.filter(u => u.roleRequest === 'pending').length,
      avgScore,
      topCourses
    };
  }, [users, exams, submissions]);

  // Chart Data Preparation
  const roleData = [
    { name: 'Docentes', value: stats.teachers, color: '#00843D' },
    { name: 'Estudiantes', value: stats.students, color: '#3b82f6' },
  ];

  const examsPerTeacher = useMemo(() => {
    const teacherMap: Record<string, { name: string, count: number }> = {};
    users.filter(u => u.role === 'teacher').forEach(u => {
      teacherMap[u.uid] = { name: u.email?.split('@')[0] || 'Docente', count: 0 };
    });
    
    exams.forEach(e => {
      if (teacherMap[e.creatorId]) {
        teacherMap[e.creatorId].count++;
      }
    });
    
    return Object.values(teacherMap).sort((a, b) => b.count - a.count);
  }, [users, exams]);

  const submissionsByDay = useMemo(() => {
    const daily: Record<string, number> = {};
    submissions.forEach(s => {
      // Handle Firestore Timestamp or number
      const dateVal = s.submittedAt?.seconds ? s.submittedAt.seconds * 1000 : s.submittedAt;
      if (dateVal) {
        const dateStr = new Date(dateVal).toLocaleDateString();
        daily[dateStr] = (daily[dateStr] || 0) + 1;
      }
    });
    return Object.entries(daily)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10);
  }, [submissions]);

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        role: newRole,
        roleRequest: 'approved',
        updatedAt: serverTimestamp()
      });
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
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleReplyMessage = async (msgId: string, reply: string) => {
    try {
      const msgRef = doc(db, 'support_messages', msgId);
      await updateDoc(msgRef, { 
        reply,
        status: 'replied',
        repliedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error replying to message:", error);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', userToDelete.uid));
      setUsers(users.filter(u => u.uid !== userToDelete.uid));
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExams = exams.filter(e => 
    e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.course?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom duration-700 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
            Consola de <span className="text-brand-primary">administración</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 bg-brand-primary text-white text-[10px] font-black uppercase rounded-full">Licenciatura en Informática</span>
            <p className="text-slate-500 font-medium italic text-sm">Monitoreo y gestión centralizada.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white px-6 py-2 rounded-2xl text-[10px] font-black tracking-widest flex items-center gap-3 shadow-lg shadow-slate-900/20">
            <ShieldCheck size={16} /> Panel maestro
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-slate-100 p-1.5 rounded-3xl w-fit">
        {[
          { id: 'metrics', label: 'Métricas de Uso', icon: BarChart3, count: 0 },
          { id: 'users', label: 'Usuarios', icon: Users, count: stats.pendingRequests },
          { id: 'exams', label: 'Repositorio', icon: FileText, count: 0 },
          { id: 'messages', label: 'Mensajes de Soporte', icon: MessageSquare, count: conversations.filter(c => c.unreadFor?.includes('admin')).length }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all relative ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-red-500 text-white text-[10px] rounded-full border-2 border-white animate-bounce shadow-lg">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'metrics' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Usuarios Totales', val: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
              { label: 'Exámenes Creados', val: stats.totalExams, icon: FileText, color: 'bg-brand-primary' },
              { label: 'Resultados Registrados', val: stats.totalSubmissions, icon: CheckCircle, color: 'bg-emerald-500' },
              { label: 'Solicitudes Pendientes', val: stats.pendingRequests, icon: UserCog, color: 'bg-amber-500' },
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Charts Section */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <PieChartIcon className="text-brand-primary" /> Distribución de Roles
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6">
                {roleData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <History className="text-brand-primary" /> Tendencia de participación estudiantil
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={submissionsByDay}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#00843D" strokeWidth={4} dot={{ r: 6, fill: '#00843D' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6 lg:col-span-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <GraduationCap className="text-brand-primary" /> Cursos con mayor producción de instrumentos
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topCourses}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Teacher Activity List - Scalable */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <UserCog className="text-brand-primary" /> Actividad detallada por docente
              </h3>
              <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">
                {examsPerTeacher.length} Docentes registrados
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {examsPerTeacher.map((teacher, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-[32px] border border-slate-100 group hover:border-brand-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center font-black text-brand-primary text-sm group-hover:bg-brand-primary group-hover:text-white transition-colors">
                      {teacher.count}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{teacher.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Exámenes totales</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Activo" />
                </div>
              ))}
              {examsPerTeacher.length === 0 && (
                <div className="col-span-full text-center py-10 italic text-slate-400 text-sm">No hay actividad docente registrada aún.</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Detailed Teacher List */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <UserCog className="text-brand-primary" /> Docentes Vinculados
                </h3>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
                {users.filter(u => u.role === 'teacher' || (u.role === 'admin' && u.email !== 'florezarturo1816@gmail.com')).map((u, i) => {
                  const teacherExams = exams.filter(e => e.creatorId === u.uid).length;
                  // We would need courses collection but for now we have exams
                  return (
                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-brand-primary/30 transition-all">
                      <div className="truncate pr-4">
                        <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{u.fullName || 'Docente sin nombre'}</p>
                        <p className="text-[10px] text-slate-400 font-bold font-mono">{u.email}</p>
                      </div>
                      <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 flex flex-col items-center">
                        <span className="text-[14px] font-black text-brand-primary leading-none">{teacherExams}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Instrumentos</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Student List */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <Users className="text-brand-primary" /> Estudiantes Registrados
                </h3>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
                {users.filter(u => u.role === 'student' || !u.role).map((u, i) => {
                  const studentSubmissions = submissions.filter(s => s.studentId === u.uid).length;
                  const studentCourses = u.enrolledCourseIds?.length || 0;
                  return (
                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-500/30 transition-all">
                      <div className="truncate pr-4">
                        <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{u.fullName || 'Estudiante sin nombre'}</p>
                        <p className="text-[10px] text-slate-400 font-bold font-mono">{u.email}</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="bg-white px-3 py-2 rounded-2xl border border-slate-100 flex flex-col items-center min-w-[70px]">
                          <span className="text-[14px] font-black text-blue-500 leading-none">{studentCourses}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Cursos</span>
                        </div>
                        <div className="bg-white px-3 py-2 rounded-2xl border border-slate-100 flex flex-col items-center min-w-[70px]">
                          <span className="text-[14px] font-black text-emerald-500 leading-none">{studentSubmissions}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Tareas</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Usuarios</h2>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar por correo..."
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-brand-primary text-sm shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <motion.div 
                layout
                key={user.uid}
                className="bg-white border border-slate-100 p-6 rounded-3xl hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                      user.role === 'admin' ? 'bg-slate-900' : user.role === 'teacher' ? 'bg-brand-primary' : 'bg-blue-500'
                    }`}>
                      {user.role === 'admin' ? <ShieldCheck size={20} /> : user.role === 'teacher' ? <UserCog size={20} /> : <Users size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{user.fullName || user.email}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          user.role === 'admin' ? 'bg-slate-900 text-white' : user.role === 'teacher' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : user.role === 'teacher' ? 'Docente' : 'Estudiante'}
                        </span>
                        {user.roleRequest === 'pending' && (
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full animate-pulse">Solicitud Pendiente</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.roleRequest === 'pending' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRoleUpdate(user.uid, 'teacher')}
                          className="px-4 py-2 bg-brand-primary text-white text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all"
                        >
                          Aprobar
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(user.uid)}
                          className="px-4 py-2 bg-red-50 text-red-500 text-[10px] font-black uppercase rounded-xl hover:bg-red-100 transition-all"
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleRoleUpdate(user.uid, user.role === 'teacher' ? 'student' : 'teacher')}
                          disabled={user.role === 'admin'}
                          className="text-[10px] font-black text-slate-400 hover:text-brand-primary uppercase tracking-widest disabled:opacity-0 transition-colors"
                        >
                          Cambiar a {user.role === 'teacher' ? 'Estudiante' : 'Docente'}
                        </button>
                        {user.role !== 'admin' && user.email !== 'florezarturo1816@gmail.com' && (
                          <button 
                            onClick={() => setUserToDelete(user)}
                            className="p-2 text-rose-300 hover:text-rose-500 transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300 font-medium italic">
                    UID: {user.uid.substring(0, 8)}...
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {userToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8">
                    <button 
                      onClick={() => setUserToDelete(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <XCircle size={24} />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center">
                      <AlertTriangle size={40} />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Confirmar eliminación</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        ¿Estás seguro de que deseas eliminar a <span className="text-rose-600 font-bold">{userToDelete.fullName || userToDelete.email}</span>? 
                        Esta acción no se puede deshacer.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full pt-4">
                      <button 
                        onClick={() => setUserToDelete(null)}
                        className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleDeleteUser}
                        disabled={deleting}
                        className="px-6 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                      >
                        {deleting ? <Loader2 className="animate-spin" size={18} /> : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Instrumentos Generados</h2>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por título o curso..."
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-brand-primary text-sm shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-xl shadow-slate-200/50">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Examen / Título</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Curso</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creado por</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExams.map(exam => {
                  const creator = users.find(u => u.uid === exam.creatorId);
                  return (
                    <tr key={exam.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900 line-clamp-1">{exam.title}</p>
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-tighter">{exam.difficulty}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <GraduationCap size={16} className="text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">{exam.course}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <UserCog size={16} className="text-brand-primary" />
                          <p className="text-sm font-bold text-slate-900">{creator?.email || 'Docente Externo'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-xs text-slate-400 font-medium">
                          {exam.createdAt?.seconds ? new Date(exam.createdAt.seconds * 1000).toLocaleDateString() : 'Desconocido'}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredExams.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <FileText className="mx-auto text-slate-100" size={64} />
                <p className="text-slate-400 text-sm font-medium italic">No se encontraron exámenes con los filtros aplicados.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Buzón de Soporte (Chat)</h2>
            <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-[10px] font-black uppercase text-slate-400">
              {conversations.length} Conversaciones activas
            </div>
          </div>

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
                 <div className="h-[600px] bg-white rounded-[40px] border border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <MessageSquare size={48} className="opacity-20" />
                    <p className="text-sm font-medium">Selecciona una conversación para responder</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MessageItem = ({ msg, onReply }: { msg: any, onReply: (id: string, reply: string) => void }) => {
  const [replyText, setReplyText] = useState(msg.reply || '');
  const [isReplying, setIsReplying] = useState(false);

  return (
    <motion.div 
      layout
      className="bg-white border border-slate-100 p-8 rounded-[40px] hover:shadow-xl hover:shadow-slate-200/50 transition-all space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
            msg.userRole === 'docente' ? 'bg-brand-primary' : 'bg-blue-500'
          }`}>
            {msg.userRole === 'docente' ? <UserCog size={24} /> : <Users size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-900 text-lg">{msg.name}</h3>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                (msg.userRole === 'docente' || msg.userRole === 'teacher') ? 'bg-brand-primary/10 text-brand-primary' : 'bg-blue-50 text-blue-600'
              }`}>
                { (msg.userRole === 'docente' || msg.userRole === 'teacher') ? 'Docente' : 'Estudiante'}
              </span>
              {msg.status === 'replied' && (
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full">Respondido</span>
              )}
            </div>
            <p className="text-sm text-slate-400 font-medium">{msg.email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Enviado el</p>
          <p className="text-sm font-bold text-slate-900">
            {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleString() : 'Recientemente'}
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative">
        <div className="absolute top-0 left-8 -translate-y-1/2 w-8 h-8 bg-brand-primary text-white flex items-center justify-center rounded-lg shadow-lg">
          <MessageSquare size={16} />
        </div>
        <p className="text-slate-700 font-medium leading-relaxed mt-2 whitespace-pre-wrap">{msg.message}</p>
      </div>

      {msg.reply && !isReplying ? (
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 space-y-2">
          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Respuesta del Administrador:</p>
          <p className="text-slate-700 font-medium italic">{msg.reply}</p>
          <button 
            onClick={() => setIsReplying(true)}
            className="text-[10px] font-black text-emerald-600 uppercase hover:underline"
          >
            Editar Respuesta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            className="w-full bg-white border border-slate-200 rounded-2xl p-6 outline-none focus:border-brand-primary transition-all font-medium text-slate-700 text-sm h-32 resize-none"
            placeholder="Escribe tu respuesta aquí..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            {isReplying && (
              <button 
                onClick={() => setIsReplying(false)}
                className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400"
              >
                Cancelar
              </button>
            )}
            <button 
              onClick={() => {
                onReply(msg.id, replyText);
                setIsReplying(false);
              }}
              disabled={!replyText.trim()}
              className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
            >
              Enviar Respuesta
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asunto:</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
          {msg.subject || 'Consulta General'}
        </span>
      </div>
    </motion.div>
  );
};
