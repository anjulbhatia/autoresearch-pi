"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { api, Experiment, StreamUpdate, getStoredApiUrl } from "@/lib/api";

const ACCENT = "#e5e5e5";

function TerminalFrame({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden font-mono text-sm">
      <div className="bg-zinc-900 px-3 py-1.5 border-b border-zinc-800 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        </div>
        <span className="text-zinc-500 text-xs ml-2">{title}</span>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function DataRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-zinc-800/50 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className={highlight ? "text-white font-mono" : "text-zinc-300 font-mono"}>{value}</span>
    </div>
  );
}

function LogEntry({ method, param, estimate, error }: { method: string; param: number; estimate: number; error: number }) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return (
    <div className="font-mono text-xs py-1 flex gap-3">
      <span className="text-zinc-600">[{timestamp}]</span>
      <span className="text-zinc-400">{method.padEnd(12)}</span>
      <span className="text-zinc-600">n={param.toString().padStart(5)}</span>
      <span className="text-zinc-300">π≈{estimate.toFixed(6)}</span>
      <span className="text-red-400/70">Δ{error.toExponential(2)}</span>
    </div>
  );
}

function PolygonVisual({ sides }: { sides: number }) {
  const radius = 60;
  const cx = 100;
  const cy = 100;
  const points = Array.from({ length: sides }, (_, i) => {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#27272a" strokeWidth="1" />
      <motion.path d={pathD} fill="none" stroke={ACCENT} strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={ACCENT} />)}
      <text x={cx} y={cy + radius + 18} textAnchor="middle" fill="#52525b" fontSize="10" className="font-mono">n={sides}</text>
    </svg>
  );
}

function MonteCarloVisual({ samples }: { samples: number }) {
  const displaySamples = Math.min(samples, 200);
  const points = Array.from({ length: displaySamples }, () => ({ x: Math.random(), y: Math.random() }));
  const insideCount = points.filter(p => (p.x - 0.5) ** 2 + (p.y - 0.5) ** 2 <= 0.25).length;

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
      <rect x="20" y="20" width="160" height="160" fill="#09090b" stroke="#27272a" strokeWidth="1" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#27272a" strokeWidth="1" />
      {points.map((p, i) => <circle key={i} cx={20 + p.x * 160} cy={20 + p.y * 160} r="1.2" fill={(p.x - 0.5) ** 2 + (p.y - 0.5) ** 2 <= 0.25 ? ACCENT : "#3f3f46"} opacity={0.7} />)}
      <text x="100" y="190" textAnchor="middle" fill="#52525b" fontSize="10" className="font-mono">{insideCount}/{samples}</text>
    </svg>
  );
}

function SeriesVisual({ method, iterations }: { method: string; iterations: number }) {
  const displayIter = Math.min(iterations, 12);
  const bars: number[] = [];
  
  for (let i = 0; i < displayIter; i++) {
    let value = 0;
    if (method === "leibniz") value = 4 * ((-1) ** i) / (2 * i + 1);
    else if (method === "nilakantha") value = i === 0 ? 3 : (i % 2 === 1 ? 4 / ((i) * (i + 1) * (i + 2)) : -4 / ((i) * (i + 1) * (i + 2)));
    bars.push(value);
  }

  return (
    <div className="flex flex-col items-center h-full px-2">
      <div className="flex items-end justify-center h-[80px] gap-0.5">
        {bars.map((val, i) => {
          const isPositive = val > 0;
          return (
            <motion.div key={i} className={`w-4 ${isPositive ? "bg-zinc-200" : "bg-zinc-600"}`} initial={{ height: 0 }} animate={{ height: `${Math.min(Math.abs(val) * 30, 60)}px` }} transition={{ duration: 0.15, delay: i * 0.04 }} />
          );
        })}
      </div>
      <p className="text-xs text-zinc-500 mt-3 font-mono">{method}</p>
    </div>
  );
}

function AGMVisual({ iterations }: { iterations: number }) {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
      <circle cx="100" cy="100" r="80" fill="none" stroke="#27272a" strokeWidth="1" />
      {[50, 35, 20].map((r, i) => <circle key={i} cx="100" cy="100" r={r} fill="none" stroke={ACCENT} strokeWidth={1.2} opacity={0.9 - i * 0.25} />)}
      <circle cx="100" cy="100" r="3" fill={ACCENT} />
      <text x="100" y="190" textAnchor="middle" fill="#52525b" fontSize="10" className="font-mono">agm[iter={iterations}]</text>
    </svg>
  );
}

