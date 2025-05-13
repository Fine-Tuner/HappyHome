from odmantic import AIOEngine

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(self, engine: AIOEngine, *, email: str) -> User | None:
        return await engine.find_one(User, User.email == email)

    async def create(self, engine: AIOEngine, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            full_name=obj_in.full_name,
            is_superuser=obj_in.is_superuser,
            is_active=obj_in.is_active,
        )
        return await engine.save(db_obj)

    async def authenticate(self, engine: AIOEngine, *, email: str) -> User | None:
        user = await self.get_by_email(engine, email=email)
        if not user:
            return None
        if not self.is_active(user):
            return None
        return user

    @staticmethod
    def is_active(user: User) -> bool:
        return user.is_active

    @staticmethod
    def is_superuser(user: User) -> bool:
        return user.is_superuser


crud_user = CRUDUser(User)
