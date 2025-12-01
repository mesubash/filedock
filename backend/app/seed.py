"""
Seed script to create default users.
Run with: python -m app.seed
"""
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.security import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

def seed_users():
    """Create default admin and user accounts"""
    db = SessionLocal()
    
    try:
        # Default users to create
        default_users = [
            {
                "email": "admin@hgn.com.np",
                "password": "adminpassword",
                "is_admin": True
            },
            {
                "email": "user@hgn.com.np", 
                "password": "userpassword",
                "is_admin": False
            }
        ]
        
        for user_data in default_users:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            
            if existing_user:
                # Update is_admin flag if needed
                if existing_user.is_admin != user_data["is_admin"]:
                    existing_user.is_admin = user_data["is_admin"]
                    db.commit()
                    print(f"Updated {user_data['email']} - is_admin: {user_data['is_admin']}")
                else:
                    print(f"User {user_data['email']} already exists, skipping...")
                continue
            
            # Create new user
            user = User(
                email=user_data["email"],
                password_hash=get_password_hash(user_data["password"]),
                is_admin=user_data["is_admin"]
            )
            db.add(user)
            db.commit()
            print(f"Created user: {user_data['email']} (admin: {user_data['is_admin']})")
        
        print("\n✅ Seeding complete!")
        print("\nDefault credentials:")
        print("  Admin: admin@hgn.com.np / adminpassword (is_admin=True)")
        print("  User:  user@hgn.com.np / userpassword (is_admin=False)")
        
    except Exception as e:
        print(f"Error seeding users: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
