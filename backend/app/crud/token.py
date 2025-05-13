from odmantic import AIOEngine

from app.crud.base import CRUDBase
from app.models.token import Token
from app.models.user import User
from app.schemas.token import RefreshTokenCreate, RefreshTokenUpdate


class CRUDToken(CRUDBase[Token, RefreshTokenCreate, RefreshTokenUpdate]):
    async def create(
        self, engine: AIOEngine, *, obj_in: RefreshTokenCreate, user_obj: User
    ) -> Token:
        db_obj = await engine.find_one(self.model, self.model.token == obj_in.token)
        if db_obj:
            if db_obj.user_id != user_obj.id:
                raise ValueError("Token mismatch between key and user.")
            return db_obj
        else:
            new_token = self.model(token=obj_in.token, user_id=user_obj.id)
            # multiple sessions for the same user are allowed
            user_obj.refresh_tokens.append(new_token.id)
            await engine.save_all([new_token, user_obj])
            return new_token

    async def get(self, engine: AIOEngine, *, token: str, user: User) -> Token | None:
        return await engine.find_one(
            self.model,
            (self.model.token == token) & (self.model.user_id == str(user.id)),
        )

    async def remove(self, engine: AIOEngine, *, db_obj: Token) -> None:
        users = []
        async for user in engine.find(User, User.refresh_tokens.in_([db_obj.id])):
            if db_obj.id in user.refresh_tokens:  # Check before removing
                user.refresh_tokens.remove(db_obj.id)
                users.append(user)
        if users:  # Only save if any user was actually modified
            await engine.save_all(users)
        await engine.delete(db_obj)  # Delete the token document itself


crud_token = CRUDToken(Token)
