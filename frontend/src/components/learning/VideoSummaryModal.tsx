import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { summarizeVideo } from "@/api";
import { Loader2, Sparkles, CheckCircle2, Video, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

interface VideoSummaryModalProps {
  videoId: string;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

type LoadingState = "idle" | "extracting" | "summarizing" | "error" | "success";

export default function VideoSummaryModal({ videoId, videoTitle, isOpen, onClose }: VideoSummaryModalProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [summary, setSummary] = useState<string | null>(null);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && videoId) {
      handleSummarize();
    }
    if (!isOpen) {
        // Reset state when closing
        setLoadingState("idle");
        setError(null);
    }
  }, [isOpen, videoId]);

  const handleSummarize = async () => {
    setLoadingState("extracting");
    setError(null);
    try {
      // Small delay to show the "extracting" state clearly
      await new Promise(r => setTimeout(r, 1500));
      setLoadingState("summarizing");
      
      const data = await summarizeVideo({ video_id: videoId });
      setSummary(data.summary);
      setKeyPoints(data.key_points);
      setLoadingState("success");
    } catch (err: any) {
      console.error("Summary error:", err);
      setError(err.message || "An unexpected error occurred while processing the video.");
      setLoadingState("error");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-2xl border-primary/20 shadow-2xl rounded-[2rem] overflow-hidden p-0">
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-8 border-b border-border/50">
          <DialogHeader>
            <div className="flex items-center gap-3 text-primary mb-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <Video className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">AI Video Intelligence</span>
            </div>
            <DialogTitle className="text-2xl font-black leading-tight tracking-tight">{videoTitle}</DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {(loadingState === "extracting" || loadingState === "summarizing") && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-20 space-y-6"
              >
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-bold text-foreground">
                    {loadingState === "extracting" ? "Extracting Knowledge..." : "Synthesizing Summary..."}
                  </p>
                  <p className="text-sm text-muted-foreground animate-pulse max-w-xs mx-auto">
                    {loadingState === "extracting" 
                      ? "Bypassing restrictions and fetching transcript from secure sources..." 
                      : "Llama 3.1 is analyzing the transcript to extract core educational value..."}
                  </p>
                </div>
              </motion.div>
            )}

            {loadingState === "error" && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 p-6 rounded-2xl">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="font-black uppercase tracking-widest text-xs mb-2">Extraction Failed</AlertTitle>
                  <AlertDescription className="text-sm font-medium leading-relaxed">
                    {error}
                  </AlertDescription>
                </Alert>
                
                <div className="bg-muted/30 p-6 rounded-2xl space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Troubleshooting</p>
                    <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                        <li>The video might have disabling of captions.</li>
                        <li>Bot protection might be temporarily blocking automated access.</li>
                        <li>The video could be too long for the current processing limit.</li>
                    </ul>
                </div>

                <Button 
                    className="w-full h-14 rounded-2xl gradient-primary-bg font-black gap-2 shadow-xl shadow-primary/20"
                    onClick={handleSummarize}
                >
                  <RefreshCw className="h-5 w-5" /> Try Alternative Method
                </Button>
              </motion.div>
            )}

            {loadingState === "success" && (
              <motion.div 
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <h4 className="text-lg font-black tracking-tight text-foreground">Executive Summary</h4>
                  </div>
                  <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
                    <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">{summary}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <h4 className="text-lg font-black tracking-tight text-foreground">Key Takeaways</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {keyPoints.map((point, i) => (
                      <div key={i} className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 group hover:border-primary/30 transition-all shadow-sm">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm text-foreground/90 font-medium leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-muted/30 border-t border-border/50 flex justify-end">
            <Button variant="outline" className="rounded-xl px-8 font-bold" onClick={onClose}>
                Close Explorer
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
