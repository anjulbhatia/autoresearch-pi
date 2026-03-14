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
import { api, Experiment, StreamUpdate } from "@/lib/api";

const METHOD_COLORS: Record<string, string> = {
  polygon: "#f97316",
  monte_carlo: "#fb923c",
  leibniz: "#fdba74",
  nilakantha: "#fed7aa",
  wallis: "#fef3c7",
  madhava: "#fde68a",
  brent_salamin: "#fcd34d",
  ramanujan: "#fbbf24",
  chudnovsky: "#f59e0b",
  basel: "#d97706",
  borwein: "#b45309",
  spigot: "#92400e",
  bbp: "#78350f",
};

const ALL_METHODS = Object.keys(METHOD_COLORS);

function PolygonVisual({ sides }: { sides: number }) {
  const radius = 70;
  const cx = 100;
  const cy = 100;
  const points = Array.from({ length: sides }, (_, i) => {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
      <motion.path d={pathD} fill="none" stroke="#f97316" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f97316" />)}
      <text x={cx} y={cy + radius + 20} textAnchor="middle" fill="#71717a" fontSize="12">{sides} sides</text>
    </svg>
  );
}

function MonteCarloVisual({ samples }: { samples: number }) {
  const displaySamples = Math.min(samples, 400);
  const points = Array.from({ length: displaySamples }, () => ({ x: Math.random(), y: Math.random() }));
  const insideCount = points.filter(p => (p.x - 0.5) ** 2 + (p.y - 0.5) ** 2 <= 0.25).length;

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
      <rect x="20" y="20" width="160" height="160" fill="#09090b" stroke="#27272a" strokeWidth="1" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
      {points.map((p, i) => <circle key={i} cx={20 + p.x * 160} cy={20 + p.y * 160} r="1.5" fill={(p.x - 0.5) ** 2 + (p.y - 0.5) ** 2 <= 0.25 ? "#f97316" : "#3f3f46"} opacity={0.8} />)}
      <text x="100" y="190" textAnchor="middle" fill="#71717a" fontSize="11">{insideCount}/{samples}</text>
    </svg>
  );
}

function SeriesVisual({ method, iterations }: { method: string; iterations: number }) {
  const displayIter = Math.min(iterations, 15);
  const bars: number[] = [];
  
  for (let i = 0; i < displayIter; i++) {
    let value = 0;
    if (method === "leibniz") value = 4 * ((-1) ** i) / (2 * i + 1);
    else if (method === "nilakantha") value = i === 0 ? 3 : (i % 2 === 1 ? 4 / ((i) * (i + 1) * (i + 2)) : -4 / ((i) * (i + 1) * (i + 2)));
    else if (method === "wallis") value = (2 * (i + 1)) / ((2 * (i + 1) - 1) * (2 * (i + 1) + 1));
    else if (method === "madhava") value = ((-1) ** i) / (2 * i + 1);
    bars.push(value);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-2">
      <div className="flex items-end justify-center h-[100px] gap-0.5">
        {bars.map((val, i) => {
          const isPositive = val > 0;
          return (
            <motion.div key={i} className={`w-4 ${isPositive ? "bg-orange-500" : "bg-zinc-600"}`} initial={{ height: 0 }} animate={{ height: `${Math.min(Math.abs(val) * 40, 80)}px` }} transition={{ duration: 0.2, delay: i * 0.05 }} />
          );
        })}
      </div>
      <div className="mt-3 w-full h-0.5 bg-gradient-to-r from-orange-500 to-orange-400" />
      <p className="text-xs text-zinc-500 mt-2 capitalize">{method.replace("_", " ")}</p>
    </div>
  );
}

function AGMVisual({ iterations }: { iterations: number }) {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
      <circle cx="100" cy="100" r="80" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
      {[60, 40, 20].map((r, i) => <circle key={i} cx="100" cy="100" r={r} fill="none" stroke="#f97316" strokeWidth={2 - i * 0.5} opacity={0.8 - i * 0.2} />)}
      <circle cx="100" cy="100" r="4" fill="#f97316" />
      <text x="100" y="190" textAnchor="middle" fill="#71717a" fontSize="11">AGM: {iterations} iter</text>
    </svg>
  );
}

