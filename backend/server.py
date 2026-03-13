from fastapi import FastAPI, APIRouter, HTTPException, Header, Cookie, Response, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Get API key
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============== MODELS ===============

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    pronouns: Optional[str] = None
    gender: Optional[str] = None
    link: Optional[str] = None
    followers: List[str] = []
    following: List[str] = []
    posts_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    created_at: datetime
    last_seen: Optional[datetime] = None

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Post(BaseModel):
    post_id: str
    user_id: str
    image: str  # base64
    caption: Optional[str] = None
    likes: List[str] = []
    comments: List[dict] = []
    created_at: datetime

class PostCreate(BaseModel):
    image: str
    caption: Optional[str] = None

class Story(BaseModel):
    story_id: str
    user_id: str
    image: str  # base64 (image or video)
    media_type: str = "image"  # "image" or "video"
    views: List[str] = []  # List of user_ids who viewed
    created_at: datetime
    expires_at: datetime

class StoryCreate(BaseModel):
    image: str
    media_type: str = "image"  # "image" or "video"

class Reel(BaseModel):
    reel_id: str
    user_id: str
    video: str  # base64
    caption: Optional[str] = None
    likes: List[str] = []
    comments: List[dict] = []
    created_at: datetime

class ReelCreate(BaseModel):
    video: str
    caption: Optional[str] = None

class Message(BaseModel):
    message_id: str
    sender_id: str
    receiver_id: str
    text: str
    image: Optional[str] = None
    created_at: datetime
    read: bool = False

class MessageCreate(BaseModel):
    receiver_id: str
    text: str
    image: Optional[str] = None

class Comment(BaseModel):
    text: str

class Notification(BaseModel):
    notification_id: str
    user_id: str
    type: str  # like, comment, follow, message
    from_user_id: str
    post_id: Optional[str] = None
    text: str
    read: bool = False
    created_at: datetime

class AICaptionRequest(BaseModel):
    image_description: Optional[str] = None
    provider: str = "openai"  # openai or gemini

class AIImageRequest(BaseModel):
    prompt: str
    provider: str = "openai"  # openai or gemini

class AIChatRequest(BaseModel):
    message: str
    provider: str = "openai"  # openai or gemini

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    picture: Optional[str] = None
    pronouns: Optional[str] = None
    gender: Optional[str] = None
    link: Optional[str] = None

# =============== HELPER FUNCTIONS ===============

async def get_current_user(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get current authenticated user from session token"""
    token = None
    
    # Try to get token from cookie first
    if session_token:
        token = session_token
    # Fallback to Authorization header
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Session not found")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

async def create_notification(user_id: str, type: str, from_user_id: str, text: str, post_id: Optional[str] = None):
    """Create a notification for a user"""
    notification = Notification(
        notification_id=f"notif_{uuid.uuid4().hex[:12]}",
        user_id=user_id,
        type=type,
        from_user_id=from_user_id,
        post_id=post_id,
        text=text,
        read=False,
        created_at=datetime.now(timezone.utc)
    )
    await db.notifications.insert_one(notification.dict())

# =============== AUTHENTICATION ROUTES ===============

@api_router.post("/auth/signup")
async def signup(request: Request, response: Response):
    """Signup with username and password"""
    try:
        body = await request.json()
        name = body.get("name")
        email = body.get("email")
        username = body.get("username")
        password = body.get("password")
        
        if not all([name, email, username, password]):
            raise HTTPException(status_code=400, detail="All fields required")
        
        # Check if username or email exists
        existing_user = await db.users.find_one({
            "$or": [
                {"username": username},
                {"email": email}
            ]
        }, {"_id": 0})
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already exists")
        
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = User(
            user_id=user_id,
            email=email,
            name=name,
            username=username,
            picture=None,
            bio="",
            followers=[],
            following=[],
            created_at=datetime.now(timezone.utc)
        )
        
        # Store password hash (in production, use proper hashing like bcrypt)
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        user_dict = user.dict()
        user_dict["password_hash"] = password_hash
        await db.users.insert_one(user_dict)
        
        # Create session
        session_token = f"session_{uuid.uuid4().hex}"
        session = UserSession(
            user_id=user.user_id,
            session_token=session_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            created_at=datetime.now(timezone.utc)
        )
        await db.user_sessions.insert_one(session.dict())
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7*24*60*60,
            path="/"
        )
        
        return {"user": user.dict(), "session_token": session_token}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login")
async def login(request: Request, response: Response):
    """Login with username and password"""
    try:
        body = await request.json()
        username = body.get("username")
        password = body.get("password")
        
        if not username or not password:
            raise HTTPException(status_code=400, detail="Username and password required")
        
        # Find user
        user_doc = await db.users.find_one({"username": username}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        if user_doc.get("password_hash") != password_hash:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Remove password hash from response
        user_doc.pop("password_hash", None)
        user = User(**user_doc)
        
        # Create session
        session_token = f"session_{uuid.uuid4().hex}"
        session = UserSession(
            user_id=user.user_id,
            session_token=session_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            created_at=datetime.now(timezone.utc)
        )
        await db.user_sessions.insert_one(session.dict())
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7*24*60*60,
            path="/"
        )
        
        return {"user": user.dict(), "session_token": session_token}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get current user profile"""
    current_user = await get_current_user(authorization, session_token)
    return current_user

@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user and clear session"""
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# =============== USER ROUTES ===============

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get user profile by ID"""
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc

@api_router.get("/users/username/{username}")
async def get_user_by_username(username: str):
    """Get user profile by username"""
    user_doc = await db.users.find_one({"username": username}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc

@api_router.put("/users/profile")
async def update_profile(profile_data: UpdateProfileRequest, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Update user profile"""
    current_user = await get_current_user(authorization, session_token)
    
    update_data = {}
    if profile_data.name:
        update_data["name"] = profile_data.name
    if profile_data.username:
        # Check if username already exists
        existing = await db.users.find_one({"username": profile_data.username, "user_id": {"$ne": current_user.user_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        update_data["username"] = profile_data.username
    if profile_data.bio is not None:
        update_data["bio"] = profile_data.bio
    if profile_data.picture:
        update_data["picture"] = profile_data.picture
    if profile_data.pronouns is not None:
        update_data["pronouns"] = profile_data.pronouns
    if profile_data.gender is not None:
        update_data["gender"] = profile_data.gender
    if profile_data.link is not None:
        update_data["link"] = profile_data.link
    
    # Update last seen
    update_data["last_seen"] = datetime.now(timezone.utc)
    
    if update_data:
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": update_data})
    
    # Return updated user
    updated_user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return updated_user

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Follow a user"""
    current_user = await get_current_user(authorization, session_token)
    
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if user exists
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update following list
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$addToSet": {"following": user_id}}
    )
    
    # Update followers list
    await db.users.update_one(
        {"user_id": user_id},
        {"$addToSet": {"followers": current_user.user_id}}
    )
    
    # Create notification
    await create_notification(
        user_id=user_id,
        type="follow",
        from_user_id=current_user.user_id,
        text=f"{current_user.name} started following you"
    )
    
    return {"message": "Following user"}

@api_router.post("/users/{user_id}/unfollow")
async def unfollow_user(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Unfollow a user"""
    current_user = await get_current_user(authorization, session_token)
    
    # Update following list
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$pull": {"following": user_id}}
    )
    
    # Update followers list
    await db.users.update_one(
        {"user_id": user_id},
        {"$pull": {"followers": current_user.user_id}}
    )
    
    return {"message": "Unfollowed user"}

# =============== CLOSE FRIENDS ROUTES ===============

@api_router.post("/users/{user_id}/close-friends")
async def add_close_friend(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Add user to close friends list"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$addToSet": {"close_friends": user_id}}
    )
    
    return {"message": "Added to close friends"}

@api_router.delete("/users/{user_id}/close-friends")
async def remove_close_friend(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Remove user from close friends list"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$pull": {"close_friends": user_id}}
    )
    
    return {"message": "Removed from close friends"}

@api_router.get("/users/me/close-friends")
async def get_close_friends(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get current user's close friends list"""
    current_user = await get_current_user(authorization, session_token)
    
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "close_friends": 1})
    close_friend_ids = user.get("close_friends", [])
    
    if not close_friend_ids:
        return []
    
    friends = await db.users.find(
        {"user_id": {"$in": close_friend_ids}},
        {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1}
    ).to_list(100)
    
    return friends

# =============== MUTE/RESTRICT/BLOCK ROUTES ===============

@api_router.post("/users/{user_id}/mute")
async def mute_user(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Mute a user's posts and stories"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$addToSet": {"muted_users": user_id}}
    )
    
    return {"message": "User muted"}

@api_router.delete("/users/{user_id}/mute")
async def unmute_user(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Unmute a user"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$pull": {"muted_users": user_id}}
    )
    
    return {"message": "User unmuted"}

@api_router.post("/users/{user_id}/restrict")
async def restrict_user(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Restrict a user"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$addToSet": {"restricted_users": user_id}}
    )
    
    return {"message": "User restricted"}

@api_router.delete("/users/{user_id}/restrict")
async def unrestrict_user(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Unrestrict a user"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$pull": {"restricted_users": user_id}}
    )
    
    return {"message": "User unrestricted"}

