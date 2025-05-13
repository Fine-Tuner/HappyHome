from typing import Any

from fastapi import APIRouter, Depends
from odmantic import AIOEngine

from app.api import deps
from app.core.security import create_access_token, create_refresh_token
from app.crud import crud_token
from app.models.user import User
from app.schemas.msg import Msg
from app.schemas.token import RefreshTokenCreate, Token

router = APIRouter(prefix="/login", tags=["login"])


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
