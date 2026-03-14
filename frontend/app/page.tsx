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
import { api, Experiment, StreamUpdate, LeaderboardEntry } from "@/lib/api";

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

function PolygonAnimation({ sides }: { sides: number }) {
  const radius = 70;
  const cx = 100;
  const cy = 100;
  
  const points = Array.from({ length: sides }, (_, i) => {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
  
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ") + " Z";

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
      <motion.path
        d={pathD}
        fill="none"
        stroke="#f97316"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f97316" />
      ))}
      <text x={cx} y={cy + radius + 15} textAnchor="middle" fill="#71717a" fontSize="11">
        {sides} sides
      </text>
    </svg>
  );
}

function MonteCarloAnimation({ samples }: { samples: number }) {
  const displaySamples = Math.min(samples, 300);
  const points = Array.from({ length: displaySamples }, () => ({
    x: Math.random(),
    y: Math.random(),
  }));
  
  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <rect x="20" y="20" width="160" height="160" fill="#09090b" stroke="#27272a" strokeWidth="1" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={20 + p.x * 160}
          cy={20 + p.y * 160}
          r="1.5"
          fill={(p.x - 0.5) ** 2 + (p.y - 0.5) ** 2 <= 0.25 ? "#f97316" : "#3f3f46"}
          opacity={0.8}
        />
      ))}
      <text x="100" y="190" textAnchor="middle" fill="#71717a" fontSize="10">
        {samples.toLocaleString()} samples
      </text>
    </svg>
  );
}

