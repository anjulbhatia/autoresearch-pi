import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Experiment {
  method: string;
  parameter: number;
  pi_estimate: number;
  error: number;
  timestamp?: string;
}

export interface LeaderboardEntry {
  method: string;
  best_error: number;
  best_estimate: number;
  parameter: number;
  description: string;
}

export interface ResearchResult {
  experiments: Experiment[];
  leaderboard: LeaderboardEntry[];
  best_method: string;
  best_estimate: number;
  best_error: number;
  best_parameter: number;
  total_experiments: number;
  total_time?: number;
  method_info?: Record<string, string>;
}

export interface StreamUpdate {
  iteration: number;
  method: string;
  parameter: number;
  pi_estimate: number;
  error: number;
  timestamp: string;
  best_method: string;
  best_estimate: number;
  best_error: number;
  method_scores: Record<string, number>;
  total_iterations: number;
}

export const api = {
  async getMethods() {
    const response = await axios.get(`${API_BASE_URL}/methods`);
    return response.data;
  },

  async runResearch(numExperiments: number = 50): Promise<ResearchResult> {
    const response = await axios.get<ResearchResult>(
      `${API_BASE_URL}/research/run`,
      { params: { num_experiments: numExperiments } }
    );
    return response.data;
  },

  streamResearch(numExperiments: number = 50): EventSource {
    const url = `${API_BASE_URL}/research/stream?num_experiments=${numExperiments}`;
    return new EventSource(url);
  },
};
