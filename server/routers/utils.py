from fastapi import Request

def get_job_start_time(request: Request):
    return request.app.state.config["job_start_time"]

def get_processing_duration(request: Request):
    return request.app.state.config["processing_duration"]