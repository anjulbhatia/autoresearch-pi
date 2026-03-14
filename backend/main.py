from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json

from api.research_runner import run_research, stream_research, ResearchAgent
from experiments.pi_methods import get_method_names, get_method_info


app = FastAPI(
    title="AutoResearch-Pi API",
    description="Automated research agent for π approximation",
    version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "AutoResearch-Pi API",
        "description": "Automated research agent that discovers mathematical methods to approximate π",
        "version": "0.2.0"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/methods")
async def get_methods():
    """Get all available PI approximation methods."""
    return {
        "methods": get_method_names(),
        "info": get_method_info(),
    }


@app.get("/research/run")
async def run_research_endpoint(
    num_experiments: int = 50,
    exploration_rate: float = 0.3,
):
    """Run complete research process and return all results."""
    result = await run_research(num_experiments, exploration_rate)
    return result


@app.get("/research/stream")
async def stream_research_endpoint(
    num_experiments: int = 50,
    exploration_rate: float = 0.3,
):
    """Stream research process in real-time."""
    async def event_generator():
        async for result in stream_research(num_experiments, exploration_rate):
            yield f"data: {json.dumps(result)}\n\n"
            await asyncio.sleep(0.05)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
