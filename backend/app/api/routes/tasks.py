from fastapi import APIRouter

from app.tasks import example_task, myhome_get_housing_list

router = APIRouter()


@router.get("/example", status_code=202)
def trigger_example_task(word: str) -> dict[str, str]:
    """
    Triggers the example background task with the provided word.
    Returns immediately with a confirmation message.
    """
    task = example_task.delay(word)
    return {"message": "`example_task` task received", "task_id": task.id}


@router.get("/happyhome/housing-list", status_code=202)
def trigger_happyhome_get_housing_list():
    """
    Triggers the happyhome get housing list task.
    """
    task = myhome_get_housing_list.delay()
    return {"message": "`happyhome_get_housing_list` task received", "task_id": task.id}
