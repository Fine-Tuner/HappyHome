import pytest

from app.schemas.comment import CommentCreate, CommentUpdate


@pytest.mark.asyncio
async def test_create_comment(test_factory):
    comment_in = CommentCreate(
        question_id="test_q_id_create",
        content="This is a test comment, long enough to pass validation.",
        user_id="test_user_create",
    )
    comment = await test_factory.create_comment(comment_in)
    assert comment is not None
    assert comment.question_id == "test_q_id_create"
    assert comment.content == "This is a test comment, long enough to pass validation."
    assert comment.user_id == "test_user_create"
    assert comment.id is not None
    assert comment.upvotes == 0
    assert comment.is_deleted is False


@pytest.mark.asyncio
async def test_get_comment(test_factory):
    comment_in = CommentCreate(
        question_id="test_q_id_get",
        content="Test comment for get operation.",
        user_id="test_user_get",
    )
    created_comment = await test_factory.create_comment(comment_in)
    assert created_comment is not None

    fetched_comment = await test_factory.get_comment(created_comment.id)
    assert fetched_comment is not None
    assert fetched_comment.id == created_comment.id
    assert fetched_comment.content == "Test comment for get operation."
    assert fetched_comment.user_id == "test_user_get"


@pytest.mark.asyncio
async def test_get_many_comments_by_question_id(test_factory):
    question_id_for_test = "q_id_for_many_comments"
    # Create a couple of comments for the same question
    comment1_in = CommentCreate(
        question_id=question_id_for_test,
        content="First comment for question.",
        user_id="user1_many",
    )
    await test_factory.create_comment(comment1_in)

    comment2_in = CommentCreate(
        question_id=question_id_for_test,
        content="Second comment for question.",
        user_id="user2_many",
    )
    await test_factory.create_comment(comment2_in)

    # Create a comment for a different question to ensure filtering works
    other_question_id = "other_q_id_many"
    comment3_in = CommentCreate(
        question_id=other_question_id,
        content="Comment for another question.",
        user_id="user3_many",
    )
    await test_factory.create_comment(comment3_in)

    comments = await test_factory.get_many_comments_by_question_id(question_id_for_test)
    assert comments is not None
    assert len(comments) == 2
    for comment in comments:
        assert comment.question_id == question_id_for_test

    # Verify that the comment for the other question is not included
    all_comments_for_mock_q = await test_factory.get_many_comments_by_question_id(
        question_id_for_test
    )
    found_other_comment = False
    for c in all_comments_for_mock_q:
        if c.question_id == other_question_id:
            found_other_comment = True
            break
    assert not found_other_comment


@pytest.mark.asyncio
async def test_update_comment(test_factory):
    comment_in = CommentCreate(
        question_id="test_q_id_update",
        content="Original content for update test.",
        user_id="test_user_update",
    )
    comment = await test_factory.create_comment(comment_in)
    assert comment is not None

    comment_update_in = CommentUpdate(
        content="Updated content for the comment.", upvotes=5, is_deleted=True
    )
    updated_comment = await test_factory.update_comment(comment.id, comment_update_in)
    assert updated_comment is not None
    assert updated_comment.id == comment.id
    assert updated_comment.content == "Updated content for the comment."
    assert updated_comment.upvotes == 5
    assert updated_comment.is_deleted is True
    assert updated_comment.user_id == "test_user_update"


@pytest.mark.asyncio
async def test_update_comment_non_existent(test_factory):
    comment_update_in = CommentUpdate(content="Trying to update non-existent comment.")
    updated_comment = await test_factory.update_comment(
        "nonexistentcommentid_update_test", comment_update_in
    )
    assert updated_comment is None
