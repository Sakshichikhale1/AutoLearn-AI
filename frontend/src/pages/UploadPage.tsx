import { useState, useCallback } from "react";
import { 
  Upload, FileText, Image as ImageIcon, Headphones, Type, X, 
  CheckCircle, Loader2, BookOpen, Sparkles, Mic, Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateLearning } from "@/api";
import { useStudy } from "@/context/StudyContext";
import { useNavigate } from "react-router-dom";

const fileTypes = [
  { icon: FileText, label: "PDF", ext: ".pdf", color: "text-red-500" },
  { icon: ImageIcon, label: "Image", ext: ".png,.jpg", color: "text-emerald-500" },
  { icon: Headphones, label: "Audio", ext: ".mp3,.wav", color: "text-primary" },
  { icon: Type, label: "Text", ext: ".txt,.md", color: "text-secondary" },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const { addSession } = useStudy();
  
  const [dragActive, setDragActive] = useState(false);
  const [text, setText] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lastGeneratedSession, setLastGeneratedSession] = useState<any>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".pdf,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.ogg,.txt,.md";
    input.onchange = (e) => {
      const selectedFiles = Array.from((e.target as HTMLInputElement).files || []);
      if (selectedFiles.length > 0) {
        setFiles(prev => [...prev, ...selectedFiles]);
      }
    };
    input.click();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `VoiceNote_${new Date().getTime()}.webm`, { type: "audio/webm" });
        setFiles(prev => [...prev, file]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      (recorder as any)._interval = interval;

    } catch (err) {
      console.error("Mic error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      clearInterval((mediaRecorder as any)._interval);
      setIsRecording(false);
      setRecordingDuration(0);
      setMediaRecorder(null);
    }
  };

  const handleGenerate = async () => {
    if (files.length === 0 && !text.trim()) return;

    setLoading(true);

    try {
      const formData = new FormData();
      if (text) formData.append("text", text);
      files.forEach(f => formData.append("files", f));

      const response = await generateLearning(formData);
      
      const sessionTitle = files.length > 0 
        ? (files.length === 1 ? files[0].name : `${files.length} Files Multi-Session`) 
        : (text.slice(0, 30) + "...");
      
      const newSession = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: sessionTitle,
        type: files.length > 0 ? "Multimodal Input" : "Text Input",
        data: response
      };

      setLastGeneratedSession(newSession);
      addSession(newSession);
      setShowSaveModal(true);

    } catch (error) {
      console.error(error);
      alert("An error occurred while generating content. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const { saveSessionToDb } = useStudy();

  const handleFinalChoice = async (shouldSave: boolean) => {
    if (shouldSave && lastGeneratedSession) {
      await saveSessionToDb(lastGeneratedSession);
    }
    setShowSaveModal(false);
    navigate("/learning");
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-32">
      <div className="animate-slide-up">
        <h1 className="font-heading text-4xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
          Learning Studio
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Supercharge your studies with multimodal AI intelligence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input */}
        <div className="space-y-8">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleFileSelect}
            className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-500 animate-slide-up ${
              dragActive
                ? "border-primary bg-primary/10 scale-[1.02] shadow-2xl shadow-primary/20"
                : "border-border hover:border-primary/50 hover:bg-accent/30"
            }`}
          >
            <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
            <p className="font-heading font-semibold text-foreground text-lg">
              {dragActive ? "Drop it here!" : "Upload Study Material"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">PDFs, Images, or Audio</p>
          </div>

          {/* Files Preview */}
          <div className="space-y-3">
            {files.map((f, idx) => (
              <div key={idx} className="glass-card flex items-center gap-3 px-4 py-3 animate-fade-in border-l-4 border-l-primary">
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB • Ready</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }} 
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Text Input */}
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-semibold text-foreground">Or paste text</h3>
              </div>
              
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                className={`rounded-full px-4 ${isRecording ? "animate-pulse" : ""}`}
              >
                {isRecording ? (
                  <>
                    <Square className="h-3 w-3 mr-2 fill-current" />
                    Stop ({recordingDuration}s)
                  </>
                ) : (
                  <>
                    <Mic className="h-3 w-3 mr-2" />
                    Record Note
                  </>
                )}
              </Button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              placeholder="Enter concepts, notes, or topics..."
              className="w-full h-40 rounded-2xl border border-border bg-card/50 p-4 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none transition-all"
            />
          </div>

          {/* CTA */}
          <div className="flex justify-end pt-4">
            <Button 
              variant="gradient" 
              size="lg" 
              className="px-8 py-6 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
              onClick={handleGenerate}
              disabled={loading || (files.length === 0 && !text.trim())}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Generating Magic...
                </>
              ) : (
                "Generate Studio ✨"
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Mini Info / Helpers */}
        <div className="hidden lg:block space-y-6">
          <div className="glass-card p-6 border-l-4 border-l-purple-500">
            <BookOpen className="h-6 w-6 text-purple-500 mb-3" />
            <h4 className="font-bold text-lg mb-2 text-foreground">What happens now?</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our AI analyzes your material and cross-references it with live data from Wikipedia, 
              YouTube, and Pexels to build a custom multimodal learning suite.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {fileTypes.map(ft => (
              <div key={ft.label} className="glass-card p-4 flex flex-col items-center text-center gap-2">
                <ft.icon className={`h-6 w-6 ${ft.color}`} />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{ft.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl animate-fade-in">
           <div className="glass-card max-w-md w-full p-8 space-y-8 shadow-2xl border-2 border-primary/20 scale-100 animate-slide-up">
              <div className="text-center space-y-4">
                 <div className="h-20 w-20 rounded-3xl gradient-primary-bg flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
                    <Sparkles className="h-10 w-10 text-white" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-foreground tracking-tight">Success! Material Ready.</h3>
                    <p className="text-muted-foreground text-sm">Would you like to save this study suite permanently to your Cloud Studio?</p>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <Button 
                    onClick={() => handleFinalChoice(true)}
                    className="h-14 rounded-2xl gradient-primary-bg font-black text-lg shadow-lg shadow-primary/20"
                 >
                    Yes, Save to Studio ✨
                 </Button>
                 <Button 
                    variant="outline"
                    onClick={() => handleFinalChoice(false)}
                    className="h-14 rounded-2xl font-bold border-border/50 hover:bg-accent"
                 >
                    Review Only (Temporary)
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
