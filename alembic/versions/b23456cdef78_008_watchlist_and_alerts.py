"""008_watchlist_and_alerts

Revision ID: b23456cdef78
Revises: a12345bcde67
Create Date: 2026-10-09 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b23456cdef78'
down_revision: Union[str, Sequence[str], None] = 'a12345bcde67'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    tables = insp.get_table_names()

    # 1. Create watchlist_items table
    if "watchlist_items" not in tables:
        op.create_table(
            "watchlist_items",
            sa.Column("id", sa.String(length=64), primary_key=True),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("symbol", sa.String(length=30), nullable=False, index=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # 2. Create user_alerts table
    if "user_alerts" not in tables:
        op.create_table(
            "user_alerts",
            sa.Column("id", sa.String(length=64), primary_key=True),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("symbol", sa.String(length=30), nullable=False, index=True),
            sa.Column("alert_type", sa.String(length=50), nullable=False, server_default="PRICE_TARGET"),
            sa.Column("condition_type", sa.String(length=50), nullable=False, server_default="ABOVE"),
            sa.Column("threshold_value", sa.Float(), nullable=True),
            sa.Column("status", sa.String(length=30), nullable=False, server_default="ACTIVE"),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column("triggered_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )


def downgrade() -> None:
    op.drop_table("user_alerts")
    op.drop_table("watchlist_items")
