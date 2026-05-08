import { motion } from 'motion/react';
import { X, MapPin, Clock, Shield, ArrowRight, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getUrgencyColors } from '../utils/urgencyColors';

interface CaseDetailProps {
  report: any;
  onClose: () => void;
  onTrack: () => void;
}

export default function CaseDetail({ report, onClose, onTrack }: CaseDetailProps) {
  if (!report) return null;
  const colors = getUrgencyColors(report.urgencyLevel);
  const date = typeof report.createdAt === 'string' ? new Date(report.createdAt) : report.createdAt;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-[1001] p-6 flex items-center justify-center pointer-events-none"
    >
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden pointer-events-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.badge}`}>
                  {report.urgencyLevel}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                  {report.issueType || 'General'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-2">
                <Clock size={10} />
                Reported {formatDistanceToNow(date, { addSuffix: true })}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {report.imageUrl && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                <img src={report.imageUrl} alt="Incident" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600">User Situation</h4>
              <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                "{report.symptoms}"
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600">AI Summary</h4>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                {report.translatedSummary}
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Location Tagged</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {report.latitude ? `${report.latitude.toFixed(4)}, ${report.longitude?.toFixed(4)}` : 'Manual Submission'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onTrack}
                className="px-4 py-2 bg-blue-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                Track on Map
                <ArrowRight size={12} />
              </button>
            </div>

            {report.phoneNumber && (
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-600">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Contact Number</p>
                  <p className="text-[10px] text-blue-600 font-bold tracking-wider">
                    {report.phoneNumber}
                  </p>
                </div>
              </div>
            )}

            {report.firstSteps && report.firstSteps.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-1">
                  <Shield size={12} />
                  AI Generated Next Steps
                </h4>
                <ul className="space-y-1.5">
                  {report.firstSteps.slice(0, 3).map((step: string, i: number) => (
                    <li key={i} className="text-[10px] font-medium text-slate-500 flex gap-2">
                      <span className="text-blue-400">•</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">NGO Admin Access Only</span>
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center font-bold text-[8px] text-white">
                  P{i}
                </div>
              ))}
            </div>
        </div>
      </div>
    </motion.div>
  );
}
