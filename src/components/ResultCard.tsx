import { motion } from 'motion/react';
import { MapPin, RotateCcw, AlertCircle } from 'lucide-react';
import { UrgencyLevel, getUrgencyColors } from '../utils/urgencyColors';

interface ResultCardProps {
  urgencyLevel: UrgencyLevel;
  explanation: string;
  firstSteps: string[];
  translatedSummary: string;
  onReset: () => void;
}

export default function ResultCard({
  urgencyLevel,
  explanation,
  firstSteps,
  translatedSummary,
  onReset,
}: ResultCardProps) {
  const colors = getUrgencyColors(urgencyLevel);
  const isHigh = urgencyLevel === 'High';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-[360px] lg:max-w-[420px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[6px] border-slate-800"
    >
      {/* Phone Notch */}
      <div className="w-24 h-5 bg-slate-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-20 hidden sm:block"></div>
      
      <div className="h-full w-full bg-white rounded-[2.2rem] overflow-hidden flex flex-col relative">
        <div className={`h-3 w-full ${colors.strip}`} />
        
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              isHigh ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'
            }`}>
              <AlertCircle size={24} />
            </div>
            
            <h2 className="urdu text-2xl font-bold leading-relaxed text-slate-900 mb-2">
              {explanation}
            </h2>
            <p className={`text-sm font-bold uppercase tracking-widest ${colors.text}`}>
              {urgencyLevel} Urgency Alert
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:border-blue-100">
              <p className="text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-widest">Immediate Next Steps</p>
              <ul className="space-y-3">
                {firstSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colors.strip}`} />
                    <span className="text-sm text-slate-700 font-bold leading-snug">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="px-1">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Case Summary</p>
               <p className="text-xs text-slate-600 font-medium italic">"{translatedSummary}"</p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 bg-white/80 backdrop-blur-sm border-t border-slate-50 space-y-3">
          <button
            onClick={() => window.open('https://www.google.com/maps/search/nearest+hospital', '_blank')}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-transform"
          >
            <MapPin size={18} />
            <span>Find Healthcare</span>
          </button>
          
          <button
            onClick={onReset}
            className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest active:opacity-60 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    </motion.div>
  );
}
