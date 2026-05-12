import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Search, FileText, ExternalLink, User, Clock, ArrowRight, BookOpen, Quote, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API } from "@/api";

interface Paper {
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  url: string;
  pdf: string | null;
  citations: number;
  source: string;
}

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [deepDivePaper, setDeepDivePaper] = useState<Paper | null>(null);
  const [deepDiveContent, setDeepDiveContent] = useState("");
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);

  const [selectedPaperForCite, setSelectedPaperForCite] = useState<Paper | null>(null);

  const getAPA = (p: Paper) => `${p.authors[0]} et al. (${p.year}). ${p.title}. ${p.source}.`;
  const getMLA = (p: Paper) => `${p.authors[0]}, et al. "${p.title}." ${p.source}, ${p.year}.`;
  const getBibTeX = (p: Paper) => `@article{cite_${p.year},\n  title={${p.title}},\n  author={${p.authors.join(' and ')}},\n  year={${p.year}},\n  publisher={${p.source}}\n}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Citation copied to clipboard!");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API}/research/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setPapers(data.papers);
      if (data.papers.length === 0) {
        toast.info("No papers found for this topic.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect to research database.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeepDive = async (paper: Paper) => {
    setDeepDivePaper(paper);
    setDeepDiveLoading(true);
    setDeepDiveContent("");
    try {
      const formData = new FormData();
      formData.append("message", `Provide an elite academic deep-dive of this research paper based on its abstract. Break it down into: 1. Core Contribution, 2. Methodology, 3. Key Findings, and 4. Why it matters. \n\nPaper Title: ${paper.title}\nAbstract: ${paper.abstract}`);
      
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setDeepDiveContent(data.response);
    } catch (error) {
      toast.error("Deep dive failed.");
    } finally {
      setDeepDiveLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="font-heading text-4xl font-bold text-foreground">Research Hub</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Search over 200 million papers from IEEE, arXiv, Springer, and more. 
          Powered by <span className="text-primary font-bold">Semantic Scholar</span>.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative group max-w-2xl animate-slide-up">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter research topic (e.g., 'Attention is all you need', 'Quantum Computing')..." 
          className="w-full bg-card border border-border rounded-2xl pl-12 pr-32 py-4 shadow-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-lg"
        />
        <Button 
          type="submit" 
          disabled={loading}
          className="absolute right-2 top-2 bottom-2 rounded-xl gradient-primary-bg px-6 font-bold"
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {/* Results */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-8 animate-pulse space-y-4">
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="h-20 w-full bg-muted rounded" />
            </div>
          ))
        ) : papers.length > 0 ? (
          papers.map((paper, i) => (
            <div 
              key={i} 
              className="glass-card-hover p-8 animate-slide-up bg-card/40 backdrop-blur-xl border-none shadow-xl group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    {paper.pdf && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold uppercase tracking-wider border border-emerald-500/20">
                        Open Access PDF
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider border border-primary/20">
                      via {paper.source}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {paper.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {paper.year}</span>
                    <span className="flex items-center gap-1.5"><Quote className="h-4 w-4" /> {paper.citations.toLocaleString()} Citations</span>
                  </div>

                  {paper.abstract && (
                    <p className="text-muted-foreground leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                      {paper.abstract}
                    </p>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    <a 
                      href={paper.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" /> View Source
                    </a>
                    {paper.pdf && (
                      <a 
                        href={paper.pdf} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-emerald-500 hover:underline"
                      >
                        <ArrowRight className="h-4 w-4" /> Direct PDF
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:w-48 shrink-0">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 font-bold rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
                    onClick={() => setSelectedPaperForCite(paper)}
                  >
                    <Quote className="h-4 w-4" /> Cite Paper
                  </Button>
                  <Button 
                    onClick={() => handleDeepDive(paper)}
                    variant="outline" 
                    className="w-full gap-2 font-bold rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
                  >
                    <BookOpen className="h-4 w-4" /> Summarize
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : !loading && query && (
          <div className="text-center py-20 grayscale opacity-50 space-y-4">
             <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto">
               <Search className="h-10 w-10" />
             </div>
             <p className="text-xl font-medium">No results found for "{query}"</p>
          </div>
        )}
      </div>

      {/* Deep Dive Modal */}
      {deepDivePaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
           <div className="bg-white w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 flex flex-col h-[90vh]">
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-xl tracking-tight">AI Summary</h3>
                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">Synthesized by AutoLearn AI</p>
                    </div>
                 </div>
                 <button 
                    onClick={() => setDeepDivePaper(null)} 
                    className="h-10 w-10 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all"
                 >
                    <X className="h-5 w-5" />
                 </button>
              </div>
              
              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
                 <div className="max-w-2xl mx-auto space-y-8">
                    <div className="space-y-4">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                           Research Insight
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">
                           {deepDivePaper.title}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">
                           Published {deepDivePaper.year} · {deepDivePaper.authors.join(", ")}
                        </p>
                    </div>

                    <div className="h-px w-full bg-slate-100" />
                    
                    {deepDiveLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-6">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-900 font-black uppercase tracking-[0.3em] text-xs">Generating Insights</p>
                                <p className="text-slate-400 text-sm mt-1">Analyzing methodology and core contributions...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="prose prose-slate max-w-none 
                            prose-headings:text-slate-900 prose-headings:font-black prose-headings:tracking-tight
                            prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg
                            prose-strong:text-primary prose-strong:font-black
                            prose-ul:list-disc prose-li:text-slate-600
                            pb-20">
                            <ReactMarkdown>{deepDiveContent}</ReactMarkdown>
                        </div>
                    )}
                 </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Scroll to read the full breakdown
                 </p>
                 <Button 
                    onClick={() => setDeepDivePaper(null)} 
                    className="rounded-2xl px-10 h-12 font-black shadow-xl shadow-primary/20"
                 >
                    Finish Reading
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Citation Modal */}
      {selectedPaperForCite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
           <div className="glass-card max-w-lg w-full p-8 space-y-6 shadow-2xl border-2 border-primary/20 relative">
              <button onClick={() => setSelectedPaperForCite(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
              <div className="space-y-2">
                 <h2 className="text-2xl font-black tracking-tight">Generate Citation</h2>
                 <p className="text-sm text-muted-foreground truncate">{selectedPaperForCite.title}</p>
              </div>

              <div className="space-y-4">
                 {[
                   { label: "APA", val: getAPA(selectedPaperForCite) },
                   { label: "MLA", val: getMLA(selectedPaperForCite) },
                   { label: "BibTeX", val: getBibTeX(selectedPaperForCite) }
                 ].map(cite => (
                   <div key={cite.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase tracking-widest text-primary">{cite.label}</span>
                         <button onClick={() => copyToClipboard(cite.val)} className="text-[10px] font-bold text-muted-foreground hover:text-primary uppercase">Copy</button>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-xl border border-border text-xs font-mono break-words leading-relaxed">
                         {cite.val}
                      </div>
                   </div>
                 ))}
              </div>
              <Button onClick={() => setSelectedPaperForCite(null)} className="w-full h-12 rounded-xl gradient-primary-bg font-bold">Done</Button>
           </div>
        </div>
      )}
    </div>
  );
}
