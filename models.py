from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

# --- ENUMS PARA RESTRICCIÓN DE DATOS ---
class RolUsuario(enum.Enum):
    DEV = "dev"
    ADMIN = "admin"
    PORTERO = "portero"

class EntidadPersonal(enum.Enum):
    ALCALDIA = "alcaldia"
    INSTITUTO_AUTONOMO = "instituto_autonomo"

class TipoPersona(enum.Enum):
    PERSONAL = "personal"
    VISITANTE = "visitante"

# --- MODELO DE USUARIOS (CRUD de Operadores) ---
class UsuarioSistema(Base):
    __tablename__ = "usuarios_sistema"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    nombre_completo = Column(String)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(Enum(RolUsuario), default=RolUsuario.PORTERO)
    activo = Column(Integer, default=1)

# --- MODELO DE PERSONAL (Trabajadores) ---
class Personal(Base):
    __tablename__ = "personal"
    id = Column(Integer, primary_key=True, index=True)
    cedula = Column(String, unique=True, index=True, nullable=False)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    entidad = Column(Enum(EntidadPersonal), default=EntidadPersonal.ALCALDIA)
    nombre_instituto = Column(String, nullable=True) # Ejemplo: IAMDE, IAMTUR
    cargo = Column(String)
    activo = Column(Integer, default=1)

# --- MODELO DE ASISTENCIA (CRUD de Entradas/Salidas) ---
class Asistencia(Base):
    __tablename__ = "asistencia_accesos"
    id = Column(Integer, primary_key=True, index=True)
    cedula_identidad = Column(String, index=True, nullable=False)
    tipo_persona = Column(Enum(TipoPersona), nullable=False)
    
    # Registro de Tiempos
    hora_entrada = Column(DateTime, default=datetime.now)
    hora_salida = Column(DateTime, nullable=True)
    
    # Detalles del movimiento
    motivo = Column(String)
    piso_destino = Column(String)
    observaciones = Column(String)
    
    # Auditoría: ¿Qué usuario del sistema registró este movimiento?
    registrado_por = Column(Integer, ForeignKey("usuarios_sistema.id"))