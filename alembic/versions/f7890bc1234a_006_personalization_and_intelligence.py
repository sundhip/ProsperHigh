"""006_personalization_and_intelligence

Revision ID: f7890bc1234a
Revises: b7201c38a194
Create Date: 2026-10-09 17:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7890bc1234a'
down_revision: Union[str, Sequence[str], None] = 'b7201c38a194'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    
    # 1. Update investor_profiles table with Phase 4 preference & versioning columns
    ip_cols = [c['name'] for c in insp.get_columns('investor_profiles')]
    if 'profile_version' not in ip_cols:
        op.add_column('investor_profiles', sa.Column('profile_version', sa.Integer(), server_default='1', nullable=False))
    if 'target_allocations' not in ip_cols:
        op.add_column('investor_profiles', sa.Column('target_allocations', sa.JSON(), server_default='{}', nullable=False))
    if 'liquidity_needs' not in ip_cols:
        op.add_column('investor_profiles', sa.Column('liquidity_needs', sa.String(length=100), nullable=True))
    if 'investment_preferences' not in ip_cols:
        op.add_column('investor_profiles', sa.Column('investment_preferences', sa.JSON(), server_default='{}', nullable=False))
    if 'is_complete' not in ip_cols:
        op.add_column('investor_profiles', sa.Column('is_complete', sa.Boolean(), server_default='0', nullable=False))

    # 2. Update analyses table with personalization, suitability, debate, thesis, and counterfactual fields
    an_cols = [c['name'] for c in insp.get_columns('analyses')]
    if 'is_personalized' not in an_cols:
        op.add_column('analyses', sa.Column('is_personalized', sa.Boolean(), server_default='0', nullable=False))
    if 'profile_version' not in an_cols:
        op.add_column('analyses', sa.Column('profile_version', sa.Integer(), nullable=True))
    if 'suitability_verdict' not in an_cols:
        op.add_column('analyses', sa.Column('suitability_verdict', sa.String(length=50), nullable=True))
    if 'suitability_json' not in an_cols:
        op.add_column('analyses', sa.Column('suitability_json', sa.JSON(), nullable=True))
    if 'debate_json' not in an_cols:
        op.add_column('analyses', sa.Column('debate_json', sa.JSON(), nullable=True))
    if 'thesis_json' not in an_cols:
        op.add_column('analyses', sa.Column('thesis_json', sa.JSON(), nullable=True))
    if 'counterfactuals_json' not in an_cols:
        op.add_column('analyses', sa.Column('counterfactuals_json', sa.JSON(), nullable=True))



    existing_tables = insp.get_table_names()

    # 3. Create goals table
    if 'goals' not in existing_tables:
        op.create_table(
            'goals',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False),
            sa.Column('name', sa.String(length=150), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('target_amount', sa.Float(), nullable=False),
            sa.Column('currency', sa.String(length=10), server_default='INR', nullable=False),
            sa.Column('target_date', sa.DateTime(timezone=True), nullable=True),
            sa.Column('monthly_contribution', sa.Float(), server_default='0.0', nullable=False),
            sa.Column('portfolio_id', sa.String(length=36), sa.ForeignKey('portfolios.id', ondelete='SET NULL'), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        )

    # 4. Create saved_scenarios table
    if 'saved_scenarios' not in existing_tables:
        op.create_table(
            'saved_scenarios',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False),
            sa.Column('scenario_type', sa.String(length=50), nullable=False),
            sa.Column('name', sa.String(length=150), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('parameters_json', sa.JSON(), server_default='{}', nullable=False),
            sa.Column('results_json', sa.JSON(), server_default='{}', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # 5. Create investment_theses table
    if 'investment_theses' not in existing_tables:
        op.create_table(
            'investment_theses',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('analysis_id', sa.String(length=64), sa.ForeignKey('analyses.id', ondelete='CASCADE'), index=True, nullable=True),
            sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False),
            sa.Column('symbol', sa.String(length=30), index=True, nullable=False),
            sa.Column('version', sa.String(length=20), server_default='1.0', nullable=False),
            sa.Column('thesis_json', sa.JSON(), server_default='{}', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )


def downgrade() -> None:
    op.drop_table('investment_theses')
    op.drop_table('saved_scenarios')
    op.drop_table('goals')

    with op.batch_alter_table('analyses', schema=None) as batch_op:
        batch_op.drop_column('counterfactuals_json')
        batch_op.drop_column('thesis_json')
        batch_op.drop_column('debate_json')
        batch_op.drop_column('suitability_json')
        batch_op.drop_column('suitability_verdict')
        batch_op.drop_column('profile_version')
        batch_op.drop_column('is_personalized')

    with op.batch_alter_table('investor_profiles', schema=None) as batch_op:
        batch_op.drop_column('is_complete')
        batch_op.drop_column('investment_preferences')
        batch_op.drop_column('liquidity_needs')
        batch_op.drop_column('target_allocations')
        batch_op.drop_column('profile_version')

