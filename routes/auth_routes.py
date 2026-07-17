from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import auth, models, database
from websocket_manager import manager

router = APIRouter()

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.UsuarioSistema).filter(models.UsuarioSistema.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user.token_version = (user.token_version or 0) + 1
    db.commit()

    try:
        await manager.broadcast({
            "type": "session_closed",
            "username": user.username,
        })
    except Exception:
        pass

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "token_version": user.token_version},
        expires_delta=access_token_expires,
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "username": user.username,
            "nombre": user.nombre_completo,
            "rol": user.rol.value
        }
    }
