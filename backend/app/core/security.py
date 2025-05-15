import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt

from app.core.config import settings

"""
https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Authentication_Cheat_Sheet.md
https://passlib.readthedocs.io/en/stable/lib/passlib.hash.argon2.html
https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Password_Storage_Cheat_Sheet.md
https://blog.cloudflare.com/ensuring-randomness-with-linuxs-random-number-generator/
https://passlib.readthedocs.io/en/stable/lib/passlib.pwd.html
Specifies minimum criteria:
    - Use Argon2id with a minimum configuration of 15 MiB of memory, an iteration count of 2, and 1 degree of parallelism.
    - Passwords shorter than 8 characters are considered to be weak (NIST SP800-63B).
    - Maximum password length of 64 prevents long password Denial of Service attacks.
    - Do not silently truncate passwords.
    - Allow usage of all characters including unicode and whitespace.
"""


def create_access_token(*, subject: str | Any, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            seconds=settings.ACCESS_TOKEN_EXPIRE_SECONDS
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGO
    )
    return encoded_jwt


def create_refresh_token(*, subject: str | Any, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            seconds=settings.REFRESH_TOKEN_EXPIRE_SECONDS
        )
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "refresh": True,
        "jti": str(uuid.uuid4()),  # Unique identifier for the token
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGO
    )
    return encoded_jwt
