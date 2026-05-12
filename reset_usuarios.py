"""
Script de emergencia: elimina todos los usuarios del sistema y crea 3 nuevos
con credenciales conocidas. Ejecutar con: python reset_usuarios.py
"""
from database import SessionLocal, engine
import models, auth

def reset_usuarios():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Eliminar todos los usuarios existentes
    eliminados = db.query(models.UsuarioSistema).delete()
    db.commit()
    print(f"[OK] Eliminados {eliminados} usuario(s) previo(s)")

    # Crear usuarios frescos con credenciales conocidas
    usuarios = [
        models.UsuarioSistema(
            username="admin",
            email="admin@guanta.gob.ve",
            nombre_completo="Administrador Principal",
            password_hash=auth.get_password_hash("admin123"),
            rol=models.RolUsuario.ADMIN
        ),
        models.UsuarioSistema(
            username="portero",
            email="porteria@guanta.gob.ve",
            nombre_completo="Oficial de Portería",
            password_hash=auth.get_password_hash("portero123"),
            rol=models.RolUsuario.PORTERO
        ),
        models.UsuarioSistema(
            username="admin_guanta",
            email="sistemas@guanta.gob.ve",
            nombre_completo="Administrador de Sistemas",
            password_hash=auth.get_password_hash("Guanta2026*"),
            rol=models.RolUsuario.ADMIN
        ),
    ]

    db.add_all(usuarios)
    db.commit()
    db.close()

    print("\n[OK] Usuarios creados exitosamente:")
    print("-" * 40)
    print("  Usuario : admin")
    print("  Clave   : admin123")
    print("  Rol     : ADMIN")
    print("-" * 40)
    print("  Usuario : portero")
    print("  Clave   : portero123")
    print("  Rol     : PORTERO")
    print("-" * 40)
    print("  Usuario : admin_guanta")
    print("  Clave   : Guanta2026*")
    print("  Rol     : ADMIN")
    print("-" * 40)

if __name__ == "__main__":
    reset_usuarios()
