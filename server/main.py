from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from server.core.rate_limit import limiter
from server.core.state import TaskRegistry
from server.routers.jobs import router as jobs_router
from server.routers.status import router as status_router

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.state.task_registry = TaskRegistry()

app.include_router(status_router)
app.include_router(jobs_router)