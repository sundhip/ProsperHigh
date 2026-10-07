import os
import shutil
import sqlite3
import pytest
from scripts.backup_db import backup_database, compute_sha256
from scripts.restore_db import restore_database


def test_backup_and_restore_verification(tmp_path):
    # Create a test sqlite database with sample data
    test_db = tmp_path / "test_prosperhigh.db"
    conn = sqlite3.connect(str(test_db))
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE test_data (id INTEGER PRIMARY KEY, name TEXT)")
    cursor.execute("INSERT INTO test_data (name) VALUES ('Test Company Reliance')")
    cursor.execute("INSERT INTO test_data (name) VALUES ('Test Company TCS')")
    conn.commit()
    conn.close()

    # Create backup
    backups_dir = tmp_path / "backups"
    # Point settings or use direct sqlite logic
    from backend.core.config import settings
    orig_url = settings.DATABASE_URL
    try:
        settings.DATABASE_URL = f"sqlite:///{test_db}"
        backup_file = backup_database(output_dir=str(backups_dir))
        assert os.path.exists(backup_file)
        assert os.path.exists(f"{backup_file}.sha256")

        # Verify checksum calculation
        checksum = compute_sha256(backup_file)
        with open(f"{backup_file}.sha256") as f:
            saved_checksum = f.read().strip()
        assert checksum == saved_checksum

        # Restore into a new database file
        restore_target = tmp_path / "restored_prosperhigh.db"
        success = restore_database(backup_file, target_db_path=str(restore_target))
        assert success is True
        assert os.path.exists(restore_target)

        # Verify data survived restore
        verify_conn = sqlite3.connect(str(restore_target))
        vcursor = verify_conn.cursor()
        vcursor.execute("SELECT COUNT(*) FROM test_data")
        count = vcursor.fetchone()[0]
        verify_conn.close()
        assert count == 2

    finally:
        settings.DATABASE_URL = orig_url
