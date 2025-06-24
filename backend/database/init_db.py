from database import Base, engine
import backend.database.models as models

Base.metadata.create_all(bind=engine)
