from fastapi import FastAPI
from server.routers.reset import router as reset_router
from server.routers.status import router as status_router
from server.core.state import TaskRegistry
from server.routers.jobs import router as jobs_router

app = FastAPI()

app.state.task_registry = TaskRegistry()

app.include_router(reset_router)
app.include_router(status_router)
app.include_router(jobs_router)