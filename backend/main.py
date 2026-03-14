from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json

from api.research_runner import run_research, stream_research


app = FastAPI(
    title="AutoResearch-Pi API",
    description="API for automated π approximation research",
    version="0.1.0"
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
        "description": "Automated research agent that rediscovers mathematical methods to approximate π"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/research/run")
async def run_research_endpoint(num_experiments: int = 30):
    result = await run_research(num_experiments)
    return result


@app.get("/research/stream")
async def stream_research_endpoint(num_experiments: int = 30):
    async def event_generator():
        async for result in stream_research(num_experiments):
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
