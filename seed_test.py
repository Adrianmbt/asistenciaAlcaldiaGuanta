from database import SessionLocal, engine
import models, auth
from datetime import datetime, timedelta

def seed():
    # Crear tablas si no existen con el nuevo esquema
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # 1. Crear Usuario Administrador y Portero
    if not db.query(models.UsuarioSistema).first():
        admin = models.UsuarioSistema(
            username="admin_guanta",
            email="sistemas@guanta.gob.ve",
            nombre_completo="Administrador de Sistemas",
            password_hash=auth.get_password_hash("Guanta2026*"),
            rol=models.RolUsuario.ADMIN
        )
        portero = models.UsuarioSistema(
            username="porteria1",
            email="seguridad@guanta.gob.ve",
            nombre_completo="Oficial de Guardia",
            password_hash=auth.get_password_hash("Acceso2026"),
            rol=models.RolUsuario.PORTERO
        )
        db.add_all([admin, portero])

    # 2. Crear/Actualizar Personal de Prueba
    personal_data = [
        {
            "cedula": "12345678", "nombre": "Juan", "apellido": "Pérez",
            "entidad": models.EntidadPersonal.ALCALDIA, "cargo": "Analista de Hacienda",
            "telefono": "0424-1234567", "huella_template": "HASH_EJEMPLO_JUAN_PEREZ"
        },
        {
            "cedula": "20111222", "nombre": "María", "apellido": "Rodríguez",
            "entidad": models.EntidadPersonal.INSTITUTO_AUTONOMO, "nombre_instituto": "IAMDE",
            "cargo": "Instructor", "telefono": "0412-7654321", "huella_template": None
        }
    ]

    for p_info in personal_data:
        p = db.query(models.Personal).filter(models.Personal.cedula == p_info["cedula"]).first()
        if p:
            # Actualizar
            p.nombre = p_info["nombre"]
            p.huella_template = p_info["huella_template"]
            p.cargo = p_info["cargo"]
        else:
            # Crear nuevo
            nuevo_p = models.Personal(**p_info)
            db.add(nuevo_p)

    # 3. Crear algunas asistencias de hoy (Simuladas)
    if not db.query(models.Asistencia).first():
        asist = models.Asistencia(
            cedula_identidad="12345678",
            tipo_persona=models.TipoPersona.PERSONAL,
            hora_entrada=datetime.now() - timedelta(hours=4),
            motivo="Jornada Laboral",
            piso_destino="Piso 2",
            telefono_aux="0424-1234567",
            ente_aux="ALCALDIA"
        )
        db.add(asist)

    db.commit()
    db.close()
    print("¡Base de datos 'verificacion' poblada con éxito!")

if __name__ == "__main__":
    seed()