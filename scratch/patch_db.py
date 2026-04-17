import sqlite3

def patch_db():
    conn = sqlite3.connect('verificacion.db')
    cursor = conn.cursor()
    
    # Lista de alteraciones
    alterations = [
        ("personal", "telefono"),
        ("asistencia_accesos", "nombre_aux"),
        ("asistencia_accesos", "telefono_aux"),
        ("asistencia_accesos", "ente_aux")
    ]
    
    for table, column in alterations:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} TEXT")
            print(f"Columna '{column}' añadida a '{table}' con éxito.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"La columna '{column}' ya existe en '{table}'.")
            else:
                print(f"Error al añadir '{column}' a '{table}': {e}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    patch_db()
