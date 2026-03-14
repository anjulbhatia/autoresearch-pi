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
import { api, Experiment } from "@/lib/api";

const METHOD_COLORS: Record<string, string> = {
  polygon: "#f97316",
  monte_carlo: "#fb923c",
  leibniz: "#fdba74",
  nilakantha: "#fed7aa",
};

export default function Home() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [bestEstimate, setBestEstimate] = useState(0);
  const [bestMethod, setBestMethod] = useState("");
  const [bestError, setBestError] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startResearch = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsRunning(true);
    setExperiments([]);

    const eventSource = api.streamResearch(30);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

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

      if (data.total_experiments >= 30) {
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

  const methodStats = experiments.reduce((acc, exp) => {
    if (!acc[exp.method] || exp.error < acc[exp.method].error) {
      acc[exp.method] = { method: exp.method, error: exp.error, parameter: exp.parameter };
    }
    return acc;
  }, {} as Record<string, { method: string; error: number; parameter: number }>);

  const methodData = Object.values(methodStats)
    .sort((a, b) => a.error - b.error)
    .map((m, i) => ({
      ...m,
      rank: i + 1,
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
                      <p className="font-mono text-zinc-300">30</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[280px] overflow-y-auto">
                <div className="space-y-2">
                  {methodData.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-4">
                      Run experiments to see rankings
                    </p>
                  ) : (
                    methodData.map((m, i) => (
                      <motion.div
                        key={m.method}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-2 rounded bg-zinc-900/50"
                      >
                        <span className="text-xs font-mono text-zinc-600 w-4">
                          #{m.rank}
                        </span>
                        <span
                          className="flex-1 text-sm capitalize"
                          style={{ color: METHOD_COLORS[m.method] }}
                        >
                          {m.method.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-mono text-zinc-500">
                          {m.error.toExponential(2)}
                        </span>
                      </motion.div>
                    ))
                  )}
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
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Error
                    </span>
                  </div>
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
                      tickFormatter={(v) => v < 0.01 ? v.toFixed(3) : v < 1 ? v.toFixed(2) : v.toFixed(0)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                      labelStyle={{ color: '#a1a1aa' }}
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
                  Method Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={methodData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="method"
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                      formatter={(value) => [Number(value).toExponential(4), 'Best Error']}
                    />
                    <Area
                      type="monotone"
                      dataKey="error"
                      fill="#f97316"
                      stroke="#fb923c"
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
                            style={{ color: METHOD_COLORS[exp.method] }}
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
                      {Math.round((experiments.length / 30) * 100)}%
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
