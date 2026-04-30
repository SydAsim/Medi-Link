import { Users, AlertTriangle, Zap } from 'lucide-react';

interface StatsPanelProps {
  totalReports: number;
  highUrgencyCount: number;
}

export default function StatsPanel({ totalReports, highUrgencyCount }: StatsPanelProps) {
  return (
    <div className="glass rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between shadow-sm gap-8">
      <div className="flex gap-12 items-center flex-1">
        <div className="text-center group">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">Total Reports</p>
          <div className="flex items-center gap-3 justify-center">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
               <Users size={20} />
            </div>
            <p className="text-4xl font-bold text-slate-900 tracking-tight">{totalReports.toLocaleString()}</p>
          </div>
        </div>

        <div className="w-px h-12 bg-slate-200 hidden md:block"></div>

        <div className="text-center group">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 group-hover:text-red-600 transition-colors">High Urgency</p>
          <div className="flex items-center gap-3 justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-red-400 blur-md opacity-20 animate-pulse rounded-full"></div>
              <div className="relative p-2 bg-red-50 rounded-lg text-red-600">
                <AlertTriangle size={20} />
              </div>
            </div>
            <p className="text-4xl font-bold text-red-600 tracking-tight">{highUrgencyCount}</p>
          </div>
        </div>

        <div className="w-px h-12 bg-slate-200 hidden md:block"></div>

        <div className="text-center group">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Avg. Response</p>
          <div className="flex items-center gap-3 justify-center">
             <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                <Zap size={20} />
             </div>
             <p className="text-4xl font-bold text-slate-900 tracking-tight">1.2s</p>
          </div>
        </div>
      </div>

      <div className="hidden xl:flex -space-x-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="inline-block h-10 w-10 rounded-full ring-4 ring-white bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden"
          >
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} 
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <div className="inline-block h-10 w-10 rounded-full ring-4 ring-white bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
          +8
        </div>
      </div>
    </div>
  );
}