function SeriesAnimation({ method, iterations }: { method: string; iterations: number }) {
  const displayIter = Math.min(iterations, 20);
  const bars = [];
  
  for (let i = 0; i < displayIter; i++) {
    let value: number;
    if (method === "leibniz") {
      value = 4 * ((-1) ** i) / (2 * i + 1);
    } else if (method === "nilakantha") {
      if (i === 0) value = 3;
      else {
        const n = Math.ceil(i / 2);
        value = 4 * ((-1) ** (n + 1)) / ((2 * n) * (2 * n + 1) * (2 * n + 2));
      }
    } else if (method === "wallis") {
      const num = (2 * (i + 1)) ** 2;
      const den = (2 * (i + 1) - 1) * (2 * (i + 1) + 1);
      value = num / den;
    } else {
      value = 0;
    }
    bars.push(value);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-2">
      <div className="flex items-end justify-center h-[100px] gap-0.5">
        {bars.map((val, i) => {
          const isPositive = val > 0;
          const height = Math.min(Math.abs(val) * 30, 80);
          return (
            <motion.div
              key={i}
              className={`w-3 ${isPositive ? "bg-orange-500" : "bg-zinc-600"}`}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 2)}px` }}
              transition={{ duration: 0.15, delay: i * 0.03 }}
            />
          );
        })}
      </div>
      <div className="mt-2 w-full h-0.5 bg-gradient-to-r from-orange-500 to-orange-400" />
      <p className="text-[10px] text-zinc-500 mt-1 capitalize">{method.replace('_', ' ')}</p>
    </div>
  );
}

function AGMAnimation({ iterations }: { iterations: number }) {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="80" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="#f97316" strokeWidth="1.5" opacity={0.6} />
      <circle cx="100" cy="100" r="40" fill="none" stroke="#f97316" strokeWidth="2" />
      <circle cx="100" cy="100" r="20" fill="none" stroke="#f97316" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="5" fill="#f97316" />
      <text x="100" y="190" textAnchor="middle" fill="#71717a" fontSize="10">
        AGM: {iterations} iterations
      </text>
    </svg>
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
  const [showVisualization, setShowVisualization] = useState(true);
  const [autoRun, setAutoRun] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set(ALL_METHODS));
  const [showSettings, setShowSettings] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  const toggleMethod = (method: string) => {
    const newSet = new Set(selectedMethods);
    if (newSet.has(method)) {
      newSet.delete(method);
    } else {
      newSet.add(method);
    }
    setSelectedMethods(newSet);
  };

  const selectAllMethods = () => setSelectedMethods(new Set(ALL_METHODS));
  const clearMethods = () => setSelectedMethods(new Set());

  const startResearch = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsRunning(true);
    setExperiments([]);

    const eventSource = api.streamResearch(numRounds);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data: StreamUpdate = JSON.parse(event.data);
      
      setExperiments((prev) => [
        ...prev,
        {
          method: data.method,
          parameter: data.parameter,
          pi_estimate: data.pi_estimate,
          error: data.error,
          timestamp: data.timestamp,
        },
      ]);
      
      setBestEstimate(data.best_estimate);
      setBestMethod(data.best_method);
      setBestError(data.best_error);
      setCurrentMethod(data.method);
      setCurrentParameter(data.parameter);

      if (data.total_iterations >= numRounds) {
        eventSource.close();
        setIsRunning(false);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsRunning(false);
    };
  };

  const resetResearch = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsRunning(false);
    setExperiments([]);
    setBestEstimate(0);
    setBestMethod("");
    setBestError(0);
    setCurrentMethod("");
    setCurrentParameter(0);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoRun && !isRunning && experiments.length === 0) {
      startResearch();
    }
  }, [autoRun]);

  const chartData = experiments.map((exp, index) => ({
    experiment: index + 1,
    error: exp.error,
    estimate: exp.pi_estimate,
    method: exp.method,
  }));

  const filteredData = chartData.filter(d => selectedMethods.has(d.method));

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <div className="border-b border-zinc-800">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-black font-bold text-lg">π</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  AutoResearch Pi Lab
                </h1>
                <p className="text-xs text-zinc-500">
                  Automated Mathematical Discovery
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                ⚙️ Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetResearch}
                disabled={isRunning}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                ↺ Reset
              </Button>
              <Button
                onClick={startResearch}
                disabled={isRunning}
                className="bg-orange-500 hover:bg-orange-600 text-black font-medium"
              >
                {isRunning ? 'Running...' : '▶ Start Research'}
              </Button>
            </div>
          </div>
          
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-2 space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-zinc-400">Rounds:</label>
                      <input
                        type="number"
                        value={numRounds}
                        onChange={(e) => setNumRounds(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100"
                        min={1}
                        max={200}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showVisualization}
                          onChange={(e) => setShowVisualization(e.target.checked)}
                          className="rounded"
                        />
                        Show Visualization
                      </label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoRun}
                          onChange={(e) => setAutoRun(e.target.checked)}
                          className="rounded"
                        />
                        Auto-run on load
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Methods:</span>
                      <Button variant="outline" size="sm" onClick={selectAllMethods} className="h-6 text-xs border-zinc-700">All</Button>
                      <Button variant="outline" size="sm" onClick={clearMethods} className="h-6 text-xs border-zinc-700">None</Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ALL_METHODS.map((method) => (
                        <button
                          key={method}
                          onClick={() => toggleMethod(method)}
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors capitalize ${
                            selectedMethods.has(method)
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                          }`}
                        >
                          {method.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-2 space-y-3">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase">Best Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-mono text-orange-500">
                  {bestEstimate > 0 ? bestEstimate.toFixed(8) : '—'}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Error: {bestError > 0 ? bestError.toExponential(3) : '—'}
                </p>
              </CardContent>
            </Card>

            {showVisualization && (
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase">Visual</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <AnimatePresence mode="wait">
                    {currentMethod === "polygon" && (
                      <motion.div key="polygon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <PolygonAnimation sides={Math.min(currentParameter, 12)} />
                      </motion.div>
                    )}
                    {currentMethod === "monte_carlo" && (
                      <motion.div key="monte" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <MonteCarloAnimation samples={Math.min(currentParameter, 1000)} />
                      </motion.div>
                    )}
                    {(currentMethod === "leibniz" || currentMethod === "nilakantha" || currentMethod === "wallis") && (
                      <motion.div key="series" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-[140px]">
                        <SeriesAnimation method={currentMethod} iterations={currentParameter} />
                      </motion.div>
                    )}
                    {currentMethod === "brent_salamin" && (
                      <motion.div key="agm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AGMAnimation iterations={currentParameter} />
                      </motion.div>
                    )}
                    {!currentMethod && (
                      <div className="text-[10px] text-zinc-600 text-center py-8">
                        Run research
                      </div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase">Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-zinc-900 rounded p-1.5">
                    <span className="text-zinc-500">Rounds</span>
                    <p className="font-mono text-zinc-300">{experiments.length}/{numRounds}</p>
                  </div>
                  <div className="bg-zinc-900 rounded p-1.5">
                    <span className="text-zinc-500">Methods</span>
                    <p className="font-mono text-zinc-300">{new Set(experiments.map(e => e.method)).size}</p>
                  </div>
                  <div className="bg-zinc-900 rounded p-1.5">
                    <span className="text-zinc-500">Min Err</span>
                    <p className="font-mono text-orange-400">
                      {experiments.length > 0 ? Math.min(...experiments.map(e => e.error)).toExponential(2) : '—'}
                    </p>
                  </div>
                  <div className="bg-zinc-900 rounded p-1.5">
                    <span className="text-zinc-500">Best</span>
                    <p className="font-mono text-orange-400 capitalize">{bestMethod.replace('_', ' ') || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-7 space-y-3">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase">Convergence</CardTitle>
                  <span className="text-[10px] text-zinc-500">{filteredData.length} points</span>
                </div>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredData}>
                    <defs>
                      <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="experiment" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 9 }} />
                    <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 9 }} tickFormatter={(v) => Number(v) < 0.01 ? Number(v).toFixed(3) : Number(v).toFixed(1)} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '4px', fontSize: '10px' }} formatter={(value) => [Number(value).toExponential(3), 'Error']} />
                    <Area type="monotone" dataKey="error" stroke="#f97316" strokeWidth={1.5} fill="url(#errorGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase">π Estimate Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="experiment" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 9 }} />
                    <YAxis domain={[3.0, 3.2]} stroke="#52525b" tick={{ fill: '#71717a', fontSize: 9 }} tickFormatter={(v) => Number(v).toFixed(2)} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '4px', fontSize: '10px' }} formatter={(value) => [Number(value).toFixed(6), 'π']} />
                    <Line type="monotone" dataKey="estimate" stroke="#fb923c" strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-3">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase">Method Filter</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[180px] overflow-y-auto">
                <div className="space-y-1">
                  {ALL_METHODS.map((method) => {
                    const methodExps = experiments.filter(e => e.method === method);
                    const best = methodExps.length > 0 ? Math.min(...methodExps.map(e => e.error)) : null;
                    return (
                      <div
                        key={method}
                        onClick={() => toggleMethod(method)}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                          selectedMethods.has(method) ? 'bg-zinc-900' : 'bg-zinc-950 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: METHOD_COLORS[method] }} />
                          <span className="text-[10px] capitalize text-zinc-400">{method.replace('_', ' ')}</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-600">
                          {best ? best.toExponential(1) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase">Recent</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[220px] overflow-y-auto">
                <div className="space-y-1">
                  <AnimatePresence>
                    {experiments.slice(-10).reverse().map((exp, i) => (
                      <motion.div
                        key={`${exp.timestamp}-${i}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-1.5 rounded bg-zinc-900/50"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] capitalize" style={{ color: METHOD_COLORS[exp.method] }}>
                            {exp.method.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] text-zinc-600">n={exp.parameter}</span>
                        </div>
                        <span className="text-[9px] font-mono text-orange-500/70">{exp.error.toExponential(1)}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {experiments.length === 0 && (
                    <p className="text-[10px] text-zinc-600 text-center py-4">No experiments</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase">Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[150px] overflow-y-auto">
                <div className="space-y-0.5">
                  {Array.from(new Set(experiments.map(e => e.method))).map((method, i) => {
                    const methodExps = experiments.filter(e => e.method === method);
                    const best = methodExps.length > 0 ? Math.min(...methodExps.map(e => e.error)) : Infinity;
                    return (
                      <div key={method} className="flex items-center justify-between p-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-500 w-3">#{i + 1}</span>
                          <span className="text-[10px] capitalize" style={{ color: METHOD_COLORS[method] }}>{method.replace('_', ' ')}</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500">{best.toExponential(2)}</span>
                      </div>
                    );
                  }).sort((a, b) => {
                    const aErr = experiments.filter(e => e.method === a.key).reduce((min, e) => Math.min(min, e.error), Infinity);
                    const bErr = experiments.filter(e => e.method === b.key).reduce((min, e) => Math.min(min, e.error), Infinity);
                    return aErr - bErr;
                  }).slice(0, 5)}
                  {experiments.length === 0 && (
                    <p className="text-[10px] text-zinc-600 text-center py-2">Run research</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800">
          <div className="flex items-center justify-between text-[10px] text-zinc-600">
            <p>AutoResearch-Pi • {experiments.length} experiments completed</p>
            <p>π ≈ 3.14159265358979...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
