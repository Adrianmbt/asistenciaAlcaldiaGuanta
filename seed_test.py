from database import SessionLocal, engine
import models, auth
from datetime import datetime, timedelta, date
import random

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # ─── 1. USUARIOS DEL SISTEMA ─────────────────────────────────────────────
    if not db.query(models.UsuarioSistema).first():
        usuarios = [
            models.UsuarioSistema(
                username="admin",
                email="admin@guanta.gob.ve",
                nombre_completo="Administrador General",
                password_hash=auth.get_password_hash("admin123"),
                rol=models.RolUsuario.ADMIN
            ),
            models.UsuarioSistema(
                username="admin_guanta",
                email="sistemas@guanta.gob.ve",
                nombre_completo="Administrador de Sistemas",
                password_hash=auth.get_password_hash("Guanta2026*"),
                rol=models.RolUsuario.DEV
            ),
            models.UsuarioSistema(
                username="porteria1",
                email="seguridad@guanta.gob.ve",
                nombre_completo="Carlos Mendoza",
                password_hash=auth.get_password_hash("Acceso2026"),
                rol=models.RolUsuario.PORTERO
            ),
            models.UsuarioSistema(
                username="porteria2",
                email="porteria2@guanta.gob.ve",
                nombre_completo="Luisa Fernández",
                password_hash=auth.get_password_hash("Acceso2026"),
                rol=models.RolUsuario.PORTERO
            ),
        ]
        db.add_all(usuarios)
        db.flush()

    # ─── 2. ENTES ────────────────────────────────────────────────────────────
    if not db.query(models.Ente).first():
        entes = [
            models.Ente(nombre="Alcaldía de Guanta", siglas="ALC", tipo="alcaldia"),
            models.Ente(nombre="Instituto Autónomo Municipal de Deporte", siglas="IAMDE", tipo="instituto_autonomo"),
            models.Ente(nombre="Instituto Municipal de Turismo", siglas="IMTUR", tipo="instituto_autonomo"),
            models.Ente(nombre="Instituto Autónomo de Vivienda y Urbanismo", siglas="IVU", tipo="instituto_autonomo"),
        ]
        db.add_all(entes)
        db.flush()

    # ─── 3. DEPARTAMENTOS ────────────────────────────────────────────────────
    if not db.query(models.Departamento).first():
        departamentos = [
            models.Departamento(nombre="Despacho", descripcion="Despacho de la Alcaldía"),
            models.Departamento(nombre="Secretaría General", descripcion="Coordinación administrativa"),
            models.Departamento(nombre="Hacienda Pública", descripcion="Gestión financiera y presupuestaria"),
            models.Departamento(nombre="Recursos Humanos", descripcion="Gestión del talento humano"),
            models.Departamento(nombre="Obras Públicas", descripcion="Infraestructura y mantenimiento"),
            models.Departamento(nombre="Urbanismo", descripcion="Planificación urbana y licencias"),
            models.Departamento(nombre="Servicios Públicos", descripcion="Aseo, agua y servicios básicos"),
            models.Departamento(nombre="Seguridad Ciudadana", descripcion="Protección y vigilancia"),
            models.Departamento(nombre="Cultura y Deporte", descripcion="Promoción cultural y deportiva"),
            models.Departamento(nombre="Turismo", descripcion="Promoción turística municipal"),
            models.Departamento(nombre="Participación Ciudadana", descripcion="Consejos comunales y organización social"),
            models.Departamento(nombre="Jurídico Consultoría", descripcion="Asesoría legal institucional"),
        ]
        db.add_all(departamentos)
        db.flush()

    # ─── 4. CARGOS ───────────────────────────────────────────────────────────
    if not db.query(models.Cargo).first():
        cargos = [
            models.Cargo(nombre="Alcalde", descripcion="Máxima autoridad municipal"),
            models.Cargo(nombre="Vicealcaldesa", descripcion="Segunda autoridad municipal"),
            models.Cargo(nombre="Secretario/a General", descripcion="Coordinación administrativa"),
            models.Cargo(nombre="Director/a de Hacienda", descripcion="Gestión financiera"),
            models.Cargo(nombre="Director/a de Recursos Humanos", descripcion="Gestión de personal"),
            models.Cargo(nombre="Director/a de Obras Públicas", descripcion="Infraestructura municipal"),
            models.Cargo(nombre="Director/a de Servicios Públicos", descripcion="Servicios básicos"),
            models.Cargo(nombre="Director/a de Seguridad Ciudadana", descripcion="Seguridad pública"),
            models.Cargo(nombre="Coordinador/a de Turismo", descripcion="Promoción turística"),
            models.Cargo(nombre="Coordinador/a de Cultura y Deporte", descripcion="Gestión cultural"),
            models.Cargo(nombre="Abogado/a Consultor", descripcion="Asesoría jurídica"),
            models.Cargo(nombre="Analista de Presupuesto", descripcion="Planificación financiera"),
            models.Cargo(nombre="Analista de Nómina", descripcion="Cálculo de nómina"),
            models.Cargo(nombre="Ingeniero/a Civil", descripcion="Proyectos de infraestructura"),
            models.Cargo(nombre="Técnico/a Administrativo", descripcion="Gestión administrativa"),
            models.Cargo(nombre="Asistente Administrativo", descripcion="Soporte administrativo"),
            models.Cargo(nombre="Oficial de Seguridad", descripcion="Portería y vigilancia"),
            models.Cargo(nombre="Conserje", descripcion="Mantenimiento y limpieza"),
            models.Cargo(nombre="Técnico/a en Informática", descripcion="Soporte tecnológico"),
        ]
        db.add_all(cargos)
        db.flush()

    # ─── 5. EMPLEADOS ────────────────────────────────────────────────────────
    if not db.query(models.Empleado).first():
        # Referencias para asignación
        deptos = {d.nombre: d for d in db.query(models.Departamento).all()}
        cargos_map = {c.nombre: c for c in db.query(models.Cargo).all()}
        entes_map = {e.siglas: e for e in db.query(models.Ente).all()}

        empleados_data = [
            # Dirección General
            {"cedula": "V-12345678", "nombres": "Juan Carlos", "apellidos": "Pérez González",
             "sexo": models.Sexo.M, "fecha_nacimiento": date(1975, 3, 12), "fecha_ingreso": date(2018, 2, 1),
             "cargo": "Director/a de Hacienda", "departamento": "Hacienda Pública", "ente": "ALC",
             "telefono": "0424-1234567", "correo": "jperez@guanta.gob.ve", "es_responsable": 1},

            {"cedula": "V-18765432", "nombres": "María Alejandra", "apellidos": "Rodríguez López",
             "sexo": models.Sexo.F, "fecha_nacimiento": date(1982, 7, 22), "fecha_ingreso": date(2019, 6, 15),
             "cargo": "Director/a de Recursos Humanos", "departamento": "Recursos Humanos", "ente": "ALC",
             "telefono": "0412-7654321", "correo": "mrodriguez@guanta.gob.ve", "es_responsable": 1},

            {"cedula": "V-20111222", "nombres": "Carlos Andrés", "apellidos": "Mendoza Bravo",
             "sexo": models.Sexo.M, "fecha_nacimiento": date(1988, 11, 5), "fecha_ingreso": date(2020, 1, 10),
             "cargo": "Oficial de Seguridad", "departamento": "Seguridad Ciudadana", "ente": "ALC",
             "telefono": "0414-5551234", "correo": "cmendoza@guanta.gob.ve"},

            {"cedula": "V-24332110", "nombres": "Luisa Fernanda", "apellidos": "Fernández Castro",
             "sexo": models.Sexo.F, "fecha_nacimiento": date(1990, 4, 18), "fecha_ingreso": date(2021, 3, 20),
             "cargo": "Técnico/a Administrativo", "departamento": "Secretaría General", "ente": "ALC",
             "telefono": "0424-9876543", "correo": "lfernandez@guanta.gob.ve"},

            {"cedula": "V-16554321", "nombres": "Pedro José", "apellidos": "García Martínez",
             "sexo": models.Sexo.M, "fecha_nacimiento": date(1978, 9, 30), "fecha_ingreso": date(2015, 8, 1),
             "cargo": "Director/a de Obras Públicas", "departamento": "Obras Públicas", "ente": "ALC",
             "telefono": "0416-3334455", "correo": "pgarcia@guanta.gob.ve", "es_responsable": 1},

            {"cedula": "V-22334455", "nombres": "Ana Lucía", "apellidos": "Torres Blanco",
             "sexo": models.Sexo.F, "fecha_nacimiento": date(1985, 1, 25), "fecha_ingreso": date(2020, 9, 1),
             "cargo": "Coordinador/a de Turismo", "departamento": "Turismo", "ente": "IMTUR",
             "telefono": "0412-1122334", "correo": "atorres@imtur.gob.ve"},

            {"cedula": "V-19887766", "nombres": "Roberto", "apellidos": "Díaz Paredes",
             "sexo": models.Sexo.M, "fecha_nacimiento": date(1980, 6, 14), "fecha_ingreso": date(2017, 4, 15),
             "cargo": "Ingeniero/a Civil", "departamento": "Obras Públicas", "ente": "ALC",
             "telefono": "0424-5566778", "correo": "rdiaz@guanta.gob.ve"},

            {"cedula": "V-25667788", "nombres": "Carmen Rosa", "apellidos": "Jiménez Rivas",
             "sexo": models.Sexo.F, "fecha_nacimiento": date(1992, 12, 3), "fecha_ingreso": date(2022, 2, 14),
             "cargo": "Asistente Administrativo", "departamento": "Hacienda Pública", "ente": "ALC",
             "telefono": "0414-9988776", "correo": "cjimenez@guanta.gob.ve"},

            {"cedula": "V-14223344", "nombres": "Francisco", "apellidos": "López Herrera",
             "sexo": models.Sexo.M, "fecha_nacimiento": date(1972, 8, 7), "fecha_ingreso": date(2010, 1, 5),
             "cargo": "Secretario/a General", "departamento": "Secretaría General", "ente": "ALC",
             "telefono": "0416-1122334", "correo": "flopez@guanta.gob.ve", "es_responsable": 1},

            {"cedula": "V-26778899", "nombres": "Gabriela", "apellidos": "Suárez Núñez",
             "sexo": models.Sexo.F, "fecha_nacimiento": date(1993, 5, 20), "fecha_ingreso": date(2023, 1, 9),
             "cargo": "Técnico/a en Informática", "departamento": "Secretaría General", "ente": "ALC",
             "telefono": "0424-4455667", "correo": "gsuarez@guanta.gob.ve"},

            {"cedula": "V-17998877", "nombres": "Miguel Ángel", "apellidos": "Rivas Contreras",
             "sexo": models.Sexo.M, "fecha_nacimiento": date(1983, 2, 11), "fecha_ingreso": date(2016, 7, 1),
             "cargo": "Coordinador/a de Cultura y Deporte", "departamento": "Cultura y Deporte", "ente": "IAMDE",
             "telefono": "0412-6677889", "correo": "mrivas@iamde.gob.ve"},

            {"cedula": "V-21335577", "nombres": "Valentina", "apellidos": "Morales Pinto",
             "sexo": models.Sexo.F, "fecha_nacimiento": date(1991, 10, 8), "fecha_ingreso": date(2021, 11, 15),
             "cargo": "Analista de Presupuesto", "departamento": "Hacienda Pública", "ente": "ALC",
             "telefono": "0414-2233445", "correo": "vmorales@guanta.gob.ve"},

            {"cedula": "V-15443322", "nombres": "Eduardo", "apellidos": "Castillo Ramos",
             "sexo": models.Sexo.M, "fecha_nacimiento": date(1976, 7, 29), "fecha_ingreso": date(2012, 3, 1),
             "cargo": "Director/a de Seguridad Ciudadana", "departamento": "Seguridad Ciudadana", "ente": "ALC",
             "telefono": "0416-8899001", "correo": "ecastillo@guanta.gob.ve", "es_responsable": 1},

            {"cedula": "V-23446688", "nombres": "Daniela", "apellidos": "Peña Vargas",
             "sexo": models.Sexo.F, "fecha_nacimiento": date(1994, 3, 16), "fecha_ingreso": date(2024, 1, 15),
             "cargo": "Abogado/a Consultor", "departamento": "Jurídico Consultoría", "ente": "ALC",
             "telefono": "0424-7788990", "correo": "dpena@guanta.gob.ve"},

            {"cedula": "V-13665544", "nombres": "Ricardo", "apellidos": "Ochoa Domínguez",
             "sexo": models.Sexo.M, "fecha_nacimiento": date(1970, 11, 22), "fecha_ingreso": date(2008, 5, 1),
             "cargo": "Director/a de Servicios Públicos", "departamento": "Servicios Públicos", "ente": "ALC",
             "telefono": "0412-3344556", "correo": "rochoa@guanta.gob.ve", "es_responsable": 1},

            {"cedula": "V-28990011", "nombres": "Isabella", "apellidos": "Carmona Ríos",
             "sexo": models.Sexo.F, "fecha_nacimiento": date(1995, 8, 4), "fecha_ingreso": date(2024, 6, 1),
             "cargo": "Analista de Nómina", "departamento": "Recursos Humanos", "ente": "ALC",
             "telefono": "0424-1100998", "correo": "icarmona@guanta.gob.ve"},

            {"cedula": "V-11223344", "nombres": "Fernando", "apellidos": "Bautista León",
             "sexo": models.Sexo.M, "fecha_nacimiento": date(1968, 4, 9), "fecha_ingreso": date(2005, 9, 1),
             "cargo": "Conserje", "departamento": "Servicios Públicos", "ente": "ALC",
             "telefono": "0416-5544332", "correo": "fbautista@guanta.gob.ve"},

            {"cedula": "V-27556677", "nombres": "Andrea", "apellidos": "Salazar Molina",
             "sexo": models.Sexo.F, "fecha_nacimiento": date(1989, 12, 17), "fecha_ingreso": date(2022, 8, 1),
             "cargo": "Coordinador/a de Turismo", "departamento": "Turismo", "ente": "IMTUR",
             "telefono": "0414-6655443", "correo": "asalazar@imtur.gob.ve"},

            {"cedula": "V-20887766", "nombres": "Oscar", "apellidos": "Henríquez Díaz",
             "sexo": models.Sexo.M, "fecha_nacimiento": date(1987, 6, 28), "fecha_ingreso": date(2021, 4, 12),
             "cargo": "Ingeniero/a Civil", "departamento": "Urbanismo", "ente": "ALC",
             "telefono": "0424-2211009", "correo": "ohenriquez@guanta.gob.ve"},

            {"cedula": "V-24667788", "nombres": "Natalia", "apellidos": "Vargas Leal",
             "sexo": models.Sexo.F, "fecha_nacimiento": date(1996, 2, 14), "fecha_ingreso": date(2024, 3, 1),
             "cargo": "Asistente Administrativo", "departamento": "Participación Ciudadana", "ente": "ALC",
             "telefono": "0412-8877665", "correo": "nvargas@guanta.gob.ve"},
        ]

        for emp in empleados_data:
            cargo_obj = cargos_map.get(emp["cargo"])
            depto_obj = deptos.get(emp["departamento"])
            ente_obj = entes_map.get(emp["ente"])

            db.add(models.Empleado(
                cedula=emp["cedula"],
                nombres=emp["nombres"],
                apellidos=emp["apellidos"],
                sexo=emp["sexo"],
                fecha_nacimiento=emp["fecha_nacimiento"],
                fecha_ingreso=emp["fecha_ingreso"],
                cargo_id=cargo_obj.id if cargo_obj else None,
                departamento_id=depto_obj.id if depto_obj else None,
                ente_id=ente_obj.id if ente_obj else None,
                es_responsable=emp.get("es_responsable", 0),
                telefono=emp["telefono"],
                correo=emp["correo"],
                estatus_laboral=models.EstatusLaboral.ACTIVO,
                estado=models.EstadoEmpleado.ACTIVO,
            ))
        db.flush()

    # ─── 6. ASISTENCIAS DE PRUEBA ────────────────────────────────────────────
    if not db.query(models.Asistencia).first():
        cedulas = [
            "V-12345678", "V-18765432", "V-20111222", "V-24332110",
            "V-16554321", "V-22334455", "V-19887766", "V-25667788",
            "V-14223344", "V-26778899", "V-17998877", "V-21335577",
        ]
        pisos = ["Planta Baja", "Piso 1", "Piso 2", "Piso 3"]
        motivos = ["Jornada Laboral", "Reunión", "Capacitación", "Visita Institucional"]
        ahora = datetime.now()

        asistencias = []
        for i in range(20):
            cedula = random.choice(cedulas)
            dias_atras = random.randint(0, 6)
            hora_base = ahora - timedelta(days=dias_atras)
            hora_ent = hora_base.replace(
                hour=random.choice([7, 7, 8, 8, 8, 9]),
                minute=random.choice([0, 15, 30, 45]),
                second=0, microsecond=0
            )
            hora_sal = None
            if random.random() > 0.25:
                hora_sal = hora_ent + timedelta(hours=random.randint(4, 9), minutes=random.randint(0, 59))

            asistencias.append(models.Asistencia(
                cedula_identidad=cedula,
                tipo_persona=models.TipoPersona.PERSONAL,
                hora_entrada=hora_ent,
                hora_salida=hora_sal,
                motivo=random.choice(motivos),
                piso_destino=random.choice(pisos),
                telefono_aux="0424-" + str(random.randint(1000000, 9999999)),
                ente_aux="ALCALDÍA",
                registrado_por=1,
            ))
        db.add_all(asistencias)

    db.commit()
    db.close()
    print("✅ Base de datos poblada con éxito (semilla completa Alcaldía de Guanta)!")

if __name__ == "__main__":
    seed()
