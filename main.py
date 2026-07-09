from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database, models
from routes import usuarios, asistencia, auth_routes, personal

# Crear tablas en la DB
models.Base.metadata.create_all(bind=database.engine)

# Seed datos iniciales (cargos, departamentos, entes si están vacíos)
def seed_referencias():
    db = database.SessionLocal()
    try:
        if not db.query(models.Cargo).first():
            db.add_all([
                models.Cargo(nombre="Analista", descripcion="Analista institucional"),
                models.Cargo(nombre="Director", descripcion="Director de área"),
                models.Cargo(nombre="Oficial de Seguridad", descripcion="Portería y vigilancia"),
            ])
        if not db.query(models.Departamento).first():
            db.add_all([
                models.Departamento(nombre="Hacienda"),
                models.Departamento(nombre="Recursos Humanos"),
                models.Departamento(nombre="Seguridad"),
            ])
        if not db.query(models.Ente).first():
            db.add_all([
                models.Ente(nombre="Alcaldía de Guanta", siglas="ALC", tipo="alcaldia"),
                models.Ente(nombre="IAMDE", siglas="IAMDE", tipo="instituto_autonomo"),
            ])
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

seed_referencias()

app = FastAPI(title="API Control de Acceso - Alcaldía de Guanta")

# Configuración de CORS para React/Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTRO DE RUTAS POR SEPARADO ---
app.include_router(auth_routes.router, prefix="/auth", tags=["Autenticación"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Gestión de Usuarios"])
app.include_router(asistencia.router, prefix="/asistencia", tags=["Control de Asistencia"])
app.include_router(personal.router, prefix="/personal", tags=["Gestión de Personal"])

@app.get("/")
def read_root():
    return {"institucion": "Alcaldía de Guanta", "status": "Online"}