"""seed sponsor channels

Revision ID: f5a6b7c8d9e0
Revises: e4f5a6b7c8d9
Create Date: 2026-06-04 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'f5a6b7c8d9e0'
down_revision: Union[str, None] = 'e4f5a6b7c8d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SPONSORS = [
    ('@DoSyta_vl',   'ДОСЫТА',                       'https://t.me/DoSyta_vl',   200),
    ('@equiplap',    'LAP (бренд одежды)',             'https://t.me/equiplap',    200),
    ('@ORDEN_MTO',   'Орден МТО',                     'https://t.me/ORDEN_MTO',   200),
    ('@SPORTSHEM',   'Спортивный отдел СС ШЭМ',       'https://t.me/SPORTSHEM',   200),
    ('@ss_shem',     'Студенческий Совет ШЭМ',        'https://t.me/ss_shem',     200),
]


def upgrade() -> None:
    for channel_id, name, url, pts in SPONSORS:
        op.execute(f"""
            INSERT INTO bonus_channels (channel_id, channel_name, channel_url, bonus_points, is_active)
            VALUES ('{channel_id}', '{name}', '{url}', {pts}, true)
            ON CONFLICT (channel_id) DO NOTHING
        """)


def downgrade() -> None:
    for channel_id, *_ in SPONSORS:
        op.execute(f"DELETE FROM bonus_channels WHERE channel_id = '{channel_id}'")
