from app.core.database import SessionLocal
from app.models.models import User
from app.core.security import get_password_hash

db = SessionLocal()
try:
    user = db.query(User).filter(User.username == "admin").first()
    if user:
        print(f"Updating password for user: {user.username}")
        # Explicitly hash with the CURRENT scheme (pbkdf2_sha256)
        user.password_hash = get_password_hash("password123")
        db.commit()
        print("Password updated successfully.")
    else:
        print("User not found.")
finally:
    db.close()
