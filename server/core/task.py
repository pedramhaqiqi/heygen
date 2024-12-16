import time
import uuid
from dataclasses import dataclass


@dataclass(frozen=True)
class TaskStatus:
    PENDING = "pending"
    COMPLETED = "completed"
    ERROR = "error"

class Task:
    def __init__(self, processing_duration: float, should_error: bool = False):
        self.job_id = str(uuid.uuid4())
        self.start_time = time.time()
        self.processing_duration = processing_duration
        self.should_error = should_error
        self._status = TaskStatus.PENDING  

    def get_status(self):
        if self._status in [TaskStatus.COMPLETED, TaskStatus.ERROR]:
            return self._status

        elapsed = time.time() - self.start_time
        if elapsed >= self.processing_duration:
            if self.should_error:
                self._status = TaskStatus.ERROR
            else:
                self._status = TaskStatus.COMPLETED
        return self._status