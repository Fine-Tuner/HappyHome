from uuid import uuid4

from odmantic import Field, Model


class Token(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    token: str
    user_id: str
