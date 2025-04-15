from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND_URL,
    include=["app.tasks"],  # List of modules to import when the worker starts
)

celery_app.conf.update(
    task_track_started=True,
    # Add other Celery configurations here if needed
    beat_schedule={
        "run-example-task-every-minute": {
            "task": "app.tasks.example_task",  # Correct task path
            "schedule": crontab(minute="*"),
            "args": ("periodic execution",),  # Pass arguments as a tuple
        },
        # Add more scheduled tasks here
    },
)
