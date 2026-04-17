from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from models import RolUsuario, EntidadPersonal, TipoPersona

# --- SCHEMAS DE USUARIO (Operadores del Sistema) ---
class UsuarioBase(BaseModel):
    username: str
    email: EmailStr
    nombre_completo: str
    rol: RolUsuario

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioRead(UsuarioBase):
    id: int
    activo: int
    class Config:
        from_attributes = True

# --- SCHEMAS DE PERSONAL (Trabajadores) ---
class PersonalBase(BaseModel):
    cedula: str
    nombre: str
    apellido: str
    entidad: EntidadPersonal
    nombre_instituto: Optional[str] = None
    cargo: Optional[str] = None

class PersonalRead(PersonalBase):
    id: int
    activo: int
    class Config:
        from_attributes = True

# --- SCHEMAS DE ASISTENCIA (Entradas/Salidas) ---
class AsistenciaBase(BaseModel):
    cedula_identidad: str
    motivo: Optional[str] = "Ingreso Institucional"
    piso_destino: Optional[str] = "Planta Baja"

class AsistenciaRead(BaseModel):
    id: int
    cedula_identidad: str
    tipo_persona: TipoPersona
    hora_entrada: datetime
    hora_salida: Optional[datetime] = None
    motivo: Optional[str]
    registrado_por: Optional[int]
    
    class Config:
        from_attributes = True

# --- SCHEMA PARA TOKEN ---
class Token(BaseModel):
    access_token: str
    token_type: str