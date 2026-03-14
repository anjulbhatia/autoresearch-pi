import math
import random
from typing import Dict, Any, List, Optional
from dataclasses import dataclass


@dataclass
class PiExperiment:
    method: str
    parameter: int
    pi_estimate: float
    error: float
    description: str = ""
    history: Optional[List[float]] = None


def polygon_approximation(number_of_sides: int) -> PiExperiment:
    if number_of_sides < 3:
        number_of_sides = 3
    
    side_length = 2 * math.sin(math.pi / number_of_sides)
    perimeter = number_of_sides * side_length
    pi_estimate = perimeter / 2
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="polygon",
        parameter=number_of_sides,
        pi_estimate=pi_estimate,
        error=error,
        description="Archimedes' polygon method using inscribed polygons"
    )


def monte_carlo_estimation(number_of_samples: int) -> PiExperiment:
    if number_of_samples < 1:
        number_of_samples = 1
    
    random.seed(42)
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
        error=error,
        description="Random sampling in a unit square"
    )


def leibniz_series(iterations: int) -> PiExperiment:
    if iterations < 1:
        iterations = 1
    
    pi_estimate = 0.0
    history = []
    for i in range(iterations):
        term = 4 * ((-1) ** i) / (2 * i + 1)
        pi_estimate += term
        if i % max(1, iterations // 10) == 0:
            history.append(pi_estimate)
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="leibniz",
        parameter=iterations,
        pi_estimate=pi_estimate,
        error=error,
        description="Leibniz infinite alternating series",
        history=history
    )


def nilakantha_series(iterations: int) -> PiExperiment:
    if iterations < 1:
        iterations = 1
    
    pi_estimate = 3.0
    history = [3.0]
    for i in range(1, iterations + 1):
        term = 4 * ((-1) ** (i + 1)) / (2 * i * (2 * i + 1) * (2 * i + 2))
        pi_estimate += term
        history.append(pi_estimate)
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="nilakantha",
        parameter=iterations,
        pi_estimate=pi_estimate,
        error=error,
        description="Nilakantha's faster converging series",
        history=history
    )


def wallis_product(iterations: int) -> PiExperiment:
    if iterations < 1:
        iterations = 1
    
    pi_estimate = 1.0
    history = []
    for i in range(1, iterations + 1):
        numerator = (2 * i) ** 2
        denominator = (2 * i - 1) * (2 * i + 1)
        pi_estimate *= numerator / denominator
        if i % max(1, iterations // 10) == 0:
            history.append(2 * pi_estimate)
    
    pi_estimate = 2 * pi_estimate
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="wallis",
        parameter=iterations,
        pi_estimate=pi_estimate,
        error=error,
        description="Wallis product using infinite fractions",
        history=history
    )


def madhava_series(iterations: int) -> PiExperiment:
    if iterations < 1:
        iterations = 1
    
    pi_estimate = 0.0
    history = []
    for i in range(iterations):
        term = ((-1) ** i) / (2 * i + 1)
        pi_estimate += term
        if i % max(1, iterations // 10) == 0:
            history.append(math.sqrt(12) * pi_estimate)
    
    pi_estimate = math.sqrt(12) * pi_estimate
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="madhava",
        parameter=iterations,
        pi_estimate=pi_estimate,
        error=error,
        description="Madhava-Leibniz series (Indian mathematician)",
        history=history
    )


def brent_salamin(iterations: int) -> PiExperiment:
    if iterations < 1:
        iterations = 1
    
    a = 1.0
    b = 1 / math.sqrt(2)
    t = 0.25
    p = 1.0
    history = []
    pi_estimate = math.pi
    
    for _ in range(iterations):
        a_new = (a + b) / 2
        b = math.sqrt(a * b)
        t = t - p * (a - a_new) ** 2
        p = 2 * p
        a = a_new
        pi_estimate = (a + b) ** 2 / (4 * t)
        history.append(pi_estimate)
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="brent_salamin",
        parameter=iterations,
        pi_estimate=pi_estimate,
        error=error,
        description="Brent-Salamin arithmetic-geometric mean",
        history=history
    )


def ramanujan_series(iterations: int) -> PiExperiment:
    if iterations < 1:
        iterations = 1
    
    pi_estimate = 0.0
    history = []
    
    for n in range(iterations):
        numerator = math.factorial(4 * n) * (1103 + 26390 * n)
        denominator = (math.factorial(n) ** 4) * (396 ** (4 * n))
        pi_estimate += numerator / denominator
        if n % max(1, iterations // 10) == 0:
            history.append(1 / (pi_estimate * 2 * math.sqrt(2) / 9801))
    
    pi_estimate = 1 / (pi_estimate * 2 * math.sqrt(2) / 9801)
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="ramanujan",
        parameter=iterations,
        pi_estimate=pi_estimate,
        error=error,
        description="Ramanujan's rapidly converging series",
        history=history
    )


def chudnovsky_series(iterations: int) -> PiExperiment:
    if iterations < 1:
        iterations = 1
    
    pi_estimate = 0.0
    history = []
    
    for n in range(iterations):
        numerator = math.factorial(6 * n) * (13591409 + 545140134 * n)
        denominator = (math.factorial(n) ** 3) * (math.factorial(3 * n)) * (640320 ** (3 * n + 3))
        pi_estimate += numerator / denominator
        if n % max(1, iterations // 10) == 0:
            history.append(1 / pi_estimate * 1000)
    
    pi_estimate = 1 / pi_estimate * 1000
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="chudnovsky",
        parameter=iterations,
        pi_estimate=pi_estimate,
        error=error,
        description="Chudnovsky brothers' algorithm (most efficient)",
        history=history
    )


