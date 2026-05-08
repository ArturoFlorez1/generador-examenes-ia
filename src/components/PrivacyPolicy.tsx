import React from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Eye, 
  Terminal, 
  Database, 
  Scale,
  Brain
} from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const sections = [
    {
      title: 'Privacidad de los Datos',
      icon: Lock,
      content: 'Toda la información personal recolectada a través de la autenticación de Google se utiliza exclusivamente para identificar tu progreso y rol dentro de la plataforma EduGenius AI. No compartimos tus datos con terceros ni los utilizamos para fines comerciales.'
    },
    {
      title: 'Generación con IA',
      icon: Brain,
      content: 'Los exámenes generados mediante Inteligencia Artificial son propiedad del docente creador. Los prompts y datos enviados al modelo Gemini Pro de Google están protegidos bajo los términos de privacidad para empresas de Google Cloud Vertex AI, lo que garantiza que tu contenido no se utiliza para entrenar modelos públicos.'
    },
    {
      title: 'Seguridad de la Información',
      icon: Database,
      content: 'Implementamos medidas de seguridad técnicas como encriptación SSL, firewalls de bases de datos de Firebase y reglas de seguridad robustas que limitan el acceso a los datos únicamente a los usuarios autorizados (dueños de los documentos o administradores del sistema).'
    },
    {
      title: 'Uso Responsable',
      icon: Scale,
      content: 'Los usuarios se comprometen a utilizar la herramienta para fines exclusivamente educativos y académicos. Queda prohibida la generación de contenido ofensivo, discriminatorio o que viole los derechos de autor de terceros.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
      <div className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="p-4 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-brand-primary transition-all shadow-sm group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Política de <span className="text-brand-primary">privacidad</span>
          </h1>
          <p className="text-slate-500 font-medium">Transparencia y seguridad en el manejo de tu información académica.</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 rounded-3xl bg-brand-primary flex items-center justify-center shrink-0 shadow-2xl shadow-brand-primary/50">
            <ShieldCheck size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight">Compromiso con la ética digital</h2>
            <p className="text-white/60 leading-relaxed font-medium">
              En la Universidad de Córdoba, entendemos que la integración de la IA en el aula requiere un compromiso inquebrantable con la privacidad de nuestros docentes y estudiantes. Esta política detalla cómo protegemos tu entorno educativo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <div key={idx} className="card p-8 space-y-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-brand-primary flex items-center justify-center">
              <section.icon size={24} />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900">{section.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">{section.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[32px] text-center space-y-4">
        <p className="text-sm font-bold text-emerald-800">
          Última actualización: Mayo 2026. 
          Al utilizar EduGenius AI, aceptas los términos descritos en este documento.
        </p>
      </div>
    </div>
  );
};
