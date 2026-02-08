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
    followers: List[str] = []
    following: List[str] = []
    created_at: datetime

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
    image: str  # base64
    created_at: datetime
    expires_at: datetime

class StoryCreate(BaseModel):
    image: str

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

@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Process session_id from Emergent Auth and create user session
    REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    """
    try:
        body = await request.json()
        session_id = body.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id required")
        
        # Get user data from Emergent Auth
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid session")
            
            auth_data = auth_response.json()
        
        # Check if user exists
        user_doc = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
        
        if user_doc:
            user = User(**user_doc)
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            username = auth_data["email"].split("@")[0] + str(uuid.uuid4().hex[:4])
            user = User(
                user_id=user_id,
                email=auth_data["email"],
                name=auth_data["name"],
                picture=auth_data.get("picture"),
                username=username,
                bio="",
                followers=[],
                following=[],
                created_at=datetime.now(timezone.utc)
            )
            await db.users.insert_one(user.dict())
        
        # Create session
        session_token = auth_data["session_token"]
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
    
    except Exception as e:
        logger.error(f"Session processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_me(current_user: User = None):
    """Get current user profile"""
    if not current_user:
        current_user = await get_current_user()
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
    """Create a new story"""
    current_user = await get_current_user(authorization, session_token)
    
    story = Story(
        story_id=f"story_{uuid.uuid4().hex[:12]}",
        user_id=current_user.user_id,
        image=story_data.image,
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
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

@api_router.get("/stories/user/{user_id}")
async def get_user_stories(user_id: str):
    """Get stories from a specific user"""
    now = datetime.now(timezone.utc)
    stories = await db.stories.find({
        "user_id": user_id,
        "expires_at": {"$gt": now}
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    return stories

# =============== REEL ROUTES ===============

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

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}
