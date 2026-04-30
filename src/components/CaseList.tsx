import { formatDistanceToNow } from 'date-fns';
import { getUrgencyColors, UrgencyLevel } from '../utils/urgencyColors';

interface Report {
  id: string;
  urgencyLevel: UrgencyLevel;
  issueType?: string;
  translatedSummary: string;
  createdAt: Date | string;
}

interface CaseListProps {
  reports: Report[];
  selectedId?: string | null;
  onSelect: (report: Report) => void;
}

export default function CaseList({ reports, selectedId, onSelect }: CaseListProps) {
  const recentReports = reports.slice(0, 10);

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-bold text-slate-900 mb-4 px-1">Case Stream</h3>
      <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {recentReports.map((report) => {
          const colors = getUrgencyColors(report.urgencyLevel);
          const date = typeof report.createdAt === 'string' ? new Date(report.createdAt) : report.createdAt;
          const isSelected = selectedId === report.id;
          
          return (
            <div
              key={report.id}
              onClick={() => onSelect(report)}
              className={`p-4 rounded-2xl transition-all cursor-pointer group active:scale-95 border-2 ${
                isSelected 
                ? 'bg-blue-50 border-blue-600 scale-[1.02] shadow-lg ring-4 ring-blue-100/50' 
                : report.urgencyLevel === 'High' 
                  ? 'bg-red-50 border-red-100 hover:border-red-300' 
                  : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${colors.badge}`}>
                    {report.urgencyLevel}
                  </span>
                  {report.issueType && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                      {report.issueType}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold italic">
                  {formatDistanceToNow(date, { addSuffix: true })}
                </span>
              </div>
              <p className={`text-xs line-clamp-2 font-bold leading-relaxed ${
                report.urgencyLevel === 'High' ? 'text-slate-800' : 'text-slate-600'
              }`}>
                {report.translatedSummary}
              </p>
            </div>
          );
        })}
        
        {reports.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Cases Active</p>
          </div>
        )}
      </div>

      <button className="mt-6 w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 hover:bg-slate-100 active:scale-[0.98] transition-all">
        View All {reports.length.toLocaleString()} Cases
      </button>
    </div>
  );
}
