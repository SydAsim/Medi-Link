import { useState, useCallback, useRef, useEffect } from 'react';

export const useSpeechRecognition = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition && !navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
    } else if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startBrowserRecognition = useCallback((languageCode: string) => {
    if (!recognitionRef.current) return;
    
    setTranscript('');
    recognitionRef.current.lang = languageCode;
    recognitionRef.current.start();
    setIsRecording(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      stopBrowserRecognition();
    }, 30000);
  }, []);

  const stopBrowserRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsRecording(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const startAudioRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript('Recording audio for AI transcription...');

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        stopAudioRecording();
      }, 30000);
    } catch (err) {
      console.error("Failed to start audio recording:", err);
      setIsSupported(false);
    }
  }, []);

  const stopAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setAudioBlob(null);
  }, []);

  return {
    isRecording,
    transcript,
    audioBlob,
    isSupported,
    startBrowserRecognition,
    stopBrowserRecognition,
    startAudioRecording,
    stopAudioRecording,
    resetTranscript,
  };
};
