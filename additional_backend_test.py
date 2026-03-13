#!/usr/bin/env python3
"""
Additional Backend API Tests for MARB Social Media App
Tests additional endpoints to ensure broader functionality
"""

import requests
import json
import sys

def test_additional_endpoints():
    """Test additional endpoints"""
    base_url = "https://marb-stories.preview.emergentagent.com"
    
    print("🔍 Additional Backend API Tests")
    print("=" * 50)
    
    tests = [
        {
            "name": "Get User by Username (non-existent)",
            "url": f"{base_url}/api/users/username/nonexistent",
            "expected_status": 404,
            "description": "Should return 404 for non-existent user"
        },
        {
            "name": "Get User by ID (non-existent)", 
            "url": f"{base_url}/api/users/user_123456",
            "expected_status": 404,
            "description": "Should return 404 for non-existent user"
        },
        {
            "name": "Get Post (non-existent)",
            "url": f"{base_url}/api/posts/post_123456", 
            "expected_status": 404,
            "description": "Should return 404 for non-existent post"
        }
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            response = requests.get(test["url"], timeout=10)
            if response.status_code == test["expected_status"]:
                print(f"✅ PASS - {test['name']}: {test['description']}")
                passed += 1
            else:
                print(f"❌ FAIL - {test['name']}: Expected {test['expected_status']}, got {response.status_code}")
        except Exception as e:
            print(f"❌ FAIL - {test['name']}: Request failed: {str(e)}")
    
    print(f"\n📊 Additional Tests: {passed}/{total} passed")
    return passed == total

if __name__ == "__main__":
    test_additional_endpoints()