from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError
from odmantic import AIOEngine
from pydantic import ValidationError

from app.core.config import settings
from app.core.db import get_mongodb_client, get_mongodb_engine
from app.crud import crud_token, crud_user
from app.models.user import User
from app.schemas.token import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login/oauth")

# Define a mock user for local development
mock_dev_user = User(
    id="dev_user_id",  # Or generate a UUID: str(uuid.uuid4())
    google_id="dev_google_id",
    email="dev@example.com",
    is_active=True,
    is_superuser=False,  # Or True if you need superuser access for dev
    # Add any other essential fields that your User model has and your app might access
)


def db_generator() -> Generator:
    try:
        db = get_mongodb_client()
        yield db
    finally:
        pass


def engine_generator() -> Generator:
    try:
        engine = get_mongodb_engine()
        yield engine
    finally:
        pass


def get_token_payload(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGO])
        token_data = TokenPayload(**payload)
    except ExpiredSignatureError:
        # Specific handling for expired tokens
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (JWTError, ValidationError):
        # General handling for other JWT errors (invalid signature, malformed token, etc.)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data


async def override_get_current_user_for_local_dev(
    engine: AIOEngine = Depends(engine_generator),
) -> User:
    existing_user = await crud_user.get_by_email(engine, email=mock_dev_user.email)
    if existing_user:
        return existing_user

    # Try to get/create a dev user from DB
    dev_db_user = await crud_user.get_by_email(
        engine, email=mock_dev_user.email
    )  # This line is redundant with the one above, will be cleaned up.

    if not dev_db_user:
        from app.schemas.user import UserCreate

        user_in = UserCreate(
            google_id=mock_dev_user.google_id,
            email=mock_dev_user.email,
            is_active=mock_dev_user.is_active,
            is_superuser=mock_dev_user.is_superuser,
        )
        dev_db_user = await crud_user.create(engine=engine, obj_in=user_in)
    return dev_db_user


async def get_current_user(
    engine: AIOEngine = Depends(engine_generator),
    token: str = Depends(reusable_oauth2),
) -> User:
    token_data = get_token_payload(token)
    if token_data.refresh:
        # Using a refresh token where an access token is expected
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await crud_user.get(engine, User.id == token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not crud_user.is_active(current_user):
        # User is authenticated but not active -> Forbidden
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive"
        )
    return current_user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not crud_user.is_superuser(current_user):
        # User is authenticated but lacks privileges -> Forbidden
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges"
        )
    return current_user


async def get_refresh_user(
    engine: AIOEngine = Depends(engine_generator), token: str = Depends(reusable_oauth2)
) -> User:
    token_data = get_token_payload(token)
    if not token_data.refresh:
        # Using an access token where a refresh token is expected
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await crud_user.get(engine, User.id == token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if not crud_user.is_active(user):
        # User associated with refresh token is inactive -> Forbidden
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive"
        )
    # Check and revoke this refresh token
    token_obj = await crud_token.get(engine, token=token, user=user)
    if not token_obj:
        # Refresh token not found in DB (likely already used/revoked or never existed)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found or revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    await crud_token.remove(engine, db_obj=token_obj)

    # Make sure to revoke all other refresh tokens
    return await crud_user.get(engine, User.id == token_data.sub)
