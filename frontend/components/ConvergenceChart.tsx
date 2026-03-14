"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

interface Experiment {
  method: string;
  parameter: number;
  pi_estimate: number;
  error: number;
  timestamp?: string;
}

interface ConvergenceChartProps {
  experiments: Experiment[];
}

export function ConvergenceChart({ experiments }: ConvergenceChartProps) {
  const data = experiments.map((exp, index) => ({
    experiment: index + 1,
    error: exp.error,
    method: exp.method,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="errorGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="experiment"
            stroke="#64748b"
            tick={{ fill: "#64748b" }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#64748b" }}
            tickFormatter={(value) => Number(value).toExponential(0)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#94a3b8" }}
            itemStyle={{ color: "#06b6d4" }}
            formatter={(value) => [Number(value).toExponential(2), "Error"]}
          />
          <Line
            type="monotone"
            dataKey="error"
            stroke="url(#errorGradient)"
            strokeWidth={2}
            dot={{ fill: "#06b6d4", strokeWidth: 0, r: 3 }}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
