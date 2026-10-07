import os
import sys
import shutil
import sqlite3
import hashlib
from datetime import datetime, timezone

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.config import settings


def compute_sha256(filepath: str) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


def backup_database(output_dir: str = "backups") -> str:
    """
    Creates a consistent point-in-time database backup.
    Supports SQLite via online backup API and PostgreSQL via pg_dump.
    """
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    db_url = settings.DATABASE_URL

    if db_url.startswith("sqlite"):
        # Extract relative or absolute sqlite filepath
        db_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
        if not os.path.isabs(db_path):
            db_path = os.path.abspath(db_path)

        if not os.path.exists(db_path):
            raise FileNotFoundError(f"Source database file not found at: {db_path}")

        backup_file = os.path.join(output_dir, f"prosperhigh_backup_{timestamp}.db")

        # Atomic SQLite Online Backup
        src_conn = sqlite3.connect(db_path)
        dest_conn = sqlite3.connect(backup_file)
        with dest_conn:
            src_conn.backup(dest_conn, pages=100)
        src_conn.close()
        dest_conn.close()

        checksum = compute_sha256(backup_file)
        meta_file = f"{backup_file}.sha256"
        with open(meta_file, "w") as f:
            f.write(checksum)

        print(f"[SUCCESS] Database backup created successfully:")
        print(f"  Target: {backup_file}")
        print(f"  SHA-256: {checksum}")
        return backup_file

    elif db_url.startswith("postgresql"):
        backup_file = os.path.join(output_dir, f"prosperhigh_backup_{timestamp}.dump")
        # In production PostgreSQL, execute pg_dump using environment variables
        cmd = f'pg_dump "{db_url}" -Fc -f "{backup_file}"'
        res = os.system(cmd)
        if res != 0:
            raise RuntimeError(f"pg_dump failed with exit code {res}")

        checksum = compute_sha256(backup_file)
        with open(f"{backup_file}.sha256", "w") as f:
            f.write(checksum)

        print(f"[SUCCESS] PostgreSQL backup created: {backup_file}")
        return backup_file

    else:
        raise ValueError(f"Unsupported database scheme for backup: {db_url}")


if __name__ == "__main__":
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "backups"
    backup_database(out_dir)
