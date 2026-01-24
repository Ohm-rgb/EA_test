from app.core.database import SessionLocal, engine, Base
from app import models
from app.core.security import get_password_hash

def seed_user():
    db = SessionLocal()
    try:
        # Create models
        Base.metadata.create_all(bind=engine)
        
        # Check if user exists
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if not user:
            print("Creating admin user...")
            user = models.User(
                username="admin",
                password_hash=get_password_hash("password123")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"User created: {user.username}")
            
            # Create default settings
            settings = models.Settings(user_id=user.id)
            db.add(settings)
            db.commit()
        else:
            print("Admin user already exists.")
            
    except Exception as e:
        print(f"Error seeding user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_user()