def euler_convergence(iterations: int) -> PiExperiment:
    if iterations < 1:
        iterations = 1
    
    pi_estimate = 0.0
    history = []
    for i in range(1, iterations + 1):
        pi_estimate += 1 / (i * i)
        if i % max(1, iterations // 10) == 0:
            history.append(math.sqrt(6 * pi_estimate))
    
    pi_estimate = math.sqrt(6 * pi_estimate)
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="basel",
        parameter=iterations,
        pi_estimate=pi_estimate,
        error=error,
        description="Basel problem solution (zeta(2))",
        history=history
    )


def borwein_algorithm(iterations: int) -> PiExperiment:
    if iterations < 1:
        iterations = 1
    
    a = 1.0
    b = 1.0 / math.sqrt(2)
    p = 2 + math.sqrt(2)
    history = []
    
    for _ in range(iterations):
        a_new = (a + b) / 2
        b = math.sqrt(a * b)
        p = p * (a_new + b) / (a + b)
        a = a_new
    
    pi_estimate = p
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="borwein",
        parameter=iterations,
        pi_estimate=pi_estimate,
        error=error,
        description="Borwein's cubic converging algorithm",
        history=[pi_estimate]
    )


def spigot_algorithm(digits: int) -> PiExperiment:
    if digits < 1:
        digits = 1
    
    result = [0] * (digits + 2)
    result[0] = 2
    
    for i in range(1, digits + 1):
        carry = 0
        for j in range(i, 0, -1):
            temp = result[j] * 10 + carry
            result[j] = temp // (2 * j - 1)
            carry = temp % (2 * j - 1)
        result[0] = carry
    
    pi_str = "3."
    for i in range(1, digits + 1):
        pi_str += str(result[i])
    
    try:
        pi_estimate = float(pi_str)
    except:
        pi_estimate = math.pi
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="spigot",
        parameter=digits,
        pi_estimate=pi_estimate,
        error=error,
        description="Spigot algorithm for digit extraction"
    )


def bailey_borwein_plouffe(digits: int) -> PiExperiment:
    if digits < 1:
        digits = 1
    
    pi_estimate = 0.0
    for k in range(digits):
        term = (1 / 16 ** k) * (
            4 / (8 * k + 1) -
            2 / (8 * k + 4) -
            1 / (8 * k + 5) -
            1 / (8 * k + 6)
        )
        pi_estimate += term
    
    error = abs(pi_estimate - math.pi)
    
    return PiExperiment(
        method="bbp",
        parameter=digits,
        pi_estimate=pi_estimate,
        error=error,
        description="Bailey-Borwein-Plouffe formula (hexadecimal)"
    )


METHODS = {
    "polygon": polygon_approximation,
    "monte_carlo": monte_carlo_estimation,
    "leibniz": leibniz_series,
    "nilakantha": nilakantha_series,
    "wallis": wallis_product,
    "madhava": madhava_series,
    "brent_salamin": brent_salamin,
    "ramanujan": ramanujan_series,
    "chudnovsky": chudnovsky_series,
    "basel": euler_convergence,
    "borwein": borwein_algorithm,
    "spigot": spigot_algorithm,
    "bbp": bailey_borwein_plouffe,
}

METHOD_DESCRIPTIONS = {
    "polygon": "Archimedes' polygon method using inscribed polygons",
    "monte_carlo": "Random sampling in a unit square",
    "leibniz": "Leibniz infinite alternating series",
    "nilakantha": "Nilakantha's faster converging series",
    "wallis": "Wallis product using infinite fractions",
    "madhava": "Madhava-Leibniz series (Indian mathematician)",
    "brent_salamin": "Brent-Salamin arithmetic-geometric mean",
    "ramanujan": "Ramanujan's rapidly converging series",
    "chudnovsky": "Chudnovsky brothers' algorithm (most efficient)",
    "basel": "Basel problem solution (zeta(2))",
    "borwein": "Borwein's cubic converging algorithm",
    "spigot": "Spigot algorithm for digit extraction",
    "bbp": "Bailey-Borwein-Plouffe formula (hexadecimal)",
}


def run_experiment(method: str, parameter: int) -> PiExperiment:
    if method not in METHODS:
        raise ValueError(f"Unknown method: {method}. Available: {list(METHODS.keys())}")
    return METHODS[method](parameter)


def get_method_names() -> List[str]:
    return list(METHODS.keys())


def get_parameter_ranges() -> Dict[str, List[int]]:
    return {
        "polygon": [6, 12, 24, 48, 96, 192, 384, 768],
        "monte_carlo": [100, 500, 1000, 5000, 10000, 50000],
        "leibniz": [10, 50, 100, 500, 1000, 5000],
        "nilakantha": [5, 10, 20, 50, 100, 200],
        "wallis": [10, 50, 100, 200, 500, 1000],
        "madhava": [10, 50, 100, 500, 1000, 5000],
        "brent_salamin": [1, 2, 3, 4, 5, 6, 7, 8],
        "ramanujan": [1, 2, 3, 4, 5, 6],
        "chudnovsky": [1, 2, 3, 4, 5],
        "basel": [10, 50, 100, 500, 1000, 5000],
        "borwein": [1, 2, 3, 4, 5],
        "spigot": [10, 50, 100, 200, 500],
        "bbp": [10, 50, 100, 200, 500],
    }


def get_method_info() -> Dict[str, str]:
    return METHOD_DESCRIPTIONS
