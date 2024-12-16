from fastapi import APIRouter, Request
from pydantic import BaseModel
from server.core.task import Task

router = APIRouter()


class CreateJobRequest(BaseModel):
    processing_duration: float
    should_error: bool


@router.post("/jobs")
def create_job(req: Request, body: CreateJobRequest):
    task = Task(
        processing_duration=body.processing_duration, should_error=body.should_error
    )
    req.app.state.task_registry.add_task(task)
    return {"job_id": task.job_id, "status": task.get_status()}
