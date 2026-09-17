import React, { useState } from 'react';
import { X, CheckCircle2, Trash2, Camera } from 'lucide-react';
import { ServiceCall, UserProfile } from '../../types';
import { uploadAttachment } from '../../lib/api';

interface CompleteModalProps {
  call: ServiceCall;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void | Promise<void>;
}

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
}

export const CompleteModal: React.FC<CompleteModalProps> = ({ call, isOpen, onClose, onConfirm }) => {
  const [note, setNote] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: PendingFile[] = Array.from(files).map((file: File) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      for (const pending of pendingFiles) {
        await uploadAttachment({ callId: call.id, file: pending.file, phase: 'resolution' });
      }
      await onConfirm(note);
    } catch (err: any) {
      setError(err.message || 'Failed to upload resolution photos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-[#DFE2DE] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFE2DE] bg-[#FBFBF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#12161A]">Mark Call Complete</h3>
              <p className="text-xs text-[#3A424B]">Job #{call.jobNumber} • {call.client?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#3A424B] mb-1.5">
              Completion Details (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Replaced sweep seal, re-caulked shower base, verified leak fixed with water test."
              rows={3}
              className="w-full text-sm p-3 rounded-lg border border-[#DFE2DE] focus:border-[#0F5CC4] focus:ring-1 focus:ring-[#0F5CC4] outline-none text-[#12161A] bg-white resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#3A424B]">
                "After" Resolution Photos
              </label>
              <span className="text-xs text-[#6B7A88]">Recommended for warranty</span>
            </div>

            <label className="border-2 border-dashed border-[#DFE2DE] hover:border-[#0F5CC4] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#FBFBF9]">
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileUpload} />
              <div className="w-10 h-10 rounded-full bg-[#0F5CC4]/10 text-[#0F5CC4] flex items-center justify-center mb-2">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#0F5CC4]">Take or Upload Photo / Video</span>
              <span className="text-[11px] text-[#6B7A88] mt-0.5">Proof of completed work for office</span>
            </label>

            {pendingFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {pendingFiles.map((f) => (
                  <div key={f.id} className="relative group rounded-lg overflow-hidden border border-[#DFE2DE] aspect-square bg-gray-100">
                    {f.file.type.startsWith('video/') ? (
                      <video src={f.previewUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={f.previewUrl} alt={f.file.name} className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Uploading…' : 'Mark complete'}</span>
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
