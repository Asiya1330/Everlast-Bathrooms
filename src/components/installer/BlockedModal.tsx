import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { ServiceCall, UserProfile } from '../../types';

interface BlockedModalProps {
  call: ServiceCall;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const BlockedModal: React.FC<BlockedModalProps> = ({
  call,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A reason is strictly required when marking a call blocked.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-[#DFE2DE]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFE2DE] bg-[#FBFBF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#12161A]">Can't Complete Call</h3>
              <p className="text-xs text-[#3A424B]">Job #{call.jobNumber} • Blocked state</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-[#3A424B] leading-relaxed">
            The database requires an explicit reason when a service call cannot be completed. The office will review this reason immediately.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#3A424B] mb-1.5">
              Reason Call Cannot Be Completed <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Esperando pieza llega el viernes (Waiting on replacement Kohler valve cartridge arriving Friday), or client not home."
              rows={4}
              required
              className="w-full text-sm p-3 rounded-lg border border-[#DFE2DE] focus:border-[#C97A16] focus:ring-1 focus:ring-[#C97A16] outline-none text-[#12161A] bg-white resize-none"
            />
            {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#C97A16] hover:bg-[#B26B12] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Mark as Blocked</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-2 py-2 text-xs font-medium text-[#6B7A88] hover:text-[#12161A]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