@api_router.post("/users/{user_id}/block")
async def block_user(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Block a user"""
    current_user = await get_current_user(authorization, session_token)
    
    # Block and also unfollow each other
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {
            "$addToSet": {"blocked_users": user_id},
            "$pull": {"following": user_id, "followers": user_id}
        }
    )
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$pull": {"following": current_user.user_id, "followers": current_user.user_id}}
    )
    
    return {"message": "User blocked"}

@api_router.delete("/users/{user_id}/block")
async def unblock_user(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Unblock a user"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$pull": {"blocked_users": user_id}}
    )
    
    return {"message": "User unblocked"}

@api_router.get("/users/me/blocked")
async def get_blocked_users(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get current user's blocked list"""
    current_user = await get_current_user(authorization, session_token)
    
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "blocked_users": 1})
    blocked_ids = user.get("blocked_users", [])
    
    if not blocked_ids:
        return []
    
    blocked = await db.users.find(
        {"user_id": {"$in": blocked_ids}},
        {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1}
    ).to_list(100)
    
    return blocked

@api_router.get("/users/me/muted")
async def get_muted_users(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get current user's muted list"""
    current_user = await get_current_user(authorization, session_token)
    
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "muted_users": 1})
    muted_ids = user.get("muted_users", [])
    
    if not muted_ids:
        return []
    
    muted = await db.users.find(
        {"user_id": {"$in": muted_ids}},
        {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1}
    ).to_list(100)
    
    return muted

@api_router.get("/users/me/restricted")
async def get_restricted_users(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get current user's restricted list"""
    current_user = await get_current_user(authorization, session_token)
    
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "restricted_users": 1})
    restricted_ids = user.get("restricted_users", [])
    
    if not restricted_ids:
        return []
    
    restricted = await db.users.find(
        {"user_id": {"$in": restricted_ids}},
        {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1}
    ).to_list(100)
    
    return restricted

@api_router.get("/users/{user_id}/posts")
async def get_user_posts(user_id: str, skip: int = 0, limit: int = 50):
    """Get all posts by a specific user"""
    posts = await db.posts.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user data
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    for post in posts:
        post["user"] = user
    
    return posts

@api_router.get("/users/search/{query}")
async def search_users(query: str):
    """Search users by name or username"""
    users = await db.users.find({
        "$or": [
            {"name": {"$regex": query, "$options": "i"}},
            {"username": {"$regex": query, "$options": "i"}}
        ]
    }, {"_id": 0}).limit(20).to_list(20)
    return users

# =============== POST ROUTES ===============

