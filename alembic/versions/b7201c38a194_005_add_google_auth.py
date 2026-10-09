"""005_add_google_auth

Revision ID: b7201c38a194
Revises: e5192ba73f11
Create Date: 2026-10-09 16:36:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7201c38a194'
down_revision: Union[str, Sequence[str], None] = 'e5192ba73f11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = [c['name'] for c in insp.get_columns('users')]
    existing_indices = [idx['name'] for idx in insp.get_indexes('users')]

    if 'google_id' not in existing_cols:
        op.add_column('users', sa.Column('google_id', sa.String(length=100), nullable=True))
    if 'ix_users_google_id' not in existing_indices:
        op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
    if 'auth_provider' not in existing_cols:
        op.add_column('users', sa.Column('auth_provider', sa.String(length=30), server_default='local', nullable=False))
    
    if bind.dialect.name != 'sqlite':
        op.alter_column('users', 'password_hash',
                   existing_type=sa.String(length=255),
                   nullable=True)


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != 'sqlite':
        op.alter_column('users', 'password_hash',
                   existing_type=sa.String(length=255),
                   nullable=False)
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'auth_provider')
    op.drop_column('users', 'google_id')


