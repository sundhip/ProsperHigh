import os
import sys
import sqlite3
import hashlib

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.config import settings


def compute_sha256(filepath: str) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


def restore_database(backup_file: str, target_db_path: str = None) -> bool:
    """
    Restores database from point-in-time backup and verifies integrity.
    """
    if not os.path.exists(backup_file):
        raise FileNotFoundError(f"Backup file not found: {backup_file}")

    # Verify checksum if present
    meta_file = f"{backup_file}.sha256"
    if os.path.exists(meta_file):
        with open(meta_file, "r") as f:
            expected_hash = f.read().strip()
        actual_hash = compute_sha256(backup_file)
        if expected_hash != actual_hash:
            raise ValueError(f"Checksum mismatch! Expected {expected_hash}, got {actual_hash}")
        print(f"[VERIFIED] Backup integrity verified via SHA-256 checksum.")

    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite"):
        if not target_db_path:
            target_db_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
            if not os.path.isabs(target_db_path):
                target_db_path = os.path.abspath(target_db_path)

        # Restore SQLite via online backup API
        src_conn = sqlite3.connect(backup_file)
        dest_conn = sqlite3.connect(target_db_path)
        with dest_conn:
            src_conn.backup(dest_conn, pages=100)
        src_conn.close()
        dest_conn.close()

        # Verify restoration with table verification query
        verify_conn = sqlite3.connect(target_db_path)
        cursor = verify_conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        verify_conn.close()

        print(f"[SUCCESS] Database successfully restored to: {target_db_path}")
        print(f"  Verified tables ({len(tables)}): {', '.join(tables[:5])}...")
        return True

    elif db_url.startswith("postgresql"):
        cmd = f'pg_restore --clean --if-exists -d "{db_url}" "{backup_file}"'
        res = os.system(cmd)
        if res != 0:
            raise RuntimeError(f"pg_restore failed with exit code {res}")
        print(f"[SUCCESS] PostgreSQL restore completed.")
        return True

    else:
        raise ValueError(f"Unsupported database scheme for restore: {db_url}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/restore_db.py <backup_file> [target_db_path]")
        sys.exit(1)
    backup_file = sys.argv[1]
    target_path = sys.argv[2] if len(sys.argv) > 2 else None
    restore_database(backup_file, target_path)
