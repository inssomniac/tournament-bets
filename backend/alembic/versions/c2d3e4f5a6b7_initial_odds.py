"""initial_odds columns for matches

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-05-24

"""
from alembic import op
import sqlalchemy as sa

revision = 'c2d3e4f5a6b7'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add initial_odds columns (nullable first to allow backfill)
    op.add_column('matches', sa.Column('initial_odds_team1', sa.Numeric(5, 2), nullable=True))
    op.add_column('matches', sa.Column('initial_odds_team2', sa.Numeric(5, 2), nullable=True))

    # Backfill: initial odds = current stored odds
    op.execute("UPDATE matches SET initial_odds_team1 = odds_team1, initial_odds_team2 = odds_team2")

    # Make NOT NULL after backfill
    op.alter_column('matches', 'initial_odds_team1', nullable=False)
    op.alter_column('matches', 'initial_odds_team2', nullable=False)

    # Also widen odds_team1/2 from Numeric(4,2) to Numeric(5,2) to allow values like 10.00
    op.alter_column('matches', 'odds_team1', type_=sa.Numeric(5, 2))
    op.alter_column('matches', 'odds_team2', type_=sa.Numeric(5, 2))


def downgrade() -> None:
    op.drop_column('matches', 'initial_odds_team1')
    op.drop_column('matches', 'initial_odds_team2')
    op.alter_column('matches', 'odds_team1', type_=sa.Numeric(4, 2))
    op.alter_column('matches', 'odds_team2', type_=sa.Numeric(4, 2))
