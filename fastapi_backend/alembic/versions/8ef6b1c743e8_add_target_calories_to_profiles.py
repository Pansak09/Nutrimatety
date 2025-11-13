"""add target_calories to profiles

Revision ID: 8ef6b1c743e8
Revises: ee3b0f57500d
Create Date: 2025-09-23 19:55:25.597341

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8ef6b1c743e8'
down_revision: Union[str, Sequence[str], None] = 'ee3b0f57500d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("target_calories", sa.Integer(), nullable=True))

def downgrade() -> None:
    op.drop_column("profiles", "target_calories")
