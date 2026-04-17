import database, models, auth
from sqlalchemy.orm import Session

def init_db():
    print("Creando tablas en la base de datos 'verificacion.db'...")
    models.Base.metadata.create_all(bind=database.engine)
    
    db = database.SessionLocal()
    try:
        # Verificar si ya existe un admin
        admin = db.query(models.UsuarioSistema).filter(models.UsuarioSistema.username == "admin").first()
        if not admin:
            print("Creando usuario administrador inicial...")
            nuevo_admin = models.UsuarioSistema(
                username="admin",
                email="admin@guanta.gob.ve",
                nombre_completo="Administrador del Sistema",
                password_hash=auth.get_password_hash("admin123"), # Cambiar en primer inicio
                rol=models.RolUsuario.DEV
            )
            db.add(nuevo_admin)
            db.commit()
            print("Usuario 'admin' creado exitosamente (clave: admin123).")
        else:
            print("El usuario administrador ya existe.")
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")
    finally:
        db.close()
    
    print("Inicialización completada.")

if __name__ == "__main__":
    init_db()
