import asyncio
import random
from typing import List, Dict, Any, AsyncGenerator
from datetime import datetime

from experiments.pi_methods import (
    PiExperiment,
    run_experiment,
    get_method_names,
    get_parameter_ranges,
)


class ResearchRunner:
    def __init__(self, num_experiments: int = 30):
        self.num_experiments = num_experiments
        self.experiments: List[PiExperiment] = []
        self.best_experiment: PiExperiment | None = None
        
    def _generate_experiment_sequence(self) -> List[tuple]:
        methods = get_method_names()
        param_ranges = get_parameter_ranges()
        
        sequence = []
        for _ in range(self.num_experiments):
            method = random.choice(methods)
            params = param_ranges[method]
            param = random.choice(params)
            sequence.append((method, param))
        
        return sequence
    
    def run_all_experiments(self) -> List[Dict[str, Any]]:
        sequence = self._generate_experiment_sequence()
        results = []
        
        for method, param in sequence:
            experiment = run_experiment(method, param)
            self.experiments.append(experiment)
            
            if self.best_experiment is None or experiment.error < self.best_experiment.error:
                self.best_experiment = experiment
            
            results.append({
                "method": experiment.method,
                "parameter": experiment.parameter,
                "pi_estimate": experiment.pi_estimate,
                "error": experiment.error,
                "timestamp": datetime.now().isoformat()
            })
        
        return results
    
    async def stream_experiments(self) -> AsyncGenerator[Dict[str, Any], None]:
        sequence = self._generate_experiment_sequence()
        
        for method, param in sequence:
            await asyncio.sleep(0.1)
            
            experiment = run_experiment(method, param)
            self.experiments.append(experiment)
            
            if self.best_experiment is None or experiment.error < self.best_experiment.error:
                self.best_experiment = experiment
            
            yield {
                "method": experiment.method,
                "parameter": experiment.parameter,
                "pi_estimate": experiment.pi_estimate,
                "error": experiment.error,
                "timestamp": datetime.now().isoformat(),
                "best_method": self.best_experiment.method,
                "best_estimate": self.best_experiment.pi_estimate,
                "best_error": self.best_experiment.error,
                "total_experiments": len(self.experiments)
            }
    
    def get_leaderboard(self) -> List[Dict[str, Any]]:
        sorted_experiments = sorted(self.experiments, key=lambda x: x.error)
        
        leaderboard = []
        for exp in sorted_experiments[:10]:
            leaderboard.append({
                "method": exp.method,
                "parameter": exp.parameter,
                "pi_estimate": exp.pi_estimate,
                "error": exp.error
            })
        
        return leaderboard
    
    def get_best_method_stats(self) -> Dict[str, Any]:
        if self.best_experiment is None:
            return {}
        
        return {
            "best_method": self.best_experiment.method,
            "best_estimate": self.best_experiment.pi_estimate,
            "best_error": self.best_experiment.error,
            "best_parameter": self.best_experiment.parameter
        }
    
    def reset(self):
        self.experiments = []
        self.best_experiment = None


async def run_research(num_experiments: int = 30) -> Dict[str, Any]:
    runner = ResearchRunner(num_experiments)
    experiments = runner.run_all_experiments()
    leaderboard = runner.get_leaderboard()
    best = runner.get_best_method_stats()
    
    return {
        "experiments": experiments,
        "leaderboard": leaderboard,
        "best_method": best.get("best_method", ""),
        "best_estimate": best.get("best_estimate", 0),
        "best_error": best.get("best_error", 0),
        "total_experiments": len(experiments)
    }


async def stream_research(num_experiments: int = 30) -> AsyncGenerator[Dict[str, Any], None]:
    runner = ResearchRunner(num_experiments)
    
    async for result in runner.stream_experiments():
        yield result
