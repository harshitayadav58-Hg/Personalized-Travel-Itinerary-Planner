from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.TokenOut, status_code=status.HTTP_201_CREATED)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = models.User(
        email=email,
        name=body.name.strip(),
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.TokenOut(access_token=create_access_token(user.id), user=user)


@router.post("/login", response_model=schemas.TokenOut)
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return schemas.TokenOut(access_token=create_access_token(user.id), user=user)


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


@router.get("/sessions", include_in_schema=False)
def session_info():
    return {"server_time": datetime.now(timezone.utc).isoformat()}
