import os
import jwt
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime, timedelta
from passlib.context import CryptContext
from supabase import create_client
from typing import Optional

# Environment variables (Supabase URL and Key)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# FastAPI setup
app = FastAPI(title="Supabase FastAPI Authentication")

# Security configurations
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# User registration model
class UserCreate(BaseModel):
    username: str = Field(..., min_length=4, max_length=20, pattern="^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str
    role: str = Field(..., pattern="^(composer|audio_engineer|programmer)$")

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, values) -> str:
        if 'password' in values.data and v != values.data['password']:
            raise ValueError("Passwords don't match")
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search("[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search("[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search("[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search("[!@#$%^&*()_+]", v):
            raise ValueError("Password must contain at least one special character")
        return v

# User response model
class UserResponse(BaseModel):
    user_id: int
    username: str
    email: EmailStr
    role: str

# Token response model
class Token(BaseModel):
    access_token: str
    token_type: str

# Utility functions for password hashing and JWT creation
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

# Database helpers using Supabase
async def get_user(username: str):
    user = supabase.table("Users").select("*").eq("username", username).execute()
    if user.data:
        return user.data[0]
    return None

async def create_user_in_db(user_data: UserCreate):
    hashed_password = get_password_hash(user_data.password)
    # Insert user into the Users table in Supabase
    user = supabase.table("Users").insert({
        "username": user_data.username,
        "password_hash": hashed_password,
        "role": user_data.role.lower(),
        "email": user_data.email
    }).execute()
    return user.data[0]

# Dependency to get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = await get_user(username)
    if not user:
        raise credentials_exception
    return user

# Registration endpoint
@app.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    existing_user = await get_user(user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    new_user = await create_user_in_db(user_data)
    return {
        "user_id": new_user["id"],
        "username": new_user["username"],
        "email": new_user["email"],
        "role": new_user["role"]
    }

# Login endpoint
@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user(form_data.username)
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": user["username"], "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer"
    }

# Accessible pages endpoint
@app.get("/pages")
async def get_accessible_pages(current_user: dict = Depends(get_current_user)):
    username = current_user.get("username")
    role = current_user.get("role")

    if role == "admin":
        pages = ["login", "generate", "Composer_Report", "editor", "Audio_Engineer_Report", "user_dashboard"]
    elif role == "composer":
        pages = ["login", "generate", "Composer_Report", "user_dashboard"]
    elif role in ["audio_engineer", "programmer"]:
        pages = ["login", "editor", "Audio_Engineer_Report", "user_dashboard"]
    else:
        pages = []

    common_pages = ["Gallery", "Tutorial", "account"]
    return {
        "username": username,
        "role": role,
        "pages": pages,
        "common_pages": common_pages
    }

# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
