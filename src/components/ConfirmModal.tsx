import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="bg-white rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <div className="text-slate-600 whitespace-pre-wrap">{message}</div>
          </div>
        </div>
        
        <div className="mt-8 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="px-5 py-2.5 rounded-xl font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
