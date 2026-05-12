import { useState, useRef } from "react";
import { Camera, Upload, Loader2, CheckCircle2, ChevronRight, HelpCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { API } from "@/api";

export default function ScanAndSolve() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [solving, setSolving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const startSolving = async () => {
    if (!file) return;
    setLoading(true);
    setSolving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("message", "Analyze this image (math problem or code). Do NOT give the final answer. Instead, greet the user, identify the problem, and ask them what they think the first step should be. Be a supportive tutor.");
      
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setHistory([{ role: 'ai', content: data.response }]);
    } catch (e) {
      toast.error("Analysis failed");
      setSolving(false);
    } finally {
      setLoading(false);
    }
  };

  const submitGuess = async (guess: string) => {
    if (!guess.trim()) return;
    setLoading(true);
    const newHistory = [...history, { role: 'user', content: guess }];
    setHistory(newHistory);
    
    try {
      const formData = new FormData();
      if (file) formData.append("file", file); // Send file again for context if needed
      formData.append("message", `The user said: "${guess}". Evaluate their guess. If correct, provide the next logical step and ask a question to lead them to the next part. If incorrect, give a subtle hint without revealing the answer. Keep the interactive 'Scan & Solve' mode going.`);
      formData.append("context", history.map(h => `${h.role}: ${h.content}`).join("\n"));

      const res = await fetch(`${API}/chat`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setHistory([...newHistory, { role: 'ai', content: data.response }]);
    } catch (e) {
      toast.error("Tutor error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {!solving ? (
        <div className="glass-card p-12 text-center space-y-6 border-dashed border-2 border-primary/20">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary animate-pulse">
            <Camera className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Scan & Solve</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Upload a photo of a math problem, handwritten notes, or a buggy code snippet. 
              Our AI Professor will guide you to the solution step-by-step.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {preview ? (
              <div className="relative group">
                <img src={preview} alt="Preview" className="h-48 rounded-2xl border-4 border-white shadow-xl object-contain bg-slate-50" />
                <button 
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronRight className="h-4 w-4 rotate-45" />
                </button>
              </div>
            ) : (
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline" 
                size="xl" 
                className="rounded-2xl gap-3 border-primary/20 text-primary hover:bg-primary/5 px-10"
              >
                <Upload className="h-5 w-5" /> Select Image
              </Button>
            )}
            
            {file && (
              <Button 
                onClick={startSolving} 
                disabled={loading}
                className="gradient-primary-bg rounded-2xl px-12 h-14 font-black shadow-xl shadow-primary/20"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                Analyze Problem
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Image Sidebar */}
          <div className="md:col-span-1 space-y-4">
             <div className="glass-card p-4 sticky top-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Target Problem</p>
                <div className="rounded-xl overflow-hidden border border-border bg-slate-50">
                    <img src={preview!} alt="problem" className="w-full h-auto" />
                </div>
                <Button 
                    onClick={() => setSolving(false)}
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-4 text-xs text-muted-foreground hover:text-destructive"
                >
                    Cancel / New Problem
                </Button>
             </div>
          </div>

          {/* Interaction Area */}
          <div className="md:col-span-2 space-y-6">
             <div className="glass-card p-0 overflow-hidden shadow-2xl border-primary/20 flex flex-col h-[600px]">
                <div className="p-4 border-b border-border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Live Tutor Session</span>
                    </div>
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {history.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-3xl ${
                                msg.role === 'user' 
                                ? 'bg-primary text-white rounded-tr-sm' 
                                : 'bg-muted/50 border border-border rounded-tl-sm'
                            }`}>
                                <div className="prose prose-sm prose-invert max-w-none text-inherit">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-muted/50 p-4 rounded-3xl animate-pulse">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-card">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            const input = (e.target as any).guess;
                            submitGuess(input.value);
                            input.value = "";
                        }}
                        className="relative"
                    >
                        <input 
                            name="guess"
                            placeholder="Type your answer or step here..."
                            className="w-full bg-background border-2 border-border rounded-2xl pl-6 pr-32 py-4 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                            disabled={loading}
                        />
                        <Button 
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-2 bottom-2 rounded-xl gradient-primary-bg px-6"
                        >
                            Submit
                        </Button>
                    </form>
                    <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase font-bold tracking-widest">
                        Remember: I'm here to guide you, not just give the answer!
                    </p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
