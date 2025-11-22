"""MealNutrition user_id

Revision ID: 596a543d847a
Revises: d487f40b2810
Create Date: 2025-11-19 22:28:52.746748

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '596a543d847a'
down_revision: Union[str, Sequence[str], None] = 'd487f40b2810'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1) เพิ่มคอลัมน์แบบ nullable ก่อน
    op.add_column('meal_nutrition',
        sa.Column('user_id', sa.Integer(), nullable=True)
    )

    # 2) ใส่ค่า default ให้ข้อมูลเก่าทั้งหมด เช่น user_id = 1
    op.execute("UPDATE meal_nutrition SET user_id = 1 WHERE user_id IS NULL")

    # 3) เปลี่ยนให้เป็น NOT NULL
    op.alter_column('meal_nutrition', 'user_id', nullable=False)

    # 4) สร้าง Foreign Key
    op.create_foreign_key(
        None, 'meal_nutrition', 'users', ['user_id'], ['id']
    )


def downgrade():
    op.drop_constraint(None, 'meal_nutrition', type_='foreignkey')
    op.drop_column('meal_nutrition', 'user_id')
