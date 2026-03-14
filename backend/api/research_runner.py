import asyncio
import random
import time
from typing import List, Dict, Any, AsyncGenerator, Optional
from datetime import datetime

from experiments.pi_methods import (
    PiExperiment,
    run_experiment,
    get_method_names,
    get_parameter_ranges,
    get_method_info,
    METHOD_DESCRIPTIONS,
)


class ResearchAgent:
    """
    AutoResearch-style research agent that:
    1. Explores different methods and parameters
    2. Measures approximation errors
    3. Compares results
    4. Selects best performing approach
    5. Iteratively improves
    """
    
    def __init__(
        self,
        num_experiments: int = 50,
        exploration_rate: float = 0.3,
        exploitation_rate: float = 0.7,
    ):
        self.num_experiments = num_experiments
        self.exploration_rate = exploration_rate
        self.exploitation_rate = exploitation_rate
        
        self.experiments: List[PiExperiment] = []
        self.best_experiment: Optional[PiExperiment] = None
        self.method_scores: Dict[str, float] = {}
        self.experiment_history: List[Dict[str, Any]] = []
        
        self.available_methods = get_method_names()
        self.param_ranges = get_parameter_ranges()
        
    def _select_method_and_param(self) -> tuple:
        """Select method and parameter using epsilon-greedy strategy."""
        if random.random() < self.exploration_rate:
            method = random.choice(self.available_methods)
            param = random.choice(self.param_ranges[method])
        else:
            if not self.method_scores:
                method = random.choice(self.available_methods)
            else:
                best_method = min(self.method_scores.items(), key=lambda x: x[1])
                method = best_method[0]
            
            sorted_params = sorted(self.param_ranges[method])
            param = random.choice(sorted_params[len(sorted_params)//2:])
        
        return method, param
    
    def _update_scores(self, experiment: PiExperiment):
        """Update method scores based on experiment results."""
        method = experiment.method
        error = experiment.error
        
        if method not in self.method_scores:
            self.method_scores[method] = error
        else:
            self.method_scores[method] = (
                0.7 * self.method_scores[method] + 0.3 * error
            )
    
    def run_full_research(self) -> Dict[str, Any]:
        """Run complete research process."""
        start_time = time.time()
        
        for i in range(self.num_experiments):
            method, param = self._select_method_and_param()
            
            experiment = run_experiment(method, param)
            self.experiments.append(experiment)
            self._update_scores(experiment)
            
            if self.best_experiment is None or experiment.error < self.best_experiment.error:
                self.best_experiment = experiment
            
            self.experiment_history.append({
                "iteration": i + 1,
                "method": experiment.method,
                "parameter": experiment.parameter,
                "pi_estimate": experiment.pi_estimate,
                "error": experiment.error,
                "timestamp": datetime.now().isoformat(),
                "best_method": self.best_experiment.method,
                "best_estimate": self.best_experiment.pi_estimate,
                "best_error": self.best_experiment.error,
            })
        
        total_time = time.time() - start_time
        
        return self._build_result(total_time)
    
    async def stream_research(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream research process with real-time updates."""
        for i in range(self.num_experiments):
            await asyncio.sleep(0.08)
            
            method, param = self._select_method_and_param()
            
            experiment = run_experiment(method, param)
            self.experiments.append(experiment)
            self._update_scores(experiment)
            
            if self.best_experiment is None or experiment.error < self.best_experiment.error:
                self.best_experiment = experiment
            
            result = {
                "iteration": i + 1,
                "method": experiment.method,
                "parameter": experiment.parameter,
                "pi_estimate": experiment.pi_estimate,
                "error": experiment.error,
                "timestamp": datetime.now().isoformat(),
                "best_method": self.best_experiment.method,
                "best_estimate": self.best_experiment.pi_estimate,
                "best_error": self.best_experiment.error,
                "method_scores": self.method_scores.copy(),
                "total_iterations": self.num_experiments,
            }
            
            yield result
    
    def _build_result(self, total_time: float) -> Dict[str, Any]:
        """Build comprehensive result."""
        sorted_methods = sorted(
            self.method_scores.items(),
            key=lambda x: x[1]
        )
        
        leaderboard = []
        for method, error in sorted_methods:
            method_experiments = [e for e in self.experiments if e.method == method]
            best_for_method = min(method_experiments, key=lambda x: x.error)
            leaderboard.append({
                "method": method,
                "best_error": error,
                "best_estimate": best_for_method.pi_estimate,
                "parameter": best_for_method.parameter,
                "description": METHOD_DESCRIPTIONS.get(method, ""),
            })
        
        return {
            "experiments": [
                {
                    "method": e.method,
                    "parameter": e.parameter,
                    "pi_estimate": e.pi_estimate,
                    "error": e.error,
                    "timestamp": datetime.now().isoformat(),
                }
                for e in self.experiments
            ],
            "leaderboard": leaderboard,
            "best_method": self.best_experiment.method if self.best_experiment else "",
            "best_estimate": self.best_experiment.pi_estimate if self.best_experiment else 0,
            "best_error": self.best_experiment.error if self.best_experiment else 0,
            "best_parameter": self.best_experiment.parameter if self.best_experiment else 0,
            "total_experiments": len(self.experiments),
            "total_time": total_time,
            "method_info": get_method_info(),
        }
    
    def get_current_state(self) -> Dict[str, Any]:
        """Get current research state."""
        return {
            "experiments_run": len(self.experiments),
            "best_method": self.best_experiment.method if self.best_experiment else None,
            "best_error": self.best_experiment.error if self.best_experiment else None,
            "method_scores": self.method_scores,
        }
    
    def reset(self):
        """Reset the research agent."""
        self.experiments = []
        self.best_experiment = None
        self.method_scores = {}
        self.experiment_history = []


async def run_research(
    num_experiments: int = 50,
    exploration_rate: float = 0.3,
) -> Dict[str, Any]:
    """Run complete research process."""
    agent = ResearchAgent(
        num_experiments=num_experiments,
        exploration_rate=exploration_rate,
    )
    return agent.run_full_research()


async def stream_research(
    num_experiments: int = 50,
    exploration_rate: float = 0.3,
) -> AsyncGenerator[Dict[str, Any], None]:
    """Stream research process."""
    agent = ResearchAgent(
        num_experiments=num_experiments,
        exploration_rate=exploration_rate,
    )
    
    async for result in agent.stream_research():
        yield result
