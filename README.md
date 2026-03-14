# AutoResearch-Pi

An automated research agent that rediscovers multiple mathematical methods to approximate π.

What took humanity centuries, an AI lab reproduces in minutes.

## Overview

AutoResearch-Pi is a visual research demo inspired by Andrej Karpathy's AutoResearch project. The research agent automatically explores different mathematical approaches to approximate π, measures errors, compares methods, and selects the best performing approach.

### Methods Explored (13 Total)

- **Polygon Approximation (Archimedes)** - Using inscribed polygons
- **Monte Carlo Estimation** - Random sampling inside a square
- **Leibniz Series** - Alternating infinite series
- **Nilakantha Series** - Faster converging infinite series
- **Wallis Product** - Infinite fraction product
- **Madhava Series** - Indian mathematician's series
- **Brent-Salamin Algorithm** - Arithmetic-geometric mean
- **Ramanujan's Series** - Rapidly converging series
- **Chudnovsky Algorithm** - Most efficient series
- **Basel Problem** - Zeta(2) solution
- **Borwein Algorithm** - Cubic converging algorithm
- **Spigot Algorithm** - Digit extraction
- **BBP Formula** - Bailey-Borwein-Plouffe

## Repository Structure

```
autoresearch-pi
├── frontend/          # Next.js frontend with dashboard
│   ├── app/          # App router pages
│   └── components/    # UI components
├── backend/          # Python FastAPI backend
│   ├── experiments/  # π approximation methods (13 algorithms)
│   ├── api/         # Research agent runner
│   ├── tests/       # Pytest test suite
│   └── main.py      # FastAPI server
```

## Quick Start

### Prerequisites

- Bun (for frontend)
- Python 3.12+ with uv

### Backend Setup

```bash
cd backend
uv sync
```

### Run Backend

```bash
cd backend
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
bun install
```

Configure the API URL (optional - defaults to http://localhost:8000):

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

Run the frontend:

```bash
bun run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /methods` - Get all available methods
- `GET /research/run` - Run all experiments at once
- `GET /research/stream` - Stream experiment results in real-time

## Running Tests

```bash
cd backend
uv run pytest tests/ -v
```

## Features

- **Research Agent**: Epsilon-greedy exploration strategy
- **Real-time Streaming**: Live experiment results via SSE
- **13 PI Algorithms**: From Archimedes to Chudnovsky
- **Animated Visualizations**: Polygon, Monte Carlo, Series animations
- **Leaderboard**: Compare method performance
- **Test Suite**: 28 passing tests

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS v4, Recharts, Framer Motion, shadcn/ui
- **Backend**: Python 3.12, FastAPI, uv, NumPy, pytest

## Credits

Inspired by [Andrej Karpathy's AutoResearch](https://github.com/karpathy/autoresearch)
