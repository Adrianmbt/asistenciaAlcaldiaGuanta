from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth
from database import get_db

router = APIRouter()

# --- CREATE ---
@router.post("/", response_model=schemas.UsuarioRead, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # Verificar si el username ya existe
    db_user = db.query(models.UsuarioSistema).filter(models.UsuarioSistema.username == usuario.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado")
    
    # Hashear la contraseña antes de guardar
    hashed_password = auth.get_password_hash(usuario.password)
    
    nuevo_usuario = models.UsuarioSistema(
        username=usuario.username,
        email=usuario.email,
        nombre_completo=usuario.nombre_completo,
        password_hash=hashed_password,
        rol=usuario.rol,
        activo=1
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

# --- READ ALL ---
@router.get("/", response_model=List[schemas.UsuarioRead])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.UsuarioSistema).all()

# --- READ ONE ---
@router.get("/{usuario_id}", response_model=schemas.UsuarioRead)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.UsuarioSistema).filter(models.UsuarioSistema.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

# --- UPDATE ---
@router.put("/{usuario_id}", response_model=schemas.UsuarioRead)
def actualizar_usuario(usuario_id: int, usuario_update: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    db_usuario = db.query(models.UsuarioSistema).filter(models.UsuarioSistema.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db_usuario.username = usuario_update.username
    db_usuario.email = usuario_update.email
    db_usuario.nombre_completo = usuario_update.nombre_completo
    db_usuario.rol = usuario_update.rol
    
    # Solo actualizar contraseña si se envía una nueva
    if usuario_update.password:
        db_usuario.password_hash = auth.get_password_hash(usuario_update.password)
        
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

# --- DELETE (Lógico) ---
@router.delete("/{usuario_id}")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    db_usuario = db.query(models.UsuarioSistema).filter(models.UsuarioSistema.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Preferimos desactivar en lugar de borrar físicamente para mantener integridad de logs
    db_usuario.activo = 0
    db.commit()
    return {"message": "Usuario desactivado correctamente"}