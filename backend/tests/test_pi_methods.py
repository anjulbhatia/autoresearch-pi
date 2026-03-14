import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import math
import pytest
from experiments.pi_methods import (
    PiExperiment,
    polygon_approximation,
    monte_carlo_estimation,
    leibniz_series,
    nilakantha_series,
    wallis_product,
    madhava_series,
    brent_salamin,
    ramanujan_series,
    chudnovsky_series,
    euler_convergence,
    borwein_algorithm,
    spigot_algorithm,
    bailey_borwein_plouffe,
    run_experiment,
    get_method_names,
    get_parameter_ranges,
    get_method_info,
    METHODS,
)


class TestPiMethods:
    """Test suite for PI approximation methods."""
    
    def test_polygon_basic(self):
        """Test basic polygon approximation."""
        result = polygon_approximation(6)
        assert isinstance(result, PiExperiment)
        assert result.method == "polygon"
        assert result.parameter == 6
        assert 2.5 < result.pi_estimate < 3.2
        assert result.error < 0.2
    
    def test_polygon_higher_sides(self):
        """Test polygon with more sides."""
        result = polygon_approximation(96)
        assert result.error < 0.001
    
    def test_polygon_error_decreases(self):
        """Test that more sides = better accuracy."""
        result_6 = polygon_approximation(6)
        result_96 = polygon_approximation(96)
        assert result_96.error < result_6.error
    
    def test_monte_carlo_basic(self):
        """Test Monte Carlo estimation."""
        result = monte_carlo_estimation(1000)
        assert isinstance(result, PiExperiment)
        assert result.method == "monte_carlo"
        assert result.parameter == 1000
        assert 2.5 < result.pi_estimate < 3.5
    
    def test_monte_carlo_more_samples(self):
        """Test Monte Carlo with more samples."""
        result = monte_carlo_estimation(10000)
        assert result.error < 0.1
    
    def test_leibniz_basic(self):
        """Test Leibniz series."""
        result = leibniz_series(100)
        assert isinstance(result, PiExperiment)
        assert result.method == "leibniz"
        assert result.error < 0.05
    
    def test_leibniz_convergence(self):
        """Test Leibniz series convergence."""
        result_10 = leibniz_series(10)
        result_1000 = leibniz_series(1000)
        assert result_1000.error < result_10.error
    
    def test_nilakantha_basic(self):
        """Test Nilakantha series."""
        result = nilakantha_series(10)
        assert isinstance(result, PiExperiment)
        assert result.error < 0.01
    
    def test_nilakantha_faster_convergence(self):
        """Test Nilakantha converges faster than Leibniz."""
        result_nilakantha = nilakantha_series(10)
        result_leibniz = leibniz_series(10)
        assert result_nilakantha.error < result_leibniz.error
    
    def test_wallis_product(self):
        """Test Wallis product."""
        result = wallis_product(100)
        assert isinstance(result, PiExperiment)
        assert 3.0 < result.pi_estimate < 3.2
    
    def test_madhava_series(self):
        """Test Madhava series."""
        result = madhava_series(5000)
        assert isinstance(result, PiExperiment)
        assert result.pi_estimate > 0
    
    def test_brent_salamin(self):
        """Test Brent-Salamin algorithm."""
        result = brent_salamin(5)
        assert isinstance(result, PiExperiment)
        assert result.error < 0.0001
    
    def test_ramanujan(self):
        """Test Ramanujan series."""
        result = ramanujan_series(3)
        assert isinstance(result, PiExperiment)
        assert result.error < 0.001
    
    def test_chudnovsky(self):
        """Test Chudnovsky algorithm."""
        result = chudnovsky_series(1)
        assert isinstance(result, PiExperiment)
        assert result.pi_estimate > 0
    
    def test_basel_problem(self):
        """Test Basel problem solution."""
        result = euler_convergence(100)
        assert isinstance(result, PiExperiment)
        assert result.error < 0.01
    
    def test_borwein(self):
        """Test Borwein algorithm."""
        result = borwein_algorithm(3)
        assert isinstance(result, PiExperiment)
        assert result.pi_estimate > 0
    
    def test_spigot(self):
        """Test spigot algorithm."""
        result = spigot_algorithm(10)
        assert isinstance(result, PiExperiment)
        assert result.pi_estimate > 0
    
    def test_bbp(self):
        """Test Bailey-Borwein-Plouffe formula."""
        result = bailey_borwein_plouffe(100)
        assert isinstance(result, PiExperiment)
        assert result.error < 0.001
    
    def test_run_experiment_all_methods(self):
        """Test run_experiment with all methods."""
        methods = get_method_names()
        for method in methods:
            params = get_parameter_ranges()[method]
            result = run_experiment(method, params[0])
            assert isinstance(result, PiExperiment)
            assert result.method == method
            assert result.error > 0
    
    def test_get_method_names(self):
        """Test getting all method names."""
        methods = get_method_names()
        assert len(methods) > 10
        assert "polygon" in methods
        assert "leibniz" in methods
        assert "ramanujan" in methods
    
    def test_get_parameter_ranges(self):
        """Test getting parameter ranges."""
        ranges = get_parameter_ranges()
        assert isinstance(ranges, dict)
        assert "polygon" in ranges
        assert len(ranges["polygon"]) > 0
    
    def test_get_method_info(self):
        """Test getting method information."""
        info = get_method_info()
        assert isinstance(info, dict)
        assert len(info) > 0
        assert "leibniz" in info
    
    def test_methods_dict(self):
        """Test METHODS dictionary."""
        assert "polygon" in METHODS
        assert "monte_carlo" in METHODS
        assert "ramanujan" in METHODS
        assert len(METHODS) > 10
    
    def test_all_methods_produce_valid_results(self):
        """Test all methods produce valid results."""
        methods = get_method_names()
        ranges = get_parameter_ranges()
        
        for method in methods:
            for param in ranges[method][:2]:
                result = run_experiment(method, param)
                assert result.pi_estimate > 0
                assert not math.isnan(result.pi_estimate)
                assert not math.isinf(result.pi_estimate)


class TestResearchAgent:
    """Test suite for Research Agent."""
    
    @pytest.mark.asyncio
    async def test_agent_basic(self):
        """Test basic research agent functionality."""
        from api.research_runner import ResearchAgent
        
        agent = ResearchAgent(num_experiments=10)
        result = agent.run_full_research()
        
        assert result["total_experiments"] == 10
        assert len(result["experiments"]) == 10
        assert result["best_error"] > 0
        assert result["best_method"] != ""
    
    @pytest.mark.asyncio
    async def test_agent_streaming(self):
        """Test research agent streaming."""
        from api.research_runner import stream_research
        
        count = 0
        async for result in stream_research(5):
            count += 1
            assert "method" in result
            assert "error" in result
            assert "best_error" in result
        
        assert count == 5
    
    @pytest.mark.asyncio
    async def test_agent_exploration(self):
        """Test that agent explores different methods."""
        from api.research_runner import ResearchAgent
        
        agent = ResearchAgent(num_experiments=20, exploration_rate=0.8)
        result = agent.run_full_research()
        
        methods_used = set(e["method"] for e in result["experiments"])
        assert len(methods_used) > 3
    
    @pytest.mark.asyncio
    async def test_agent_leaderboard(self):
        """Test agent produces leaderboard."""
        from api.research_runner import ResearchAgent
        
        agent = ResearchAgent(num_experiments=15)
        result = agent.run_full_research()
        
        assert "leaderboard" in result
        assert len(result["leaderboard"]) > 0
        assert result["leaderboard"][0]["best_error"] <= result["leaderboard"][-1]["best_error"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
