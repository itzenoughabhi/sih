from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

is_sqlite = db_url.startswith("sqlite")

connect_args = {}
if is_sqlite:
    connect_args["check_same_thread"] = False

_pool_kwargs = {} if is_sqlite else {
    "pool_size": 5,
    "max_overflow": 10,
    "pool_recycle": 300,  # recycle connections every 5 mins to prevent Neon idle drops
}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
    **_pool_kwargs,
)

# ── SQLite performance tuning ─────────────────────────────────────────────────
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_conn, _connection_record):
        cursor = dbapi_conn.cursor()
        # WAL mode: allows concurrent reads while a write is in progress
        cursor.execute("PRAGMA journal_mode=WAL;")
        # Reduce fsync calls – safe for non-critical data, big speed boost
        cursor.execute("PRAGMA synchronous=NORMAL;")
        # 64 MB page cache (default is ~2 MB)
        cursor.execute("PRAGMA cache_size=-65536;")
        # Store temp tables in memory
        cursor.execute("PRAGMA temp_store=MEMORY;")
        # Enable memory-mapped I/O (256 MB)
        cursor.execute("PRAGMA mmap_size=268435456;")
        cursor.close()
# ─────────────────────────────────────────────────────────────────────────────

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
