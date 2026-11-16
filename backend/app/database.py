from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite database file stored right inside the backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./janapriya.db"

# check_same_thread=False is required for SQLite when used with FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Session factory for interacting with the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all SQLAlchemy models
Base = declarative_base()

def get_db():
    """
    Dependency function that creates a new SQLAlchemy session for each request
    and closes it automatically once the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()