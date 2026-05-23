"""drop unique constraint uq_user_match to allow top-up bets

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-05-24

"""
from alembic import op

revision = 'd3e4f5a6b7c8'
down_revision = 'c2d3e4f5a6b7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the unique constraint that prevented multiple bets per user per match.
    # Top-up bets (same team, same match) are now allowed at the application layer.
    op.drop_constraint('uq_user_match', 'bets', type_='unique')


def downgrade() -> None:
    op.create_unique_constraint('uq_user_match', 'bets', ['user_id', 'match_id'])
