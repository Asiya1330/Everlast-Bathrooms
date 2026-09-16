import React, { useState } from 'react';
import {
  TrendingUp,
  Percent,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { db } from '../../lib/database';
import { UserProfile } from '../../types';

interface Dashboard90dProps {
  currentUser: UserProfile;
}

export const Dashboard90d: React.FC<Dashboard90dProps> = ({ currentUser }) => {
  const rates = db.get90DayRates();
  const installers = db.getActiveInstallers();
  const [activeMonth, setActiveMonth] = useState('2026-09-01');
  const [monthlyCounts, setMonthlyCounts] = useState<Record<string, number>>({
    inst_alexander_azua: 6,
    inst_carlos_mendez: 8,
    inst_david_rivera: 9,
    inst_manny_guevara: 7,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveMonthlyCounts = () => {
    Object.entries(monthlyCounts).forEach(([instId, count]) => {
      db.updateMonthlyStat(instId, activeMonth, Number(count), currentUser);
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 90-Day KPI Overview */}
      <div className="bg-white p-6 rounded-xl border border-[#DFE2DE] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#0F5CC4]"></span>
              <h2 className="text-base font-bold text-[#12161A] tracking-tight">
                90-Day Crew Service Call Rate
              </h2>
            </div>
            <p className="text-xs text-[#6B7A88] mt-1">
              Calculated live per Spec 5.10: <code>(Installer Calls ÷ Completed Projects) × 100</code>.
              Office & manufacturer faults are excluded by rule.
            </p>
          </div>
          <div className="px-3 py-1.5 bg-[#FBFBF9] border border-[#DFE2DE] rounded-lg text-xs font-semibold text-[#3A424B]">
            Period: Last 90 Days
          </div>
        </div>

        {/* 90-Day Rates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F0F2F0] text-[#3A424B] border-b border-[#DFE2DE] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Crew / Installer</th>
                <th className="py-3 px-4 text-center">Projects Completed (90d)</th>
                <th className="py-3 px-4 text-center">Installer Service Calls</th>
                <th className="py-3 px-4 text-right">Service Call %</th>
                <th className="py-3 px-4 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE2DE]">
              {rates.map((rate) => {
                const pct = rate.serviceCallPct;
                const isHigh = pct !== null && pct > 20;
                const isGreat = pct !== null && pct < 12;

                return (
                  <tr key={rate.installerId} className="hover:bg-[#FBFBF9] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#12161A] text-sm">
                      {rate.fullName}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-[#3A424B] tabular-nums">
                      {rate.totalProjects}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-[#12161A] tabular-nums">
                      {rate.totalServiceCalls}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-base tabular-nums">
                      {pct !== null ? (
                        <span className={isHigh ? 'text-red-600' : isGreat ? 'text-emerald-600' : 'text-[#12161A]'}>
                          {pct}%
                        </span>
                      ) : (
                        <span className="text-[#6B7A88] font-normal text-xs italic">
                          No project counts
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {pct !== null ? (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isHigh
                              ? 'bg-red-100 text-red-800'
                              : isGreat
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {isHigh ? 'Above Target' : isGreat ? 'Excellent' : 'Standard'}
                        </span>
                      ) : (
                        <span className="text-[#6B7A88] text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Option A: Monthly Count Entry (Spec 1.1 & 7.3) */}
      <div className="bg-white p-6 rounded-xl border border-[#DFE2DE] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#12161A] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0F5CC4]" />
              <span>Monthly Completed Projects Entry (Option A)</span>
            </h3>
            <p className="text-xs text-[#6B7A88] mt-0.5">
              Enter each crew&apos;s completed bath remodels once a month to feed the denominator.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[#6B7A88]">Month:</label>
            <select
              value={activeMonth}
              onChange={(e) => setActiveMonth(e.target.value)}
              className="text-xs p-1.5 bg-[#FBFBF9] border border-[#DFE2DE] rounded-lg font-semibold"
            >
              <option value="2026-09-01">September 2026</option>
              <option value="2026-08-01">August 2026</option>
              <option value="2026-07-01">July 2026</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {installers.map((inst) => (
            <div key={inst.id} className="p-3.5 bg-[#FBFBF9] rounded-xl border border-[#DFE2DE]">
              <span className="block text-xs font-semibold text-[#12161A] truncate">
                {inst.fullName}
              </span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={monthlyCounts[inst.id] ?? 0}
                  onChange={(e) =>
                    setMonthlyCounts((prev) => ({
                      ...prev,
                      [inst.id]: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-20 text-center font-bold text-sm p-1.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none tabular-nums"
                />
                <span className="text-xs text-[#6B7A88]">completed</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between pt-3 border-t border-[#DFE2DE]">
          <span className="text-xs text-[#6B7A88]">
            {saveSuccess ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Monthly counts updated!
              </span>
            ) : (
              'Autosaves to database denominator'
            )}
          </span>
          <button
            onClick={handleSaveMonthlyCounts}
            className="px-4 py-2 bg-[#12161A] hover:bg-[#3A424B] text-white text-xs font-bold rounded-lg transition-colors"
          >
            Save Counts
          </button>
        </div>
      </div>
    </div>
  );
};
