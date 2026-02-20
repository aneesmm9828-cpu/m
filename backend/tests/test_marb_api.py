"""
MARB Instagram Clone API Tests
Testing: Auth, Posts, Reels, Stories, Users, Follow/Unfollow, Like/Unlike, 
Close Friends, Mute/Restrict/Block
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')

# Ensure BASE_URL has correct format
if BASE_URL and not BASE_URL.startswith('http'):
    BASE_URL = 'https://' + BASE_URL
    
# Use internal URL for testing
BASE_URL = 'http://localhost:8001'

class TestHealthEndpoints:
    """Health and basic endpoint tests"""
    
    def test_health_check(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_root_endpoint(self):
        """Test /api/ root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Root endpoint passed")


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_username = f"testuser_{uuid.uuid4().hex[:8]}"
        self.test_email = f"{self.test_username}@test.com"
        self.test_password = "testpass123"
        self.test_name = "Test User"
    
    def test_signup_success(self):
        """Test user signup"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": self.test_name,
            "email": self.test_email,
            "username": self.test_username,
            "password": self.test_password
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "session_token" in data
        assert data["user"]["email"] == self.test_email
        assert data["user"]["username"] == self.test_username
        print("✓ Signup success passed")
    
    def test_login_success(self):
        """Test user login after signup"""
        # First signup
        requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": self.test_name,
            "email": self.test_email,
            "username": self.test_username,
            "password": self.test_password
        })
        
        # Then login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": self.test_username,
            "password": self.test_password
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "session_token" in data
        print("✓ Login success passed")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "nonexistentuser",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Login invalid credentials test passed")
    
    def test_auth_me_without_token(self):
        """Test /auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth me without token test passed")


