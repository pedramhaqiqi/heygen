import time

from fastapi import APIRouter, Request
from server.routers.utils import get_job_start_time, get_processing_duration
import asyncio

router = APIRouter()


@router.get("/status")
async def get_status(request: Request):
    """Endpoint to check the status of the job."""
    job_start_time = get_job_start_time(request)
    processing_duration = get_processing_duration(request)

    long_poll_timeout = 5.0
    poll_interval = 0.5

    start_wait = time.time()

    while time.time() - start_wait < long_poll_timeout:
        elapsed = time.time() - job_start_time
        if elapsed >= processing_duration:
            return {"result": "completed"}

        await asyncio.sleep(poll_interval)

    return {"result": "pending"}
