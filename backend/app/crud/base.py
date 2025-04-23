from typing import Any, Dict, Generic, TypeVar, Union

from fastapi.encoders import jsonable_encoder
from odmantic import AIOEngine, Model
from odmantic.query import QueryExpression
from pydantic import BaseModel

ModelType = TypeVar("ModelType", bound=Model)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).

        **Parameters**

        * `model`: A ODMantic model class
        * `schema`: A Pydantic model (schema) class
        """
        self.model = model

    async def get(
        self, engine: AIOEngine, *queries: QueryExpression | dict | bool
    ) -> ModelType | None:
        return await engine.find_one(self.model, *queries)

    async def get_many(
        self,
        engine: AIOEngine,
        *queries: QueryExpression | dict | bool,
    ) -> list[ModelType]:  # noqa
        return await engine.find(self.model, *queries)

    def _prepare_model_for_create(self, obj_in: CreateSchemaType) -> ModelType:
        obj_in_data = jsonable_encoder(obj_in)
        return self.model(**obj_in_data)

    async def create(self, engine: AIOEngine, obj_in: CreateSchemaType) -> ModelType:  # noqa
        db_obj = self._prepare_model_for_create(obj_in)
        return await engine.save(db_obj)

    async def create_many(
        self, engine: AIOEngine, objs_in: list[CreateSchemaType]
    ) -> list[ModelType]:
        db_objs = [self._prepare_model_for_create(obj_in) for obj_in in objs_in]
        return await engine.save_all(db_objs)

    async def update(
        self,
        engine: AIOEngine,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]],  # noqa
    ) -> ModelType:
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        for field in obj_data:
            if field in update_data and field != "id":
                setattr(db_obj, field, update_data[field])
        await engine.save(db_obj)
        return db_obj

    async def delete(self, engine: AIOEngine, id: str) -> ModelType:
        obj = await self.get(engine, id)
        if obj:
            await engine.delete(obj)
        return obj
