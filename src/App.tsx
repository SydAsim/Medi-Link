import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import VoiceInputScreen from './components/VoiceInputScreen';
import NGODashboard from './components/NGODashboard';

export default function App() {
  return (
    <BrowserRouter>
      {/* Hidden Navigation for Demo Purpose */}
      <nav className="fixed bottom-4 right-4 z-50 flex space-x-2">
        <Link 
          to="/" 
          className="bg-white/80 backdrop-blur shadow-lg border border-white/50 px-4 py-2 rounded-full text-xs font-bold text-blue-600 hover:bg-white transition-all"
        >
          Villager App
        </Link>
        <Link 
          to="/dashboard" 
          className="bg-white/80 backdrop-blur shadow-lg border border-white/50 px-4 py-2 rounded-full text-xs font-bold text-blue-600 hover:bg-white transition-all"
        >
          NGO Dashboard
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<VoiceInputScreen />} />
        <Route path="/dashboard" element={<NGODashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
