import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, HelpCircle, Activity, Globe, Shield, MapPin, Zap, HeartPulse, History, FileText, LayoutDashboard, Bell, User, Camera, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function VoiceInputScreen() {
  const navigate = useNavigate();
  const {
    isRecording,
    transcript,
    audioBlob,
    isSupported,
    startBrowserRecognition,
    stopBrowserRecognition,
    startAudioRecording,
    stopAudioRecording,
    resetTranscript,
  } = useSpeechRecognition();

  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'voice' | 'text'>(isSupported ? 'voice' : 'text');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions for a thumbnail/smaller preview that fits in Firestore (1MB limit)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.6 quality to ensure it's well under 1MB
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setSelectedImage(dataUrl);
          setIsImageUploading(false);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

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

  const handleSubmit = async (text: string) => {
    if ((!text || text.length < 3) && !selectedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      let nearestClinic = MOCK_CLINICS[0].name;
      if (location) {
        let minDistance = Infinity;
        for (const clinic of MOCK_CLINICS) {
          const d = getDistance(location.lat, location.lng, clinic.latitude, clinic.longitude);
          if (d < minDistance) {
            minDistance = d;
            nearestClinic = clinic.name;
          }
        }
      } else {
        nearestClinic = MOCK_CLINICS.map(c => c.name).join(" or ");
      }

      const systemPrompt = "You are a disaster response triage assistant. Analyze the user's situation (text and optional image) and categorize it. If an image is provided, identify injuries/risks visible and provide specific first-aid instructions like 'apply pressure', 'bandage the wound', or 'keep elevated'. Respond ONLY with valid JSON.";
      
      const userPromptText = `Issue/Symptoms: ${text || "See attached image"}
Language of response: ${selectedLang.label}
Nearest healthcare facility: ${nearestClinic}

Respond ONLY with a valid JSON object in this exact format:
{
  "urgencyLevel": "Low" | "Medium" | "High",
  "issueType": "Medical" | "Rescue" | "Shelter" | "Food" | "Other",
  "explanation": "One sentence in the user's language explaining the urgency level",
  "firstSteps": [
    "Step 1 in the user's language (Must include image-based first-aid if image is provided)",
    "Step 2 in the user's language",
    "Go to ${nearestClinic} or nearest Sehat Card clinic"
  ],
  "translatedSummary": "Brief English summary of symptoms and visual findings for dashboard",
  "language": "detected language code"
}`;

      let contents: any;
      if (selectedImage) {
        const base64Data = selectedImage.split(',')[1];
        const mimeType = selectedImage.split(';')[0].split(':')[1];
        contents = {
          parts: [
            { text: userPromptText },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        };
      } else {
        contents = userPromptText;
      }

      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const responseText = geminiResponse.text;
      if (!responseText) throw new Error("Empty response from AI");
      
      const triageData = JSON.parse(responseText.trim());
      setResult(triageData);

      const reportResponse = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: text || "Image submission",
          translatedSummary: triageData.translatedSummary,
          urgencyLevel: triageData.urgencyLevel,
          issueType: triageData.issueType || "Medical",
          firstSteps: triageData.firstSteps,
          language: triageData.language || selectedLang.label,
          latitude: location?.lat,
          longitude: location?.lng,
          phoneNumber: phoneNumber || null,
          imageUrl: selectedImage,
        }),
      });

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json();
        throw new Error(errorData.error || "Failed to submit report to dashboard");
      }

    } catch (err: any) {
      console.error("Triage error:", err);
      if (err.message?.includes("API_KEY_INVALID") || err.message?.includes("not configured")) {
        setError("Gemini API key is not configured or invalid. Please check your AI Studio secrets.");
      } else {
        setError(err.message || 'Error communicating with AI. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (isRecording) {
      if (selectedLang.code === 'ps-AF') {
        stopAudioRecording();
      } else {
        stopBrowserRecognition();
        if (transcript.length >= 3) {
          handleSubmit(transcript);
        }
      }
    } else {
      if (selectedLang.code === 'ps-AF') {
        startAudioRecording();
      } else {
        startBrowserRecognition(selectedLang.code);
      }
    }
  };

  const handleTranscribeAudio = async (blob: Blob) => {
    setIsLoading(true);
    setError(null);
    try {
      const reader = new ArrayBufferReader(blob);
      const base64 = await reader.toBase64();

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            text: "Please transcribe this Pashto speech accurately into Pashto text. If there is no speech, return an empty string."
          },
          {
            inlineData: {
              data: base64,
              mimeType: "audio/webm"
            }
          }
        ],
      });

      const transcription = response.text;
      if (transcription && transcription.trim().length > 2) {
        handleSubmit(transcription);
      } else {
        setError("Could not detect clear speech. Please try again.");
      }
    } catch (err: any) {
      console.error("Transcription error:", err);
      setError("Failed to transcribe audio. Please try text input.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioBlob && selectedLang.code === 'ps-AF') {
      handleTranscribeAudio(audioBlob);
    }
  }, [audioBlob]);

  // Helper inside component or outside
  class ArrayBufferReader {
    constructor(private blob: Blob) {}
    async toBase64(): Promise<string> {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(this.blob);
      });
    }
  }

  const handleReset = () => {
    setResult(null);
    setError(null);
    resetTranscript();
    setInputText('');
    setPhoneNumber('');
    setSelectedImage(null);
  };

  if (result) {
    return (
      <div className="min-h-screen bg-[#EFF6FF] flex items-center justify-center p-4">
        <ResultCard
          urgencyLevel={result.urgencyLevel}
          explanation={result.explanation}
          firstSteps={result.firstSteps}
          translatedSummary={result.translatedSummary}
          imageUrl={selectedImage}
          onReset={handleReset}
        />
      </div>
    );
  }

  const isUrduOrPashto = selectedLang.code === 'ur-PK' || selectedLang.code === 'ps-AF';

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans overflow-y-auto">
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
            <Navlink icon={History} label="Alert History" />
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

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden py-12">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 z-10">
        
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
                    {/* Image Preview Overlay */}
                    {selectedImage && (
                      <div className="relative w-full max-w-[200px] aspect-square rounded-3xl overflow-hidden border-2 border-blue-200 shadow-xl z-20">
                        <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

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

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm cursor-pointer hover:bg-slate-50 transition-all">
                        <Camera size={18} />
                        <span>Capture Injury</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <label className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm cursor-pointer hover:bg-slate-50 transition-all">
                        <ImageIcon size={18} />
                        <span>Upload Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
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
                    {/* Image Preview Overlay */}
                    {selectedImage && (
                      <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-2 border-blue-200 shadow-xl">
                        <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={removeImage}
                          className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    )}
                    
                    <div className="relative">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={selectedLang.code === 'ur-PK' ? 'اپنی صورتحال بیان کریں...' : "Describe your situation in detail..."}
                        className={`w-full p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 focus:border-blue-400 focus:bg-white transition-all outline-none min-h-[220px] text-xl font-bold placeholder:text-slate-300 ${isUrduOrPashto ? 'urdu text-right' : 'font-display'}`}
                      />
                      <div className="absolute bottom-6 right-6 flex gap-3">
                         <label className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl cursor-pointer hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                          <Camera size={20} />
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                        </label>
                        <label className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl cursor-pointer hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                          <ImageIcon size={20} />
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </div>
                    
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
