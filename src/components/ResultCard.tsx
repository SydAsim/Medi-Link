import { motion } from 'motion/react';
import { MapPin, RotateCcw, AlertCircle, Bell, User, LayoutDashboard, History, HeartPulse, HelpCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UrgencyLevel, getUrgencyColors } from '../utils/urgencyColors';

interface ResultCardProps {
  urgencyLevel: UrgencyLevel;
  explanation: string;
  firstSteps: string[];
  translatedSummary: string;
  imageUrl?: string | null;
  onReset: () => void;
}

export default function ResultCard({
  urgencyLevel,
  explanation,
  firstSteps,
  translatedSummary,
  imageUrl,
  onReset,
}: ResultCardProps) {
  const navigate = useNavigate();
  const colors = getUrgencyColors(urgencyLevel);
  const isHigh = urgencyLevel === 'High';

  return (
    <div className="fixed inset-0 z-[100] bg-[#F0F4F8] flex flex-col font-sans overflow-y-auto">
      {/* Top Professional Navigation */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <HeartPulse className="text-white" size={18} />
            </div>
            <span className="text-xl font-display font-bold text-blue-900">MediLink</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Navlink icon={LayoutDashboard} label="Dashboard" onClick={() => navigate('/dashboard')} />
            <Navlink icon={FileText} label="Health Records" />
            <Navlink icon={History} label="Alert History" active />
            <Navlink icon={HelpCircle} label="Support" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
            <Bell size={20} />
          </button>
          <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
            <User size={20} />
          </button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-12 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
        >
          {/* Urgency Banner */}
          <div className={`py-3 px-8 flex items-center gap-2 ${urgencyLevel === 'High' ? 'bg-red-600' : urgencyLevel === 'Medium' ? 'bg-orange-500' : 'bg-emerald-700'}`}>
            <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              Active Session: {urgencyLevel} Urgency
            </span>
          </div>

          <div className="p-8 md:p-16">
            {/* Headline Section */}
            <div className="text-center mb-16 space-y-4">
              <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${colors.text}`}>
                {urgencyLevel} Urgency Alert
              </p>
              <h1 className="urdu text-4xl md:text-5xl font-bold text-slate-900 leading-[1.3] max-w-2xl mx-auto">
                {explanation}
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
              {/* Left Column: Tactics */}
              <div className="md:col-span-3 bg-blue-50/50 rounded-3xl p-8 border border-blue-100/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-1.5 bg-blue-600 rounded-md">
                    <FileText className="text-white" size={14} />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900">Immediate Next Steps</h3>
                </div>
                
                <ul className="space-y-6">
                  {firstSteps.map((step, idx) => (
                    <li key={idx} className="flex gap-4 group">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${colors.strip}`} />
                      <div className="space-y-1">
                        <p className="urdu text-xl font-bold text-slate-800 leading-snug group-hover:text-blue-700 transition-colors">
                          {step}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column: Context & Graphics */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Case Summary</h3>
                  <div className="flex items-start gap-3 bg-blue-100/30 p-4 rounded-xl">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <User size={18} />
                    </div>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {translatedSummary}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-inner bg-slate-100 border border-slate-200 aspect-video flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent z-10" />
                  <img 
                    src={imageUrl || "https://images.unsplash.com/photo-1576091160550-217359f42f8c?auto=format&fit=crop&q=80&w=400"} 
                    alt="Incident Analysis" 
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-blue-600 shadow-xl">
                      <HeartPulse size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-4 pt-12 border-t border-slate-100">
              <button 
                onClick={() => window.open('https://www.google.com/maps/search/nearest+hospital', '_blank')}
                className="w-full sm:w-80 py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                <MapPin size={22} />
                <span>Find Healthcare</span>
              </button>
              
              <button 
                onClick={onReset}
                className="w-full sm:w-60 py-5 bg-white text-slate-600 border-2 border-slate-200 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </motion.div>

        <p className="mt-8 text-xs text-slate-400 font-medium text-center max-w-lg mb-12">
          If you feel this is an emergency, please contact <span className="text-red-500 font-bold">1122</span> or visit the nearest ER immediately.
        </p>
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 px-8 py-8 flex flex-col md:flex-row items-center justify-between text-slate-500 mt-auto">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-900 border-r border-slate-300 pr-6 mr-0">MediLink</span>
          <FooterLink label="Privacy Policy" />
          <FooterLink label="Terms of Service" />
          <FooterLink label="Emergency Contacts" />
          <FooterLink label="Accessibility" />
        </div>
        <p className="text-[10px] font-medium text-slate-400">
          © 2024 MediLink Digital Services. Professional Medical Guidance.
        </p>
      </footer>
    </div>
  );
}

function Navlink({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-1 py-1 border-b-2 transition-all cursor-pointer ${
      active ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
    }`}>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function FooterLink({ label }: { label: string }) {
  return (
    <button className="text-[10px] font-bold uppercase tracking-widest hover:text-blue-600 transition-colors cursor-pointer">
      {label}
    </button>
  );
}

