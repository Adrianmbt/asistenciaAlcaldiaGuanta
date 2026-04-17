from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database, models
from routes import usuarios, asistencia, auth_routes

# Crear tablas en la DB
models.Base.metadata.create_all(bind=database.engine)

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

@app.get("/")
def read_root():
    return {"institucion": "Alcaldía de Guanta", "status": "Online"}