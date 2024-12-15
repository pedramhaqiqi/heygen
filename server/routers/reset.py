import time

from fastapi import APIRouter, Request

router = APIRouter()


@router.post("/reset")
def reset_job(request: Request):
    """Endpoint to reset the job start time."""
    request.app.state.config["job_start_time"] = time.time()  # Reset the job start time
    return {"result": "Job start time has been reset"}
