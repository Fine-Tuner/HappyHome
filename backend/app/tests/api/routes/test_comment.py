import pytest
from httpx import AsyncClient

from app.schemas.comment import (
    CommentCreate,
    CommentCreateRequest,
    CommentUpdateRequest,
)
from app.schemas.question import QuestionCreate


@pytest.mark.asyncio
async def test_create_comment_endpoint(client: AsyncClient, test_factory):
    question_in = QuestionCreate(
        title="API Test Question for Create Comment Endpoint",
        content="This question is for testing comment creation endpoint.",
        user_id="123",  # Align with mocked authenticated user ID from conftest.py
    )
    created_question = await test_factory.create_question(question_in)
    assert created_question is not None

    request_payload = CommentCreateRequest(
        question_id=created_question.id,
        content="API test comment content for create endpoint, needs to be long enough.",
    )
    response = await client.post(
        "/api/v1/comments/create", json=request_payload.model_dump()
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == request_payload.content
    assert data["question_id"] == created_question.id
    assert data["user_id"] == "123"  # Mocked authenticated user ID
    assert "id" in data


@pytest.mark.asyncio
async def test_create_comment_for_nonexistent_question(client: AsyncClient):
    api_request_payload = CommentCreateRequest(
        question_id="nonexistent_q_id_create_comment_test",
        content="Comment for a question that does not exist (API test).",
    )
    response = await client.post(
        "/comments/create", json=api_request_payload.model_dump()
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_comment_endpoint(client: AsyncClient, test_factory):
    question_in = QuestionCreate(
        title="API Test Question for Update Comment Endpoint",
        content="This question is for testing comment updates endpoint.",
        user_id="user_q_update_comment_endpoint",  # Unique user for question
    )
    created_question = await test_factory.create_question(question_in)
    assert created_question is not None

    # Comment created by the mocked authenticated user (ID "123")
    comment_create_schema = CommentCreate(
        question_id=created_question.id,
        content="Original API comment for update endpoint.",
        user_id="123",
    )
    created_comment = await test_factory.create_comment(comment_create_schema)
    assert created_comment is not None

    update_api_payload = CommentUpdateRequest(
        id=created_comment.id,
        content="Updated API comment content for update endpoint.",
    )
    # API call made by mocked user (ID "123"), who is the owner
    response = await client.put(
        "/api/v1/comments/update", json=update_api_payload.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == update_api_payload.content
    assert data["id"] == created_comment.id
    # No cleanup


@pytest.mark.asyncio
async def test_update_comment_not_owner(client: AsyncClient, test_factory):
    question_in = QuestionCreate(
        title="API Test Question for Update Comment Not Owner",
        content="This question is for testing comment update auth (not owner).",
        user_id="user_q_update_comment_not_owner",  # Unique user for question
    )
    created_question = await test_factory.create_question(question_in)
    assert created_question is not None

    owner_of_comment_id = "comment_owner_for_update_auth_test"
    # Comment created by a different user
    comment_create_schema = CommentCreate(
        question_id=created_question.id,
        user_id=owner_of_comment_id,
        content="Comment by actual owner for update auth test.",
    )
    created_comment_by_owner = await test_factory.create_comment(comment_create_schema)
    assert created_comment_by_owner is not None

    update_api_payload = CommentUpdateRequest(
        id=created_comment_by_owner.id,
        content="Attempted update by non-owner (mocked user '123').",
    )
    # API call made by mocked user (ID "123"), who is NOT the owner
    response = await client.put(
        "/api/v1/comments/update", json=update_api_payload.model_dump(exclude_none=True)
    )
    assert response.status_code == 403
    # No cleanup


@pytest.mark.asyncio
async def test_delete_comment_endpoint(client: AsyncClient, test_factory):
    question_in = QuestionCreate(
        title="API Test Question for Delete Comment Endpoint",
        content="This question is for testing comment deletion endpoint.",
        user_id="user_q_delete_comment_endpoint",  # Unique user for question
    )
    created_question = await test_factory.create_question(question_in)
    assert created_question is not None

    # Comment created by the mocked authenticated user (ID "123")
    comment_create_schema = CommentCreate(
        question_id=created_question.id,
        user_id="123",
        content="API comment to be deleted by its owner (mocked user '123').",
    )
    created_comment_to_delete = await test_factory.create_comment(comment_create_schema)
    assert created_comment_to_delete is not None

    # API call made by mocked user (ID "123"), who is the owner
    response = await client.delete(
        f"/api/v1/comments/delete?id={created_comment_to_delete.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_deleted"] is True
    assert data["id"] == created_comment_to_delete.id

    fetched_comment_model = await test_factory.get_comment(created_comment_to_delete.id)
    assert fetched_comment_model is not None
    assert fetched_comment_model.is_deleted is True
    # No cleanup


@pytest.mark.asyncio
async def test_delete_comment_not_found(client: AsyncClient):
    non_existent_comment_id = "nonexistent_comment_id_for_delete_test"
    response = await client.delete(
        f"/api/v1/comments/delete?id={non_existent_comment_id}"
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_comment_not_owner(client: AsyncClient, test_factory):
    question_in = QuestionCreate(
        title="API Test Question for Delete Comment Not Owner",
        content="This question is for testing comment delete auth (not owner).",
        user_id="user_q_delete_comment_not_owner",  # Unique user for question
    )
    created_question = await test_factory.create_question(question_in)
    assert created_question is not None

    owner_of_comment_id = "comment_owner_for_delete_auth_test"
    # Comment created by a different user
    comment_create_schema = CommentCreate(
        question_id=created_question.id,
        user_id=owner_of_comment_id,
        content="Comment by actual owner for delete auth test (mocked user '123' will try to delete).",
    )
    created_comment_by_owner = await test_factory.create_comment(comment_create_schema)
    assert created_comment_by_owner is not None

    # API call made by mocked user (ID "123"), who is NOT the owner
    response = await client.delete(
        f"/api/v1/comments/delete?id={created_comment_by_owner.id}"
    )
    assert response.status_code == 403
    # No cleanup
