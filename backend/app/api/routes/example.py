from fastapi import APIRouter
from app.tasks import example_task

router = APIRouter()


@router.get("/example", status_code=202)
def trigger_example_task(word: str) -> dict[str, str]:
    """
    Triggers the example background task with the provided word.
    Returns immediately with a confirmation message.
    """
    task = example_task.delay(word)
    return {"message": "Task received", "task_id": task.id}
