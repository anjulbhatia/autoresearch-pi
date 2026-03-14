"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface PiCardProps {
  bestEstimate: number;
  bestMethod: string;
  error: number;
}

export function PiCard({ bestEstimate, bestMethod, error }: PiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-cyan-400">Best Approximation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">π Estimate</p>
              <p className="text-4xl font-mono text-white">
                {bestEstimate.toFixed(10)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Method</p>
                <p className="text-lg font-semibold text-cyan-300 capitalize">
                  {bestMethod.replace("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Error</p>
                <p className="text-lg font-mono text-red-400">
                  {error.toExponential(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
