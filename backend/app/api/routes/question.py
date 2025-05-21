from fastapi import APIRouter, Depends, HTTPException, status
from odmantic import AIOEngine

from app.api import deps
from app.crud import (
    crud_question,  # Assuming you'll create/have crud_question similar to crud_comment
)
from app.models.question import Question
from app.models.user import User
from app.schemas.question import (  # QuestionDelete # We'll use ID from path for delete
    QuestionCreate,
    QuestionCreateRequest,
    QuestionResponse,
    QuestionUpdate,
    QuestionUpdateRequest,
)

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post(
    "/create", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED
)
async def create_question(
    request_params: QuestionCreateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Create a new question.
    """
    question_in = QuestionCreate(**request_params.model_dump(), user_id=current_user.id)
    new_question = await crud_question.create(engine, obj_in=question_in)
    return QuestionResponse.from_model(new_question)


@router.get("/", response_model=list[QuestionResponse])
async def get_all_questions(
    skip: int = 0,
    limit: int = 100,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Retrieve all non-deleted questions with pagination.
    """
    questions = await crud_question.get_many(
        engine,
        Question.is_deleted == False,
        skip=skip,
        limit=limit,
        sort=Question.created_at.desc(),
    )
    return [QuestionResponse.from_model(question) for question in questions]


@router.put("/update", response_model=QuestionResponse)
async def update_question(
    request_params: QuestionUpdateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Update an existing question. Only the owner can update their question.
    """
    existing_question = await crud_question.get(
        engine, Question.id == request_params.id
    )
    if not existing_question or existing_question.is_deleted:
        raise HTTPException(status_code=404, detail="Question not found.")

    if existing_question.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to update this question.",
        )

    question_update_in = QuestionUpdate(
        title=request_params.title,
        content=request_params.content,
        upvotes=request_params.upvotes,
    )

    updated_question = await crud_question.update(
        engine, db_obj=existing_question, obj_in=question_update_in
    )
    return updated_question


@router.delete("/delete", response_model=QuestionResponse)
async def delete_question(
    id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Mark a question as deleted. Only the owner can delete their question.
    This performs a soft delete.
    """
    existing_question = await crud_question.get(engine, Question.id == id)
    if not existing_question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Question not found."
        )

    if existing_question.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this question.",
        )

    question_delete_in = QuestionUpdate(is_deleted=True)
    deleted_question = await crud_question.update(
        engine, db_obj=existing_question, obj_in=question_delete_in
    )
    return QuestionResponse.from_model(deleted_question)
