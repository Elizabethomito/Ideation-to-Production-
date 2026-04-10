import { useState, useCallback } from "react";
import { Shield, AlertTriangle, CheckCircle2, Info, ArrowRight, History, Trash2, ShieldAlert, ShieldCheck, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { analyzeMessage, type AnalysisResult } from "@/src/lib/gemini";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  message: string;
  result: AnalysisResult;
  timestamp: number;
}

export default function App() {
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeMessage(input);
      setResult(analysis);
      
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        message: input,
        result: analysis,
        timestamp: Date.now(),
      };
      setHistory(prev => [newHistoryItem, ...prev]);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze message. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [input]);

  const clearHistory = () => setHistory([]);
  const deleteHistoryItem = (id: string) => setHistory(prev => prev.filter(item => item.id !== id));

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Low": return "text-green-600 bg-green-50 border-green-200";
      case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "High": return "text-orange-600 bg-orange-50 border-orange-200";
      case "Critical": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getProgressColor = (score: number) => {
    if (score < 30) return "bg-green-500";
    if (score < 60) return "bg-yellow-500";
    if (score < 85) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans selection:bg-blue-100">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">FinGuard AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:flex gap-1.5 py-1 px-3 border-slate-200 font-medium text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                AI Analysis Active
              </Badge>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Input & Analysis */}
            <div className="lg:col-span-7 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-2 text-slate-800">Analyze Message</h2>
                <p className="text-slate-500 mb-6">Paste any suspicious message, email snippet, or financial request to check for fraud indicators.</p>
                
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <Textarea 
                      placeholder="e.g., 'URGENT: Your bank account has been suspended. Click here to verify your identity...'"
                      className="min-h-[200px] border-0 focus-visible:ring-0 resize-none p-6 text-lg placeholder:text-slate-400"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                  </CardContent>
                  <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center">
                    <div className="text-xs text-slate-400 font-medium">
                      {input.length} characters
                    </div>
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing || !input.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 transition-all duration-200"
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Scan for Risks
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </section>

              {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Card className="border-slate-200 shadow-md overflow-hidden">
                      <CardHeader className={cn("border-b", result.isScam ? "bg-red-50/50" : "bg-green-50/50")}>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                              {result.isScam ? (
                                <ShieldAlert className="w-6 h-6 text-red-600" />
                              ) : (
                                <ShieldCheck className="w-6 h-6 text-green-600" />
                              )}
                              Analysis Result
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {result.isScam ? "Potential scam detected. Exercise extreme caution." : "No significant scam indicators found."}
                            </CardDescription>
                          </div>
                          <Badge className={cn("px-3 py-1 text-sm font-bold", getRiskColor(result.riskLevel))}>
                            {result.riskLevel} Risk
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Risk Score */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-600">Risk Score</span>
                            <span className="text-slate-900">{result.riskScore}/100</span>
                          </div>
                          <Progress value={result.riskScore} className="h-2 bg-slate-100" indicatorClassName={getProgressColor(result.riskScore)} />
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-500" />
                            AI Summary
                          </h4>
                          <p className="text-slate-700 text-sm leading-relaxed">{result.summary}</p>
                        </div>

                        {/* Red Flags */}
                        {result.redFlags.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              Red Flags Identified
                            </h4>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {result.redFlags.map((flag, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                  {flag}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Separator className="bg-slate-100" />

                        {/* Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              How to Verify
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed">{result.authenticationCheck}</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <ArrowRight className="w-4 h-4 text-blue-500" />
                              Suggested Action
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed font-medium">{result.suggestedAction}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column: History & Tips */}
            <div className="lg:col-span-5 space-y-6">
              {/* History Section */}
              <Card className="border-slate-200 shadow-sm h-fit">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    <CardTitle className="text-lg">Recent Scans</CardTitle>
                  </div>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearHistory} className="text-slate-400 hover:text-red-500 h-8 px-2">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="bg-slate-50 p-3 rounded-full mb-3">
                          <Shield className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-400">No scan history yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {history.map((item) => (
                          <div 
                            key={item.id} 
                            className="group relative p-3 rounded-xl border border-slate-100 bg-white hover:border-blue-200 transition-all cursor-pointer"
                            onClick={() => {
                              setInput(item.message);
                              setResult(item.result);
                            }}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <Badge className={cn("text-[10px] px-1.5 py-0", getRiskColor(item.result.riskLevel))}>
                                {item.result.riskLevel}
                              </Badge>
                              <span className="text-[10px] text-slate-400">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 pr-6">{item.message}</p>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 text-slate-300 hover:text-red-500 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHistoryItem(item.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Educational Tips */}
              <Card className="border-slate-200 shadow-sm bg-blue-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Shield className="w-24 h-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Stay Safe Online
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="bg-white/20 p-1 rounded h-fit mt-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-blue-50 leading-tight">Never click links in unexpected text messages or emails.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-white/20 p-1 rounded h-fit mt-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-blue-50 leading-tight">Banks will never ask for your PIN or full password over the phone.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-white/20 p-1 rounded h-fit mt-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-blue-50 leading-tight">Be wary of "urgent" requests that demand immediate action.</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50 border-0" asChild>
                    <a href="https://www.scamwatch.gov.au/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      Learn More
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <footer className="mt-12 border-t py-8 bg-white">
          <div className="container mx-auto px-4 text-center max-w-6xl">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} FinGuard AI. Powered by Google Gemini. 
              <br />
              <span className="text-[10px] mt-1 block">This tool is for educational purposes. Always verify financial requests directly with the institution.</span>
            </p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
