import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, MessageSquare, Sparkles, X, ChevronRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface VirtualProfessorProps {
  summary: string;
}

export default function VirtualProfessor({ summary }: VirtualProfessorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const startLecture = () => {
    window.speechSynthesis.cancel();
    const text = summary || "Welcome to your study session. I've analyzed your materials and prepared a comprehensive learning path. Let's dive into the core concepts together.";
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.0;
    utterance.rate = 0.95;
    
    // Find a nice professional voice
    const voices = window.speechSynthesis.getVoices();
    const professorVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Male")) || voices[0];
    if (professorVoice) utterance.voice = professorVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setProgress(100);
    };
    
    utterance.onboundary = (event) => {
        const charIndex = event.charIndex;
        const progressPercent = (charIndex / text.length) * 100;
        setProgress(progressPercent);
        setCurrentText(text.substring(0, charIndex + 10).split(' ').slice(-8).join(' ') + "...");
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsOpen(true);
  };

  const stopLecture = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {!isOpen ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Button
              onClick={startLecture}
              className="h-16 w-16 rounded-full gradient-primary-bg shadow-2xl shadow-primary/40 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors" />
              <Brain className="h-8 w-8 text-white relative z-10 animate-pulse" />
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="w-80 glass-card p-6 border-2 border-primary/30 shadow-2xl relative overflow-hidden bg-slate-900/90"
          >
            {/* Background Animation */}
            <div className="absolute top-0 left-0 w-full h-1 bg-muted">
               <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <div className={`absolute -inset-2 rounded-full bg-primary/20 blur-md ${isSpeaking ? 'animate-pulse' : ''}`} />
                    <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-primary/50 relative z-10 shadow-lg bg-slate-800">
                        <img 
                            src="/professor_avatar.png" 
                            alt="Professor" 
                            className={`w-full h-full object-cover transition-transform duration-500 ${isSpeaking ? 'scale-110' : 'scale-100'}`} 
                        />
                    </div>
                 </div>
                 <div>
                    <h4 className="font-black text-white tracking-tight">Prof. AI-ra</h4>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">Virtual Mentor</p>
                 </div>
              </div>
              <button onClick={stopLecture} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
               <div className="bg-black/40 rounded-2xl p-4 min-h-[80px] flex items-center border border-white/5 relative">
                  <MessageSquare className="absolute -top-2 -left-2 h-5 w-5 text-primary opacity-30" />
                  <p className="text-sm text-slate-200 leading-relaxed italic font-medium">
                    "{isSpeaking ? currentText : "Ready to begin your session summary?"}"
                  </p>
               </div>

               <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 flex items-center gap-1">
                     {Array.from({ length: 12 }).map((_, i) => (
                        <motion.div
                           key={i}
                           animate={isSpeaking ? { height: [4, Math.random() * 20 + 5, 4] } : { height: 4 }}
                           transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                           className="w-1 bg-primary/50 rounded-full"
                        />
                     ))}
                  </div>
                  <Button 
                    onClick={() => {
                        if (isSpeaking) {
                            window.speechSynthesis.pause();
                            setIsSpeaking(false);
                        } else {
                            window.speechSynthesis.resume();
                            setIsSpeaking(true);
                        }
                    }}
                    variant="gradient" 
                    size="sm" 
                    className="rounded-xl font-bold h-10 px-6"
                  >
                    {isSpeaking ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                    {isSpeaking ? "Mute" : "Resume"}
                  </Button>
               </div>
               
               <p className="text-[9px] text-center text-slate-500 uppercase font-black tracking-widest pt-2">
                 Synchronized AI Video Lecture
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
