"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface GeometryAnimationProps {
  method: string;
  parameter: number;
}

export function GeometryAnimation({ method, parameter }: GeometryAnimationProps) {
  const [points, setPoints] = useState<{ x: number; y: number; inside: boolean }[]>([]);

  useEffect(() => {
    if (method === "monte_carlo") {
      const numPoints = Math.min(parameter, 500);
      const newPoints = Array.from({ length: numPoints }, () => {
        const x = Math.random();
        const y = Math.random();
        return { x, y, inside: x * x + y * y <= 1 };
      });
      setPoints(newPoints);
    }
  }, [method, parameter]);

  if (method === "polygon") {
    const sides = Math.min(parameter, 12);
    const angleStep = (2 * Math.PI) / sides;
    const radius = 100;
    const points2 = Array.from({ length: sides }, (_, i) => ({
      x: 150 + radius * Math.cos(i * angleStep - Math.PI / 2),
      y: 150 + radius * Math.sin(i * angleStep - Math.PI / 2),
    }));
    const pathD = points2
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
      .join(" ") + " Z";

    return (
      <div className="flex items-center justify-center h-[300px]">
        <svg width="300" height="300" className="overflow-visible">
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <motion.path
            d={pathD}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />
          {points2.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#06b6d4"
            />
          ))}
          <text x="150" y="270" textAnchor="middle" fill="#64748b" fontSize="14">
            {sides} sides
          </text>
        </svg>
      </div>
    );
  }

  if (method === "monte_carlo") {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <svg width="300" height="300" className="overflow-visible">
          <rect
            x="25"
            y="25"
            width="250"
            height="250"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="2"
          />
          <circle
            cx="150"
            cy="150"
            r="125"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={25 + p.x * 250}
              cy={25 + p.y * 250}
              r="2"
              fill={p.inside ? "#10b981" : "#f43f5e"}
              opacity={0.7}
            />
          ))}
          <text x="150" y="290" textAnchor="middle" fill="#64748b" fontSize="14">
            {points.filter((p) => p.inside).length} / {points.length} inside
          </text>
        </svg>
      </div>
    );
  }

  if (method === "leibniz" || method === "nilakantha") {
    const iterations = Math.min(parameter, 20);
    const terms = Array.from({ length: iterations }, (_, i) => {
      if (method === "leibniz") {
        return 4 * ((-1) ** i) / (2 * i + 1);
      } else {
        if (i === 0) return 3;
        const j = 2 * i;
        return 4 * ((-1) ** (i - 1)) / (j * (j + 1) * (j + 2));
      }
    });

    return (
      <div className="flex items-center justify-center h-[300px] p-4">
        <div className="w-full">
          <div className="flex items-end justify-center h-[200px] gap-1">
            {terms.map((term, i) => {
              const cumulative = terms.slice(0, i + 1).reduce((a, b) => a + b, 0);
              const height = Math.min(Math.abs(cumulative - Math.PI) * 500, 180);
              const isPositive = term > 0;
              return (
                <motion.div
                  key={i}
                  className={`w-3 ${isPositive ? "bg-cyan-400" : "bg-red-400"}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 2)}px` }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                />
              );
            })}
          </div>
          <div className="flex justify-center mt-2">
            <div className="h-0.5 w-full bg-gradient-to-r from-cyan-400 to-purple-500" />
          </div>
          <p className="text-center text-slate-400 text-sm mt-2">
            Converging to π
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-[300px] text-slate-500">
      Select an experiment to see visualization
    </div>
  );
}
