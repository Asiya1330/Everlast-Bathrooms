import React from 'react';
import { X, Download, FileText } from 'lucide-react';
import { Attachment } from '../../types';
import { formatBytes, formatDate } from '../../lib/utils';

interface MediaLightboxProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({ attachment, onClose }) => {
  if (!attachment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-all"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] max-w-4xl w-full flex flex-col items-center bg-[#12161A] rounded-xl overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="w-full flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 text-white">
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate max-w-xs sm:max-w-md">
              {attachment.fileName}
            </span>
            <span className="text-xs text-gray-400">
              {attachment.phase === 'resolution' ? 'Resolution (After fix)' : 'Reported (Initial issue)'} •{' '}
              {formatBytes(attachment.sizeBytes)} • {formatDate(attachment.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={attachment.url}
              download={attachment.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="w-full flex items-center justify-center p-4 bg-black/60 min-h-[300px] max-h-[75vh] overflow-auto">
          {attachment.kind === 'image' ? (
            <img
              src={attachment.url}
              alt={attachment.fileName}
              className="max-h-[70vh] max-w-full object-contain rounded"
              referrerPolicy="no-referrer"
            />
          ) : attachment.kind === 'video' ? (
            <video
              src={attachment.url}
              controls
              autoPlay
              className="max-h-[70vh] max-w-full rounded shadow-lg"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-white text-center">
              <FileText className="w-16 h-16 text-gray-400 mb-3" />
              <p className="text-sm font-medium">{attachment.fileName}</p>
              <p className="text-xs text-gray-400 mt-1">Document file</p>
              <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 px-4 py-2 bg-[#0F5CC4] text-white text-sm font-medium rounded hover:bg-[#0F5CC4]/90"
              >
                Open File
              </a>
            </div>
          )}
        </div>

        {/* Caption/Uploader */}
        {attachment.uploaderName && (
          <div className="w-full px-4 py-2 text-xs text-gray-400 bg-black/40 border-t border-white/5">
            Uploaded by {attachment.uploaderName}
          </div>
        )}
      </div>
    </div>
  );
};
