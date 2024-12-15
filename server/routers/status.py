import time

from fastapi import APIRouter, Request
from server.routers.utils import get_job_start_time, get_processing_duration

router = APIRouter()


@router.get("/status")
def get_status(request: Request):
    """Endpoint to check the status of the job."""
    job_start_time = get_job_start_time(request)
    processing_duration = get_processing_duration(request)
    elapsed = time.time() - job_start_time
    if elapsed < processing_duration:
        return {"result": "pending"}
    return {"result": "completed"}
