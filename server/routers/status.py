import asyncio
import time
from fastapi import APIRouter, Request, HTTPException, Query
from server.core.state import TaskRegistry
from server.core.task import TaskStatus

router = APIRouter()

@router.get("/status")
async def get_status(request: Request, job_id: str = Query(...)):
    registry: TaskRegistry = request.app.state.task_registry
    task = registry.get_task(job_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task with job_id {job_id} not found")

    long_poll_timeout = 5.0
    poll_interval = 0.5
    start_wait = time.time()

    while time.time() - start_wait < long_poll_timeout:
        status = task.get_status()
        if status in [TaskStatus.COMPLETED, TaskStatus.ERROR]:
            return {"result": status}
        await asyncio.sleep(poll_interval)

    return {"result": TaskStatus.PENDING}