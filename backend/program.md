# AutoResearch-Pi Program

## Goal
Discover increasingly accurate approximations of π using different mathematical methods.

## Available Methods
- **Polygon Approximation**: Using inscribed polygons (Archimedes method)
- **Monte Carlo Simulation**: Random sampling inside a square
- **Leibniz Series**: Alternating infinite series
- **Nilakantha Series**: Faster converging infinite series

## Experiment Loop
1. Choose a method from the available methods
2. Run experiment with a specific parameter value
3. Measure approximation error (|π_estimate - π|)
4. Compare with previous experiments
5. Attempt improved configuration

## Optimization Objective
Minimize: |π_estimate - π|

## Output
Return best performing method and configuration with its error metric.
