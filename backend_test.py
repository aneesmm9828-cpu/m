#!/usr/bin/env python3
"""
Backend API Test Suite for MARB Social Media App

Tests the specified endpoints:
1. Health Check - GET /api/health
2. Root endpoint - GET /api/
3. Auth endpoints - GET /api/auth/me (unauthenticated)
4. Explore posts - GET /api/posts/explore
5. Search users - GET /api/users/search/test

Backend URL: https://marb-reels.preview.emergentagent.com
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

class BackendTester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Optional[Any] = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {details}")
        
    def test_health_check(self):
        """Test GET /api/health"""
        try:
            url = f"{self.base_url}/api/health"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    self.log_test(
                        "Health Check", 
                        True, 
                        "Returned correct health status",
                        data
                    )
                else:
                    self.log_test(
                        "Health Check", 
                        False, 
                        f"Unexpected response data: {data}",
                        data
                    )
            else:
                self.log_test(
                    "Health Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
    
    def test_root_endpoint(self):
        """Test GET /api/"""
        try:
            url = f"{self.base_url}/api/"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_message = "MARB API is running"
                expected_version = "1.0"
                
                if (data.get('message') == expected_message and 
                    data.get('version') == expected_version):
                    self.log_test(
                        "Root Endpoint", 
                        True, 
                        "Returned correct API info",
                        data
                    )
                else:
                    self.log_test(
                        "Root Endpoint", 
                        False, 
                        f"Unexpected response data: {data}",
                        data
                    )
            else:
                self.log_test(
                    "Root Endpoint", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Request failed: {str(e)}")
    
    def test_auth_me_unauthenticated(self):
        """Test GET /api/auth/me without authentication - should return 401"""
        try:
            url = f"{self.base_url}/api/auth/me"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 401:
                try:
                    data = response.json()
                    if 'detail' in data and 'authenticated' in data['detail'].lower():
                        self.log_test(
                            "Auth Me (Unauthenticated)", 
                            True, 
                            "Correctly returned 401 with authentication error",
                            data
                        )
                    else:
                        self.log_test(
                            "Auth Me (Unauthenticated)", 
                            True, 
                            f"Returned 401 but unexpected message: {data}",
                            data
                        )
                except:
                    self.log_test(
                        "Auth Me (Unauthenticated)", 
                        True, 
                        f"Returned 401 as expected (non-JSON response): {response.text[:100]}"
                    )
            else:
                self.log_test(
                    "Auth Me (Unauthenticated)", 
                    False, 
                    f"Expected 401, got HTTP {response.status_code}: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_test("Auth Me (Unauthenticated)", False, f"Request failed: {str(e)}")
    
    def test_explore_posts(self):
        """Test GET /api/posts/explore - should return empty array"""
        try:
            url = f"{self.base_url}/api/posts/explore"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Explore Posts", 
                        True, 
                        f"Returned list with {len(data)} posts",
                        {"post_count": len(data), "sample": data[:2] if data else []}
                    )
                else:
                    self.log_test(
                        "Explore Posts", 
                        False, 
                        f"Expected list, got: {type(data)} - {data}",
                        data
                    )
            else:
                self.log_test(
                    "Explore Posts", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_test("Explore Posts", False, f"Request failed: {str(e)}")
    
    def test_search_users(self):
        """Test GET /api/users/search/test - should return empty array"""
        try:
            url = f"{self.base_url}/api/users/search/test"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Search Users", 
                        True, 
                        f"Returned list with {len(data)} users",
                        {"user_count": len(data), "sample": data[:2] if data else []}
                    )
                else:
                    self.log_test(
                        "Search Users", 
                        False, 
                        f"Expected list, got: {type(data)} - {data}",
                        data
                    )
            else:
                self.log_test(
                    "Search Users", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_test("Search Users", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend API Tests for: {self.base_url}")
        print("=" * 60)
        
        # Test each endpoint
        self.test_health_check()
        self.test_root_endpoint()
        self.test_auth_me_unauthenticated()
        self.test_explore_posts()
        self.test_search_users()
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.test_results if r['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed == total

def main():
    """Main test function"""
    # Use the production URL from frontend .env
    backend_url = "https://marb-reels.preview.emergentagent.com"
    
    print("MARB Social Media App - Backend API Testing")
    print(f"Target: {backend_url}")
    print()
    
    tester = BackendTester(backend_url)
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()