from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

import os
from dotenv import load_dotenv

# โหลด ENV
load_dotenv()

# อ่าน DATABASE_URL จาก .env
DATABASE_URL = os.getenv("DATABASE_URL")

# อ่าน config จาก alembic.ini
config = context.config

# ---- ตั้ง URL ของ DB ----
if DATABASE_URL:
    config.set_main_option("sqlalchemy.url", DATABASE_URL)

# ---- Logging ----
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---- Import Base metadata ----
from models import Base
target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,   # สำคัญ!! เพื่อ sync type ให้ตรง models
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
