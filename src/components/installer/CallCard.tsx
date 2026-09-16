import React from 'react';
import { Paperclip, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { ServiceCall } from '../../types';
import { formatRelativeDate, getPriorityBorderColor, getStatusBadge } from '../../lib/utils';

interface CallCardProps {
  call: ServiceCall;
  onClick: () => void;
}

export const CallCard: React.FC<CallCardProps> = ({ call, onClick }) => {
  const priorityColor = getPriorityBorderColor(call.priority);
  const statusBadge = getStatusBadge(call.status);
  const attachmentCount = (call.attachments || []).length;

  return (
    <div
      onClick={onClick}
      className="relative flex bg-white rounded-xl shadow-xs border border-[#DFE2DE] hover:border-[#3A424B]/40 active:scale-[0.99] cursor-pointer transition-all overflow-hidden"
    >
      {/* 4px Colored Priority Left Edge Bar (Per Spec Section 7.3 & 8) */}
      <div
        className="w-1.5 shrink-0 self-stretch"
        style={{ backgroundColor: priorityColor }}
        title={`Priority: ${call.priority}`}
      />

      <div className="flex-1 p-3.5 flex flex-col justify-between">
        {/* First Line: Job Number and Client Name */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-[#12161A] text-white px-2 py-0.5 rounded-md tabular-nums">
              #{call.jobNumber}
            </span>
            <h3 className="text-base font-bold text-[#12161A] tracking-tight truncate max-w-[190px]">
              {call.client?.name || 'Customer'}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
              {statusBadge.label}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Issue Description - Truncated to two lines */}
        <p className="mt-2 text-xs text-[#3A424B] font-normal line-clamp-2 leading-relaxed">
          {call.description}
        </p>

        {/* Blocked reason if any */}
        {call.status === 'blocked' && call.completionNote && (
          <div className="mt-2 p-1.5 bg-red-50 border border-red-100 rounded text-[11px] text-red-700 truncate">
            <span className="font-semibold">Reason:</span> {call.completionNote}
          </div>
        )}

        {/* Bottom meta: relative days reported & paperclip attachment count */}
        <div className="mt-3 pt-2.5 border-t border-[#DFE2DE]/70 flex items-center justify-between text-[11px] text-[#6B7A88]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            Reported {formatRelativeDate(call.reportedDate)}
          </span>

          <div className="flex items-center gap-3">
            {attachmentCount > 0 && (
              <span className="flex items-center gap-1 text-[#0F5CC4] font-medium" title={`${attachmentCount} attachments`}>
                <Paperclip className="w-3.5 h-3.5" />
                <span>{attachmentCount}</span>
              </span>
            )}
            <span className="capitalize text-[#3A424B] font-medium">
              {call.responsibility}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
