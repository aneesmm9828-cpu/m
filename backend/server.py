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
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
