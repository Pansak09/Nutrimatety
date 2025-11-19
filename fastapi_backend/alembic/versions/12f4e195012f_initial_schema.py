"""initial schema

Revision ID: 12f4e195012f
Revises:
Create Date: 2025-11-18
"""

from alembic import op
import sqlalchemy as sa

revision = "12f4e195012f"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # สร้างตาราง users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
    )

    # สร้างตาราง profiles
    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("gender", sa.String()),
        sa.Column("height", sa.Integer()),
        sa.Column("current_weight", sa.Integer()),
        sa.Column("target_weight", sa.Integer()),
        sa.Column("goal", sa.String()),
        sa.Column("target_calories", sa.Integer()),

        sa.Column("bmi", sa.Float()),
        sa.Column("bmr", sa.Integer()),
        sa.Column("tdee", sa.Integer()),
        sa.Column("lifestyle", sa.String()),

        sa.Column("protein_target", sa.Integer()),
        sa.Column("carb_target", sa.Integer()),
        sa.Column("fat_target", sa.Integer()),
    )

    # สร้าง menu
    op.create_table(
        "menu",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("food_name", sa.String(), nullable=False),
        sa.Column("food_name_en", sa.String()),
        sa.Column("calories", sa.Float()),
        sa.Column("protein", sa.Float()),
        sa.Column("carbs", sa.Float()),
        sa.Column("fat", sa.Float()),
    )

    # สร้าง meal_nutrition
    op.create_table(
        "meal_nutrition",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("protein", sa.Float()),
        sa.Column("fat", sa.Float()),
        sa.Column("carb", sa.Float()),
        sa.Column("calories", sa.Float()),
        sa.Column("image_url", sa.String()),
        sa.Column("meal_time", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )


def downgrade():
    op.drop_table("meal_nutrition")
    op.drop_table("menu")
    op.drop_table("profiles")
    op.drop_table("users")
