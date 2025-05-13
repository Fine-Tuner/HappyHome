from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi_sso.sso.google import GoogleSSO
from odmantic import AIOEngine

from app.api import deps
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.crud import crud_token, crud_user
from app.models.user import User
from app.schemas.msg import Msg
from app.schemas.token import RefreshTokenCreate, Token
from app.schemas.user import UserCreate, UserUpdate

router = APIRouter(prefix="/login", tags=["login"])

google_sso = GoogleSSO(
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    redirect_uri=settings.BACKEND_CALLBACK_URL,
    allow_insecure_http=settings.ENVIRONMENT
    == "local",  # Allow insecure HTTP for local development
)


"""
https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Authentication_Cheat_Sheet.md
Specifies minimum criteria:
    - Change password must require current password verification to ensure that it's the legitimate user.
    - Login page and all subsequent authenticated pages must be exclusively accessed over TLS or other strong transport.
    - An application should respond with a generic error message regardless of whether:
        - The user ID or password was incorrect.
        - The account does not exist.
        - The account is locked or disabled.
    - Code should go through the same process, no matter what, allowing the application to return in approximately
      the same response time.
    - In the words of George Orwell, break these rules sooner than do something truly barbaric.

See `security.py` for other requirements.
"""


@router.post("/refresh", response_model=Token)
async def refresh_token(
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_refresh_user),
) -> Any:
    """
    Refresh tokens for future requests
    """
    refresh_token = create_refresh_token(subject=current_user.id)
    await crud_token.create(
        engine=engine,
        obj_in=RefreshTokenCreate(token=refresh_token),
        user_obj=current_user,
    )
    return {
        "access_token": create_access_token(subject=current_user.id),
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/revoke", response_model=Msg)
async def revoke_token(
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_refresh_user),
) -> Any:
    """
    Revoke a refresh token
    """
    return {"msg": "Token revoked"}


@router.get("/google/login")
async def google_login():
    async with google_sso:
        return await google_sso.get_login_redirect(
            params={"prompt": "consent", "access_type": "offline"}
        )


@router.post("/google/callback")
async def google_callback(
    request: Request,
    engine: AIOEngine = Depends(deps.engine_generator),
) -> RedirectResponse:
    async with google_sso:
        sso_user = await google_sso.verify_and_process(request)
        if not sso_user:
            raise HTTPException(
                status_code=400,
                detail="SSO user verification failed. Please try again.",
            )

    user: User | None = None

    if sso_user.id:
        user = await engine.find_one(User, User.google_id == sso_user.id)

    if user:
        user_in = UserUpdate(
            email=sso_user.email,
            first_name=sso_user.first_name,
            last_name=sso_user.last_name,
            display_name=sso_user.display_name,
            picture=sso_user.picture,
        )
        await crud_user.update(engine, db_obj=user, obj_in=user_in)
    else:
        user_in = UserCreate(
            google_id=sso_user.id,
            email=sso_user.email,
            first_name=sso_user.first_name,
            last_name=sso_user.last_name,
            display_name=sso_user.display_name,
            picture=sso_user.picture,
        )
        user = await crud_user.create(engine, obj_in=user_in)

    access_token = create_access_token(subject=user.id)
    refresh_token_str = create_refresh_token(subject=user.id)

    await crud_token.create(
        engine=engine,
        obj_in=RefreshTokenCreate(token=refresh_token_str),
        user_obj=user,
    )

    # Set cookies and redirect to the frontend
    response = RedirectResponse(
        url=settings.FRONTEND_HOST, status_code=303
    )  # Use 303 for POST -> GET redirect

    secure_cookie = settings.ENVIRONMENT == "local"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=secure_cookie,
        path="/",  # Access token available for all paths
        max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        samesite="lax",
        secure=secure_cookie,
        path="/api/v1/login/refresh",  # More specific path for refresh token is a good practice
        max_age=settings.REFRESH_TOKEN_EXPIRE_SECONDS,
    )
    return response
