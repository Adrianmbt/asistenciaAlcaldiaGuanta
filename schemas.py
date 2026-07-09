from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List
from models import RolUsuario, TipoPersona, Sexo, EstatusLaboral, EstadoEmpleado

# --- USUARIO ---
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

# --- CARGO ---
class CargoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class CargoRead(CargoBase):
    id: int
    class Config:
        from_attributes = True

# --- DEPARTAMENTO ---
class DepartamentoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class DepartamentoRead(DepartamentoBase):
    id: int
    class Config:
        from_attributes = True

# --- ENTE ---
class EnteBase(BaseModel):
    nombre: str
    siglas: Optional[str] = None
    tipo: Optional[str] = "alcaldia"

class EnteRead(EnteBase):
    id: int
    class Config:
        from_attributes = True

# --- EMPLEADO ---
class EmpleadoBase(BaseModel):
    cedula: str
    nombres: str
    apellidos: str
    sexo: Optional[Sexo] = None
    fecha_nacimiento: Optional[date] = None
    fecha_ingreso: Optional[date] = None
    fecha_egreso: Optional[date] = None
    cargo_id: Optional[int] = None
    departamento_id: Optional[int] = None
    ente_id: Optional[int] = None
    es_responsable: Optional[int] = 0
    telefono: Optional[str] = None
    correo: Optional[str] = None
    estatus_laboral: Optional[EstatusLaboral] = EstatusLaboral.ACTIVO
    estado: Optional[EstadoEmpleado] = EstadoEmpleado.ACTIVO
    observaciones: Optional[str] = None

class EmpleadoRead(EmpleadoBase):
    id: int
    foto: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    cargo: Optional[CargoRead] = None
    departamento: Optional[DepartamentoRead] = None
    ente: Optional[EnteRead] = None
    class Config:
        from_attributes = True

# --- ASISTENCIA ---
class AsistenciaBase(BaseModel):
    cedula_identidad: str
    motivo: Optional[str] = "Ingreso Institucional"
    piso_destino: Optional[str] = "Planta Baja"
    nombre_aux: Optional[str] = None
    telefono_aux: Optional[str] = None
    ente_aux: Optional[str] = None

class AsistenciaRead(BaseModel):
    id: int
    cedula_identidad: str
    tipo_persona: TipoPersona
    hora_entrada: datetime
    hora_salida: Optional[datetime] = None
    motivo: Optional[str]
    nombre_aux: Optional[str]
    telefono_aux: Optional[str]
    ente_aux: Optional[str]
    registrado_por: Optional[int]
    class Config:
        from_attributes = True

# --- TOKEN ---
class Token(BaseModel):
    access_token: str
    token_type: str
