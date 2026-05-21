"""match live status + nullable deadline

Revision ID: a1b2c3d4e5f6
Revises: 01e80fce40a5
Create Date: 2026-05-21 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '01e80fce40a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make bet_deadline nullable — deadline is now informational only;
    # bets close when admin presses "Start match" (status → live)
    op.alter_column('matches', 'bet_deadline', nullable=True)


def downgrade() -> None:
    # Fill NULLs before restoring NOT NULL constraint
    op.execute("UPDATE matches SET bet_deadline = NOW() WHERE bet_deadline IS NULL")
    op.alter_column('matches', 'bet_deadline', nullable=False)
