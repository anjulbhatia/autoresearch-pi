import math
import random
from typing import Dict, Any, List
from dataclasses import dataclass


@dataclass
class PiExperiment:
    method: str
    parameter: int
    pi_estimate: float
    error: float


def polygon_approximation(number_of_sides: int) -> PiExperiment:
    if number_of_sides < 3:
        number_of_sides = 3
    
    interior_angle = math.pi * (number_of_sides - 2) / number_of_sides
    side_length = 2 * math.sin(math.pi / number_of_sides)
    perimeter = number_of_sides * side_length
    pi_estimate = perimeter / 2
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="polygon",
        parameter=number_of_sides,
        pi_estimate=pi_estimate,
        error=error
    )


def monte_carlo_estimation(number_of_samples: int) -> PiExperiment:
    if number_of_samples < 1:
        number_of_samples = 1
    
    inside_circle = 0
    for _ in range(number_of_samples):
        x = random.random()
        y = random.random()
        if x * x + y * y <= 1:
            inside_circle += 1
    
    pi_estimate = 4 * inside_circle / number_of_samples
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="monte_carlo",
        parameter=number_of_samples,
        pi_estimate=pi_estimate,
        error=error
    )


def leibniz_series(iterations: int) -> PiExperiment:
    if iterations < 1:
        iterations = 1
    
    pi_estimate = 0.0
    for i in range(iterations):
        term = 4 * ((-1) ** i) / (2 * i + 1)
        pi_estimate += term
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="leibniz",
        parameter=iterations,
        pi_estimate=pi_estimate,
        error=error
    )


def nilakantha_series(iterations: int) -> PiExperiment:
    if iterations < 1:
        iterations = 1
    
    pi_estimate = 3.0
    for i in range(2, 2 * iterations + 2, 2):
        term = 4 * ((-1) ** (i // 2)) / (i * (i + 1) * (i + 2))
        pi_estimate += term
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="nilakantha",
        parameter=iterations,
        pi_estimate=pi_estimate,
        error=error
    )


def run_experiment(method: str, parameter: int) -> PiExperiment:
    if method == "polygon":
        return polygon_approximation(parameter)
    elif method == "monte_carlo":
        return monte_carlo_estimation(parameter)
    elif method == "leibniz":
        return leibniz_series(parameter)
    elif method == "nilakantha":
        return nilakantha_series(parameter)
    else:
        raise ValueError(f"Unknown method: {method}")


def get_method_names() -> List[str]:
    return ["polygon", "monte_carlo", "leibniz", "nilakantha"]


def get_parameter_ranges() -> Dict[str, List[int]]:
    return {
        "polygon": [6, 12, 24, 48, 96, 192, 384, 768],
        "monte_carlo": [100, 500, 1000, 5000, 10000, 50000],
        "leibniz": [10, 50, 100, 500, 1000, 5000],
        "nilakantha": [5, 10, 20, 50, 100, 200]
    }
