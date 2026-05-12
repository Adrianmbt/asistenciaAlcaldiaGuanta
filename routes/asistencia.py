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

@router.post("/biometria/verificar")
def verificar_biometria(template: str, db: Session = Depends(get_db)):
    """
    Busca a una persona por su template biométrico (huella).
    En una implementación real, esto podría requerir una librería de comparación.
    """
    persona = db.query(models.Personal).filter(
        models.Personal.huella_template == template,
        models.Personal.activo == 1
    ).first()
    
    if not persona:
        raise HTTPException(status_code=404, detail="Identidad biométrica no reconocida")
        
    return {
        "cedula": persona.cedula,
        "nombre": f"{persona.nombre} {persona.apellido}",
        "entidad": persona.entidad,
        "cargo": persona.cargo
    }

@router.post("/registrar", response_model=schemas.AsistenciaRead)
def registrar_movimiento(
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
    es_tarde = ahora.hour >= 17 # Después de las 5 PM
    
    # 1. Buscar si ya tiene un registro hoy (entrada y posiblemente salida)
    registro_hoy = db.query(models.Asistencia).filter(
        models.Asistencia.cedula_identidad == cedula,
        models.Asistencia.hora_entrada >= hoy
    ).order_by(models.Asistencia.hora_entrada.desc()).first()

    # Buscar datos de la persona para saber si es administrativo
    persona = db.query(models.Personal).filter(models.Personal.cedula == cedula).first()

    if registro_hoy:
        # Si ya tiene entrada y salida hoy, ya no puede marcar nada (a menos que sea otra entrada/salida)
        if registro_hoy.hora_salida:
            # Si es tarde y ya tiene salida, quizás quiera re-entrar? No, mejor elevar error según el requerimiento.
            raise HTTPException(status_code=400, detail="Ya ha registrado su entrada y salida por el día de hoy.")
        
        # Si tiene entrada pero no salida, marcamos la salida
        registro_hoy.hora_salida = ahora
        db.commit()
        db.refresh(registro_hoy)
        return registro_hoy
    
    # --- Lógica Especial después de las 5 PM para Personal Administrativo ---
    if es_tarde and persona and persona.entidad == models.EntidadPersonal.ALCALDIA:
        # Si no tiene registro previo hoy pero es después de las 5 PM, 
        # marcamos una salida "huérfana" o asumimos que se le olvidó marcar entrada.
        # Por ahora, seguiremos el flujo normal pero podríamos añadir una nota.
        pass

    # 2. Si no tiene registro hoy, crear nueva Entrada
    persona = db.query(models.Personal).filter(models.Personal.cedula == cedula).first()
    tipo = models.TipoPersona.PERSONAL if persona else models.TipoPersona.VISITANTE

    nuevo_acceso = models.Asistencia(
        cedula_identidad=cedula,
        tipo_persona=tipo,
        hora_entrada=datetime.now(),
        motivo=motivo if not persona else "Ingreso Institucional",
        piso_destino=piso,
        nombre_aux=nombre,
        telefono_aux=telefono,
        ente_aux=ente
    )
    db.add(nuevo_acceso)
    db.commit()
    db.refresh(nuevo_acceso)
    return nuevo_acceso

@router.get("/hoy")
def reporte_hoy(db: Session = Depends(get_db)):
    hoy = datetime.now().date()
    # Ordenar por fecha de entrada descendente (más nuevos primero)
    registros = db.query(models.Asistencia).filter(models.Asistencia.hora_entrada >= hoy).order_by(models.Asistencia.hora_entrada.desc()).all()
    
    resultado = []
    for reg in registros:
        # Priorizar nombre_aux (sirve como override si se edita)
        nombre = reg.nombre_aux
        telefono = reg.telefono_aux
        ente = reg.ente_aux
        
        # Si es personal y NO tiene nombre_aux (es un registro nuevo sin editar), buscar en tabla Personal
        if reg.tipo_persona == models.TipoPersona.PERSONAL and not nombre:
            persona = db.query(models.Personal).filter(models.Personal.cedula == reg.cedula_identidad).first()
            if persona:
                nombre = f"{persona.nombre} {persona.apellido}"
                telefono = persona.telefono
                ente = persona.nombre_instituto or "ALCALDIA"
        
        resultado.append({
            "id": reg.id,
            "cedula_identidad": reg.cedula_identidad,
            "tipo_persona": reg.tipo_persona.value,
            "hora_entrada": reg.hora_entrada,
            "hora_salida": reg.hora_salida,
            "motivo": reg.motivo,
            "piso": reg.piso_destino,
            "nombre": nombre,
            "telefono": telefono,
            "ente": ente
        })
        
    return resultado

@router.delete("/{id}")
def eliminar_asistencia(id: int, db: Session = Depends(get_db)):
    registro = db.query(models.Asistencia).filter(models.Asistencia.id == id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    db.delete(registro)
    db.commit()
    return {"status": "ok", "message": "Registro eliminado con éxito"}

@router.put("/{id}")
def editar_asistencia(id: int, nombre: str = None, motivo: str = None, piso: str = None, db: Session = Depends(get_db)):
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
    return registro