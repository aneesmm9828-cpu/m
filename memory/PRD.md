# MARB - Instagram Clone App PRD

## Project Overview
MARB is a full-stack Instagram clone application built with React Native (Expo) for frontend and FastAPI/MongoDB for backend.

## Original Problem Statement
User wants to build a complete, production-ready, Instagram-style social media mobile application for Android and iOS named "MARB" with all Instagram features including posts, stories, reels, DMs, and more.

## Core Features Implemented

### Phase 1: Core Infrastructure ✅
- [x] FastAPI backend with MongoDB
- [x] JWT-based authentication (signup/login)
- [x] User profile management
- [x] React Native Expo frontend
- [x] Bottom tab navigation (Home, Explore, Create, Reels, Messages, Profile)
- [x] Database seeding (60 users, 400 posts, 500 reels)

### Phase 2: Feed & Posts ✅
- [x] Home feed with posts from followed users
- [x] Post creation (image upload)
- [x] Like/Unlike posts
- [x] Comment on posts
- [x] Save/Bookmark posts
- [x] Double-tap to like animation
- [x] Post detail view with comments modal
- [x] Share post functionality

### Phase 3: Stories ✅
- [x] Story creation (image/video)
- [x] Story viewer with progress bars
- [x] Tap/swipe navigation between stories
- [x] Story view tracking
- [x] Story likes and replies
- [x] Story deletion
- [x] 24-hour expiration
- [x] "Your Story" with gradient ring and + button

### Phase 4: Reels ✅
- [x] Full-screen vertical video player
- [x] Reel creation and upload
- [x] Like/Comment/Share/Save reels
- [x] Double-tap to like
- [x] Scroll-based video playback
- [x] Mute/Unmute functionality
- [x] Caption expansion

### Phase 5: Messaging ✅
- [x] Conversations list
- [x] Individual chat view
- [x] Message sending
- [x] DM Notes feature
- [x] Unread message indicators

### Phase 6: User Interactions ✅
- [x] Follow/Unfollow users
- [x] Block users
- [x] Mute users
- [x] Restrict users
- [x] Close Friends list
- [x] User search

### Phase 7: Profile ✅
- [x] User stats (posts, followers, following)
- [x] Grid view of posts
- [x] Grid view of reels
- [x] Tagged posts tab
- [x] Saved posts tab
- [x] Story highlights
- [x] Profile editing

### Phase 8: Explore ✅
- [x] Content grid discovery
- [x] Search functionality
- [x] Category filters (People, Tags, Places)

### Phase 9: Settings ✅
- [x] Settings main screen with all Instagram-like options
- [x] Account privacy toggle
- [x] Close friends management
- [x] Blocked accounts list
- [x] Muted accounts list
- [x] Restricted accounts list
- [x] Archive (posts/stories/reels)
- [x] Logout functionality

### Phase 10: Create Screen ✅
- [x] Unified create screen
- [x] Post/Reel/Story tabs
- [x] Gallery picker
- [x] Camera capture
- [x] Caption input
- [x] Location tagging (UI)
- [x] People tagging (UI)
- [x] AI caption generation (integration ready)

## Technical Architecture

### Frontend
- **Framework**: React Native with Expo (SDK 52)
- **Routing**: Expo Router (file-based)
- **State Management**: Zustand
- **Styling**: StyleSheet with dark theme
- **Icons**: Ionicons (expo/vector-icons)
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI
- **Database**: MongoDB with Motor (async)
- **Authentication**: JWT tokens
- **Password Hashing**: bcrypt

### Database Schema
- **users**: user_id, email, password, name, username, bio, picture, followers, following, close_friends, blocked_users, muted_users, restricted_users
- **posts**: post_id, user_id, image, caption, likes, comments, saved_by, created_at
- **reels**: reel_id, user_id, video, caption, likes, comments, created_at
- **stories**: story_id, user_id, image, media_type, views, likes, created_at, expires_at
- **highlights**: highlight_id, user_id, name, cover_image, story_ids
- **messages**: message_id, sender_id, receiver_id, text, image, read, created_at
- **notes**: note_id, user_id, content, created_at
- **notifications**: notification_id, user_id, type, from_user_id, text, read

## API Endpoints

### Auth
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me

### Users
- GET /api/users/{user_id}
- PUT /api/users/me
- POST /api/users/{user_id}/follow
- POST /api/users/{user_id}/unfollow
- GET /api/users/search/{query}
- POST/DELETE /api/users/{user_id}/close-friends
- POST/DELETE /api/users/{user_id}/mute
- POST/DELETE /api/users/{user_id}/restrict
- POST/DELETE /api/users/{user_id}/block
- GET /api/users/me/close-friends
- GET /api/users/me/blocked
- GET /api/users/me/muted
- GET /api/users/me/restricted

### Posts
- GET /api/posts/feed
- GET /api/posts/explore
- POST /api/posts
- GET /api/posts/{post_id}
- POST /api/posts/{post_id}/like
- POST /api/posts/{post_id}/unlike
- POST /api/posts/{post_id}/comment
- POST /api/posts/{post_id}/save
- POST /api/posts/{post_id}/unsave
- DELETE /api/posts/{post_id}

### Stories
- GET /api/stories
- GET /api/stories/user/{user_id}
- POST /api/stories
- POST /api/stories/{story_id}/view
- GET /api/stories/{story_id}/viewers
- POST /api/stories/{story_id}/like
- DELETE /api/stories/{story_id}

### Reels
- GET /api/reels
- POST /api/reels
- POST /api/reels/{reel_id}/like
- POST /api/reels/{reel_id}/comment
- DELETE /api/reels/{reel_id}

### Highlights
- GET /api/highlights/user/{user_id}
- POST /api/highlights
- DELETE /api/highlights/{highlight_id}

### Messages
- GET /api/messages/conversations
- POST /api/messages
- GET /api/notes

## Testing Status
- Backend API Tests: 32/32 passed (100%)
- Frontend UI: Renders correctly
- Database: Seeded with sample data

## Pending/Future Features (P2)
- [ ] DM Vanish Mode
- [ ] Voice Messages in DM
- [ ] Video Calls
- [ ] Chat Themes
- [ ] GIF support
- [ ] Message Reactions
- [ ] Two-Factor Authentication (2FA)
- [ ] Login Activity tracking
- [ ] Download Your Data
- [ ] Pronouns field in profile
- [ ] Multiple links in bio
- [ ] Collaborative Posts
- [ ] Dual Camera feature
- [ ] Shop tab

## Last Updated
February 2026

## Recent Updates (Feb 2026)
- Added Camera icon in header (next to heart icon)
- Post photo click opens post detail
- User profile/name click opens their profile
- Created `/profile/[id].tsx` for viewing other users
- Added `/api/users/{user_id}/posts` endpoint
- Instagram-style Create screen with POST/STORY/REEL tabs
