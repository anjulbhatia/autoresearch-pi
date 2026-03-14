# AutoResearch-Pi

An automated research agent that rediscovers multiple mathematical methods to approximate π.

What took humanity centuries, an AI lab reproduces in minutes.

## Overview

AutoResearch-Pi is a visual research demo inspired by Andrej Karpathy's AutoResearch project. Instead of training ML models, the research loop experiments with different mathematical approaches to approximate π and determines which method converges fastest.

### Methods Explored

- **Polygon Approximation (Archimedes)** - Using inscribed polygons
- **Monte Carlo Estimation** - Random sampling inside a square
- **Leibniz Series** - Alternating infinite series
- **Nilakantha Series** - Faster converging infinite series

## Repository Structure

```
autoresearch-pi
├── frontend/          # Next.js frontend with dashboard
│   ├── app/           # App router pages
│   └── components/    # UI components
└── backend/           # Python FastAPI backend
    ├── experiments/   # π approximation methods
    ├── api/          # Research runner
    └── main.py       # FastAPI server
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
bun run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /research/run` - Run all experiments at once
- `GET /research/stream` - Stream experiment results in real-time

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS v4, Recharts, Framer Motion, shadcn/ui
- **Backend**: Python 3.12, FastAPI, uv, NumPy

## Credits

Inspired by [Andrej Karpathy's AutoResearch](https://github.com/karpathy/autoresearch)
