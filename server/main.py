from fastapi import FastAPI
from server.routers.reset import router as reset_router
from server.routers.status import router as status_router
from server.core.config import config
app = FastAPI()

# Shared state between endpoints
app.state.config = config

app.include_router(reset_router)
app.include_router(status_router)