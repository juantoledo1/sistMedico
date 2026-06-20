from datetime import datetime, timedelta
from typing import Optional
import secrets
import string

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    return pwd_context.hash(password_bytes.decode('utf-8'))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')[:72]
    return pwd_context.verify(password_bytes.decode('utf-8'), hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") not in ["access", "refresh"]:
            return None
        exp = payload.get("exp")
        if exp and datetime.utcnow() > datetime.fromtimestamp(exp):
            return None
        return payload
    except JWTError:
        return None


def validate_password_strength(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Mínimo 8 caracteres"
    if not any(c.isupper() for c in password):
        return False, "Al menos una mayúscula"
    if not any(c.islower() for c in password):
        return False, "Al menos una minúscula"
    if not any(c.isdigit() for c in password):
        return False, "Al menos un número"
    return True, "Contraseña segura"


def generate_random_password(length: int = 8) -> str:
    uppercase = secrets.choice(string.ascii_uppercase.translate(str.maketrans("", "", "IO")))
    lowercase = secrets.choice(string.ascii_lowercase.translate(str.maketrans("", "", "lo")))
    digit = secrets.choice(string.digits.translate(str.maketrans("", "", "01")))
    safe_chars = (
        string.ascii_uppercase.translate(str.maketrans("", "", "IO"))
        + string.ascii_lowercase.translate(str.maketrans("", "", "lo"))
        + string.digits.translate(str.maketrans("", "", "01"))
    )
    rest = ''.join(secrets.choice(safe_chars) for _ in range(length - 3))
    combined = list(uppercase + lowercase + digit + rest)
    secrets.SystemRandom().shuffle(combined)
    return ''.join(combined)
