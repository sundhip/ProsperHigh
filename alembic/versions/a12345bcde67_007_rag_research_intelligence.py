"""007_rag_research_intelligence

Revision ID: a12345bcde67
Revises: f7890bc1234a
Create Date: 2026-10-09 17:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a12345bcde67'
down_revision: Union[str, Sequence[str], None] = 'f7890bc1234a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    
    # 1. Update documents table using batch_alter_table for SQLite & Postgres compatibility
    doc_cols = [c['name'] for c in insp.get_columns('documents')]
    with op.batch_alter_table('documents') as batch_op:
        if 'source_url' not in doc_cols:
            batch_op.add_column(sa.Column('source_url', sa.String(length=500), nullable=True))
        if 'reporting_period' not in doc_cols:
            batch_op.add_column(sa.Column('reporting_period', sa.String(length=50), nullable=True))
        if 'publication_date' not in doc_cols:
            batch_op.add_column(sa.Column('publication_date', sa.DateTime(timezone=True), nullable=True))
        if 'jurisdiction' not in doc_cols:
            batch_op.add_column(sa.Column('jurisdiction', sa.String(length=20), server_default='IN', nullable=False))
        if 'content_hash' not in doc_cols:
            batch_op.add_column(sa.Column('content_hash', sa.String(length=64), nullable=True))
        if 'file_size_bytes' not in doc_cols:
            batch_op.add_column(sa.Column('file_size_bytes', sa.Integer(), nullable=True))
        if 'mime_type' not in doc_cols:
            batch_op.add_column(sa.Column('mime_type', sa.String(length=50), server_default='text/plain', nullable=True))
        if 'parser_version' not in doc_cols:
            batch_op.add_column(sa.Column('parser_version', sa.String(length=20), server_default='1.0', nullable=False))
        if 'error_message' not in doc_cols:
            batch_op.add_column(sa.Column('error_message', sa.Text(), nullable=True))
        if 'is_user_uploaded' not in doc_cols:
            batch_op.add_column(sa.Column('is_user_uploaded', sa.Boolean(), server_default='0', nullable=False))
        if 'user_id' not in doc_cols:
            batch_op.add_column(sa.Column('user_id', sa.String(length=36), nullable=True))

    # 2. Create document_versions table
    tables = insp.get_table_names()
    if 'document_versions' not in tables:
        op.create_table(
            'document_versions',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('document_id', sa.String(length=64), sa.ForeignKey('documents.id', ondelete='CASCADE'), index=True, nullable=False),
            sa.Column('version_number', sa.String(length=20), server_default='1.0', nullable=False),
            sa.Column('source_url', sa.String(length=500), nullable=True),
            sa.Column('content_hash', sa.String(length=64), nullable=False),
            sa.Column('file_size_bytes', sa.Integer(), server_default='0', nullable=False),
            sa.Column('parsed_text', sa.Text(), nullable=True),
            sa.Column('change_notes', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # 3. Update document_chunks table
    chunk_cols = [c['name'] for c in insp.get_columns('document_chunks')]
    with op.batch_alter_table('document_chunks') as batch_op:
        if 'chunk_hash' not in chunk_cols:
            batch_op.add_column(sa.Column('chunk_hash', sa.String(length=64), nullable=True))
        if 'token_count' not in chunk_cols:
            batch_op.add_column(sa.Column('token_count', sa.Integer(), nullable=True))

    # 4. Update research_history table
    rh_cols = [c['name'] for c in insp.get_columns('research_history')]
    with op.batch_alter_table('research_history') as batch_op:
        if 'session_id' not in rh_cols:
            batch_op.add_column(sa.Column('session_id', sa.String(length=64), nullable=True))
        if 'evidence_json' not in rh_cols:
            batch_op.add_column(sa.Column('evidence_json', sa.JSON(), nullable=True))


def downgrade() -> None:
    pass
