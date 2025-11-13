"""add username to profiles

Revision ID: ee3b0f57500d
Revises: 
Create Date: 2025-09-11 23:07:49.436890
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'ee3b0f57500d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # --- MENU ---
    if 'menu' in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("menu")]
        if "food_name" in cols:
            op.alter_column('menu', 'food_name',
                existing_type=sa.TEXT(),
                type_=sa.String(),
                nullable=True)
        if "calories" in cols:
            op.alter_column('menu', 'calories',
                existing_type=sa.NUMERIC(precision=12, scale=2),
                type_=sa.Float(),
                existing_nullable=True)
        if "protein" in cols:
            op.alter_column('menu', 'protein',
                existing_type=sa.NUMERIC(precision=12, scale=2),
                type_=sa.Float(),
                existing_nullable=True)
        if "carbs" in cols:
            op.alter_column('menu', 'carbs',
                existing_type=sa.NUMERIC(precision=12, scale=2),
                type_=sa.Float(),
                existing_nullable=True)
        if "fat" in cols:
            op.alter_column('menu', 'fat',
                existing_type=sa.NUMERIC(precision=12, scale=2),
                type_=sa.Float(),
                existing_nullable=True)
        if "food_name_en" in cols:
            op.alter_column('menu', 'food_name_en',
                existing_type=sa.TEXT(),
                type_=sa.String(),
                existing_nullable=True)
        if "created_at" in cols:
            op.drop_column("menu", "created_at")
        if "sugar" in cols:
            op.drop_column("menu", "sugar")

        op.create_index(op.f('ix_menu_id'), 'menu', ['id'], unique=False)

    # --- PROFILES ---
    if 'profiles' in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("profiles")]
        if "username" not in cols:
            op.add_column('profiles', sa.Column('username', sa.String(length=150), nullable=True))

        if "food_allergies" in cols:
            op.alter_column('profiles', 'food_allergies',
                existing_type=sa.TEXT(),
                type_=sa.String(),
                existing_nullable=True)

        if "avatar_url" in cols:
            op.alter_column('profiles', 'avatar_url',
                existing_type=sa.TEXT(),
                type_=sa.String(),
                existing_nullable=True)

        op.create_index(op.f('ix_profiles_id'), 'profiles', ['id'], unique=False)

        # unique constraint บน username (ถ้ายังไม่มี)
        constraints = [uc['name'] for uc in inspector.get_unique_constraints('profiles')]
        if "profiles_username_key" not in constraints:
            op.create_unique_constraint("profiles_username_key", 'profiles', ['username'])

        # foreign key (ถ้ามีของเดิมก็ drop ก่อน)
        fks = [fk['constrained_columns'] for fk in inspector.get_foreign_keys('profiles')]
        if ["user_id"] not in fks:
            op.create_foreign_key("profiles_user_id_fkey", "profiles", "users", ["user_id"], ["id"])


def downgrade() -> None:
    # ✅ ตัด logic กลับง่าย ๆ พอ (ไม่ซับซ้อน)
    with op.batch_alter_table("profiles") as batch_op:
        batch_op.drop_constraint("profiles_user_id_fkey", type_="foreignkey")
        batch_op.drop_constraint("profiles_username_key", type_="unique")
        batch_op.drop_index("ix_profiles_id")
        batch_op.drop_column("username")

    with op.batch_alter_table("menu") as batch_op:
        batch_op.drop_index("ix_menu_id")
        batch_op.add_column(sa.Column("sugar", sa.Numeric(precision=12, scale=2)))
        batch_op.add_column(sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.text("CURRENT_TIMESTAMP")))
