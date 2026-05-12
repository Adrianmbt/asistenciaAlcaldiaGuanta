import sqlite3

def patch_db():
    conn = sqlite3.connect('verificacion.db')
    cursor = conn.cursor()
    try:
        cursor.execute('ALTER TABLE personal ADD COLUMN huella_template TEXT')
        print("[OK] Columna 'huella_template' añadida a la tabla 'personal'")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("! La columna 'huella_template' ya existe.")
        else:
            print(f"Error: {e}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    patch_db()
