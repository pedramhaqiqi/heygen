from typing import Dict

from .task import Task


class TaskRegistry:
    def __init__(self):
        self.tasks: Dict[str, Task] = {}

    def add_task(self, task: Task):
        self.tasks[task.job_id] = task

    def get_task(self, job_id: str) -> Task:
        return self.tasks.get(job_id)
