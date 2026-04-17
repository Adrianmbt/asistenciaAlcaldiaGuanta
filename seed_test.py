from database import SessionLocal, engine
import models, auth
from datetime import datetime, timedelta

def seed():
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

    # 2. Crear Personal de Prueba (Alcaldía e Institutos)
    if not db.query(models.Personal).first():
        p1 = models.Personal(
            cedula="12345678", nombre="Juan", apellido="Pérez",
            entidad=models.EntidadPersonal.ALCALDIA, cargo="Analista de Hacienda"
        )
        p2 = models.Personal(
            cedula="20111222", nombre="María", apellido="Rodríguez",
            entidad=models.EntidadPersonal.INSTITUTO_AUTONOMO, nombre_instituto="IAMDE", cargo="Instructor"
        )
        db.add_all([p1, p2])

    # 3. Crear algunas asistencias de hoy (Simuladas)
    if not db.query(models.Asistencia).first():
        asist = models.Asistencia(
            cedula_identidad="12345678",
            tipo_persona=models.TipoPersona.PERSONAL,
            hora_entrada=datetime.now() - timedelta(hours=4),
            motivo="Jornada Laboral",
            piso_destino="Piso 2"
        )
        db.add(asist)

    db.commit()
    db.close()
    print("¡Base de datos 'verificacion' poblada con éxito!")

if __name__ == "__main__":
    seed()