"""initial schema

Revision ID: a953fb9893d5
Revises: 12f4e195012f
Create Date: 2025-11-18 17:47:06.591695

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a953fb9893d5'
down_revision: Union[str, Sequence[str], None] = '12f4e195012f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