function NoVisual() {
  return (
    <div className="flex items-center justify-center h-[180px] text-sm text-zinc-600 font-mono">
      <span className="opacity-50">// awaiting data stream...</span>
    </div>
  );
}

export default function Home() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [bestEstimate, setBestEstimate] = useState(0);
  const [bestMethod, setBestMethod] = useState("");
  const [bestError, setBestError] = useState(0);
  const [currentMethod, setCurrentMethod] = useState("");
  const [currentParameter, setCurrentParameter] = useState(0);
  
  const [numRounds, setNumRounds] = useState(50);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set(["polygon", "monte_carlo", "leibniz", "nilakantha", "brent_salamin"]));
  const [vizMethod, setVizMethod] = useState<string>("polygon");
  const [apiUrl, setApiUrl] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connected" | "error">("idle");
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setApiUrl(getStoredApiUrl());
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [experiments]);

  const toggleMethod = (method: string) => {
    const newSet = new Set(selectedMethods);
    if (newSet.has(method)) newSet.delete(method);
    else newSet.add(method);
    setSelectedMethods(newSet);
  };

  const selectAll = () => setSelectedMethods(new Set(["polygon", "monte_carlo", "leibniz", "nilakantha", "wallis", "madhava", "brent_salamin", "ramanujan", "chudnovsky", "basel", "borwein", "spigot", "bbp"]));
  const selectNone = () => setSelectedMethods(new Set());

  const testConnection = async () => {
    try {
      const baseUrl = apiUrl.trim() || 'http://localhost:8000';
      await fetch(`${baseUrl}/health`, { mode: 'cors' });
      setConnectionStatus("connected");
    } catch {
      setConnectionStatus("error");
    }
  };

  const startResearch = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setIsRunning(true);
    setExperiments([]);
    setBestEstimate(0); setBestMethod(""); setBestError(0);
    setConnectionStatus("idle");
    
    const baseUrl = apiUrl.trim() || getStoredApiUrl();
    const url = `${baseUrl}/research/stream?num_experiments=${numRounds}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => setConnectionStatus("connected");
    
    eventSource.onmessage = (event) => {
      const data: StreamUpdate = JSON.parse(event.data);
      setExperiments(prev => [...prev, { method: data.method, parameter: data.parameter, pi_estimate: data.pi_estimate, error: data.error, timestamp: data.timestamp }]);
      setBestEstimate(data.best_estimate);
      setBestMethod(data.best_method);
      setBestError(data.best_error);
      setCurrentMethod(data.method);
      setCurrentParameter(data.parameter);
      if (data.total_iterations >= numRounds) { eventSource.close(); setIsRunning(false); }
    };

    eventSource.onerror = () => { eventSource.close(); setIsRunning(false); setConnectionStatus("error"); };
  };

  const resetResearch = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setIsRunning(false);
    setExperiments([]);
    setBestEstimate(0); setBestMethod(""); setBestError(0); setCurrentMethod(""); setCurrentParameter(0);
  };

  useEffect(() => () => { if (eventSourceRef.current) eventSourceRef.current.close(); }, []);

  const chartData = experiments.filter(e => selectedMethods.has(e.method)).map((exp, i) => ({ experiment: i + 1, error: exp.error, estimate: exp.pi_estimate }));

  const leaderboard = Array.from(new Set(experiments.map(e => e.method))).map(method => {
    const methodExps = experiments.filter(e => e.method === method);
    const best = methodExps.length > 0 ? Math.min(...methodExps.map(e => e.error)) : Infinity;
    return { method, best, count: methodExps.length };
  }).sort((a, b) => a.best - b.best);

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <span className="text-zinc-200 font-mono font-bold text-lg">π</span>
              </div>
              <div>
                <h1 className="text-lg font-medium text-zinc-100 tracking-tight">AutoResearch <span className="text-zinc-500">// π Discovery</span></h1>
                <p className="text-xs text-zinc-600 font-mono">automated mathematical exploration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded border border-zinc-800 text-xs font-mono ${connectionStatus === 'connected' ? 'text-green-500' : connectionStatus === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-zinc-600'}`} />
                {connectionStatus === 'connected' ? 'connected' : connectionStatus === 'error' ? 'disconnected' : 'idle'}
              </div>
              <Button variant="outline" onClick={() => setShowSettings(true)} className="border-zinc-700 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 text-sm font-mono">
                [config]
              </Button>
              <Button variant="outline" onClick={resetResearch} disabled={isRunning} className="border-zinc-700 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 text-sm font-mono">
                ↺
              </Button>
              <Button onClick={startResearch} disabled={isRunning} className="bg-zinc-100 hover:bg-white text-black font-medium text-sm font-mono px-4">
                {isRunning ? '▶ running' : '▶ start'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <TerminalFrame title="BEST_APPROXIMATION">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-600 font-mono mb-1">π_estimate</p>
                  <p className="text-2xl font-mono text-zinc-100 tracking-wider">{bestEstimate > 0 ? bestEstimate.toFixed(8) : '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-xs text-zinc-600 font-mono">method</p>
                    <p className="text-sm font-mono text-zinc-300">{bestMethod || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600 font-mono">error</p>
                    <p className="text-sm font-mono text-zinc-300">{bestError > 0 ? bestError.toExponential(3) : '—'}</p>
                  </div>
                </div>
              </div>
            </TerminalFrame>

            <TerminalFrame title="VISUALIZATION">
              <select value={vizMethod} onChange={(e) => setVizMethod(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs font-mono text-zinc-300 mb-3">
                {["polygon", "monte_carlo", "leibniz", "nilakantha", "wallis", "madhava", "brent_salamin", "ramanujan", "chudnovsky", "basel", "borwein", "spigot", "bbp"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <AnimatePresence mode="wait">
                <motion.div key={vizMethod} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {vizMethod === "polygon" && <PolygonVisual sides={Math.min(currentParameter || 6, 12)} />}
                  {vizMethod === "monte_carlo" && <MonteCarloVisual samples={currentParameter || 100} />}
                  {(vizMethod === "leibniz" || vizMethod === "nilakantha" || vizMethod === "wallis" || vizMethod === "madhava") && <SeriesVisual method={vizMethod} iterations={currentParameter || 10} />}
                  {vizMethod === "brent_salamin" && <AGMVisual iterations={currentParameter || 5} />}
                  {!currentMethod && <NoVisual />}
                </motion.div>
              </AnimatePresence>
            </TerminalFrame>

            <TerminalFrame title="METRICS">
              <div className="grid grid-cols-2 gap-3">
                <DataRow label="rounds" value={`${experiments.length}/${numRounds}`} />
                <DataRow label="methods" value={String(new Set(experiments.map(e => e.method)).size)} />
                <DataRow label="min_error" value={experiments.length > 0 ? Math.min(...experiments.map(e => e.error)).toExponential(1) : '—'} />
                <DataRow label="avg_error" value={experiments.length > 0 ? (experiments.reduce((a, b) => a + b.error, 0) / experiments.length).toExponential(1) : '—'} />
              </div>
            </TerminalFrame>
          </div>

          <div className="col-span-12 lg:col-span-6 space-y-6">
            <TerminalFrame title="CONVERGENCE_ANALYSIS">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="eGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e5e5e5" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#e5e5e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="experiment" stroke="#404040" tick={{ fill: '#52525b', fontSize: 10 }} tickFormatter={(v) => String(v)} />
                    <YAxis stroke="#404040" tick={{ fill: '#52525b', fontSize: 10 }} tickFormatter={(v) => Number(v) < 0.1 ? Number(v).toFixed(2) : Number(v).toFixed(0)} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }} formatter={(v) => [Number(v).toExponential(2), 'error']} />
                    <Area type="monotone" dataKey="error" stroke="#e5e5e5" strokeWidth={1.5} fill="url(#eGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TerminalFrame>

            <TerminalFrame title="ESTIMATE_TIMESERIES">
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="experiment" stroke="#404040" tick={{ fill: '#52525b', fontSize: 10 }} />
                    <YAxis domain={[3.0, 3.2]} stroke="#404040" tick={{ fill: '#52525b', fontSize: 10 }} tickFormatter={(v) => Number(v).toFixed(2)} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }} formatter={(v) => [Number(v).toFixed(6), 'π']} />
                    <Line type="monotone" dataKey="estimate" stroke="#737373" strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TerminalFrame>

            <TerminalFrame title="EXPERIMENT_LOG">
              <div ref={logRef} className="h-[160px] overflow-y-auto font-mono text-xs space-y-0.5">
                {experiments.slice(-20).map((exp, i) => (
                  <LogEntry key={`${exp.timestamp}-${i}`} method={exp.method} param={exp.parameter} estimate={exp.pi_estimate} error={exp.error} />
                ))}
                {experiments.length === 0 && <p className="text-zinc-600 opacity-50">// no experiments recorded</p>}
              </div>
            </TerminalFrame>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-6">
            <TerminalFrame title="METHODS">
              <div className="space-y-1 max-h-[180px] overflow-y-auto">
                {["polygon", "monte_carlo", "leibniz", "nilakantha", "wallis", "madhava", "brent_salamin", "ramanujan", "chudnovsky", "basel", "borwein", "spigot", "bbp"].map((method) => {
                  const methodExps = experiments.filter(e => e.method === method);
                  const best = methodExps.length > 0 ? Math.min(...methodExps.map(e => e.error)) : null;
                  return (
                    <div key={method} onClick={() => toggleMethod(method)} className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors text-xs font-mono ${selectedMethods.has(method) ? 'bg-zinc-900' : 'bg-zinc-950 opacity-40'}`}>
                      <span className={selectedMethods.has(method) ? 'text-zinc-300' : 'text-zinc-600'}>{method}</span>
                      <span className="text-zinc-600">{best ? best.toExponential(1) : '—'}</span>
                    </div>
                  );
                })}
              </div>
            </TerminalFrame>

            <TerminalFrame title="LEADERBOARD">
              <div className="space-y-1">
                {leaderboard.slice(0, 6).map((item, i) => (
                  <div key={item.method} className="flex items-center justify-between p-1.5 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-600 w-4">{i + 1}.</span>
                      <span className="text-zinc-300">{item.method}</span>
                    </div>
                    <span className="text-zinc-500">{item.best.toExponential(2)}</span>
                  </div>
                ))}
                {leaderboard.length === 0 && <p className="text-zinc-600 text-xs">// run experiments</p>}
              </div>
            </TerminalFrame>
          </div>
        </div>

        <footer className="mt-8 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-600">
            <p>auto_research_pi // {experiments.length} experiments completed</p>
            <p>π ≈ 3.14159265358979323846...</p>
          </div>
        </footer>
      </main>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Research Configuration</DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm">Configure experiment parameters</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">API Endpoint</label>
              <div className="flex gap-2">
                <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="http://localhost:8000" className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-600" />
                <Button variant="outline" onClick={testConnection} className="border-zinc-700 text-sm font-mono">test</Button>
              </div>
              <p className="text-xs text-zinc-600">Leave empty to use default or set NEXT_PUBLIC_API_URL in environment</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Experiment Rounds: <span className="text-zinc-100 font-mono">{numRounds}</span></label>
              <input type="range" min="10" max="200" value={numRounds} onChange={(e) => setNumRounds(parseInt(e.target.value))} className="w-full accent-zinc-400" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Active Methods</label>
              <div className="flex flex-wrap gap-2">
                {["polygon", "monte_carlo", "leibniz", "nilakantha", "wallis", "madhava", "brent_salamin", "ramanujan", "chudnovsky", "basel", "borwein", "spigot", "bbp"].map((method) => (
                  <button key={method} onClick={() => toggleMethod(method)} className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${selectedMethods.has(method) ? 'bg-zinc-800 border-zinc-600 text-zinc-200' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}>
                    {method}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Visualization</label>
              <select value={vizMethod} onChange={(e) => setVizMethod(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm font-mono">
                {["polygon", "monte_carlo", "leibniz", "nilakantha", "wallis", "madhava", "brent_salamin", "ramanujan", "chudnovsky", "basel", "borwein", "spigot", "bbp"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={selectAll} className="text-sm border-zinc-700">select all</Button>
            <Button onClick={() => { setShowSettings(false); }} className="bg-zinc-100 hover:bg-white text-black text-sm">done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
