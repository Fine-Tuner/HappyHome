import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from odmantic import AIOEngine

from app.core.config import settings
from app.core.security import create_refresh_token
from app.crud.token import crud_token
from app.crud.user import crud_user
from app.models.user import User
from app.schemas.token import RefreshTokenCreate
from app.schemas.user import UserCreate


@pytest_asyncio.fixture
async def active_user(engine: AIOEngine):
    user_in = UserCreate(
        google_id="test_google_id_login",
        email="test_login@example.com",
        display_name="Test Login User",
        is_active=True,
        is_superuser=False,
    )
    user = await crud_user.create(engine=engine, obj_in=user_in)
    yield user


@pytest.mark.asyncio
async def test_refresh_with_access_token(client: TestClient, active_user: User):
    # Create a valid access token (not a refresh token)
    from app.core.security import create_access_token

    access_token = create_access_token(subject=active_user.id)

    # Try to use the access token as a refresh token
    response = await client.post(
        f"{settings.API_V1_STR}/login/refresh",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 401
    assert "Refresh token required" in response.json()["detail"]


@pytest.mark.asyncio
async def test_revoke_token_success(
    client: TestClient, engine: AIOEngine, active_user: User
):
    """Test successful token revocation using the /login/revoke endpoint."""
    # 1. Create a refresh token for the user
    refresh_token_str = create_refresh_token(subject=active_user.id)
    token_in = RefreshTokenCreate(token=refresh_token_str)
    # Ensure we pass a fresh user instance to create, to reflect DB state
    user_for_create = await crud_user.get(engine, User.id == active_user.id)
    token_obj = await crud_token.create(
        engine=engine, obj_in=token_in, user_obj=user_for_create
    )
    assert token_obj is not None
    initial_token_id = token_obj.id

    # Verify user has the token ID before revocation
    db_user_before_revoke = await crud_user.get(engine, User.id == active_user.id)
    assert initial_token_id in db_user_before_revoke.refresh_tokens

    # 2. Make the revoke request
    response = await client.post(
        f"{settings.API_V1_STR}/login/revoke",
        headers={"Authorization": f"Bearer {refresh_token_str}"},
    )

    # 3. Assertions for the response
    assert response.status_code == 200
    data = response.json()
    assert data == {"msg": "Token revoked"}

    # 4. Verify the token no longer exists in the DB
    revoked_token_check = await crud_token.get(
        engine=engine, token=refresh_token_str, user=active_user
    )
    assert revoked_token_check is None, "Token should be removed from DB after revoke"

    # 5. Verify the token ID is removed from the user's list
    db_user_after_revoke = await crud_user.get(engine, User.id == active_user.id)
    assert initial_token_id not in db_user_after_revoke.refresh_tokens


@pytest.mark.asyncio
async def test_refresh_token_success(
    client: TestClient, engine: AIOEngine, active_user: User
):
    """Test successful token refresh using the /login/refresh endpoint."""
    # 1. Create an initial refresh token for the user
    original_refresh_token_str = create_refresh_token(subject=active_user.id)
    token_in = RefreshTokenCreate(token=original_refresh_token_str)
    await crud_token.create(engine=engine, obj_in=token_in, user_obj=active_user)

    # 2. Make the refresh request
    response = await client.post(
        f"{settings.API_V1_STR}/login/refresh",
        headers={"Authorization": f"Bearer {original_refresh_token_str}"},
    )

    # 3. Assertions for the response
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    new_refresh_token_str = data["refresh_token"]
    assert new_refresh_token_str != original_refresh_token_str

    # 4. Verify the new refresh token exists in the DB
    new_token_obj = await crud_token.get(
        engine=engine, token=new_refresh_token_str, user=active_user
    )

    assert new_token_obj is not None
    assert new_token_obj.token == new_refresh_token_str
    assert new_token_obj.token != original_refresh_token_str
    assert new_token_obj.user_id == active_user.id

    # 5. Verify the old refresh token is not in the DB
    old_token_check = await crud_token.get(
        engine=engine, token=original_refresh_token_str, user=active_user
    )
    assert old_token_check is None

    # 6. Ensure user's tokens are updated
    db_user = await crud_user.get(engine, User.id == active_user.id)
    assert len(db_user.refresh_tokens) == 1
    assert new_token_obj.id in db_user.refresh_tokens


@pytest.mark.asyncio
async def test_refresh_token_multi_device_scenario(
    client: TestClient, engine: AIOEngine, active_user: User
):
    """Test successful token refresh when a user has tokens from multiple devices/sessions."""
    # --- Device A: Create initial refresh token ---
    token_A_str = create_refresh_token(subject=active_user.id)
    token_A_in = RefreshTokenCreate(token=token_A_str)
    # Pass a fresh copy of active_user to crud_token.create to avoid unintended side effects
    # on the active_user instance if it's reused across multiple crud_token.create calls directly.
    user_for_token_A = await crud_user.get(engine, User.id == active_user.id)
    token_A_obj = await crud_token.create(
        engine=engine, obj_in=token_A_in, user_obj=user_for_token_A
    )

    # --- Device B: Create initial refresh token ---
    token_B_str = create_refresh_token(subject=active_user.id)
    token_B_in = RefreshTokenCreate(token=token_B_str)
    user_for_token_B = await crud_user.get(engine, User.id == active_user.id)
    token_B_obj = await crud_token.create(
        engine=engine, obj_in=token_B_in, user_obj=user_for_token_B
    )

    # --- Verification 1: User has both tokens ---
    db_user_step1 = await crud_user.get(engine, User.id == active_user.id)
    assert token_A_obj.id in db_user_step1.refresh_tokens
    assert token_B_obj.id in db_user_step1.refresh_tokens
    assert len(db_user_step1.refresh_tokens) == 2

    # --- Device A: Refresh token ---
    response_A = await client.post(
        f"{settings.API_V1_STR}/login/refresh",
        headers={"Authorization": f"Bearer {token_A_str}"},
    )
    assert response_A.status_code == 200
    data_A = response_A.json()
    new_token_A_str = data_A["refresh_token"]
    assert new_token_A_str != token_A_str

    # --- Verification 2: State after Device A refresh ---
    new_token_A_obj = await crud_token.get(
        engine=engine,
        token=new_token_A_str,
        user=active_user,  # active_user is fine for .get
    )
    assert new_token_A_obj is not None, "New token for Device A should exist in DB"

    old_token_A_check = await crud_token.get(
        engine=engine, token=token_A_str, user=active_user
    )
    assert old_token_A_check is None, "Original token for Device A should be revoked"

    token_B_check_after_A = await crud_token.get(
        engine=engine, token=token_B_str, user=active_user
    )
    assert token_B_check_after_A is not None, "Token for Device B should still be valid"
    assert token_B_check_after_A.id == token_B_obj.id

    db_user_step2 = await crud_user.get(engine, User.id == active_user.id)
    assert new_token_A_obj.id in db_user_step2.refresh_tokens, (
        "New Token A ID missing from user list"
    )
    assert token_A_obj.id not in db_user_step2.refresh_tokens, (
        "Old Token A ID still in user list"
    )
    assert token_B_obj.id in db_user_step2.refresh_tokens, (
        "Token B ID missing from user list after A's refresh"
    )
    assert len(db_user_step2.refresh_tokens) == 2, (
        "User token list count is incorrect after A's refresh"
    )

    # --- Device B: Refresh token (using its original token_B_str) ---
    response_B = await client.post(
        f"{settings.API_V1_STR}/login/refresh",
        headers={"Authorization": f"Bearer {token_B_str}"},
    )
    assert response_B.status_code == 200
    data_B = response_B.json()
    new_token_B_str = data_B["refresh_token"]
    assert new_token_B_str != token_B_str

    # --- Verification 3: State after Device B refresh ---
    new_token_B_obj = await crud_token.get(
        engine=engine, token=new_token_B_str, user=active_user
    )
    assert new_token_B_obj is not None, "New token for Device B should exist in DB"

    old_token_B_check = await crud_token.get(
        engine=engine, token=token_B_str, user=active_user
    )
    assert old_token_B_check is None, "Original token for Device B should be revoked"

    # Check Device A's newest token is still valid
    final_check_token_A = await crud_token.get(
        engine=engine, token=new_token_A_str, user=active_user
    )
    assert final_check_token_A is not None, "Device A's new token should still be valid"
    assert final_check_token_A.id == new_token_A_obj.id

    db_user_step3 = await crud_user.get(engine, User.id == active_user.id)
    assert new_token_A_obj.id in db_user_step3.refresh_tokens, (
        "New Token A ID missing from user list at the end"
    )
    assert new_token_B_obj.id in db_user_step3.refresh_tokens, (
        "New Token B ID missing from user list at the end"
    )
    assert token_A_obj.id not in db_user_step3.refresh_tokens
    assert token_B_obj.id not in db_user_step3.refresh_tokens
    assert len(db_user_step3.refresh_tokens) == 2, (
        "User token list count is incorrect at the end"
    )
