import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, HelpCircle, Activity, Globe, Shield, MapPin, Zap } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import LoadingState from './LoadingState';
import ResultCard from './ResultCard';
import { GoogleGenAI } from "@google/genai";

const LANGUAGES = [
  { name: 'اردو', code: 'ur-PK', label: 'Urdu' },
  { name: 'پښتو', code: 'ps-AF', label: 'Pashto' },
  { name: 'English', code: 'en-US', label: 'English' },
];

const MOCK_CLINICS = [
  {
    name: "Lady Reading Hospital",
    city: "Peshawar",
    latitude: 34.0151,
    longitude: 71.5249,
  },
  {
    name: "Mardan Medical Complex",
    city: "Mardan",
    latitude: 34.1986,
    longitude: 72.0404,
  },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export default function VoiceInputScreen() {
  const {
    isRecording,
    transcript,
    audioBlob,
    startAudioRecording,
    stopAudioRecording,
    resetTranscript,
  } = useSpeechRecognition();

  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'voice' | 'text'>('voice');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (isLocationEnabled && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.log('Location access denied', err);
          setIsLocationEnabled(false);
        }
      );
    } else {
      setLocation(null);
    }
  }, [isLocationEnabled]);

  const nearestClinicName = location 
    ? MOCK_CLINICS.reduce((prev, curr) => {
        const dPrev = getDistance(location.lat, location.lng, prev.latitude, prev.longitude);
        const dCurr = getDistance(location.lat, location.lng, curr.latitude, curr.longitude);
        return dCurr < dPrev ? curr : prev;
      }).name
    : MOCK_CLINICS[0].name;

  const handleSubmit = async (text: string) => {
    if (!text || text.length < 3) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: selectedLang.label,
          nearestClinic: nearestClinicName,
          location,
          phoneNumber
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error || "Triage failed");
      }
    } catch (err: any) {
      console.error('Triage error:', err);
      setError(err.message || 'Failed to process symptoms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioRecording = async (blob: Blob) => {
    setIsLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // Unified call to handle everything in one request
        const response = await fetch('/api/process-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: blob.type,
            language: selectedLang.label,
            nearestClinic: nearestClinicName,
            location,
            phoneNumber
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          setResult(data.data);
          resetTranscript();
        } else {
          throw new Error(data.error || "Processing failed");
        }
      };
    } catch (err: any) {
      console.error('Audio processing error:', err);
      setError(err.message || 'Failed to process audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioBlob) {
      handleAudioRecording(audioBlob);
    }
  }, [audioBlob]);

  const handleMicToggle = () => {
    if (isRecording) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    resetTranscript();
    setInputText('');
    setPhoneNumber('');
  };

  if (result) {
    return (
      <div className="min-h-screen bg-[#EFF6FF] flex items-center justify-center p-4">
        <ResultCard
          urgencyLevel={result.urgencyLevel}
          explanation={result.explanation}
          firstSteps={result.firstSteps}
          translatedSummary={result.translatedSummary}
          onReset={handleReset}
        />
      </div>
    );
  }

  const isUrduOrPashto = selectedLang.code === 'ur-PK' || selectedLang.code === 'ps-AF';

  return (
    <div className="min-h-screen bg-[#EFF6FF] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center gap-12 z-10">
        
        {/* Left Side: Brand & Status (Visible on Desktop) */}
        <div className="flex-1 space-y-8 hidden lg:block">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-300">
              <Zap className="text-white" size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-6xl font-display font-medium tracking-tight text-slate-900 leading-[0.9]">
              Instant Relief <br /> 
              <span className="text-blue-600 italic">Response Network</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium max-w-sm">
              Connecting rural communities to immediate emergency NGOs using advanced AI triage.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { icon: Activity, label: "Live Network", value: "98.2%" },
              { icon: Globe, label: "Coverage", value: "KPK & Punjab" },
              { icon: Shield, label: "Encryption", value: "256-bit AES" },
              { icon: MapPin, label: "Facilities", value: "120+ Connected" },
            ].map((stat, i) => (
              <div key={i} className="glass p-4 rounded-3xl border-blue-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <stat.icon size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                  <p className="text-sm font-bold text-slate-800">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Main Interactive Terminal */}
        <div className="w-full lg:w-[480px] space-y-6">
          <div className="lg:hidden text-center space-y-2 mb-8">
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900">MediLink AI</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Emergency & NGO Grid</p>
          </div>

          <main className="glass border-blue-100 shadow-2xl rounded-[3rem] p-6 lg:p-8 space-y-8 relative overflow-hidden backdrop-blur-2xl">
            <div className="flex items-center justify-between w-full bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <div className="flex space-x-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
                      selectedLang.code === lang.code
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'text-slate-500 hover:bg-white hover:text-slate-700'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2 pl-3">
                 <button
                    onClick={() => setInputType(i => i === 'voice' ? 'text' : 'voice')}
                    className={`p-2.5 rounded-xl transition-all ${
                      inputType === 'text' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'
                    }`}
                 >
                    {inputType === 'voice' ? <Send size={16} /> : <Mic size={16} />}
                 </button>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12">
                <LoadingState />
              </div>
            ) : (
              <div className="space-y-8">
                {inputType === 'voice' && isSupported ? (
                  <div className="flex flex-col items-center space-y-8">
                    <div className="relative flex items-center justify-center">
                      <AnimatePresence>
                        {isRecording && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [1, 1.6, 1], opacity: 0.2 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="absolute w-48 h-48 bg-red-400 rounded-full"
                          />
                        )}
                      </AnimatePresence>
                      
                      <button
                        onClick={handleMicToggle}
                        className={`relative w-32 h-32 rounded-[3.5rem] flex items-center justify-center transition-all shadow-2xl hover:scale-105 active:scale-95 z-10 ${
                          isRecording ? 'bg-red-500 shadow-red-200' : 'bg-slate-900 shadow-slate-200'
                        }`}
                      >
                        {isRecording ? <MicOff size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
                      </button>
                    </div>

                    <div className={`w-full p-8 glass rounded-[2.5rem] shadow-xl min-h-[180px] transition-all flex flex-col items-center justify-center text-center group ${
                      isRecording ? 'border-red-200/50 bg-red-50/10' : 'border-slate-100 hover:border-blue-100'
                    }`}>
                      {selectedLang.code === 'ps-AF' && (
                        <div className="mb-2 flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[8px] font-bold uppercase tracking-[0.2em] animate-pulse">
                          <Zap size={10} />
                          AI-Powered Transcription
                        </div>
                      )}
                      {transcript ? (
                        <p className={`text-2xl font-bold text-slate-800 leading-tight ${isUrduOrPashto ? 'urdu' : 'font-display'}`}>
                          {transcript}
                        </p>
                      ) : (
                        <div className="space-y-4">
                           <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                            {isRecording ? "Listening to your situation" : "Press and hold to speak"}
                          </p>
                          {!isRecording && (
                            <div className="flex gap-2 justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-200"></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-200"></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-200"></div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={selectedLang.code === 'ur-PK' ? 'اپنی صورتحال بیان کریں...' : "Describe your situation in detail..."}
                      className={`w-full p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 focus:border-blue-400 focus:bg-white transition-all outline-none min-h-[220px] text-xl font-bold placeholder:text-slate-300 ${isUrduOrPashto ? 'urdu text-right' : 'font-display'}`}
                    />
                    <button
                      disabled={inputText.length < 3}
                      onClick={() => handleSubmit(inputText)}
                      className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center space-x-3 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <Send size={24} />
                      <span>Submit Report</span>
                    </button>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center px-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reporter Contact (Optional)</p>
                    <button 
                      onClick={() => setIsLocationEnabled(prev => !prev)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
                        isLocationEnabled ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <MapPin size={10} />
                      {isLocationEnabled ? "GPS Active" : "GPS Hidden"}
                    </button>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 03XX XXXXXXX"
                    className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 focus:border-blue-400 focus:bg-white transition-all outline-none font-bold placeholder:text-slate-300 text-slate-700"
                  />
                </div>
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-center text-xs font-bold bg-red-50 border border-red-100 p-5 rounded-3xl"
              >
                {error}
              </motion.div>
            )}
          </main>
          
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              Powered by MediLink Neural Network
            </p>
          </div>
        </div>
      </div>

      {/* Global Status Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center border-t border-slate-200 mt-auto">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Village Net Connected</span>
          </div>
          <div className="flex items-center space-x-2">
            <Globe size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Khyber Pakhtunkhwa Grid</span>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-2 px-4 py-2 bg-blue-50/50 rounded-full text-blue-600 border border-blue-100">
          <HelpCircle size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Emergency Guide</span>
        </div>
      </footer>
    </div>
  );
}