function NoVisual() {
  return (
    <div className="flex items-center justify-center h-[200px] text-sm text-zinc-500">
      Select a method to see visualization
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
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set(ALL_METHODS));
  const [vizMethod, setVizMethod] = useState<string>("polygon");
  
  const eventSourceRef = useRef<EventSource | null>(null);

  const toggleMethod = (method: string) => {
    const newSet = new Set(selectedMethods);
    if (newSet.has(method)) newSet.delete(method);
    else newSet.add(method);
    setSelectedMethods(newSet);
  };

  const selectAll = () => setSelectedMethods(new Set(ALL_METHODS));
  const selectNone = () => setSelectedMethods(new Set());

  const startResearch = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setIsRunning(true);
    setExperiments([]);
    const eventSource = api.streamResearch(numRounds);
    eventSourceRef.current = eventSource;

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

    eventSource.onerror = () => { eventSource.close(); setIsRunning(false); };
  };

  const resetResearch = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setIsRunning(false);
    setExperiments([]);
    setBestEstimate(0); setBestMethod(""); setBestError(0); setCurrentMethod(""); setCurrentParameter(0);
  };

  useEffect(() => () => { if (eventSourceRef.current) eventSourceRef.current.close(); }, []);

  const chartData = experiments.filter(e => selectedMethods.has(e.method)).map((exp, i) => ({ experiment: i + 1, error: exp.error, estimate: exp.pi_estimate, method: exp.method }));

  const leaderboard = Array.from(new Set(experiments.map(e => e.method))).map(method => {
    const methodExps = experiments.filter(e => e.method === method);
    const best = methodExps.length > 0 ? Math.min(...methodExps.map(e => e.error)) : Infinity;
    return { method, best, count: methodExps.length };
  }).sort((a, b) => a.best - b.best);

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-black font-bold text-xl">π</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">AutoResearch Pi Lab</h1>
                <p className="text-sm text-zinc-500">Automated Mathematical Discovery</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-md text-sm">
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-orange-500 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="text-zinc-400">{isRunning ? 'Running' : 'Idle'}</span>
              </span>
              <Button variant="outline" onClick={() => setShowSettings(true)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm">
                ⚙️ Settings
              </Button>
              <Button variant="outline" onClick={resetResearch} disabled={isRunning} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm">
                ↺ Reset
              </Button>
              <Button onClick={startResearch} disabled={isRunning} className="bg-orange-500 hover:bg-orange-600 text-black font-medium text-sm">
                {isRunning ? '▶ Running...' : '▶ Start Research'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase">Best Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-mono text-orange-500">{bestEstimate > 0 ? bestEstimate.toFixed(8) : '—'}</p>
                <p className="text-sm text-zinc-500 mt-2">Error: <span className="font-mono">{bestError > 0 ? bestError.toExponential(4) : '—'}</span></p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase">Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <select value={vizMethod} onChange={(e) => setVizMethod(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 mb-4">
                  {ALL_METHODS.map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
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
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-xs text-zinc-500">Rounds</p>
                    <p className="text-lg font-mono text-zinc-100">{experiments.length}/{numRounds}</p>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-xs text-zinc-500">Methods</p>
                    <p className="text-lg font-mono text-zinc-100">{new Set(experiments.map(e => e.method)).size}</p>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-xs text-zinc-500">Min Error</p>
                    <p className="text-lg font-mono text-orange-400">{experiments.length > 0 ? Math.min(...experiments.map(e => e.error)).toExponential(2) : '—'}</p>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-xs text-zinc-500">Best Method</p>
                    <p className="text-lg font-mono text-orange-400 capitalize">{bestMethod.replace("_", " ") || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-6 space-y-6">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-zinc-400 uppercase">Convergence</CardTitle>
                  <span className="text-xs text-zinc-500">{chartData.length} experiments</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="experiment" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 11 }} />
                      <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => Number(v) < 0.01 ? Number(v).toFixed(3) : Number(v).toFixed(1)} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '6px', fontSize: '12px' }} formatter={(v) => [Number(v).toExponential(3), 'Error']} />
                      <Area type="monotone" dataKey="error" stroke="#f97316" strokeWidth={2} fill="url(#errorGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase">π Estimate Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="experiment" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 11 }} />
                      <YAxis domain={[3.0, 3.2]} stroke="#52525b" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => Number(v).toFixed(2)} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '6px', fontSize: '12px' }} formatter={(v) => [Number(v).toFixed(6), 'π']} />
                      <Line type="monotone" dataKey="estimate" stroke="#fb923c" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-6">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase">Method Filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2 mb-3">
                  <Button variant="outline" size="sm" onClick={selectAll} className="flex-1 text-xs border-zinc-700">All</Button>
                  <Button variant="outline" size="sm" onClick={selectNone} className="flex-1 text-xs border-zinc-700">None</Button>
                </div>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {ALL_METHODS.map((method) => {
                    const methodExps = experiments.filter(e => e.method === method);
                    const best = methodExps.length > 0 ? Math.min(...methodExps.map(e => e.error)) : null;
                    return (
                      <div key={method} onClick={() => toggleMethod(method)} className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${selectedMethods.has(method) ? 'bg-zinc-900' : 'bg-zinc-950 opacity-50'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: METHOD_COLORS[method] }} />
                          <span className="text-sm capitalize text-zinc-300">{method.replace("_", " ")}</span>
                        </div>
                        <span className="text-xs font-mono text-zinc-500">{best ? best.toExponential(1) : '—'}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase">Recent Experiments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  <AnimatePresence>
                    {experiments.slice(-8).reverse().map((exp, i) => (
                      <motion.div key={`${exp.timestamp}-${i}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between p-2 bg-zinc-900/50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm capitalize" style={{ color: METHOD_COLORS[exp.method] }}>{exp.method.replace("_", " ")}</span>
                          <span className="text-xs text-zinc-600">n={exp.parameter}</span>
                        </div>
                        <span className="text-xs font-mono text-orange-400">{exp.error.toExponential(1)}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {experiments.length === 0 && <p className="text-sm text-zinc-600 text-center py-4">No experiments yet</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase">Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {leaderboard.slice(0, 6).map((item, i) => (
                    <div key={item.method} className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-500 w-5">#{i + 1}</span>
                        <span className="text-sm capitalize" style={{ color: METHOD_COLORS[item.method] }}>{item.method.replace("_", " ")}</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">{item.best.toExponential(2)}</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && <p className="text-sm text-zinc-600 text-center py-2">Run research</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="mt-8 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between text-sm text-zinc-600">
            <p>AutoResearch-Pi • {experiments.length} experiments</p>
            <p>π ≈ 3.14159265358979...</p>
          </div>
        </footer>
      </main>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Research Settings</DialogTitle>
            <DialogDescription className="text-zinc-400">Configure research parameters</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Number of Rounds</label>
              <div className="flex items-center gap-4">
                <input type="range" min="10" max="200" value={numRounds} onChange={(e) => setNumRounds(parseInt(e.target.value))} className="flex-1" />
                <span className="text-sm font-mono bg-zinc-900 px-3 py-1 rounded">{numRounds}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Active Methods</label>
              <div className="flex flex-wrap gap-2">
                {ALL_METHODS.map((method) => (
                  <button key={method} onClick={() => toggleMethod(method)} className={`px-3 py-1 text-sm rounded-full border transition-colors ${selectedMethods.has(method) ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>
                    {method.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Visualization Type</label>
              <select value={vizMethod} onChange={(e) => setVizMethod(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm">
                {ALL_METHODS.map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
              </select>
              <p className="text-xs text-zinc-500">Choose which method's visualization to display during research</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={selectAll} className="text-sm border-zinc-700">Select All</Button>
            <Button variant="outline" onClick={selectNone} className="text-sm border-zinc-700">Clear All</Button>
            <Button onClick={() => setShowSettings(false)} className="bg-orange-500 hover:bg-orange-600 text-black text-sm">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
