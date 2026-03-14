import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Experiment {
  method: string;
  parameter: number;
  pi_estimate: number;
  error: number;
  timestamp?: string;
  best_method?: string;
  best_estimate?: number;
  best_error?: number;
  total_experiments?: number;
}

export interface ResearchResult {
  experiments: Experiment[];
  leaderboard: Experiment[];
  best_method: string;
  best_estimate: number;
  best_error: number;
  total_experiments: number;
}

export const api = {
  async runResearch(numExperiments: number = 30): Promise<ResearchResult> {
    const response = await axios.get<ResearchResult>(
      `${API_BASE_URL}/research/run`,
      { params: { num_experiments: numExperiments } }
    );
    return response.data;
  },

  streamResearch(numExperiments: number = 30): EventSource {
    const url = `${API_BASE_URL}/research/stream?num_experiments=${numExperiments}`;
    return new EventSource(url);
  },
};
