"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Experiment {
  method: string;
  parameter: number;
  pi_estimate: number;
  error: number;
  timestamp?: string;
}

interface ExperimentLogProps {
  experiments: Experiment[];
}

const METHOD_COLORS: Record<string, string> = {
  polygon: "text-cyan-400",
  monte_carlo: "text-purple-400",
  leibniz: "text-amber-400",
  nilakantha: "text-emerald-400",
};

export function ExperimentLog({ experiments }: ExperimentLogProps) {
  const recentExperiments = experiments.slice(-10).reverse();

  return (
    <div className="h-[300px] overflow-y-auto space-y-2 pr-2">
      <AnimatePresence>
        {recentExperiments.map((exp, index) => (
          <motion.div
            key={`${exp.timestamp || index}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900 rounded-lg p-3 border border-slate-800"
          >
            <div className="flex justify-between items-center">
              <span className={`font-semibold capitalize ${METHOD_COLORS[exp.method]}`}>
                {exp.method.replace("_", " ")}
              </span>
              <span className="text-slate-400 text-sm">
                n={exp.parameter.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-white font-mono text-sm">
                π ≈ {exp.pi_estimate.toFixed(6)}
              </span>
              <span className="text-red-400 font-mono text-sm">
                {exp.error.toExponential(2)}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {experiments.length === 0 && (
        <div className="text-slate-500 text-center py-8">
          Waiting for experiments...
        </div>
      )}
    </div>
  );
}
