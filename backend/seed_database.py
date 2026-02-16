import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid
import random
import hashlib
import os
from dotenv import load_dotenv
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Indian names for realistic accounts
INDIAN_NAMES = [
    "Aarav Sharma", "Vivaan Kumar", "Aditya Singh", "Vihaan Patel", "Arjun Gupta",
    "Sai Reddy", "Arnav Verma", "Ayaan Khan", "Krishna Rao", "Ishaan Nair",
    "Shaurya Desai", "Atharv Joshi", "Advait Mehta", "Pranav Iyer", "Reyansh Das",
    "Kiaan Shah", "Dhruv Agarwal", "Vedant Kulkarni", "Aarohi Kapoor", "Ananya Pillai",
    "Diya Malhotra", "Saanvi Bhat", "Ira Menon", "Myra Mishra", "Anika Banerjee",
    "Navya Chopra", "Kiara Saxena", "Shanaya Ghosh", "Tara Sinha", "Riya Pandey",
    "Kabir Rathore", "Veer Thakur", "Shivansh Dubey", "Rudra Tripathi", "Ansh Chaudhary",
    "Yash Srivastava", "Om Yadav", "Aaditya Tiwari", "Raghav Bhatt", "Rohan Jain",
    "Prisha Rane", "Avni Deshpande", "Aadhya Naik", "Pari Shukla", "Reet Bajaj",
    "Mishka Khurana", "Anaya Kohli", "Myra Tandon", "Ishita Goyal", "Sara Ahuja",
    "Aryan Oberoi", "Karan Gill", "Raghav Dutta", "Lakshya Sen", "Arnav Bakshi",
    "Samaira Bose", "Zara Choudhury", "Mira Sethi", "Anaisha Roy", "Inaya Kashyap"
]

CAPTIONS = [
    "Living my best life ✨",
    "Vibes on point 🔥",
    "Making memories 📸",
    "Good times only 🌟",
    "Blessed and grateful 🙏",
    "Chase your dreams 💫",
    "Life is beautiful 🌈",
    "Creating magic ✨",
    "Stay positive 😊",
    "Adventure awaits 🚀",
    "Sunset lover 🌅",
    "Coffee & vibes ☕",
    "Weekend mood 🎉",
    "Smile more 😁",
    "Be yourself 💯",
    "Travel diaries ✈️",
    "Food lover 🍕",
    "Fitness journey 💪",
    "Music is life 🎵",
    "Art & creativity 🎨",
    "Nature lover 🌿",
    "City lights 🌃",
    "Beach vibes 🏖️",
    "Mountain calling ⛰️",
    "Sunset chaser 🌇"
]

def generate_gradient_image(color1, color2, width=1080, height=1080):
    """Generate a gradient image"""
    image = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(image)
    
    r1, g1, b1 = color1
    r2, g2, b2 = color2
    
    for y in range(height):
        ratio = y / height
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    buffer = BytesIO()
    image.save(buffer, format='JPEG', quality=85)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def generate_square_image(color, width=1080, height=1080):
    """Generate a solid color image"""
    image = Image.new('RGB', (width, height), color)
    buffer = BytesIO()
    image.save(buffer, format='JPEG', quality=85)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

COLOR_GRADIENTS = [
    ((255, 107, 107), (255, 193, 7)),   # Red to Yellow
    ((74, 144, 226), (80, 227, 194)),   # Blue to Cyan
    ((168, 85, 247), (241, 130, 141)),  # Purple to Pink
    ((58, 123, 213), (58, 96, 115)),    # Blue gradient
    ((255, 159, 64), (255, 99, 132)),   # Orange to Pink
    ((75, 192, 192), (54, 162, 235)),   # Teal to Blue
    ((153, 102, 255), (255, 159, 243)), # Purple to Light Pink
    ((255, 205, 86), (255, 99, 71)),    # Yellow to Red
]

SOLID_COLORS = [
    (52, 152, 219),   # Blue
    (46, 204, 113),   # Green
    (155, 89, 182),   # Purple
    (241, 196, 15),   # Yellow
    (230, 126, 34),   # Orange
    (231, 76, 60),    # Red
    (26, 188, 156),   # Turquoise
    (52, 73, 94),     # Dark Gray
]

