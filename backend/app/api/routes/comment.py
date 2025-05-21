from fastapi import APIRouter, Depends, HTTPException, status
from odmantic import AIOEngine

from app.api import deps
from app.crud import crud_comment, crud_question
from app.models.comment import Comment
from app.models.question import Question
from app.models.user import User
from app.schemas.comment import (
    CommentCreate,
    CommentCreateRequest,
    CommentResponse,
    CommentUpdate,
    CommentUpdateRequest,
)

router = APIRouter(prefix="/comments", tags=["comments"])


@router.post("/create", response_model=CommentResponse)
async def create_comment(
    request_params: CommentCreateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    user_id = current_user.id
    question = await crud_question.get(
        engine, Question.id == request_params.question_id
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Question not found."
        )

    create_comment_in = CommentCreate(**request_params.model_dump(), user_id=user_id)
    new_comment = await crud_comment.create(engine, obj_in=create_comment_in)
    return CommentResponse.from_model(new_comment)


@router.put("/update", response_model=CommentResponse)
async def update_comment(
    request_params: CommentUpdateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    existing_comment = await crud_comment.get(engine, Comment.id == request_params.id)
    if not existing_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found."
        )

    if existing_comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to update this comment.",
        )

    update_comment_in = CommentUpdate(
        content=request_params.content,
        upvotes=request_params.upvotes,
        is_deleted=request_params.is_deleted,
    )
    updated_comment = await crud_comment.update(
        engine, db_obj=existing_comment, obj_in=update_comment_in
    )
    return CommentResponse.from_model(updated_comment)

    pass


@router.delete("/delete", response_model=CommentResponse)
async def delete_comment(
    id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    existing_comment = await crud_comment.get(engine, Comment.id == id)
    if not existing_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found."
        )

    if existing_comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this comment.",
        )

    delete_comment_in = CommentUpdate(is_deleted=True)
    deleted_comment = await crud_comment.update(
        engine, db_obj=existing_comment, obj_in=delete_comment_in
    )
    return CommentResponse.from_model(deleted_comment)
