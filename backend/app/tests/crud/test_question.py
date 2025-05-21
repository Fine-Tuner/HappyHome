import pytest

from app.schemas.question import QuestionCreate, QuestionUpdate


@pytest.mark.asyncio
async def test_create_question(test_factory):
    question_in = QuestionCreate(
        title="Test Question Title",
        content="Test question content, should be long enough.",
        user_id="test_user_id",
    )
    question = await test_factory.create_question(question_in)
    assert question.title == question_in.title
    assert question.content == question_in.content
    assert question.user_id == "test_user_id"
    assert question.id is not None


@pytest.mark.asyncio
async def test_get_question(test_factory):
    question_in = QuestionCreate(
        title="Test Question for Get",
        content="Detailed content for getting a specific question.",
        user_id="test_user_id",
    )
    created_question = await test_factory.create_question(question_in)
    fetched_question = await test_factory.get_question(created_question.id)
    assert fetched_question is not None
    assert fetched_question.id == created_question.id
    assert fetched_question.title == "Test Question for Get"


@pytest.mark.asyncio
async def test_get_many_questions(test_factory):
    question1_in = QuestionCreate(
        title="Question 1",
        content="Content for question 1",
        user_id="test_user_id",
    )
    await test_factory.create_question(question1_in)
    question2_in = QuestionCreate(
        title="Question 2",
        content="Content for question 2",
        user_id="test_user_id",
    )
    await test_factory.create_question(question2_in)

    questions = await test_factory.get_many_questions()
    assert len(questions) == 2


@pytest.mark.asyncio
async def test_update_question(test_factory):
    question_in = QuestionCreate(
        title="Original Title",
        content="Original content for update test.",
        user_id="test_user_id",
    )
    question = await test_factory.create_question(question_in)
    question_update_in = QuestionUpdate(
        title="Updated Title", content="Updated content."
    )
    updated_question = await test_factory.update_question(
        question.id, question_update_in
    )
    assert updated_question is not None
    assert updated_question.title == "Updated Title"
    assert updated_question.content == "Updated content."
    assert updated_question.id == question.id


@pytest.mark.asyncio
async def test_delete_question_soft(test_factory):
    question_in = QuestionCreate(
        title="Question to be deleted",
        content="This question will be soft deleted.",
        user_id="test_user_id",
    )
    question = await test_factory.create_question(question_in)
    deleted_question = await test_factory.delete_question(question.id)

    assert deleted_question is not None
    assert deleted_question.is_deleted is True

    fetched_question = await test_factory.get_question(question.id)
    assert fetched_question is not None
    assert fetched_question.is_deleted is True


@pytest.mark.asyncio
async def test_update_question_non_existent(test_factory):
    question_update_in = QuestionUpdate(title="Non Existent Question Update")
    # Attempt to update a non-existent question
    updated_question = await test_factory.update_question(
        "nonexistentid", question_update_in
    )
    assert updated_question is None

    # Verify that the question was not created
    fetched_after_attempt = await test_factory.get_question("nonexistentid")
    assert fetched_after_attempt is None
