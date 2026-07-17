from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime, date, timedelta, time as dtime
import auth, models, schemas
from websocket_manager import manager

router = APIRouter()

CIERRE_JORNADA = 17  # 5:00 PM

def auto_cierre(reg, hora_salida_db):
    if hora_salida_db is not None:
        return hora_salida_db, False
    ahora = datetime.now()
    if reg.tipo_persona != models.TipoPersona.PERSONAL:
        return hora_salida_db, False
    if reg.hora_entrada.date() != ahora.date():
        return hora_salida_db, False
    cierre = ahora.replace(hour=CIERRE_JORNADA, minute=0, second=0, microsecond=0)
    if ahora >= cierre:
        return cierre, True
    return hora_salida_db, False

def build_registro(reg, db):
    nombre = reg.nombre_aux
    telefono = reg.telefono_aux
    ente = reg.ente_aux

    if reg.tipo_persona == models.TipoPersona.PERSONAL and not nombre:
        empleado = db.query(models.Empleado).filter(
            models.Empleado.cedula == reg.cedula_identidad,
            models.Empleado.deleted_at.is_(None)
        ).first()
        if empleado:
            nombre = f"{empleado.nombres} {empleado.apellidos}"
            telefono = empleado.telefono
            ente = empleado.ente.nombre if empleado.ente else "ALCALDÍA"

    hora_salida, auto = auto_cierre(reg, reg.hora_salida)

    return {
        "id": reg.id,
        "cedula_identidad": reg.cedula_identidad,
        "tipo_persona": reg.tipo_persona.value,
        "hora_entrada": reg.hora_entrada,
        "hora_salida": hora_salida,
        "auto_salida": auto,
        "motivo": reg.motivo,
        "piso": reg.piso_destino,
        "nombre": nombre,
        "telefono": telefono,
        "ente": ente
    }

@router.get("/verificar/{cedula}")
def verificar_cedula(cedula: str, db: Session = Depends(get_db)):
    empleado = db.query(models.Empleado).filter(
        models.Empleado.cedula == cedula,
        models.Empleado.deleted_at.is_(None)
    ).first()

    if empleado:
        ente_nombre = empleado.ente.nombre if empleado.ente else "Alcaldía de Guanta"
        ente_tipo = empleado.ente.tipo if empleado.ente else "alcaldia"
        cargo_nombre = empleado.cargo.nombre if empleado.cargo else ""
        return {
            "encontrado": True,
            "tipo": "personal",
            "datos": {
                "nombre": f"{empleado.nombres} {empleado.apellidos}",
                "ente": ente_nombre,
                "ente_tipo": ente_tipo,
                "cargo": cargo_nombre,
                "foto": empleado.foto
            }
        }

    return {
        "encontrado": False,
        "tipo": "visitante",
        "datos": None
    }

@router.post("/registrar", response_model=schemas.AsistenciaRead)
async def registrar_movimiento(
    cedula: str,
    motivo: str = "Ingreso Institucional",
    piso: str = "Planta Baja",
    nombre: str = None,
    telefono: str = None,
    ente: str = None,
    db: Session = Depends(get_db)
):
    ahora = datetime.now()
    hoy = ahora.date()

    registro_hoy = db.query(models.Asistencia).filter(
        models.Asistencia.cedula_identidad == cedula,
        models.Asistencia.hora_entrada >= hoy
    ).order_by(models.Asistencia.hora_entrada.desc()).first()

    empleado = db.query(models.Empleado).filter(
        models.Empleado.cedula == cedula,
        models.Empleado.deleted_at.is_(None)
    ).first()

    if registro_hoy:
        if registro_hoy.hora_salida:
            raise HTTPException(status_code=400, detail="Ya ha registrado su entrada y salida por el día de hoy.")
        registro_hoy.hora_salida = ahora
        db.commit()
        db.refresh(registro_hoy)
        await manager.broadcast({"type": "asistencia", "action": "update"})
        return registro_hoy

    tipo = models.TipoPersona.PERSONAL if empleado else models.TipoPersona.VISITANTE

    nuevo_acceso = models.Asistencia(
        cedula_identidad=cedula,
        tipo_persona=tipo,
        hora_entrada=datetime.now(),
        motivo=motivo if not empleado else "Ingreso Institucional",
        piso_destino=piso,
        nombre_aux=nombre,
        telefono_aux=telefono,
        ente_aux=ente
    )
    db.add(nuevo_acceso)
    db.commit()
    db.refresh(nuevo_acceso)
    await manager.broadcast({"type": "asistencia", "action": "create"})
    return nuevo_acceso

@router.get("/hoy")
def reporte_hoy(
    db: Session = Depends(get_db),
    current_user: models.UsuarioSistema = Depends(auth.get_current_user),
):
    hoy = datetime.now().date()
    registros = db.query(models.Asistencia).filter(
        models.Asistencia.hora_entrada >= hoy
    ).order_by(models.Asistencia.hora_entrada.desc()).all()

    return [build_registro(reg, db) for reg in registros]

@router.get("/rango")
def reporte_rango(
    desde: str = Query(..., description="Fecha inicio (YYYY-MM-DD)"),
    hasta: str = Query(..., description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: models.UsuarioSistema = Depends(auth.get_current_user),
):
    desde_date = date.fromisoformat(desde)
    hasta_date = date.fromisoformat(hasta) + timedelta(days=1)
    registros = db.query(models.Asistencia).filter(
        models.Asistencia.hora_entrada >= desde_date,
        models.Asistencia.hora_entrada < hasta_date
    ).order_by(models.Asistencia.hora_entrada.desc()).all()

    return [build_registro(reg, db) for reg in registros]

@router.delete("/{id}")
async def eliminar_asistencia(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.UsuarioSistema = Depends(auth.get_current_user),
):
    registro = db.query(models.Asistencia).filter(models.Asistencia.id == id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    db.delete(registro)
    db.commit()
    await manager.broadcast({"type": "asistencia", "action": "delete"})
    return {"status": "ok", "message": "Registro eliminado con éxito"}

@router.put("/{id}")
async def editar_asistencia(
    id: int,
    nombre: str = None,
    motivo: str = None,
    piso: str = None,
    db: Session = Depends(get_db),
    current_user: models.UsuarioSistema = Depends(auth.get_current_user),
):
    registro = db.query(models.Asistencia).filter(models.Asistencia.id == id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    if nombre:
        registro.nombre_aux = nombre
    if motivo:
        registro.motivo = motivo
    if piso:
        registro.piso_destino = piso
    db.commit()
    db.refresh(registro)
    await manager.broadcast({"type": "asistencia", "action": "update"})
    return registro
