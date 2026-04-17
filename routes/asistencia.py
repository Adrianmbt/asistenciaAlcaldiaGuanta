from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime
import models, schemas

router = APIRouter()

@router.get("/verificar/{cedula}")
def verificar_cedula(cedula: str, db: Session = Depends(get_db)):
    # Buscar en la tabla de Personal
    persona = db.query(models.Personal).filter(models.Personal.cedula == cedula).first()
    
    if persona:
        return {
            "encontrado": True,
            "tipo": "personal",
            "datos": {
                "nombre": f"{persona.nombre} {persona.apellido}",
                "entidad": persona.entidad,
                "cargo": persona.cargo,
                "instituto": persona.nombre_instituto
            }
        }
    
    return {
        "encontrado": False,
        "tipo": "visitante",
        "datos": None
    }

@router.post("/registrar", response_model=schemas.AsistenciaRead)
def registrar_movimiento(cedula: str, db: Session = Depends(get_db)):
    # 1. Buscar si la persona ya está "adentro" (tiene entrada pero no salida)
    registro_pendiente = db.query(models.Asistencia).filter(
        models.Asistencia.cedula_identidad == cedula,
        models.Asistencia.hora_salida == None
    ).first()

    if registro_pendiente:
        # CRUD: Actualizar (Marcar Salida)
        registro_pendiente.hora_salida = datetime.now()
        db.commit()
        db.refresh(registro_pendiente)
        return registro_pendiente

    # 2. Si no está adentro, crear nueva Entrada
    # Aquí podrías verificar si la cédula pertenece a 'Personal' o 'Visitante'
    persona = db.query(models.Personal).filter(models.Personal.cedula == cedula).first()
    tipo = models.TipoPersona.PERSONAL if persona else models.TipoPersona.VISITANTE

    nuevo_acceso = models.Asistencia(
        cedula_identidad=cedula,
        tipo_persona=tipo,
        hora_entrada=datetime.now(),
        motivo="Ingreso Institucional" if persona else "Visita"
    )
    db.add(nuevo_acceso)
    db.commit()
    db.refresh(nuevo_acceso)
    return nuevo_acceso

@router.get("/hoy")
def reporte_hoy(db: Session = Depends(get_db)):
    hoy = datetime.now().date()
    registros = db.query(models.Asistencia).filter(models.Asistencia.hora_entrada >= hoy).all()
    
    # Enriquecer con nombres si son personal
    resultado = []
    for reg in registros:
        nombre = None
        if reg.tipo_persona == models.TipoPersona.PERSONAL:
            persona = db.query(models.Personal).filter(models.Personal.cedula == reg.cedula_identidad).first()
            if persona:
                nombre = f"{persona.nombre} {persona.apellido}"
        
        reg_dict = {
            "id": reg.id,
            "cedula_identidad": reg.cedula_identidad,
            "tipo_persona": reg.tipo_persona.value,
            "hora_entrada": reg.hora_entrada,
            "hora_salida": reg.hora_salida,
            "motivo": reg.motivo,
            "nombre": nombre
        }
        resultado.append(reg_dict)
        
    return resultado