from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Date, SmallInteger
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

# --- ENUMS ---
class RolUsuario(enum.Enum):
    DEV = "dev"
    ADMIN = "admin"
    PORTERO = "portero"

class TipoPersona(enum.Enum):
    PERSONAL = "personal"
    VISITANTE = "visitante"

class Sexo(enum.Enum):
    M = "M"
    F = "F"

class EstatusLaboral(enum.Enum):
    ACTIVO = "ACTIVO"
    EGRESADO = "EGRESADO"
    JUBILADO = "JUBILADO"
    SUSPENDIDO = "SUSPENDIDO"
    PERMISO = "PERMISO"
    REPOSO = "REPOSO"

class EstadoEmpleado(enum.Enum):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"

# --- USUARIOS DEL SISTEMA ---
class UsuarioSistema(Base):
    __tablename__ = "usuarios_sistema"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    nombre_completo = Column(String)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(Enum(RolUsuario), default=RolUsuario.PORTERO)
    activo = Column(Integer, default=1)
    token_version = Column(Integer, default=0)

# --- CARGOS ---
class Cargo(Base):
    __tablename__ = "cargos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    empleados = relationship("Empleado", back_populates="cargo")

# --- DEPARTAMENTOS ---
class Departamento(Base):
    __tablename__ = "departamentos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    empleados = relationship("Empleado", back_populates="departamento")

# --- ENTES ---
class Ente(Base):
    __tablename__ = "entes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    siglas = Column(String(20), nullable=True)
    tipo = Column(String(50), default="alcaldia")
    empleados = relationship("Empleado", back_populates="ente")

# --- EMPLEADOS ---
class Empleado(Base):
    __tablename__ = "empleados"
    id = Column(Integer, primary_key=True, index=True)
    cedula = Column(String(15), unique=True, index=True, nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    sexo = Column(Enum(Sexo), nullable=True)
    fecha_nacimiento = Column(Date, nullable=True)
    fecha_ingreso = Column(Date, nullable=True)
    fecha_egreso = Column(Date, nullable=True)
    cargo_id = Column(Integer, ForeignKey("cargos.id"), nullable=True)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=True)
    ente_id = Column(Integer, ForeignKey("entes.id"), nullable=True)
    es_responsable = Column(Integer, default=0)
    foto = Column(String(255), nullable=True)
    telefono = Column(String(30), nullable=True)
    correo = Column(String(150), nullable=True)
    estatus_laboral = Column(Enum(EstatusLaboral), default=EstatusLaboral.ACTIVO)
    estado = Column(Enum(EstadoEmpleado), default=EstadoEmpleado.ACTIVO)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    deleted_at = Column(DateTime, nullable=True)

    cargo = relationship("Cargo", back_populates="empleados")
    departamento = relationship("Departamento", back_populates="empleados")
    ente = relationship("Ente", back_populates="empleados")

# --- ASISTENCIA ---
class Asistencia(Base):
    __tablename__ = "asistencia_accesos"
    id = Column(Integer, primary_key=True, index=True)
    cedula_identidad = Column(String, index=True, nullable=False)
    tipo_persona = Column(Enum(TipoPersona), nullable=False)
    hora_entrada = Column(DateTime, default=datetime.now)
    hora_salida = Column(DateTime, nullable=True)
    motivo = Column(String)
    piso_destino = Column(String)
    observaciones = Column(String)
    nombre_aux = Column(String, nullable=True)
    telefono_aux = Column(String, nullable=True)
    ente_aux = Column(String, nullable=True)
    registrado_por = Column(Integer, ForeignKey("usuarios_sistema.id"))
