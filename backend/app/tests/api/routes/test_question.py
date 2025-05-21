import pytest
from httpx import AsyncClient

from app.schemas.question import (
    QuestionCreate,
    QuestionCreateRequest,
    QuestionUpdateRequest,
)
from app.tests.conftest import mock_user_instance  # Ensure this is correctly imported


@pytest.mark.asyncio
async def test_create_question_endpoint(client: AsyncClient, test_factory):
    request_payload = QuestionCreateRequest(
        title="API Test Question Title",
        content="API test content for creating a question, ensuring it is long enough for validation.",
    )
    response = await client.post(
        "/api/v1/questions/create", json=request_payload.model_dump()
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == request_payload.title
    assert data["content"] == request_payload.content
    assert data["user_id"] == mock_user_instance.id  # Check against the mocked user ID
    assert "id" in data
    # Assuming test_factory or test setup handles cleanup


@pytest.mark.asyncio
async def test_get_all_questions_endpoint(client: AsyncClient, test_factory):
    # Create a couple of questions to ensure the endpoint returns a list
    q1_in = QuestionCreate(
        title="API Q1", content="Content Q1", user_id=mock_user_instance.id
    )
    q1 = await test_factory.create_question(q1_in)
    q2_in = QuestionCreate(
        title="API Q2", content="Content Q2", user_id=mock_user_instance.id
    )
    q2 = await test_factory.create_question(q2_in)

    response = await client.get("/api/v1/questions/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Check if the titles of the created questions are in the response
    titles_in_response = [q["title"] for q in data]
    assert q1.title in titles_in_response
    assert q2.title in titles_in_response
    # Assuming test_factory or test setup handles cleanup


@pytest.mark.asyncio
async def test_update_question_endpoint(client: AsyncClient, test_factory):
    # Create a question to update
    question_in = QuestionCreate(
        title="Original API Title",
        content="Original content for API update test.",
        user_id=mock_user_instance.id,
    )
    question = await test_factory.create_question(question_in)

    update_payload = QuestionUpdateRequest(
        id=question.id,
        title="Updated API Title",
        content="Updated API content.",
    )
    response = await client.put(
        "/api/v1/questions/update", json=update_payload.model_dump()
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == update_payload.title
    assert data["content"] == update_payload.content
    assert data["id"] == question.id
    # Assuming test_factory or test setup handles cleanup


@pytest.mark.asyncio
async def test_update_question_not_owner(client: AsyncClient, test_factory):
    # Create a question with a different user ID
    other_user_id = "other_user_id_123"
    question_in = QuestionCreate(
        title="Other User Question",
        content="This question belongs to another user.",
        user_id=other_user_id,  # Different from mock_user_instance.id
    )
    question = await test_factory.create_question(question_in)

    update_payload = QuestionUpdateRequest(
        id=question.id, title="Attempted Update Title"
    )
    response = await client.put(
        "/api/v1/questions/update", json=update_payload.model_dump()
    )
    assert response.status_code == 403  # Forbidden
    # Assuming test_factory or test setup handles cleanup


@pytest.mark.asyncio
async def test_delete_question_endpoint(client: AsyncClient, test_factory):
    # Create a question to delete
    question_in = QuestionCreate(
        title="API Question to Delete",
        content="This question will be deleted via API.",
        user_id=mock_user_instance.id,
    )
    question_to_delete = await test_factory.create_question(question_in)

    response = await client.delete(
        f"/api/v1/questions/delete?id={question_to_delete.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_deleted"] is True
    assert data["id"] == question_to_delete.id

    # Verify soft delete by trying to fetch it using the factory's get method
    # (assuming test_factory has a get_question method or similar)
    # If test_factory.get_question doesn't exist, this part needs adjustment
    # or we rely on direct crud.get if engine is available or passed to factory
    fetched_question = await test_factory.get_question(question_to_delete.id)
    assert fetched_question is not None
    assert fetched_question.is_deleted is True
    # Assuming test_factory or test setup handles cleanup


@pytest.mark.asyncio
async def test_delete_question_not_found(client: AsyncClient):
    non_existent_id = "nonexistentquestionid12345"  # Made more unique
    response = await client.delete(f"/api/v1/questions/delete?id={non_existent_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_question_not_owner(client: AsyncClient, test_factory):
    other_user_id = "other_user_456"
    question_in = QuestionCreate(
        title="Question by Another User for Delete Test",
        content="Content for delete authorization test.",
        user_id=other_user_id,
    )
    question_by_other = await test_factory.create_question(question_in)

    response = await client.delete(
        f"/api/v1/questions/delete?id={question_by_other.id}"
    )
    assert response.status_code == 403  # Forbidden
    # Assuming test_factory or test setup handles cleanup
