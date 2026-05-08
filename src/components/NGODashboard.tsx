import { useState } from 'react';
import { useTriageReports } from '../hooks/useTriageReports';
import StatsPanel from './StatsPanel';
import MapComponent from './MapComponent';
import CaseList from './CaseList';
import CaseDetail from './CaseDetail';
import LoadingState from './LoadingState';
import { RefreshCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function NGODashboard() {
  const navigate = useNavigate();
  const { reports, isLoading, error, refetch } = useTriageReports();
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);

  if (isLoading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="Connecting to health workers network..." />
      </div>
    );
  }

  const highUrgencyCount = reports.filter(r => r.urgencyLevel === 'High').length;

  const handleSelectCase = (report: any) => {
    setSelectedCase(report);
    setIsDetailOpen(true);
  };

  const handleTrackOnMap = () => {
    setIsDetailOpen(false);
    setFocusTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#EFF6FF] text-slate-800 flex flex-col p-8 relative">
      <AnimatePresence>
        {isDetailOpen && selectedCase && (
          <CaseDetail 
            report={selectedCase} 
            onClose={() => setIsDetailOpen(false)}
            onTrack={handleTrackOnMap} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="max-w-[1200px] mx-auto w-full flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-blue-600 cursor-pointer"
            title="Back to Villager App"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">MediLink AI</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 opacity-80">Khyber Pakhtunkhwa Regional Triage</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="hidden md:flex px-4 py-2 bg-white rounded-full border border-slate-200 text-sm font-medium items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 
            System Online
          </div>
          <button 
            onClick={() => refetch()}
            className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 shadow-sm transition-all"
          >
            <RefreshCcw size={20} />
          </button>
          <div className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium shadow-sm">
            Admin Dashboard
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1200px] mx-auto w-full flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Top Horizontal Stats Bar */}
        <div className="col-span-12">
          <StatsPanel 
            totalReports={reports.length} 
            highUrgencyCount={highUrgencyCount} 
          />
        </div>

        {/* Map View */}
        <section className="col-span-12 lg:col-span-8 glass rounded-[2rem] p-2 relative overflow-hidden h-[500px] lg:h-full">
          <MapComponent reports={reports} selectedReport={selectedCase} focusTrigger={focusTrigger} />
          {error && (
            <div className="absolute top-6 left-6 right-6 glass bg-red-50/90 text-red-700 p-4 rounded-2xl shadow-xl z-[1000] flex justify-between items-center border border-red-100">
              <span className="text-sm font-bold">{error}</span>
              <button onClick={() => refetch()} className="text-xs font-extrabold uppercase tracking-widest underline">Retry</button>
            </div>
          )}
        </section>

        {/* Recent Cases */}
        <aside className="col-span-12 lg:col-span-4 glass rounded-[2rem] p-6 h-[500px] lg:h-full flex flex-col overflow-hidden">
          <CaseList reports={reports} selectedId={selectedCase?.id} onSelect={handleSelectCase} />
        </aside>
      </main>
    </div>
  );
}
