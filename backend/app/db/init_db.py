import logging
from app.db.session import engine, Base
import app.models  # ensure models are registered with Base.metadata

logger = logging.getLogger("netsentinel.db")

def init_db():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

if __name__ == "__main__":
    init_db()

