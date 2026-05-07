import { useState, useRef } from "react";
import { Play, Pause, Radio, Loader2, Volume2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API } from "@/api";

interface PodcastLine {
  speaker: string;
  text: string;
}

interface AIPodcastProps {
  content: string;
}

export default function AIPodcast({ content }: AIPodcastProps) {
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<PodcastLine[] | null>(null);
  const [title, setTitle] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const isPlayingRef = useRef(false);
  const alexVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const samVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const generatePodcast = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/voice/podcast/script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to generate podcast");
      const data = await res.json();
      setScript(data.script);
      setTitle(data.title);
      setShowPlayer(true);
      toast.success("AI Podcast generated! 🎙️");
    } catch (e) {
      console.error(e);
      toast.error("Podcast generation failed");
    } finally {
      setLoading(false);
    }
  };

  const playPodcast = async () => {
    if (!script) return;
    setIsPlaying(true);
    isPlayingRef.current = true;
    
    for (let i = currentIndex; i < script.length; i++) {
        if (!isPlayingRef.current) break;
        
        setCurrentIndex(i);
        const line = script[i];
        
        // Filter out production cues like [Intro music] or (Alex laughs)
        let cleanText = line.text.replace(/\[.*?\]|\(.*?\)/g, "").trim();
        
        // Remove common non-spoken phrases
        const noise = ["Intro music fades out", "Intro music", "alex:", "sam:", "fades out", "upbeat music", "Alex laughs", "Sam laughs"];
        noise.forEach(n => {
            const re = new RegExp(n, "gi");
            cleanText = cleanText.replace(re, "");
        });
        
        cleanText = cleanText.replace(/^\.\.\.|\.\.\.$/g, "").trim(); // Remove leading/trailing dots

        if (cleanText) {
          const voice = line.speaker === "Alex" ? alexVoiceRef.current : samVoiceRef.current;
          await speak(cleanText, line.speaker === "Alex" ? 1.1 : 0.9, voice); 
        }
        
        // Small delay between speakers
        await new Promise(r => setTimeout(r, 500));
    }
    
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const speak = (text: string, pitch: number, voice: SpeechSynthesisVoice | null) => {
    return new Promise((resolve) => {
        const ut = new SpeechSynthesisUtterance(text);
        if (voice) ut.voice = voice;
        ut.pitch = pitch;
        ut.rate = 1.05; // Slightly faster for natural dialogue
        ut.onend = resolve;
        window.speechSynthesis.speak(ut);
    });
  };

  // Initialize voices
  useState(() => {
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Try to find distinct voices (usually index 0 is default, but we can look for specific names or just pick different ones)
            alexVoiceRef.current = voices.find(v => v.name.includes("Google US English") || v.name.includes("Male")) || voices[0];
            samVoiceRef.current = voices.find(v => v.name.includes("Google UK English Female") || v.name.includes("Female") || v.name.includes("Zira")) || voices[1] || voices[0];
        }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  });

  return (
    <div className="mb-8">
      {!showPlayer ? (
        <Button 
          variant="outline" 
          onClick={generatePodcast} 
          disabled={loading}
          className="w-full h-16 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all group"
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary-bg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Radio className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-black text-foreground">AI Podcast Studio</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Turn notes into a 2-min dialogue</p>
              </div>
              <Sparkles className="h-4 w-4 text-yellow-400 ml-auto animate-pulse" />
            </div>
          )}
        </Button>
      ) : (
        <div className="glass-card p-6 border-2 border-primary/50 relative animate-slide-up overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <button onClick={() => { setShowPlayer(false); window.speechSynthesis.cancel(); setIsPlaying(false); }} className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="h-20 w-20 rounded-3xl gradient-primary-bg flex items-center justify-center shadow-2xl shadow-primary/30 animate-pulse-slow">
                <Volume2 className="h-10 w-10 text-white" />
             </div>
             <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-black uppercase tracking-tighter">AI Podcast</span>
                    <h4 className="font-black text-xl text-foreground truncate">{title}</h4>
                </div>
                
                <div className="flex items-center gap-4">
                    <Button 
                        size="icon" 
                        variant="gradient"
                        className="h-12 w-12 rounded-full shadow-lg"
                        onClick={() => {
                            if (isPlaying) {
                                window.speechSynthesis.cancel();
                                setIsPlaying(false);
                                isPlayingRef.current = false;
                            } else {
                                playPodcast();
                            }
                        }}
                    >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                    </Button>
                    
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                            <span>{script?.[currentIndex]?.speaker || "Alex"} Speaking...</span>
                            <span>{currentIndex + 1} / {script?.length}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-500" 
                                style={{ width: `${((currentIndex + 1) / (script?.length || 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
             </div>
          </div>
          
          {script && (
            <div className="mt-6 p-4 bg-muted/30 rounded-2xl border border-border/50 max-h-32 overflow-y-auto">
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                    <span className="font-black text-primary uppercase mr-2">{script[currentIndex].speaker}:</span>
                    "{script[currentIndex].text}"
                </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
