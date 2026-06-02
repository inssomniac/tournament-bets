"""bonus_channels: channel_id to string + is_active + seed

Revision ID: e4f5a6b7c8d9
Revises: d3e4f5a6b7c8
Create Date: 2026-06-02 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e4f5a6b7c8d9'
down_revision: Union[str, None] = 'd3e4f5a6b7c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Меняем тип channel_id с BigInteger на String(100)
    op.alter_column(
        'bonus_channels', 'channel_id',
        existing_type=sa.BigInteger(),
        type_=sa.String(length=100),
        existing_nullable=False,
        postgresql_using='channel_id::text',
    )

    # Добавляем is_active
    op.add_column(
        'bonus_channels',
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
    )

    # Seed: первый канал-партнёр
    op.execute("""
        INSERT INTO bonus_channels (channel_id, channel_name, channel_url, bonus_points, is_active)
        VALUES ('@colizeum_vladivostok_balyaeva', 'Colizeum Владивосток', 'https://t.me/colizeum_vladivostok_balyaeva', 200, true)
        ON CONFLICT (channel_id) DO NOTHING
    """)


def downgrade() -> None:
    op.drop_column('bonus_channels', 'is_active')
    op.alter_column(
        'bonus_channels', 'channel_id',
        existing_type=sa.String(length=100),
        type_=sa.BigInteger(),
        existing_nullable=False,
        postgresql_using='channel_id::bigint',
    )