@api_router.post("/posts")
async def create_post(post_data: PostCreate, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a new post"""
    current_user = await get_current_user(authorization, session_token)
    
    post = Post(
        post_id=f"post_{uuid.uuid4().hex[:12]}",
        user_id=current_user.user_id,
        image=post_data.image,
        caption=post_data.caption,
        likes=[],
        comments=[],
        created_at=datetime.now(timezone.utc)
    )
    
    await db.posts.insert_one(post.dict())
    return post

@api_router.get("/posts/feed")
async def get_feed(skip: int = 0, limit: int = 20, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get feed of posts from followed users"""
    current_user = await get_current_user(authorization, session_token)
    
    # Get posts from users the current user follows + own posts
    user_ids = current_user.following + [current_user.user_id]
    
    posts = await db.posts.find(
        {"user_id": {"$in": user_ids}},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user data
    for post in posts:
        user = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
        post["user"] = user
    
    return posts

@api_router.get("/posts/explore")
async def get_explore_posts(skip: int = 0, limit: int = 30):
    """Get explore posts (all recent posts)"""
    posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user data
    for post in posts:
        user = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
        post["user"] = user
    
    return posts

@api_router.get("/posts/user/{user_id}")
async def get_user_posts(user_id: str):
    """Get posts by a specific user"""
    posts = await db.posts.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts

@api_router.get("/posts/{post_id}")
async def get_post(post_id: str):
    """Get a single post"""
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Enrich with user data
    user = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
    post["user"] = user
    
    return post

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Like a post"""
    current_user = await get_current_user(authorization, session_token)
    
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Add like
    await db.posts.update_one(
        {"post_id": post_id},
        {"$addToSet": {"likes": current_user.user_id}}
    )
    
    # Create notification if not own post
    if post["user_id"] != current_user.user_id:
        await create_notification(
            user_id=post["user_id"],
            type="like",
            from_user_id=current_user.user_id,
            post_id=post_id,
            text=f"{current_user.name} liked your post"
        )
    
    return {"message": "Post liked"}

@api_router.post("/posts/{post_id}/unlike")
async def unlike_post(post_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Unlike a post"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.posts.update_one(
        {"post_id": post_id},
        {"$pull": {"likes": current_user.user_id}}
    )
    
    return {"message": "Post unliked"}

@api_router.post("/posts/{post_id}/comment")
async def add_comment(post_id: str, comment_data: Comment, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Add comment to a post"""
    current_user = await get_current_user(authorization, session_token)
    
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment = {
        "comment_id": f"cmt_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "user_name": current_user.name,
        "user_picture": current_user.picture,
        "text": comment_data.text,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.update_one(
        {"post_id": post_id},
        {"$push": {"comments": comment}}
    )
    
    # Create notification if not own post
    if post["user_id"] != current_user.user_id:
        await create_notification(
            user_id=post["user_id"],
            type="comment",
            from_user_id=current_user.user_id,
            post_id=post_id,
            text=f"{current_user.name} commented on your post"
        )
    
    return comment

@api_router.post("/posts/{post_id}/save")
async def save_post(post_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Save a post to collection"""
    current_user = await get_current_user(authorization, session_token)
    
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Add to user's saved posts
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$addToSet": {"saved_posts": post_id}}
    )
    
    return {"message": "Post saved"}

@api_router.post("/posts/{post_id}/unsave")
async def unsave_post(post_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Remove post from saved collection"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$pull": {"saved_posts": post_id}}
    )
    
    return {"message": "Post unsaved"}

@api_router.get("/users/me/saved")
async def get_saved_posts(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get user's saved posts"""
    current_user = await get_current_user(authorization, session_token)
    
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    saved_post_ids = user.get("saved_posts", [])
    
    posts = []
    for post_id in saved_post_ids:
        post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
        if post:
            # Get post author
            author = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
            post["user"] = author
            posts.append(post)
    
    return posts

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Delete a post"""
    current_user = await get_current_user(authorization, session_token)
    
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.posts.delete_one({"post_id": post_id})
    return {"message": "Post deleted"}

# =============== STORY ROUTES ===============

@api_router.post("/stories")
async def create_story(story_data: StoryCreate, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a new story (image or video, max 10 per day)"""
    current_user = await get_current_user(authorization, session_token)
    
    # Check story limit (max 10 stories per day)
    now = datetime.now(timezone.utc)
    existing_stories = await db.stories.count_documents({
        "user_id": current_user.user_id,
        "expires_at": {"$gt": now}
    })
    
    if existing_stories >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 stories allowed. Please wait for existing stories to expire.")
    
    story = Story(
        story_id=f"story_{uuid.uuid4().hex[:12]}",
        user_id=current_user.user_id,
        image=story_data.image,
        media_type=story_data.media_type,
        views=[],
        created_at=now,
        expires_at=now + timedelta(hours=24)
    )
    
    await db.stories.insert_one(story.dict())
    return story

@api_router.get("/stories")
async def get_stories(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get stories from followed users"""
    current_user = await get_current_user(authorization, session_token)
    
    # Get stories from users the current user follows + own stories
    user_ids = current_user.following + [current_user.user_id]
    
    # Get non-expired stories
    now = datetime.now(timezone.utc)
    stories = await db.stories.find({
        "user_id": {"$in": user_ids},
        "expires_at": {"$gt": now}
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Group by user
    stories_by_user = {}
    for story in stories:
        user_id = story["user_id"]
        if user_id not in stories_by_user:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
            stories_by_user[user_id] = {
                "user": user,
                "stories": []
            }
        stories_by_user[user_id]["stories"].append(story)
    
    return list(stories_by_user.values())

# =============== HIGHLIGHTS ENDPOINTS ===============

class HighlightCreate(BaseModel):
    name: str
    cover_image: str = ""
    story_ids: List[str] = []

@api_router.post("/highlights")
async def create_highlight(highlight_data: HighlightCreate, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a new story highlight"""
    current_user = await get_current_user(authorization, session_token)
    
    highlight = {
        "highlight_id": f"highlight_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "name": highlight_data.name,
        "cover_image": highlight_data.cover_image,
        "story_ids": highlight_data.story_ids,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.highlights.insert_one(highlight)
    return highlight

@api_router.get("/highlights/user/{user_id}")
async def get_user_highlights(user_id: str):
    """Get highlights for a user"""
    highlights = await db.highlights.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return highlights

@api_router.delete("/highlights/{highlight_id}")
async def delete_highlight(highlight_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Delete a highlight"""
    current_user = await get_current_user(authorization, session_token)
    
    result = await db.highlights.delete_one({
        "highlight_id": highlight_id,
        "user_id": current_user.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Highlight not found")
    
    return {"message": "Highlight deleted"}

@api_router.get("/stories/user/{user_id}")
async def get_user_stories(user_id: str):
    """Get stories from a specific user"""
    now = datetime.now(timezone.utc)
    stories = await db.stories.find({
        "user_id": user_id,
        "expires_at": {"$gt": now}
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    return stories

@api_router.get("/stories/{story_id}")
async def get_story(story_id: str):
    """Get a single story"""
    story = await db.stories.find_one({"story_id": story_id}, {"_id": 0})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story

@api_router.post("/stories/{story_id}/view")
async def record_story_view(story_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Record that a user viewed a story"""
    current_user = await get_current_user(authorization, session_token)
    
    story = await db.stories.find_one({"story_id": story_id}, {"_id": 0})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Add view if not already viewed
    await db.stories.update_one(
        {"story_id": story_id},
        {"$addToSet": {"views": current_user.user_id}}
    )
    
    return {"message": "View recorded"}

@api_router.get("/stories/{story_id}/viewers")
async def get_story_viewers(story_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get list of users who viewed a story (only for story owner)"""
    current_user = await get_current_user(authorization, session_token)
    
    story = await db.stories.find_one({"story_id": story_id}, {"_id": 0})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Only story owner can see viewers
    if story["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only story owner can see viewers")
    
    # Get viewer details
    viewers = []
    view_ids = story.get("views", [])
    for viewer_id in view_ids:
        viewer = await db.users.find_one({"user_id": viewer_id}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
        if viewer:
            viewers.append(viewer)
    
    return {
        "view_count": len(view_ids),
        "viewers": viewers
    }

@api_router.post("/stories/{story_id}/like")
async def like_story(story_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Like a story"""
    current_user = await get_current_user(authorization, session_token)
    
    story = await db.stories.find_one({"story_id": story_id}, {"_id": 0})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    await db.stories.update_one(
        {"story_id": story_id},
        {"$addToSet": {"likes": current_user.user_id}}
    )
    
    # Create notification
    if story["user_id"] != current_user.user_id:
        await create_notification(
            user_id=story["user_id"],
            type="story_like",
            from_user_id=current_user.user_id,
            text=f"{current_user.name} liked your story"
        )
    
    return {"message": "Story liked"}

@api_router.delete("/stories/{story_id}")
async def delete_story(story_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Delete a story"""
    current_user = await get_current_user(authorization, session_token)
    
    story = await db.stories.find_one({"story_id": story_id}, {"_id": 0})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    if story["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this story")
    
    await db.stories.delete_one({"story_id": story_id})
    return {"message": "Story deleted"}

# =============== REEL ROUTES ===============

@api_router.get("/reels/user/{user_id}")
async def get_user_reels(user_id: str, skip: int = 0, limit: int = 50):
    """Get reels from a specific user"""
    reels = await db.reels.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Add user info to each reel
    for reel in reels:
        user = await db.users.find_one({"user_id": reel["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
        reel["user"] = user
    
    return reels

@api_router.post("/reels")
async def create_reel(reel_data: ReelCreate, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a new reel"""
    current_user = await get_current_user(authorization, session_token)
    
    reel = Reel(
        reel_id=f"reel_{uuid.uuid4().hex[:12]}",
        user_id=current_user.user_id,
        video=reel_data.video,
        caption=reel_data.caption,
        likes=[],
        comments=[],
        created_at=datetime.now(timezone.utc)
    )
    
    await db.reels.insert_one(reel.dict())
    return reel

@api_router.get("/reels")
async def get_reels(skip: int = 0, limit: int = 20):
    """Get all reels"""
    reels = await db.reels.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user data
    for reel in reels:
        user = await db.users.find_one({"user_id": reel["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
        reel["user"] = user
    
    return reels

@api_router.post("/reels/{reel_id}/like")
async def like_reel(reel_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Like a reel"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.reels.update_one(
        {"reel_id": reel_id},
        {"$addToSet": {"likes": current_user.user_id}}
    )
    
    return {"message": "Reel liked"}

@api_router.post("/reels/{reel_id}/unlike")
async def unlike_reel(reel_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Unlike a reel"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.reels.update_one(
        {"reel_id": reel_id},
        {"$pull": {"likes": current_user.user_id}}
    )
    
    return {"message": "Reel unliked"}

@api_router.post("/reels/{reel_id}/comment")
async def comment_on_reel(reel_id: str, comment_data: dict, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Add a comment to a reel"""
    current_user = await get_current_user(authorization, session_token)
    
    comment = {
        "comment_id": f"cmt_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "user_name": current_user.name,
        "username": current_user.username,
        "user_picture": current_user.picture[:50] + "..." if current_user.picture else None,
        "text": comment_data.get("text", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "likes": []
    }
    
    await db.reels.update_one(
        {"reel_id": reel_id},
        {"$push": {"comments": comment}}
    )
    
    # Get reel owner for notification
    reel = await db.reels.find_one({"reel_id": reel_id}, {"_id": 0, "user_id": 1})
    if reel and reel["user_id"] != current_user.user_id:
        await create_notification(
            user_id=reel["user_id"],
            type="reel_comment",
            from_user_id=current_user.user_id,
            text=f"{current_user.name} commented on your reel"
        )
    
    return comment

@api_router.post("/reels/{reel_id}/save")
async def save_reel(reel_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Save a reel to collection"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$addToSet": {"saved_reels": reel_id}}
    )
    
    return {"message": "Reel saved"}

@api_router.post("/reels/{reel_id}/unsave")
async def unsave_reel(reel_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Remove reel from saved collection"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$pull": {"saved_reels": reel_id}}
    )
    
    return {"message": "Reel unsaved"}

@api_router.delete("/reels/{reel_id}")
async def delete_reel(reel_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Delete a reel"""
    current_user = await get_current_user(authorization, session_token)
    
    reel = await db.reels.find_one({"reel_id": reel_id}, {"_id": 0})
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    
    if reel["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this reel")
    
    await db.reels.delete_one({"reel_id": reel_id})
    return {"message": "Reel deleted"}

# =============== MESSAGE ROUTES ===============

@api_router.post("/messages")
async def send_message(msg_data: MessageCreate, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Send a direct message"""
    current_user = await get_current_user(authorization, session_token)
    
    message = Message(
        message_id=f"msg_{uuid.uuid4().hex[:12]}",
        sender_id=current_user.user_id,
        receiver_id=msg_data.receiver_id,
        text=msg_data.text,
        image=msg_data.image,
        created_at=datetime.now(timezone.utc),
        read=False
    )
    
    await db.messages.insert_one(message.dict())
    
    # Create notification
    await create_notification(
        user_id=msg_data.receiver_id,
        type="message",
        from_user_id=current_user.user_id,
        text=f"{current_user.name} sent you a message"
    )
    
    return message

@api_router.get("/messages/conversations")
async def get_conversations(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get all conversations"""
    current_user = await get_current_user(authorization, session_token)
    
    # Get all messages where user is sender or receiver
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user.user_id},
            {"receiver_id": current_user.user_id}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Group by conversation
    conversations = {}
    for msg in messages:
        other_user_id = msg["receiver_id"] if msg["sender_id"] == current_user.user_id else msg["sender_id"]
        
        if other_user_id not in conversations:
            user = await db.users.find_one({"user_id": other_user_id}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
            conversations[other_user_id] = {
                "user": user,
                "last_message": msg,
                "unread_count": 0
            }
        
        # Count unread messages
        if msg["receiver_id"] == current_user.user_id and not msg["read"]:
            conversations[other_user_id]["unread_count"] += 1
    
    return list(conversations.values())

# =============== NOTES ROUTES ===============

@api_router.get("/notes")
async def get_notes(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get notes from users you follow"""
    current_user = await get_current_user(authorization, session_token)
    
    # Get user's following list
    user_data = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "following": 1})
    following = user_data.get("following", []) if user_data else []
    following.append(current_user.user_id)  # Include own note
    
    # Get notes from followed users (only last 24 hours)
    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(hours=24)
    
    notes = await db.notes.find({
        "user_id": {"$in": following},
        "created_at": {"$gte": yesterday}
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Add user info
    for note in notes:
        user = await db.users.find_one({"user_id": note["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
        note["user"] = user
    
    return notes

@api_router.post("/notes")
async def create_note(note_data: dict, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a new note (24hr status)"""
    current_user = await get_current_user(authorization, session_token)
    
    # Delete existing note if any
    await db.notes.delete_many({"user_id": current_user.user_id})
    
    note = {
        "note_id": f"note_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "text": note_data.get("text", "")[:60],  # Max 60 chars
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    
    await db.notes.insert_one(note)
    return note

@api_router.delete("/notes/me")
async def delete_my_note(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Delete own note"""
    current_user = await get_current_user(authorization, session_token)
    
    await db.notes.delete_many({"user_id": current_user.user_id})
    return {"message": "Note deleted"}

@api_router.get("/messages/chat/{user_id}")
async def get_chat(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get messages with a specific user"""
    current_user = await get_current_user(authorization, session_token)
    
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user.user_id, "receiver_id": user_id},
            {"sender_id": user_id, "receiver_id": current_user.user_id}
        ]
    }, {"_id": 0}).sort("created_at", 1).to_list(1000)
    
    # Mark messages as read
    await db.messages.update_many(
        {"sender_id": user_id, "receiver_id": current_user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    
    return messages

# =============== NOTIFICATION ROUTES ===============

@api_router.get("/notifications")
async def get_notifications(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get user notifications"""
    current_user = await get_current_user(authorization, session_token)
    
    notifications = await db.notifications.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    # Enrich with user data
    for notif in notifications:
        user = await db.users.find_one({"user_id": notif["from_user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
        notif["from_user"] = user
    
    return notifications

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Mark notification as read"""
    await db.notifications.update_one(
        {"notification_id": notification_id},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}

# =============== AI ROUTES ===============

@api_router.post("/ai/caption")
async def generate_caption(request: AICaptionRequest, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Generate AI caption for post"""
    current_user = await get_current_user(authorization, session_token)
    
    try:
        prompt = f"Generate a creative and engaging Instagram caption"
        if request.image_description:
            prompt += f" for an image about: {request.image_description}"
        prompt += ". Keep it short, catchy, and include relevant emojis."
        
        if request.provider == "gemini":
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"caption_{uuid.uuid4().hex[:8]}",
                system_message="You are a creative social media caption writer."
            )
            chat.with_model("gemini", "gemini-2.5-pro")
        else:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"caption_{uuid.uuid4().hex[:8]}",
                system_message="You are a creative social media caption writer."
            )
            chat.with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=prompt))
        return {"caption": response}
    
    except Exception as e:
        logger.error(f"Caption generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Caption generation failed: {str(e)}")

@api_router.post("/ai/image")
async def generate_image(request: AIImageRequest, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Generate AI image"""
    current_user = await get_current_user(authorization, session_token)
    
    try:
        if request.provider == "gemini":
            # Gemini Nano Banana
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"img_{uuid.uuid4().hex[:8]}",
                system_message="You are a helpful AI assistant"
            )
            chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
            
            msg = UserMessage(text=request.prompt)
            text, images = await chat.send_message_multimodal_response(msg)
            
            if images and len(images) > 0:
                image_base64 = images[0]['data']
                return {"image": image_base64, "text": text}
            else:
                raise HTTPException(status_code=500, detail="No image generated")
        else:
            # OpenAI DALL-E
            image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
            images = await image_gen.generate_images(
                prompt=request.prompt,
                model="gpt-image-1",
                number_of_images=1
            )
            
            if images and len(images) > 0:
                image_base64 = base64.b64encode(images[0]).decode('utf-8')
                return {"image": image_base64}
            else:
                raise HTTPException(status_code=500, detail="No image generated")
    
    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

@api_router.post("/ai/chat")
async def ai_chat(request: AIChatRequest, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Chat with AI assistant"""
    current_user = await get_current_user(authorization, session_token)
    
    try:
        if request.provider == "gemini":
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"chat_{current_user.user_id}",
                system_message="You are a helpful AI assistant for social media. Help users with their content creation, photo ideas, captions, and general questions."
            )
            chat.with_model("gemini", "gemini-2.5-pro")
        else:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"chat_{current_user.user_id}",
                system_message="You are a helpful AI assistant for social media. Help users with their content creation, photo ideas, captions, and general questions."
            )
            chat.with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=request.message))
        return {"response": response}
    
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

# =============== HEALTH AND ROOT ENDPOINTS ===============

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

@api_router.get("/")
async def root():
    return {"message": "MARB API is running", "version": "1.0"}

# =============== FORGOT PASSWORD / OTP ===============

@api_router.post("/auth/forgot-password")
async def forgot_password(request: Request):
    """Initiate forgot password flow - store OTP"""
    body = await request.json()
    email_or_username = body.get("email_or_username", "").lower().strip()
    if not email_or_username:
        raise HTTPException(status_code=400, detail="Email or username required")
    user = await db.users.find_one({"$or": [{"email": email_or_username}, {"username": email_or_username}]}, {"_id": 0})
    if not user:
        # Don't reveal if user exists
        return {"message": "If this account exists, an OTP has been sent"}
    import random
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.password_reset_otps.delete_many({"user_id": user["user_id"]})
    await db.password_reset_otps.insert_one({"user_id": user["user_id"], "otp": otp, "expires_at": expires_at.isoformat()})
    # In production, send via SMS/Email. For now return OTP for testing
    return {"message": "OTP sent", "otp": otp, "user_id": user["user_id"]}

@api_router.post("/auth/verify-otp")
async def verify_otp(request: Request):
    """Verify OTP for password reset"""
    body = await request.json()
    user_id = body.get("user_id")
    otp = body.get("otp")
    if not user_id or not otp:
        raise HTTPException(status_code=400, detail="user_id and otp required")
    record = await db.password_reset_otps.find_one({"user_id": user_id, "otp": otp}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    expires_at = record["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
    reset_token = uuid.uuid4().hex
    await db.password_reset_otps.update_one({"user_id": user_id, "otp": otp}, {"$set": {"reset_token": reset_token, "verified": True}})
    return {"message": "OTP verified", "reset_token": reset_token}

@api_router.post("/auth/reset-password")
async def reset_password(request: Request):
    """Reset password with reset token"""
    body = await request.json()
    user_id = body.get("user_id")
    reset_token = body.get("reset_token")
    new_password = body.get("new_password")
    if not all([user_id, reset_token, new_password]):
        raise HTTPException(status_code=400, detail="All fields required")
    record = await db.password_reset_otps.find_one({"user_id": user_id, "reset_token": reset_token, "verified": True}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    import bcrypt
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one({"user_id": user_id}, {"$set": {"hashed_password": hashed}})
    await db.password_reset_otps.delete_many({"user_id": user_id})
    return {"message": "Password reset successful"}

# =============== ONBOARDING ===============

@api_router.get("/users/suggested")
async def get_suggested_users(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get suggested users for onboarding"""
    try:
        current_user = await get_current_user(authorization, session_token)
        following = current_user.followers or []
        users = await db.users.find({"user_id": {"$ne": current_user.user_id, "$nin": following}}, {"_id": 0, "hashed_password": 0}).limit(20).to_list(20)
        import random
        random.shuffle(users)
        return users[:10]
    except:
        users = await db.users.find({}, {"_id": 0, "hashed_password": 0}).limit(10).to_list(10)
        return users

@api_router.post("/users/onboarding/complete")
async def complete_onboarding(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Mark onboarding as complete"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    interests = body.get("interests", [])
    await db.users.update_one({"user_id": current_user.user_id}, {"$set": {"onboarding_complete": True, "interests": interests}})
    return {"message": "Onboarding complete"}

# =============== GROUP MESSAGES ===============

@api_router.post("/messages/groups")
async def create_group(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a group chat"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    name = body.get("name", "Group")
    member_ids = body.get("member_ids", [])
    if current_user.user_id not in member_ids:
        member_ids.append(current_user.user_id)
    group_id = f"group_{uuid.uuid4().hex[:12]}"
    group = {
        "group_id": group_id,
        "name": name,
        "admin_id": current_user.user_id,
        "member_ids": member_ids,
        "picture": body.get("picture"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_message": None
    }
    await db.groups.insert_one({**group, "_id": group_id})
    group.pop("_id", None)
    return group

@api_router.get("/messages/groups")
async def get_groups(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get user's groups"""
    current_user = await get_current_user(authorization, session_token)
    groups = await db.groups.find({"member_ids": current_user.user_id}, {"_id": 0}).to_list(50)
    result = []
    for g in groups:
        members = await db.users.find({"user_id": {"$in": g.get("member_ids", [])}}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1}).to_list(50)
        g["members"] = members
        result.append(g)
    return result

@api_router.get("/messages/groups/{group_id}")
async def get_group_messages(group_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get group messages"""
    current_user = await get_current_user(authorization, session_token)
    messages = await db.group_messages.find({"group_id": group_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return messages

@api_router.post("/messages/groups/{group_id}")
async def send_group_message(group_id: str, request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Send a message to group"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    msg = {
        "message_id": f"gmsg_{uuid.uuid4().hex[:12]}",
        "group_id": group_id,
        "sender_id": current_user.user_id,
        "sender_name": current_user.name,
        "sender_username": current_user.username,
        "text": body.get("text", ""),
        "image": body.get("image"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.group_messages.insert_one({**msg})
    await db.groups.update_one({"group_id": group_id}, {"$set": {"last_message": {"text": msg["text"], "created_at": msg["created_at"], "sender_name": current_user.name}}})
    return msg

# =============== STORY STICKERS ===============

@api_router.post("/stories/{story_id}/poll-response")
async def respond_to_poll(story_id: str, request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Submit poll response"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    option = body.get("option", 0)
    await db.story_polls.update_one({"story_id": story_id}, {"$push": {"responses": {"user_id": current_user.user_id, "option": option, "created_at": datetime.now(timezone.utc).isoformat()}}}, upsert=True)
    return {"message": "Poll response submitted"}

@api_router.post("/stories/{story_id}/qa-response")
async def respond_to_qa(story_id: str, request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Submit Q&A response"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    question = body.get("question", "")
    await db.story_qa.update_one({"story_id": story_id}, {"$push": {"questions": {"user_id": current_user.user_id, "question": question, "is_anonymous": body.get("is_anonymous", False), "created_at": datetime.now(timezone.utc).isoformat()}}}, upsert=True)
    return {"message": "Question submitted"}

@api_router.get("/stories/{story_id}/poll-results")
async def get_poll_results(story_id: str):
    """Get poll results for a story"""
    poll = await db.story_polls.find_one({"story_id": story_id}, {"_id": 0})
    return poll or {"responses": []}

# =============== CREATOR ANALYTICS ===============

@api_router.get("/analytics/overview")
async def get_analytics_overview(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get creator analytics overview"""
    current_user = await get_current_user(authorization, session_token)
    posts = await db.posts.find({"user_id": current_user.user_id}, {"_id": 0, "likes": 1, "comments": 1, "created_at": 1}).to_list(100)
    reels = await db.reels.find({"user_id": current_user.user_id}, {"_id": 0, "likes": 1, "comments": 1, "views": 1, "created_at": 1}).to_list(100)
    total_likes = sum(len(p.get("likes", [])) for p in posts) + sum(len(r.get("likes", [])) for r in reels)
    total_comments = sum(len(p.get("comments", [])) for p in posts) + sum(len(r.get("comments", [])) for r in reels)
    followers_count = len(current_user.followers) if current_user.followers else 0
    return {
        "followers": followers_count,
        "following": len(current_user.following) if current_user.following else 0,
        "total_posts": len(posts),
        "total_reels": len(reels),
        "total_likes": total_likes,
        "total_comments": total_comments,
        "reach": followers_count * 3,
        "impressions": total_likes * 5 + total_comments * 10,
        "profile_visits": followers_count * 2,
        "follower_growth": [{"date": f"Day {i+1}", "count": max(0, followers_count - (7 - i) * 2)} for i in range(7)]
    }

@api_router.get("/analytics/content")
async def get_content_analytics(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get top performing content"""
    current_user = await get_current_user(authorization, session_token)
    posts = await db.posts.find({"user_id": current_user.user_id}, {"_id": 0, "post_id": 1, "caption": 1, "likes": 1, "comments": 1, "created_at": 1}).to_list(50)
    posts_sorted = sorted(posts, key=lambda x: len(x.get("likes", [])), reverse=True)[:5]
    reels = await db.reels.find({"user_id": current_user.user_id}, {"_id": 0, "reel_id": 1, "caption": 1, "likes": 1, "comments": 1, "created_at": 1}).to_list(50)
    reels_sorted = sorted(reels, key=lambda x: len(x.get("likes", [])), reverse=True)[:5]
    return {"top_posts": posts_sorted, "top_reels": reels_sorted}

@api_router.get("/analytics/audience")
async def get_audience_analytics(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get audience analytics"""
    current_user = await get_current_user(authorization, session_token)
    followers_count = len(current_user.followers) if current_user.followers else 0
    return {
        "total_followers": followers_count,
        "gender_split": {"male": 55, "female": 42, "other": 3},
        "age_groups": [{"group": "13-17", "pct": 8}, {"group": "18-24", "pct": 35}, {"group": "25-34", "pct": 32}, {"group": "35-44", "pct": 16}, {"group": "45+", "pct": 9}],
        "top_locations": [{"city": "Mumbai", "pct": 22}, {"city": "Delhi", "pct": 18}, {"city": "Bangalore", "pct": 15}, {"city": "Hyderabad", "pct": 10}, {"city": "Chennai", "pct": 8}],
        "active_hours": [{"hour": h, "activity": 30 + (40 if 8 <= h <= 22 else 0) + (20 if 18 <= h <= 21 else 0)} for h in range(24)]
    }

# =============== EVENTS ===============

@api_router.post("/events")
async def create_event(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create an event"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    event = {
        "event_id": f"event_{uuid.uuid4().hex[:12]}",
        "creator_id": current_user.user_id,
        "title": body.get("title", ""),
        "description": body.get("description", ""),
        "date": body.get("date", ""),
        "time": body.get("time", ""),
        "location": body.get("location", ""),
        "category": body.get("category", ""),
        "cover_image": body.get("cover_image"),
        "going": [current_user.user_id],
        "interested": [],
        "not_going": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.events.insert_one({**event, "_id": event["event_id"]})
    event.pop("_id", None)
    return event

@api_router.get("/events")
async def get_events(skip: int = 0, limit: int = 20):
    """Get events list"""
    events = await db.events.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    result = []
    for e in events:
        creator = await db.users.find_one({"user_id": e["creator_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
        e["creator"] = creator
        result.append(e)
    return result

@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    """Get event details"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    creator = await db.users.find_one({"user_id": event["creator_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
    event["creator"] = creator
    return event

@api_router.post("/events/{event_id}/rsvp")
async def rsvp_event(event_id: str, request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """RSVP to event"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    status = body.get("status", "going")  # going, interested, not_going
    await db.events.update_one({"event_id": event_id}, {"$pull": {"going": current_user.user_id, "interested": current_user.user_id, "not_going": current_user.user_id}})
    field = status if status in ["going", "interested", "not_going"] else "interested"
    await db.events.update_one({"event_id": event_id}, {"$push": {field: current_user.user_id}})
    return {"message": f"RSVP status: {status}"}

# =============== STUDY ROOMS ===============

@api_router.get("/study-rooms")
async def get_study_rooms():
    """Get active study rooms"""
    rooms = await db.study_rooms.find({}, {"_id": 0}).to_list(20)
    if not rooms:
        # Seed default rooms
        default_rooms = [
            {"room_id": "room_1", "name": "JEE Prep 2026", "subject": "Mathematics", "members": [], "max_members": 10, "timer": "25:00", "is_active": True},
            {"room_id": "room_2", "name": "UPSC Study Circle", "subject": "General Studies", "members": [], "max_members": 8, "timer": "25:00", "is_active": True},
            {"room_id": "room_3", "name": "Code & Debug", "subject": "Programming", "members": [], "max_members": 12, "timer": "25:00", "is_active": True},
            {"room_id": "room_4", "name": "CA Exam Prep", "subject": "Accountancy", "members": [], "max_members": 6, "timer": "25:00", "is_active": True},
        ]
        await db.study_rooms.insert_many([{**r, "_id": r["room_id"]} for r in default_rooms])
        rooms = default_rooms
    return rooms

@api_router.post("/study-rooms/{room_id}/join")
async def join_study_room(room_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Join a study room"""
    current_user = await get_current_user(authorization, session_token)
    await db.study_rooms.update_one({"room_id": room_id}, {"$addToSet": {"members": current_user.user_id}})
    return {"message": "Joined study room"}

@api_router.post("/study-rooms/{room_id}/leave")
async def leave_study_room(room_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Leave a study room"""
    current_user = await get_current_user(authorization, session_token)
    await db.study_rooms.update_one({"room_id": room_id}, {"$pull": {"members": current_user.user_id}})
    return {"message": "Left study room"}

# =============== BROADCAST CHANNELS ===============

@api_router.post("/broadcast-channels")
async def create_broadcast_channel(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a broadcast channel"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    channel = {
        "channel_id": f"chan_{uuid.uuid4().hex[:12]}",
        "creator_id": current_user.user_id,
        "name": body.get("name", ""),
        "description": body.get("description", ""),
        "picture": body.get("picture"),
        "subscribers": [current_user.user_id],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.broadcast_channels.insert_one({**channel, "_id": channel["channel_id"]})
    channel.pop("_id", None)
    return channel

@api_router.get("/broadcast-channels")
async def get_broadcast_channels(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get broadcast channels"""
    try:
        current_user = await get_current_user(authorization, session_token)
        channels = await db.broadcast_channels.find({}, {"_id": 0}).to_list(20)
    except:
        channels = await db.broadcast_channels.find({}, {"_id": 0}).to_list(20)
    return channels

@api_router.post("/broadcast-channels/{channel_id}/subscribe")
async def subscribe_channel(channel_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Subscribe to a broadcast channel"""
    current_user = await get_current_user(authorization, session_token)
    await db.broadcast_channels.update_one({"channel_id": channel_id}, {"$addToSet": {"subscribers": current_user.user_id}})
    return {"message": "Subscribed"}

@api_router.post("/broadcast-channels/{channel_id}/messages")
async def send_broadcast_message(channel_id: str, request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Send broadcast message"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    msg = {
        "message_id": f"bmsg_{uuid.uuid4().hex[:12]}",
        "channel_id": channel_id,
        "sender_id": current_user.user_id,
        "text": body.get("text", ""),
        "image": body.get("image"),
        "reactions": {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.broadcast_messages.insert_one({**msg})
    return msg

@api_router.get("/broadcast-channels/{channel_id}/messages")
async def get_broadcast_messages(channel_id: str):
    """Get broadcast messages"""
    messages = await db.broadcast_messages.find({"channel_id": channel_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return messages

# =============== MARB COINS / REWARDS ===============

@api_router.get("/rewards/balance")
async def get_rewards_balance(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get MARB coins balance"""
    current_user = await get_current_user(authorization, session_token)
    wallet = await db.wallets.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not wallet:
        wallet = {"user_id": current_user.user_id, "coins": 100, "transactions": []}
    return wallet

@api_router.post("/rewards/earn")
async def earn_coins(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Earn MARB coins"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    coins = body.get("coins", 10)
    reason = body.get("reason", "Activity")
    await db.wallets.update_one({"user_id": current_user.user_id}, {"$inc": {"coins": coins}, "$push": {"transactions": {"type": "earn", "amount": coins, "reason": reason, "created_at": datetime.now(timezone.utc).isoformat()}}}, upsert=True)
    return {"message": f"Earned {coins} coins!", "coins": coins}

# =============== SHOPPING / MARKETPLACE ===============

@api_router.get("/shop/products")
async def get_products(category: Optional[str] = None, skip: int = 0, limit: int = 20):
    """Get shop products"""
    query = {} if not category else {"category": category}
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return products

@api_router.post("/shop/products")
async def create_product(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a product listing"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    product = {
        "product_id": f"prod_{uuid.uuid4().hex[:12]}",
        "seller_id": current_user.user_id,
        "title": body.get("title", ""),
        "description": body.get("description", ""),
        "price": body.get("price", 0),
        "images": body.get("images", []),
        "category": body.get("category", ""),
        "stock": body.get("stock", 1),
        "ratings": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one({**product, "_id": product["product_id"]})
    product.pop("_id", None)
    return product

@api_router.get("/shop/products/{product_id}")
async def get_product(product_id: str):
    """Get product details"""
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    seller = await db.users.find_one({"user_id": product["seller_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
    product["seller"] = seller
    return product

@api_router.post("/shop/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Add product to wishlist"""
    current_user = await get_current_user(authorization, session_token)
    await db.users.update_one({"user_id": current_user.user_id}, {"$addToSet": {"wishlist": product_id}})
    return {"message": "Added to wishlist"}

@api_router.get("/shop/wishlist")
async def get_wishlist(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get user wishlist"""
    current_user = await get_current_user(authorization, session_token)
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "wishlist": 1})
    wishlist = user.get("wishlist", []) if user else []
    products = await db.products.find({"product_id": {"$in": wishlist}}, {"_id": 0}).to_list(50)
    return products

# =============== LIVE STREAMING ===============

@api_router.post("/live/start")
async def start_live(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Start a live stream"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    live = {
        "live_id": f"live_{uuid.uuid4().hex[:12]}",
        "host_id": current_user.user_id,
        "title": body.get("title", f"{current_user.name}'s Live"),
        "audience": body.get("audience", "everyone"),
        "viewers": [],
        "comments": [],
        "hearts": 0,
        "is_active": True,
        "started_at": datetime.now(timezone.utc).isoformat()
    }
    await db.live_streams.insert_one({**live, "_id": live["live_id"]})
    live.pop("_id", None)
    return live

@api_router.get("/live")
async def get_active_lives():
    """Get active live streams"""
    lives = await db.live_streams.find({"is_active": True}, {"_id": 0}).to_list(20)
    result = []
    for l in lives:
        host = await db.users.find_one({"user_id": l["host_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
        l["host"] = host
        result.append(l)
    return result

@api_router.post("/live/{live_id}/end")
async def end_live(live_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """End a live stream"""
    current_user = await get_current_user(authorization, session_token)
    await db.live_streams.update_one({"live_id": live_id, "host_id": current_user.user_id}, {"$set": {"is_active": False, "ended_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Live ended"}

@api_router.post("/live/{live_id}/comment")
async def comment_on_live(live_id: str, request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Comment on live stream"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    comment = {"user_id": current_user.user_id, "name": current_user.name, "text": body.get("text", ""), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.live_streams.update_one({"live_id": live_id}, {"$push": {"comments": comment}})
    return {"message": "Comment added"}

# =============== HASHTAG / LOCATION PAGES ===============

@api_router.get("/hashtags/{tag}/posts")
async def get_hashtag_posts(tag: str, skip: int = 0, limit: int = 30):
    """Get posts for a hashtag"""
    posts = await db.posts.find({"caption": {"$regex": f"#{tag}", "$options": "i"}}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    result = []
    for p in posts:
        user = await db.users.find_one({"user_id": p["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1})
        p["user"] = user
        result.append(p)
    return result

@api_router.get("/locations/{location}/posts")
async def get_location_posts(location: str, skip: int = 0, limit: int = 30):
    """Get posts for a location"""
    posts = await db.posts.find({"location": {"$regex": location, "$options": "i"}}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return posts

# =============== ADMIN PANEL ===============

ADMIN_SECRET = "marb_admin_2026"

@api_router.get("/admin/users")
async def admin_get_users(secret: str, skip: int = 0, limit: int = 50):
    """Admin: Get all users"""
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    users = await db.users.find({}, {"_id": 0, "hashed_password": 0}).skip(skip).limit(limit).to_list(limit)
    return {"users": users, "total": await db.users.count_documents({})}

@api_router.post("/admin/users/{user_id}/ban")
async def admin_ban_user(user_id: str, secret: str):
    """Admin: Ban a user"""
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.users.update_one({"user_id": user_id}, {"$set": {"is_banned": True}})
    return {"message": "User banned"}

@api_router.get("/admin/analytics")
async def admin_analytics(secret: str):
    """Admin: Platform analytics"""
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    total_users = await db.users.count_documents({})
    total_posts = await db.posts.count_documents({})
    total_reels = await db.reels.count_documents({})
    total_stories = await db.stories.count_documents({})
    total_messages = await db.messages.count_documents({})
    return {"total_users": total_users, "total_posts": total_posts, "total_reels": total_reels, "total_stories": total_stories, "total_messages": total_messages, "dau": total_users // 3, "weekly_active": total_users // 2}

@api_router.get("/admin/reports")
async def admin_get_reports(secret: str):
    """Admin: Get reported content"""
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    reports = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return reports

# =============== REPORTS / SAFETY ===============

@api_router.post("/report")
async def report_content(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Report content"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    report = {
        "report_id": f"rep_{uuid.uuid4().hex[:12]}",
        "reporter_id": current_user.user_id,
        "content_type": body.get("content_type", "post"),
        "content_id": body.get("content_id", ""),
        "reason": body.get("reason", ""),
        "description": body.get("description", ""),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.insert_one({**report})
    return {"message": "Report submitted. Thank you for keeping MARB safe."}

# =============== REFERRALS ===============

@api_router.get("/referrals/my-code")
async def get_referral_code(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get user's referral code"""
    current_user = await get_current_user(authorization, session_token)
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "referral_code": 1})
    if not user or not user.get("referral_code"):
        code = f"MARB{current_user.user_id[-6:].upper()}"
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": {"referral_code": code}})
    else:
        code = user["referral_code"]
    referred = await db.users.count_documents({"referred_by": code})
    return {"referral_code": code, "referred_count": referred, "coins_earned": referred * 50}

# =============== FOLLOWERS MANAGEMENT ===============

@api_router.get("/users/me/followers")
async def get_my_followers(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get current user's followers"""
    current_user = await get_current_user(authorization, session_token)
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "followers": 1})
    follower_ids = user_doc.get("followers", []) if user_doc else []
    followers = await db.users.find({"user_id": {"$in": follower_ids}}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1, "bio": 1}).to_list(100)
    return followers

@api_router.get("/users/me/following")
async def get_my_following(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get users current user is following"""
    current_user = await get_current_user(authorization, session_token)
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "following": 1})
    following_ids = user_doc.get("following", []) if user_doc else []
    following = await db.users.find({"user_id": {"$in": following_ids}}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1, "bio": 1}).to_list(100)
    return following

@api_router.delete("/users/{user_id}/followers")
async def remove_follower(user_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Remove a follower"""
    current_user = await get_current_user(authorization, session_token)
    await db.users.update_one({"user_id": current_user.user_id}, {"$pull": {"followers": user_id}})
    await db.users.update_one({"user_id": user_id}, {"$pull": {"following": current_user.user_id}})
    return {"message": "Follower removed"}

# =============== NOTIFICATIONS SETTINGS ===============

@api_router.put("/settings/notifications")
async def update_notification_settings(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Update notification settings"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    await db.users.update_one({"user_id": current_user.user_id}, {"$set": {"notification_settings": body}})
    return {"message": "Settings updated"}

@api_router.get("/settings/notifications")
async def get_notification_settings(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get notification settings"""
    current_user = await get_current_user(authorization, session_token)
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "notification_settings": 1})
    return user.get("notification_settings", {"likes": True, "comments": True, "follows": True, "messages": True, "stories": True, "reels": True}) if user else {}

# =============== MOOD FEED ===============

@api_router.post("/mood")
async def set_mood(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Set user mood for mood-based feed"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    mood = body.get("mood", "happy")
    await db.users.update_one({"user_id": current_user.user_id}, {"$set": {"current_mood": mood, "mood_updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": f"Mood set to {mood}"}

@api_router.get("/mood/feed")
async def get_mood_feed(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get mood-based feed"""
    current_user = await get_current_user(authorization, session_token)
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "current_mood": 1})
    mood = user.get("current_mood", "happy") if user else "happy"
    mood_hashtags = {"happy": "#happy #fun #joy", "sad": "#motivation #inspiration", "excited": "#adventure #travel", "peaceful": "#nature #calm #meditation", "energetic": "#fitness #workout"}
    posts = await db.posts.find({}, {"_id": 0}).limit(20).to_list(20)
    return {"mood": mood, "posts": posts[:10]}

# =============== SCHEDULED POSTS ===============

@api_router.post("/posts/schedule")
async def schedule_post(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Schedule a post for later"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    scheduled = {
        "scheduled_id": f"sched_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "image": body.get("image", ""),
        "caption": body.get("caption", ""),
        "scheduled_for": body.get("scheduled_for", ""),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.scheduled_posts.insert_one({**scheduled})
    return scheduled

@api_router.get("/posts/scheduled")
async def get_scheduled_posts(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get scheduled posts"""
    current_user = await get_current_user(authorization, session_token)
    posts = await db.scheduled_posts.find({"user_id": current_user.user_id, "status": "pending"}, {"_id": 0}).sort("scheduled_for", 1).to_list(50)
    return posts

# =============== TIME CAPSULE ===============

@api_router.post("/time-capsule")
async def create_time_capsule(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a time capsule post"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    capsule = {
        "capsule_id": f"cap_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "image": body.get("image", ""),
        "caption": body.get("caption", ""),
        "reveal_date": body.get("reveal_date", ""),
        "is_revealed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.time_capsules.insert_one({**capsule})
    return capsule

@api_router.get("/time-capsule")
async def get_time_capsules(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get user's time capsules"""
    current_user = await get_current_user(authorization, session_token)
    capsules = await db.time_capsules.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(20)
    return capsules

# =============== FUNDRAISER ===============

@api_router.post("/fundraisers")
async def create_fundraiser(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a fundraiser"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    fundraiser = {
        "fundraiser_id": f"fund_{uuid.uuid4().hex[:12]}",
        "creator_id": current_user.user_id,
        "title": body.get("title", ""),
        "description": body.get("description", ""),
        "goal_amount": body.get("goal_amount", 0),
        "raised_amount": 0,
        "donors": [],
        "image": body.get("image"),
        "end_date": body.get("end_date", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.fundraisers.insert_one({**fundraiser, "_id": fundraiser["fundraiser_id"]})
    fundraiser.pop("_id", None)
    return fundraiser

@api_router.get("/fundraisers")
async def get_fundraisers():
    """Get active fundraisers"""
    fundraisers = await db.fundraisers.find({}, {"_id": 0}).to_list(20)
    return fundraisers

# =============== VERIFICATION APPLICATION ===============

@api_router.post("/verification/apply")
async def apply_for_verification(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Apply for account verification"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    application = {
        "application_id": f"ver_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "category": body.get("category", ""),
        "known_as": body.get("known_as", ""),
        "country": body.get("country", "India"),
        "id_type": body.get("id_type", ""),
        "id_number": body.get("id_number", ""),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.verifications.insert_one({**application})
    return {"message": "Verification application submitted", "application_id": application["application_id"]}

# =============== BIRTHDAYS ===============

@api_router.get("/birthdays")
async def get_friend_birthdays(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get friends' birthdays"""
    current_user = await get_current_user(authorization, session_token)
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "following": 1})
    following_ids = user_doc.get("following", []) if user_doc else []
    friends_with_birthday = await db.users.find({"user_id": {"$in": following_ids}, "dob": {"$exists": True}}, {"_id": 0, "user_id": 1, "name": 1, "username": 1, "picture": 1, "dob": 1}).to_list(50)
    return friends_with_birthday

# =============== STREAKS ===============

@api_router.get("/streaks")
async def get_streaks(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get user streaks"""
    current_user = await get_current_user(authorization, session_token)
    streaks = await db.streaks.find({"$or": [{"user1_id": current_user.user_id}, {"user2_id": current_user.user_id}]}, {"_id": 0}).to_list(20)
    return streaks

@api_router.post("/streaks/{friend_id}/maintain")
async def maintain_streak(friend_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Maintain a streak with a friend"""
    current_user = await get_current_user(authorization, session_token)
    streak = await db.streaks.find_one({"$or": [{"user1_id": current_user.user_id, "user2_id": friend_id}, {"user1_id": friend_id, "user2_id": current_user.user_id}]}, {"_id": 0})
    if streak:
        await db.streaks.update_one({"streak_id": streak["streak_id"]}, {"$inc": {"days": 1}, "$set": {"last_maintained": datetime.now(timezone.utc).isoformat()}})
    else:
        new_streak = {"streak_id": f"str_{uuid.uuid4().hex[:12]}", "user1_id": current_user.user_id, "user2_id": friend_id, "days": 1, "last_maintained": datetime.now(timezone.utc).isoformat(), "started_at": datetime.now(timezone.utc).isoformat()}
        await db.streaks.insert_one({**new_streak})
    return {"message": "Streak maintained!"}

# =============== POST REACTIONS ===============

@api_router.post("/posts/{post_id}/react")
async def react_to_post(post_id: str, request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """React to a post with emoji"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    reaction = body.get("reaction", "like")  # like, love, haha, wow, sad, angry, care
    await db.post_reactions.update_one({"post_id": post_id, "user_id": current_user.user_id}, {"$set": {"reaction": reaction, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"message": f"Reacted with {reaction}"}

@api_router.get("/posts/{post_id}/reactions")
async def get_post_reactions(post_id: str):
    """Get all reactions for a post"""
    reactions = await db.post_reactions.find({"post_id": post_id}, {"_id": 0}).to_list(100)
    counts = {}
    for r in reactions:
        counts[r["reaction"]] = counts.get(r["reaction"], 0) + 1
    return {"reactions": counts, "total": len(reactions)}

# =============== CHECK-IN ===============

@api_router.post("/check-in")
async def check_in(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Check in at a location"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    checkin = {
        "checkin_id": f"ci_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "location": body.get("location", ""),
        "latitude": body.get("latitude"),
        "longitude": body.get("longitude"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.checkins.insert_one({**checkin})
    return checkin

@api_router.get("/check-in/history")
async def get_checkin_history(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get check-in history"""
    current_user = await get_current_user(authorization, session_token)
    checkins = await db.checkins.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return checkins

# =============== TRENDING ===============

@api_router.get("/trending")
async def get_trending():
    """Get trending topics"""
    trending_tags = ["#Bollywood", "#Cricket", "#India", "#Fashion", "#Food", "#Travel", "#Tech", "#Music", "#Fitness", "#Startup"]
    trending_locations = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Jaipur"]
    return {"trending_tags": trending_tags, "trending_locations": trending_locations, "trending_audio": ["Tum Hi Ho", "Ek Do Teen", "Kesariya", "Raataan Lambiyan", "Pasoori"]}

# =============== SAVED COLLECTIONS ===============

@api_router.post("/collections")
async def create_collection(request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a saved collection"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    collection = {
        "collection_id": f"col_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "name": body.get("name", "Collection"),
        "post_ids": [],
        "cover_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.collections.insert_one({**collection})
    return collection

@api_router.get("/collections")
async def get_collections(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get user's collections"""
    current_user = await get_current_user(authorization, session_token)
    cols = await db.collections.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(20)
    return cols

@api_router.post("/collections/{collection_id}/add")
async def add_to_collection(collection_id: str, request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Add post to collection"""
    current_user = await get_current_user(authorization, session_token)
    body = await request.json()
    post_id = body.get("post_id")
    await db.collections.update_one({"collection_id": collection_id, "user_id": current_user.user_id}, {"$addToSet": {"post_ids": post_id}})
    return {"message": "Added to collection"}

# =============== PINNED POSTS ===============

@api_router.post("/posts/{post_id}/pin")
async def pin_post(post_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Pin a post to profile"""
    current_user = await get_current_user(authorization, session_token)
    pinned = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "pinned_posts": 1})
    if pinned and len(pinned.get("pinned_posts", [])) >= 3:
        raise HTTPException(status_code=400, detail="Maximum 3 posts can be pinned")
    await db.users.update_one({"user_id": current_user.user_id}, {"$addToSet": {"pinned_posts": post_id}})
    return {"message": "Post pinned"}

@api_router.post("/posts/{post_id}/unpin")
async def unpin_post(post_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Unpin a post from profile"""
    current_user = await get_current_user(authorization, session_token)
    await db.users.update_one({"user_id": current_user.user_id}, {"$pull": {"pinned_posts": post_id}})
    return {"message": "Post unpinned"}

# =============== REELS REMIX ===============

@api_router.post("/reels/{reel_id}/remix")
async def remix_reel(reel_id: str, request: Request, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Create a remix of a reel"""
    current_user = await get_current_user(authorization, session_token)
    original = await db.reels.find_one({"reel_id": reel_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Reel not found")
    body = await request.json()
    remix = {
        "reel_id": f"reel_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "video": body.get("video", original.get("video", "")),
        "caption": body.get("caption", f"Remix of @{original.get('user', {}).get('username', '')}"),
        "original_reel_id": reel_id,
        "is_remix": True,
        "likes": [],
        "comments": [],
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reels.insert_one({**remix})
    remix.pop("_id", None)
    return remix

# =============== MEMORIES / FLASHBACK ===============

@api_router.get("/memories")
async def get_memories(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    """Get On This Day memories"""
    current_user = await get_current_user(authorization, session_token)
    today = datetime.now(timezone.utc)
    last_year = today - timedelta(days=365)
    posts = await db.posts.find({"user_id": current_user.user_id, "created_at": {"$gte": last_year.isoformat(), "$lte": (last_year + timedelta(days=3)).isoformat()}}, {"_id": 0}).to_list(10)
    return {"date": last_year.strftime("%B %d, %Y"), "memories": posts}

# =============== DATABASE SEED ENDPOINT ===============

import random
import io
from PIL import Image

def generate_gradient_image(width=400, height=400, colors=None):
    """Generate a gradient image as base64"""
    if colors is None:
        # Random gradient colors
        color1 = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        color2 = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
    else:
        color1, color2 = colors
    
    img = Image.new('RGB', (width, height))
    for y in range(height):
        r = int(color1[0] + (color2[0] - color1[0]) * y / height)
        g = int(color1[1] + (color2[1] - color1[1]) * y / height)
        b = int(color1[2] + (color2[2] - color1[2]) * y / height)
        for x in range(width):
            img.putpixel((x, y), (r, g, b))
    
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=60)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def generate_profile_pic():
    """Generate a simple profile picture"""
    colors = [
        ((255, 100, 100), (200, 50, 50)),    # Red
        ((100, 255, 100), (50, 200, 50)),    # Green
        ((100, 100, 255), (50, 50, 200)),    # Blue
        ((255, 200, 100), (200, 150, 50)),   # Orange
        ((200, 100, 255), (150, 50, 200)),   # Purple
        ((100, 255, 255), (50, 200, 200)),   # Cyan
        ((255, 100, 200), (200, 50, 150)),   # Pink
        ((255, 255, 100), (200, 200, 50)),   # Yellow
    ]
    return generate_gradient_image(100, 100, random.choice(colors))

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Sai",
    "Ananya", "Aadhya", "Saanvi", "Myra", "Diya", "Pari", "Aanya", "Kiara", "Riya", "Priya",
    "Rohan", "Karan", "Amit", "Rahul", "Nikhil", "Vikram", "Raj", "Dev", "Aryan", "Kabir",
    "Neha", "Sneha", "Pooja", "Kavya", "Sanya", "Tanvi", "Isha", "Nikita", "Shruti", "Meera",
    "Mohammed", "Ali", "Omar", "Hassan", "Ahmed", "Zara", "Fatima", "Ayesha", "Sara", "Hina",
    "John", "Mike", "David", "Chris", "Alex", "Emma", "Sophia", "Olivia", "Ava", "Mia"
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Shah", "Joshi", "Reddy", "Nair",
    "Khan", "Ali", "Ahmed", "Sheikh", "Malik", "Ansari", "Siddiqui", "Qureshi", "Mirza", "Hashmi",
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Davis", "Miller", "Wilson", "Moore", "Taylor"
]

CAPTIONS = [
    "Living my best life! ✨", "Good vibes only 🌟", "Making memories 📸", "Blessed and grateful 🙏",
    "Adventure awaits! 🌍", "Chasing dreams ⭐", "Stay positive 💫", "Love this moment ❤️",
    "Weekend mood 🎉", "Perfect day! ☀️", "Feeling happy 😊", "Life is beautiful 🌸",
    "No filter needed 📷", "Just me being me 💁", "Sunset vibes 🌅", "Coffee time ☕",
    "Workout done 💪", "Travel diaries ✈️", "Food lover 🍕", "Nature lover 🌿",
    "Party time! 🎊", "Chill mode on 😎", "New beginning 🌱", "Grateful heart 💖",
    "Dream big! 🚀", "Keep smiling 😄", "Stay humble 🙌", "Enjoy little things 🎀",
    "Beach please 🏖️", "Mountain calling 🏔️", "City lights 🌃", "Rainy day ☔",
    "Music is life 🎵", "Art lover 🎨", "Book worm 📚", "Fitness freak 🏃",
    "Fashion forward 👗", "Pet lover 🐕", "Friends forever 👫", "Family first 👨‍👩‍👧‍👦"
]

BIOS = [
    "Living life one day at a time 🌟",
    "Dream. Believe. Achieve. ✨",
    "Adventure seeker | Travel lover 🌍",
    "Music | Art | Photography 📸",
    "Just a simple person with big dreams 💭",
    "Spreading positivity everywhere 🌈",
    "Coffee addict ☕ | Book lover 📚",
    "Fitness enthusiast 💪 | Health first",
    "Creating memories one click at a time 📷",
    "Love laugh live 💖",
    "Writer | Dreamer | Creator ✍️",
    "Tech geek 💻 | Innovation lover",
    "Food explorer 🍕 | Trying new cuisines",
    "Nature lover 🌿 | Environment first",
    "Student of life 📖 | Always learning"
]

@api_router.post("/seed-database")
async def seed_database():
    """Seed database with demo data: 60 users, 400 posts, 500 reels"""
    try:
        # Clear existing data
        await db.users.delete_many({})
        await db.posts.delete_many({})
        await db.reels.delete_many({})
        await db.stories.delete_many({})
        await db.user_sessions.delete_many({})
        
        users = []
        user_ids = []
        
        # Create 60 demo users
        logger.info("Creating 60 demo users...")
        for i in range(60):
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            name = f"{first_name} {last_name}"
            username = f"{first_name.lower()}{random.randint(100, 999)}"
            email = f"{username}@demo.com"
            
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user_ids.append(user_id)
            
            # Generate followers/following (random connections)
            num_following = random.randint(5, 30)
            following = random.sample(user_ids[:-1], min(num_following, len(user_ids) - 1)) if len(user_ids) > 1 else []
            
            user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "username": username,
                "picture": generate_profile_pic(),
                "bio": random.choice(BIOS),
                "pronouns": random.choice(["he/him", "she/her", "they/them", ""]),
                "gender": random.choice(["Male", "Female", "Other", ""]),
                "link": f"https://example.com/{username}" if random.random() > 0.5 else "",
                "followers": [],
                "following": following,
                "posts_count": 0,
                "followers_count": 0,
                "following_count": len(following),
                "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 365)),
                "last_seen": datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 72)),
                "password_hash": "demo_password_hash"
            }
            users.append(user)
        
        # Insert users
        await db.users.insert_many(users)
        logger.info(f"Created {len(users)} users")
        
        # Update followers based on following
        for user in users:
            for followed_id in user["following"]:
                await db.users.update_one(
                    {"user_id": followed_id},
                    {"$addToSet": {"followers": user["user_id"]}}
                )
        
        # Create 400 posts
        logger.info("Creating 400 posts...")
        posts = []
        for i in range(400):
            user_id = random.choice(user_ids)
            post_user = next(u for u in users if u["user_id"] == user_id)
            
            # Random likes from other users
            num_likes = random.randint(0, min(50, len(user_ids)))
            likes = random.sample(user_ids, num_likes)
            
            # Random comments
            num_comments = random.randint(0, 10)
            comments = []
            for _ in range(num_comments):
                commenter_id = random.choice(user_ids)
                commenter = next(u for u in users if u["user_id"] == commenter_id)
                comments.append({
                    "comment_id": f"cmt_{uuid.uuid4().hex[:12]}",
                    "user_id": commenter_id,
                    "user_name": commenter["name"],
                    "user_picture": commenter["picture"][:50] + "..." if commenter["picture"] else None,
                    "text": random.choice(["Nice! 👍", "Beautiful ❤️", "Amazing 🔥", "Love it! 😍", "Great shot! 📸", "Awesome! 🙌", "So cool! 😎", "Wow! 🤩"]),
                    "created_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 100))).isoformat()
                })
            
            post = {
                "post_id": f"post_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "image": generate_gradient_image(400, 400),
                "caption": random.choice(CAPTIONS),
                "likes": likes,
                "comments": comments,
                "created_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 500))
            }
            posts.append(post)
            
            if (i + 1) % 50 == 0:
                logger.info(f"Created {i + 1} posts...")
        
        await db.posts.insert_many(posts)
        logger.info(f"Created {len(posts)} posts")
        
        # Create 500 reels
        logger.info("Creating 500 reels...")
        reels = []
        for i in range(500):
            user_id = random.choice(user_ids)
            
            # Random likes
            num_likes = random.randint(0, min(100, len(user_ids)))
            likes = random.sample(user_ids, num_likes)
            
            # Random comments
            num_comments = random.randint(0, 15)
            comments = []
            for _ in range(num_comments):
                commenter_id = random.choice(user_ids)
                commenter = next(u for u in users if u["user_id"] == commenter_id)
                comments.append({
                    "comment_id": f"cmt_{uuid.uuid4().hex[:12]}",
                    "user_id": commenter_id,
                    "user_name": commenter["name"],
                    "text": random.choice(["🔥🔥🔥", "So good!", "Amazing reel!", "Love this! ❤️", "Viral! 🚀", "Keep it up! 💪", "Trending! 📈", "Best! 🏆"]),
                    "created_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 100))).isoformat()
                })
            
            reel = {
                "reel_id": f"reel_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "video": generate_gradient_image(270, 480),  # Vertical video placeholder
                "caption": random.choice(CAPTIONS) + " #reel #viral #trending",
                "likes": likes,
                "comments": comments,
                "created_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 300))
            }
            reels.append(reel)
            
            if (i + 1) % 100 == 0:
                logger.info(f"Created {i + 1} reels...")
        
        await db.reels.insert_many(reels)
        logger.info(f"Created {len(reels)} reels")
        
        # Update post counts for users
        for user_id in user_ids:
            posts_count = len([p for p in posts if p["user_id"] == user_id])
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"posts_count": posts_count}}
            )
        
        return {
            "success": True,
            "message": "Database seeded successfully!",
            "data": {
                "users": 60,
                "posts": 400,
                "reels": 500
            }
        }
    
    except Exception as e:
        logger.error(f"Seed error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")

# =============== INCLUDE ROUTER ===============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://marb-stories.preview.emergentagent.com",
        "https://marb-reels.cluster-0.preview.emergentcf.cloud",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