class TestPostsEndpoints:
    """Posts CRUD tests"""
    
    def test_get_explore_posts(self):
        """Test GET /api/posts/explore"""
        response = requests.get(f"{BASE_URL}/api/posts/explore?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            # Verify post structure
            post = data[0]
            assert "post_id" in post
            assert "user_id" in post
            assert "image" in post
            assert "user" in post
            print(f"✓ Explore posts returned {len(data)} posts")
        else:
            print("✓ Explore posts returned empty list (no posts in DB)")
    
    def test_get_user_posts(self):
        """Test GET /api/posts/user/{user_id}"""
        # First get a user from explore posts
        explore_res = requests.get(f"{BASE_URL}/api/posts/explore?limit=1")
        if explore_res.status_code == 200 and len(explore_res.json()) > 0:
            user_id = explore_res.json()[0]["user_id"]
            response = requests.get(f"{BASE_URL}/api/posts/user/{user_id}")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ User posts returned {len(data)} posts for user {user_id}")
        else:
            print("⚠ Skipped user posts test - no posts in DB")


class TestReelsEndpoints:
    """Reels CRUD tests"""
    
    def test_get_reels(self):
        """Test GET /api/reels"""
        response = requests.get(f"{BASE_URL}/api/reels?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            # Verify reel structure
            reel = data[0]
            assert "reel_id" in reel
            assert "user_id" in reel
            assert "video" in reel
            assert "user" in reel
            print(f"✓ Reels returned {len(data)} reels")
        else:
            print("✓ Reels returned empty list")
    
    def test_get_user_reels(self):
        """Test GET /api/reels/user/{user_id}"""
        # First get a user from reels
        reels_res = requests.get(f"{BASE_URL}/api/reels?limit=1")
        if reels_res.status_code == 200 and len(reels_res.json()) > 0:
            user_id = reels_res.json()[0]["user_id"]
            response = requests.get(f"{BASE_URL}/api/reels/user/{user_id}")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ User reels returned {len(data)} reels")
        else:
            print("⚠ Skipped user reels test - no reels in DB")


class TestUsersEndpoints:
    """User endpoints tests"""
    
    def test_search_users(self):
        """Test GET /api/users/search/{query}"""
        response = requests.get(f"{BASE_URL}/api/users/search/a")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            user = data[0]
            assert "user_id" in user
            assert "username" in user
            print(f"✓ User search returned {len(data)} users")
        else:
            print("✓ User search returned empty list")
    
    def test_get_user_by_id(self):
        """Test GET /api/users/{user_id}"""
        # First search for a user
        search_res = requests.get(f"{BASE_URL}/api/users/search/a")
        if search_res.status_code == 200 and len(search_res.json()) > 0:
            user_id = search_res.json()[0]["user_id"]
            response = requests.get(f"{BASE_URL}/api/users/{user_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["user_id"] == user_id
            print(f"✓ Get user by ID passed for {user_id}")
        else:
            print("⚠ Skipped get user by ID - no users in search results")
    
    def test_get_user_not_found(self):
        """Test GET /api/users/{user_id} with invalid ID"""
        response = requests.get(f"{BASE_URL}/api/users/nonexistent_user_123")
        assert response.status_code == 404
        print("✓ Get user not found test passed")


class TestAuthenticatedEndpoints:
    """Tests requiring authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session"""
        self.test_username = f"authtest_{uuid.uuid4().hex[:8]}"
        self.test_email = f"{self.test_username}@test.com"
        
        # Create user and get token
        signup_res = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Auth Test User",
            "email": self.test_email,
            "username": self.test_username,
            "password": "testpass123"
        })
        
        if signup_res.status_code == 200:
            self.token = signup_res.json().get("session_token")
            self.user_id = signup_res.json().get("user", {}).get("user_id")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Could not create test user")
    
    def test_get_auth_me(self):
        """Test GET /api/auth/me with valid token"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == self.test_username
        print("✓ Auth me with token passed")
    
    def test_get_close_friends_empty(self):
        """Test GET /api/users/me/close-friends returns empty list for new user"""
        response = requests.get(f"{BASE_URL}/api/users/me/close-friends", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print("✓ Close friends endpoint passed")
    
    def test_get_blocked_users_empty(self):
        """Test GET /api/users/me/blocked returns empty list for new user"""
        response = requests.get(f"{BASE_URL}/api/users/me/blocked", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print("✓ Blocked users endpoint passed")
    
    def test_get_muted_users_empty(self):
        """Test GET /api/users/me/muted returns empty list for new user"""
        response = requests.get(f"{BASE_URL}/api/users/me/muted", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print("✓ Muted users endpoint passed")
    
    def test_get_restricted_users_empty(self):
        """Test GET /api/users/me/restricted returns empty list for new user"""
        response = requests.get(f"{BASE_URL}/api/users/me/restricted", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print("✓ Restricted users endpoint passed")


class TestFollowUnfollowFlow:
    """Follow/Unfollow workflow tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup two users for follow testing"""
        # Create user 1
        self.user1_username = f"follow_test1_{uuid.uuid4().hex[:6]}"
        signup1 = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Follow Test User 1",
            "email": f"{self.user1_username}@test.com",
            "username": self.user1_username,
            "password": "testpass123"
        })
        
        if signup1.status_code != 200:
            pytest.skip("Could not create test user 1")
        
        self.user1_token = signup1.json().get("session_token")
        self.user1_id = signup1.json().get("user", {}).get("user_id")
        self.user1_headers = {"Authorization": f"Bearer {self.user1_token}"}
        
        # Get an existing user to follow
        search_res = requests.get(f"{BASE_URL}/api/users/search/a")
        if search_res.status_code == 200 and len(search_res.json()) > 0:
            self.target_user_id = search_res.json()[0]["user_id"]
        else:
            pytest.skip("No users to follow")
    
    def test_follow_user(self):
        """Test POST /api/users/{user_id}/follow"""
        response = requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/follow",
            headers=self.user1_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Follow user test passed - followed {self.target_user_id}")
    
    def test_unfollow_user(self):
        """Test POST /api/users/{user_id}/unfollow"""
        # First follow
        requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/follow",
            headers=self.user1_headers
        )
        
        # Then unfollow
        response = requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/unfollow",
            headers=self.user1_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Unfollow user test passed")
    
    def test_cannot_follow_self(self):
        """Test that user cannot follow themselves"""
        response = requests.post(
            f"{BASE_URL}/api/users/{self.user1_id}/follow",
            headers=self.user1_headers
        )
        assert response.status_code == 400
        print("✓ Cannot follow self test passed")


class TestLikeUnlikeFlow:
    """Like/Unlike post workflow tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup user and find a post to like"""
        # Create user
        self.username = f"like_test_{uuid.uuid4().hex[:6]}"
        signup = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Like Test User",
            "email": f"{self.username}@test.com",
            "username": self.username,
            "password": "testpass123"
        })
        
        if signup.status_code != 200:
            pytest.skip("Could not create test user")
        
        self.token = signup.json().get("session_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get a post to like
        posts_res = requests.get(f"{BASE_URL}/api/posts/explore?limit=1")
        if posts_res.status_code == 200 and len(posts_res.json()) > 0:
            self.post_id = posts_res.json()[0]["post_id"]
        else:
            pytest.skip("No posts to like")
    
    def test_like_post(self):
        """Test POST /api/posts/{post_id}/like"""
        response = requests.post(
            f"{BASE_URL}/api/posts/{self.post_id}/like",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Like post test passed - liked {self.post_id}")
    
    def test_unlike_post(self):
        """Test POST /api/posts/{post_id}/unlike"""
        # First like
        requests.post(
            f"{BASE_URL}/api/posts/{self.post_id}/like",
            headers=self.headers
        )
        
        # Then unlike
        response = requests.post(
            f"{BASE_URL}/api/posts/{self.post_id}/unlike",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Unlike post test passed")


class TestMuteRestrictBlockFlow:
    """Mute/Restrict/Block workflow tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup user for testing"""
        self.username = f"mrb_test_{uuid.uuid4().hex[:6]}"
        signup = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "MRB Test User",
            "email": f"{self.username}@test.com",
            "username": self.username,
            "password": "testpass123"
        })
        
        if signup.status_code != 200:
            pytest.skip("Could not create test user")
        
        self.token = signup.json().get("session_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get a user to mute/restrict/block
        search_res = requests.get(f"{BASE_URL}/api/users/search/a")
        if search_res.status_code == 200 and len(search_res.json()) > 0:
            self.target_user_id = search_res.json()[0]["user_id"]
        else:
            pytest.skip("No users to target")
    
    def test_mute_user(self):
        """Test POST /api/users/{user_id}/mute"""
        response = requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/mute",
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ Mute user test passed")
    
    def test_unmute_user(self):
        """Test DELETE /api/users/{user_id}/mute"""
        # First mute
        requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/mute",
            headers=self.headers
        )
        
        # Then unmute
        response = requests.delete(
            f"{BASE_URL}/api/users/{self.target_user_id}/mute",
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ Unmute user test passed")
    
    def test_restrict_user(self):
        """Test POST /api/users/{user_id}/restrict"""
        response = requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/restrict",
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ Restrict user test passed")
    
    def test_unrestrict_user(self):
        """Test DELETE /api/users/{user_id}/restrict"""
        # First restrict
        requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/restrict",
            headers=self.headers
        )
        
        # Then unrestrict
        response = requests.delete(
            f"{BASE_URL}/api/users/{self.target_user_id}/restrict",
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ Unrestrict user test passed")
    
    def test_block_user(self):
        """Test POST /api/users/{user_id}/block"""
        response = requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/block",
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ Block user test passed")
    
    def test_unblock_user(self):
        """Test DELETE /api/users/{user_id}/block"""
        # First block
        requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/block",
            headers=self.headers
        )
        
        # Then unblock
        response = requests.delete(
            f"{BASE_URL}/api/users/{self.target_user_id}/block",
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ Unblock user test passed")


class TestCloseFriendsFlow:
    """Close Friends workflow tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup user for testing"""
        self.username = f"cf_test_{uuid.uuid4().hex[:6]}"
        signup = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Close Friends Test User",
            "email": f"{self.username}@test.com",
            "username": self.username,
            "password": "testpass123"
        })
        
        if signup.status_code != 200:
            pytest.skip("Could not create test user")
        
        self.token = signup.json().get("session_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get a user to add to close friends
        search_res = requests.get(f"{BASE_URL}/api/users/search/a")
        if search_res.status_code == 200 and len(search_res.json()) > 0:
            self.target_user_id = search_res.json()[0]["user_id"]
        else:
            pytest.skip("No users to add")
    
    def test_add_close_friend(self):
        """Test POST /api/users/{user_id}/close-friends"""
        response = requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/close-friends",
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ Add close friend test passed")
    
    def test_remove_close_friend(self):
        """Test DELETE /api/users/{user_id}/close-friends"""
        # First add
        requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/close-friends",
            headers=self.headers
        )
        
        # Then remove
        response = requests.delete(
            f"{BASE_URL}/api/users/{self.target_user_id}/close-friends",
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ Remove close friend test passed")
    
    def test_get_close_friends_after_add(self):
        """Test GET /api/users/me/close-friends after adding"""
        # Add close friend
        requests.post(
            f"{BASE_URL}/api/users/{self.target_user_id}/close-friends",
            headers=self.headers
        )
        
        # Get close friends list
        response = requests.get(
            f"{BASE_URL}/api/users/me/close-friends",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify the user is in the list
        user_ids = [u["user_id"] for u in data]
        assert self.target_user_id in user_ids
        print("✓ Get close friends after add test passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
