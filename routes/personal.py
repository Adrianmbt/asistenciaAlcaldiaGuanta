from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import csv
import io
from typing import List

router = APIRouter()

@router.get("/", response_model=List[schemas.PersonalRead])
def listar_personal(db: Session = Depends(get_db)):
    return db.query(models.Personal).all()

@router.post("/", response_model=schemas.PersonalRead)
def crear_personal(persona: schemas.PersonalBase, db: Session = Depends(get_db)):
    db_persona = db.query(models.Personal).filter(models.Personal.cedula == persona.cedula).first()
    if db_persona:
        raise HTTPException(status_code=400, detail="Cédula ya registrada")
    
    nuevo_personal = models.Personal(**persona.dict())
    db.add(nuevo_personal)
    db.commit()
    db.refresh(nuevo_personal)
    return nuevo_personal

@router.put("/{id}", response_model=schemas.PersonalRead)
def actualizar_personal(id: int, persona: schemas.PersonalBase, db: Session = Depends(get_db)):
    db_persona = db.query(models.Personal).filter(models.Personal.id == id).first()
    if not db_persona:
        raise HTTPException(status_code=404, detail="Personal no encontrado")
    
    # Actualizar campos
    db_persona.cedula = persona.cedula
    db_persona.nombre = persona.nombre
    db_persona.apellido = persona.apellido
    db_persona.entidad = persona.entidad
    db_persona.nombre_instituto = persona.nombre_instituto
    db_persona.cargo = persona.cargo
    db_persona.telefono = persona.telefono
    
    db.commit()
    db.refresh(db_persona)
    return db_persona

@router.delete("/{id}")
def eliminar_personal(id: int, db: Session = Depends(get_db)):
    db_persona = db.query(models.Personal).filter(models.Personal.id == id).first()
    if not db_persona:
        raise HTTPException(status_code=404, detail="Personal no encontrado")
    
    db.delete(db_persona)
    db.commit()
    return {"status": "ok", "message": "Personal eliminado correctamente"}

@router.post("/import-csv")
async def importar_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un CSV")
    
    try:
        content = await file.read()
        # Intentar decodificar como utf-8, fallback a latin-1 si falla (común en archivos excel/csv viejos)
        try:
            text_content = content.decode('utf-8')
        except UnicodeDecodeError:
            text_content = content.decode('latin-1')
            
        f = io.StringIO(text_content)
        
        # Detectar el delimitador automáticamente
        try:
            sample = f.read(2048)
            f.seek(0)
            dialect = csv.Sniffer().sniff(sample, delimiters=',;')
            reader = csv.DictReader(f, dialect=dialect)
        except:
            f.seek(0)
            reader = csv.DictReader(f)
            
        nuevos = 0
        actualizados = 0
        
        for row in reader:
            # Limpiar llaves y valores
            row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
            
            cedula = row.get('cedula', row.get('id', ''))
            if not cedula: continue
            
            db_persona = db.query(models.Personal).filter(models.Personal.cedula == cedula).first()
            
            # Mapeo de entidad
            entidad_raw = row.get('entidad', 'alcaldia').lower()
            entidad = models.EntidadPersonal.ALCALDIA
            if 'inst' in entidad_raw or 'auto' in entidad_raw:
                entidad = models.EntidadPersonal.INSTITUTO_AUTONOMO
            
            nombre = row.get('nombre', '')
            apellido = row.get('apellido', '')
            cargo = row.get('cargo', '')
            telefono = row.get('telefono', '')
            instituto = row.get('nombre_instituto', row.get('instituto', ''))
            
            if db_persona:
                db_persona.nombre = nombre
                db_persona.apellido = apellido
                db_persona.entidad = entidad
                db_persona.cargo = cargo
                db_persona.telefono = telefono
                db_persona.nombre_instituto = instituto if entidad == models.EntidadPersonal.INSTITUTO_AUTONOMO else None
                actualizados += 1
            else:
                nuevo = models.Personal(
                    cedula=cedula,
                    nombre=nombre,
                    apellido=apellido,
                    entidad=entidad,
                    cargo=cargo,
                    telefono=telefono,
                    nombre_instituto=instituto if entidad == models.EntidadPersonal.INSTITUTO_AUTONOMO else None
                )
                db.add(nuevo)
                nuevos += 1
        
        db.commit()
        return {"status": "ok", "nuevos": nuevos, "actualizados": actualizados}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")