async def seed_database():
    print("🚀 Starting database seeding...")
    
    # Clear existing data
    print("🗑️ Clearing existing data...")
    await db.users.delete_many({"email": {"$regex": "dummy"}})
    await db.posts.delete_many({})
    await db.stories.delete_many({})
    await db.reels.delete_many({})
    await db.notifications.delete_many({})
    
    # Create 60 dummy users
    print("👥 Creating 60 dummy users...")
    users = []
    for i, name in enumerate(INDIAN_NAMES):
        username = name.lower().replace(" ", "_") + str(random.randint(100, 999))
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        # Generate profile picture (small colored circle)
        color = SOLID_COLORS[i % len(SOLID_COLORS)]
        profile_pic = generate_square_image(color, 200, 200)
        
        user = {
            "user_id": user_id,
            "email": f"dummy{i+1}@marb.app",
            "name": name,
            "username": username,
            "picture": profile_pic,
            "bio": f"{random.choice(['Creator', 'Photographer', 'Artist', 'Traveler', 'Foodie', 'Tech Enthusiast'])} | {random.choice(['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'])}",
            "followers": [],
            "following": [],
            "posts_count": 0,
            "followers_count": 0,
            "following_count": 0,
            "created_at": datetime.now(timezone.utc),
            "password_hash": hashlib.sha256("password123".encode()).hexdigest()
        }
        users.append(user)
    
    await db.users.insert_many(users)
    print(f"✅ Created {len(users)} users")
    
    # Create followers network
    print("🔗 Creating follower relationships...")
    for user in users:
        # Each user follows 10-25 random other users
        num_following = random.randint(10, 25)
        following_users = random.sample([u for u in users if u['user_id'] != user['user_id']], num_following)
        
        following_ids = [u['user_id'] for u in following_users]
        await db.users.update_one(
            {"user_id": user['user_id']},
            {"$set": {"following": following_ids, "following_count": len(following_ids)}}
        )
        
        # Update followers for followed users
        for followed_user in following_users:
            await db.users.update_one(
                {"user_id": followed_user['user_id']},
                {"$addToSet": {"followers": user['user_id']}}
            )
    
    # Update follower counts
    for user in users:
        user_doc = await db.users.find_one({"user_id": user['user_id']}, {"_id": 0})
        await db.users.update_one(
            {"user_id": user['user_id']},
            {"$set": {"followers_count": len(user_doc.get('followers', []))}}
        )
    
    print("✅ Follower relationships created")
    
    # Create 100 posts
    print("📸 Creating 100 posts...")
    posts = []
    for i in range(100):
        user = random.choice(users)
        
        # Generate gradient image
        color_pair = random.choice(COLOR_GRADIENTS)
        post_image = generate_gradient_image(color_pair[0], color_pair[1])
        
        post = {
            "post_id": f"post_{uuid.uuid4().hex[:12]}",
            "user_id": user['user_id'],
            "image": post_image,
            "caption": random.choice(CAPTIONS),
            "likes": [],
            "comments": [],
            "created_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))
        }
        posts.append(post)
    
    await db.posts.insert_many(posts)
    print(f"✅ Created {len(posts)} posts")
    
    # Create 100 reels
    print("🎬 Creating 100 reels...")
    reels = []
    for i in range(100):
        user = random.choice(users)
        
        # Generate reel thumbnail
        color_pair = random.choice(COLOR_GRADIENTS)
        reel_video = generate_gradient_image(color_pair[0], color_pair[1], 1080, 1920)
        
        reel = {
            "reel_id": f"reel_{uuid.uuid4().hex[:12]}",
            "user_id": user['user_id'],
            "video": reel_video,
            "caption": random.choice(CAPTIONS),
            "likes": [],
            "comments": [],
            "created_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48))
        }
        reels.append(reel)
    
    await db.reels.insert_many(reels)
    print(f"✅ Created {len(reels)} reels")
    
    # Create 60 stories (recent)
    print("📱 Creating 60 stories...")
    stories = []
    for i in range(60):
        user = users[i]
        
        # Generate story image
        color = random.choice(SOLID_COLORS)
        story_image = generate_square_image(color, 1080, 1920)
        
        story = {
            "story_id": f"story_{uuid.uuid4().hex[:12]}",
            "user_id": user['user_id'],
            "image": story_image,
            "created_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 20)),
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=random.randint(4, 24))
        }
        stories.append(story)
    
    await db.stories.insert_many(stories)
    print(f"✅ Created {len(stories)} stories")
    
    # Add likes to posts
    print("❤️ Adding likes to posts...")
    for post in posts:
        num_likes = random.randint(50, 500)
        likers = random.sample([u['user_id'] for u in users], min(num_likes, len(users)))
        await db.posts.update_one(
            {"post_id": post['post_id']},
            {"$set": {"likes": likers}}
        )
    print("✅ Likes added to posts")
    
    # Add likes to reels
    print("❤️ Adding likes to reels...")
    for reel in reels:
        num_likes = random.randint(100, 1000)
        likers = random.sample([u['user_id'] for u in users], min(num_likes, len(users)))
        await db.reels.update_one(
            {"reel_id": reel['reel_id']},
            {"$set": {"likes": likers}}
        )
    print("✅ Likes added to reels")
    
    # Add comments
    print("💬 Adding comments...")
    comment_texts = [
        "Amazing! 🔥", "Love this! ❤️", "So cool!", "Nice one 👍",
        "Beautiful! 😍", "Awesome! 🎉", "Great content!", "Keep it up!",
        "Inspiring! ✨", "Perfect! 💯"
    ]
    
    for post in posts[:50]:  # Add comments to first 50 posts
        num_comments = random.randint(5, 20)
        comments = []
        for _ in range(num_comments):
            commenter = random.choice(users)
            comment = {
                "comment_id": f"cmt_{uuid.uuid4().hex[:12]}",
                "user_id": commenter['user_id'],
                "user_name": commenter['name'],
                "user_picture": commenter['picture'],
                "text": random.choice(comment_texts),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            comments.append(comment)
        
        await db.posts.update_one(
            {"post_id": post['post_id']},
            {"$set": {"comments": comments}}
        )
    print("✅ Comments added")
    
    # Update post counts
    print("📊 Updating user stats...")
    for user in users:
        post_count = await db.posts.count_documents({"user_id": user['user_id']})
        await db.users.update_one(
            {"user_id": user['user_id']},
            {"$set": {"posts_count": post_count}}
        )
    
    print("\n🎉 Database seeding complete!")
    print(f"✅ 60 users with followers")
    print(f"✅ 100 posts with likes & comments")
    print(f"✅ 100 reels with likes")
    print(f"✅ 60 stories (24h expiry)")
    print(f"✅ Follower network established")
    
    # Print stats
    total_users = await db.users.count_documents({})
    total_posts = await db.posts.count_documents({})
    total_reels = await db.reels.count_documents({})
    total_stories = await db.stories.count_documents({})
    
    print(f"\n📊 Final Database Stats:")
    print(f"   Users: {total_users}")
    print(f"   Posts: {total_posts}")
    print(f"   Reels: {total_reels}")
    print(f"   Stories: {total_stories}")

if __name__ == "__main__":
    asyncio.run(seed_database())
