from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime
import models, schemas
from typing import List
from websocket_manager import manager

router = APIRouter()

# ─── CARGOS ──────────────────────────────────────────────────────────────────

@router.get("/cargos", response_model=List[schemas.CargoRead])
def listar_cargos(db: Session = Depends(get_db)):
    return db.query(models.Cargo).all()

@router.post("/cargos", response_model=schemas.CargoRead)
def crear_cargo(data: schemas.CargoBase, db: Session = Depends(get_db)):
    existe = db.query(models.Cargo).filter(models.Cargo.nombre == data.nombre).first()
    if existe:
        raise HTTPException(status_code=400, detail="El cargo ya existe")
    obj = models.Cargo(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/cargos/{id}", response_model=schemas.CargoRead)
def actualizar_cargo(id: int, data: schemas.CargoBase, db: Session = Depends(get_db)):
    obj = db.query(models.Cargo).filter(models.Cargo.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Cargo no encontrado")
    for k, v in data.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/cargos/{id}")
def eliminar_cargo(id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Cargo).filter(models.Cargo.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Cargo no encontrado")
    db.delete(obj)
    db.commit()
    return {"status": "ok"}

# ─── DEPARTAMENTOS ───────────────────────────────────────────────────────────

@router.get("/departamentos", response_model=List[schemas.DepartamentoRead])
def listar_departamentos(db: Session = Depends(get_db)):
    return db.query(models.Departamento).all()

@router.post("/departamentos", response_model=schemas.DepartamentoRead)
def crear_departamento(data: schemas.DepartamentoBase, db: Session = Depends(get_db)):
    existe = db.query(models.Departamento).filter(models.Departamento.nombre == data.nombre).first()
    if existe:
        raise HTTPException(status_code=400, detail="El departamento ya existe")
    obj = models.Departamento(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/departamentos/{id}", response_model=schemas.DepartamentoRead)
def actualizar_departamento(id: int, data: schemas.DepartamentoBase, db: Session = Depends(get_db)):
    obj = db.query(models.Departamento).filter(models.Departamento.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    for k, v in data.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/departamentos/{id}")
def eliminar_departamento(id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Departamento).filter(models.Departamento.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    db.delete(obj)
    db.commit()
    return {"status": "ok"}

# ─── ENTES ───────────────────────────────────────────────────────────────────

@router.get("/entes", response_model=List[schemas.EnteRead])
def listar_entes(db: Session = Depends(get_db)):
    return db.query(models.Ente).all()

@router.post("/entes", response_model=schemas.EnteRead)
def crear_ente(data: schemas.EnteBase, db: Session = Depends(get_db)):
    obj = models.Ente(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/entes/{id}", response_model=schemas.EnteRead)
def actualizar_ente(id: int, data: schemas.EnteBase, db: Session = Depends(get_db)):
    obj = db.query(models.Ente).filter(models.Ente.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Ente no encontrado")
    for k, v in data.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/entes/{id}")
def eliminar_ente(id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Ente).filter(models.Ente.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Ente no encontrado")
    db.delete(obj)
    db.commit()
    return {"status": "ok"}

# ─── EMPLEADOS ───────────────────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.EmpleadoRead])
def listar_empleados(db: Session = Depends(get_db)):
    return db.query(models.Empleado).filter(models.Empleado.deleted_at.is_(None)).all()

@router.get("/{id}", response_model=schemas.EmpleadoRead)
def obtener_empleado(id: int, db: Session = Depends(get_db)):
    emp = db.query(models.Empleado).filter(models.Empleado.id == id, models.Empleado.deleted_at.is_(None)).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return emp

@router.post("/", response_model=schemas.EmpleadoRead)
async def crear_empleado(data: schemas.EmpleadoBase, db: Session = Depends(get_db)):
    existe = db.query(models.Empleado).filter(models.Empleado.cedula == data.cedula).first()
    if existe:
        raise HTTPException(status_code=400, detail="Cédula ya registrada")
    empleado = models.Empleado(**data.dict())
    db.add(empleado)
    db.commit()
    db.refresh(empleado)
    await manager.broadcast({"type": "personal", "action": "create"})
    return empleado

@router.put("/{id}", response_model=schemas.EmpleadoRead)
async def actualizar_empleado(id: int, data: schemas.EmpleadoBase, db: Session = Depends(get_db)):
    emp = db.query(models.Empleado).filter(models.Empleado.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    for k, v in data.dict().items():
        setattr(emp, k, v)
    db.commit()
    db.refresh(emp)
    await manager.broadcast({"type": "personal", "action": "update"})
    return emp

@router.delete("/{id}")
async def eliminar_empleado(id: int, db: Session = Depends(get_db)):
    emp = db.query(models.Empleado).filter(models.Empleado.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    emp.deleted_at = datetime.now()
    db.commit()
    await manager.broadcast({"type": "personal", "action": "delete"})
    return {"status": "ok", "message": "Empleado desactivado correctamente"}
