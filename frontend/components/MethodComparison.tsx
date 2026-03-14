"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

interface Experiment {
  method: string;
  parameter: number;
  pi_estimate: number;
  error: number;
}

interface MethodComparisonProps {
  experiments: Experiment[];
}

const METHOD_COLORS: Record<string, string> = {
  polygon: "#06b6d4",
  monte_carlo: "#8b5cf6",
  leibniz: "#f59e0b",
  nilakantha: "#10b981",
};

export function MethodComparison({ experiments }: MethodComparisonProps) {
  const methodErrors: Record<string, number> = {};

  experiments.forEach((exp) => {
    if (!methodErrors[exp.method] || exp.error < methodErrors[exp.method]) {
      methodErrors[exp.method] = exp.error;
    }
  });

  const data = Object.entries(methodErrors)
    .map(([method, error]) => ({
      method: method.replace("_", " "),
      error,
      fill: METHOD_COLORS[method] || "#64748b",
    }))
    .sort((a, b) => a.error - b.error);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            type="number"
            stroke="#64748b"
            tick={{ fill: "#64748b" }}
            tickFormatter={(value) => Number(value).toExponential(0)}
          />
          <YAxis
            type="category"
            dataKey="method"
            stroke="#64748b"
            tick={{ fill: "#64748b", fontSize: 12 }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#94a3b8" }}
            itemStyle={{ color: "#06b6d4" }}
            formatter={(value) => [Number(value).toExponential(2), "Best Error"]}
          />
          <Bar dataKey="error" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
