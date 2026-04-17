from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter()

@router.post("/", response_model=schemas.UsuarioRead)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.UsuarioSistema).filter(models.UsuarioSistema.username == usuario.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    
    nuevo_usuario = models.UsuarioSistema(
        username=usuario.username,
        email=usuario.email,
        nombre_completo=usuario.nombre_completo,
        password_hash=auth.get_password_hash(usuario.password),
        rol=usuario.rol
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@router.get("/", response_model=list[schemas.UsuarioRead])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.UsuarioSistema).all()