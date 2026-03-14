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

function PolygonAnimation({ sides }: { sides: number }) {
  const radius = 80;
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
        transition={{ duration: 1 }}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#f97316" />
      ))}
      <text x={cx} y={cy + radius + 20} textAnchor="middle" fill="#71717a" fontSize="12">
        n={sides}
      </text>
    </svg>
  );
}

function MonteCarloAnimation({ samples, inside }: { samples: number; inside: number }) {
  const displaySamples = Math.min(samples, 500);
  
  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <rect x="20" y="20" width="160" height="160" fill="#09090b" stroke="#27272a" strokeWidth="1" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
      {Array.from({ length: displaySamples }).map((_, i) => {
        const x = 20 + (i % 25) * 6.4;
        const y = 20 + Math.floor(i / 25) * 6.4;
        const inCircle = (x - 100) ** 2 + (y - 100) ** 2 <= 80 ** 2;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="1.5"
            fill={inCircle ? "#f97316" : "#3f3f46"}
          />
        );
      })}
      <text x="100" y="190" textAnchor="middle" fill="#71717a" fontSize="10">
        {inside}/{samples}
      </text>
    </svg>
  );
}

function SeriesAnimation({ method, iterations }: { method: string; iterations: number }) {
  const displayIter = Math.min(iterations, 30);
  const terms = Array.from({ length: displayIter }, (_, i) => {
    if (method === "leibniz") {
      return 4 * ((-1) ** i) / (2 * i + 1);
    } else if (method === "nilakantha") {
      if (i === 0) return 3;
      const n = Math.ceil(i / 2);
      return 4 * ((-1) ** (n + 1)) / ((2 * n) * (2 * n + 1) * (2 * n + 2));
    }
    return 0;
  });

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex items-end justify-center h-[120px] gap-0.5">
        {terms.map((term, i) => {
          const cumulative = terms.slice(0, i + 1).reduce((a, b) => a + b, 0);
          const height = Math.min(Math.abs(cumulative - Math.PI) * 80, 100);
          const isPositive = term > 0;
          return (
            <motion.div
              key={i}
              className={`w-2 ${isPositive ? "bg-orange-500" : "bg-zinc-600"}`}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 2)}px` }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
            />
          );
        })}
      </div>
      <div className="mt-2 w-full h-0.5 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
      <p className="text-xs text-zinc-500 mt-2">{method} series</p>
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startResearch = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsRunning(true);
    setExperiments([]);
    setLeaderboard([]);

    const eventSource = api.streamResearch(50);
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

      if (data.total_iterations >= 50) {
        eventSource.close();
        setIsRunning(false);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsRunning(false);
    };
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const chartData = experiments.map((exp, index) => ({
    experiment: index + 1,
    error: exp.error,
    estimate: exp.pi_estimate,
    method: exp.method,
  }));

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <div className="border-b border-zinc-800">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-black font-bold text-lg">π</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  AutoResearch Pi Lab
                </h1>
                <p className="text-xs text-zinc-500">
                  Automated Mathematical Discovery
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-md">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-orange-500 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="text-xs text-zinc-400">
                  {isRunning ? 'Research Running' : 'Idle'}
                </span>
              </div>
              <Button
                onClick={startResearch}
                disabled={isRunning}
                className="bg-orange-500 hover:bg-orange-600 text-black font-medium px-5"
              >
                {isRunning ? 'Running...' : 'Start Research'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Best Estimate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-mono text-orange-500">
                    {bestEstimate > 0 ? bestEstimate.toFixed(8) : '—'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Error:</span>
                    <span className="text-xs font-mono text-zinc-400">
                      {bestError > 0 ? bestError.toExponential(4) : '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Visualization
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {currentMethod === "polygon" && (
                    <motion.div
                      key="polygon"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <PolygonAnimation sides={Math.min(currentParameter, 12)} />
                    </motion.div>
                  )}
                  {currentMethod === "monte_carlo" && (
                    <motion.div
                      key="monte"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <MonteCarloAnimation 
                        samples={Math.min(currentParameter, 500)} 
                        inside={Math.floor(currentParameter * 0.785)} 
                      />
                    </motion.div>
                  )}
                  {(currentMethod === "leibniz" || currentMethod === "nilakantha") && (
                    <motion.div
                      key="series"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-[180px]"
                    >
                      <SeriesAnimation method={currentMethod} iterations={currentParameter} />
                    </motion.div>
                  )}
                  {!currentMethod && (
                    <div className="text-xs text-zinc-600 text-center py-8">
                      Run research to see visualizations
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Method Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[200px] overflow-y-auto">
                <div className="space-y-1">
                  {Object.entries(METHOD_COLORS).slice(0, 8).map(([method, color]) => (
                    <div key={method} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs capitalize text-zinc-400">{method.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-6 space-y-4">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Convergence
                  </CardTitle>
                  <span className="text-xs text-zinc-500">
                    {experiments.length}/50
                  </span>
                </div>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis
                      dataKey="experiment"
                      stroke="#52525b"
                      tick={{ fill: '#71717a', fontSize: 10 }}
                      tickLine={{ stroke: '#3f3f46' }}
                    />
                    <YAxis
                      stroke="#52525b"
                      tick={{ fill: '#71717a', fontSize: 10 }}
                      tickLine={{ stroke: '#3f3f46' }}
                      tickFormatter={(v) => Number(v) < 0.01 ? Number(v).toFixed(3) : Number(v) < 1 ? Number(v).toFixed(2) : Number(v).toFixed(0)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                      formatter={(value) => [Number(value).toExponential(4), 'Error']}
                    />
                    <Area
                      type="monotone"
                      dataKey="error"
                      stroke="#f97316"
                      strokeWidth={2}
                      fill="url(#errorGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Estimate Progression
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis
                      dataKey="experiment"
                      stroke="#52525b"
                      tick={{ fill: '#71717a', fontSize: 10 }}
                    />
                    <YAxis
                      domain={[3.0, 3.2]}
                      stroke="#52525b"
                      tick={{ fill: '#71717a', fontSize: 10 }}
                      tickFormatter={(v) => Number(v).toFixed(2)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                      formatter={(value) => [Number(value).toFixed(6), 'π Estimate']}
                    />
                    <Line
                      type="monotone"
                      dataKey="estimate"
                      stroke="#fb923c"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Best Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div
                    className="px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800"
                  >
                    <span className="text-lg font-medium capitalize text-orange-400">
                      {bestMethod.replace('_', ' ') || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-900 rounded px-2 py-1.5">
                      <span className="text-zinc-500">Experiments</span>
                      <p className="font-mono text-zinc-300">{experiments.length}</p>
                    </div>
                    <div className="bg-zinc-900 rounded px-2 py-1.5">
                      <span className="text-zinc-500">Target</span>
                      <p className="font-mono text-zinc-300">50</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Recent Experiments
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[260px] overflow-y-auto">
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {experiments.slice(-8).reverse().map((exp, i) => (
                      <motion.div
                        key={`${exp.timestamp}-${i}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-2 rounded bg-zinc-900/50 border border-zinc-800/50"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs font-medium capitalize"
                            style={{ color: METHOD_COLORS[exp.method] || '#71717a' }}
                          >
                            {exp.method.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-600">
                            n={exp.parameter}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] font-mono text-zinc-400">
                            {exp.pi_estimate.toFixed(6)}
                          </span>
                          <span className="text-[10px] font-mono text-orange-500/70">
                            {exp.error.toExponential(2)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {experiments.length === 0 && (
                    <p className="text-xs text-zinc-600 text-center py-4">
                      No experiments yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-900 rounded p-2">
                    <p className="text-[10px] text-zinc-500">Avg Error</p>
                    <p className="text-sm font-mono text-orange-400">
                      {experiments.length > 0
                        ? (experiments.reduce((a, b) => a + b.error, 0) / experiments.length).toExponential(2)
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-zinc-900 rounded p-2">
                    <p className="text-[10px] text-zinc-500">Min Error</p>
                    <p className="text-sm font-mono text-orange-400">
                      {experiments.length > 0
                        ? Math.min(...experiments.map(e => e.error)).toExponential(2)
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-zinc-900 rounded p-2">
                    <p className="text-[10px] text-zinc-500">Methods Tried</p>
                    <p className="text-sm font-mono text-orange-400">
                      {new Set(experiments.map(e => e.method)).size}
                    </p>
                  </div>
                  <div className="bg-zinc-900 rounded p-2">
                    <p className="text-[10px] text-zinc-500">Progress</p>
                    <p className="text-sm font-mono text-orange-400">
                      {Math.round((experiments.length / 50) * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <p>AutoResearch-Pi — Automated Mathematical Discovery</p>
            <p>π ≈ 3.14159265358979...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
