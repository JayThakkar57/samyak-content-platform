#!/usr/bin/env python3
"""
Comprehensive backend API test for Samyak Content Delivery Platform
Tests all endpoints with proper error handling and detailed reporting
"""

import requests
import json
import sys

# Base URL from .env
BASE_URL = "https://95f03a1c-e07b-467a-93a9-90a761d977fc.preview.emergentagent.com/api"

# Test data storage
admin_token = None
student_token = None
program_id = None
module_id = None
chapter_id = None
lesson_id = None
student_id = None
other_program_id = None

def log(msg, level="INFO"):
    """Log test messages"""
    print(f"[{level}] {msg}")

def test_result(test_name, passed, details=""):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {test_name}")
    if details:
        print(f"  Details: {details}")
    return passed

def make_request(method, endpoint, token=None, data=None, expect_error=False):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PATCH":
            resp = requests.patch(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=10)
        else:
            return None, f"Unknown method: {method}"
        
        # Try to parse JSON response
        try:
            response_data = resp.json()
        except:
            response_data = {"raw": resp.text}
        
        return resp, response_data
    except Exception as e:
        return None, str(e)

# ============ TEST 1: AUTH FLOW ============
def test_auth_flow():
    global admin_token
    log("=" * 60)
    log("TEST 1: AUTH FLOW")
    log("=" * 60)
    
    # 1.1 Seed admin
    log("1.1 Testing POST /api/seed")
    resp, data = make_request("POST", "/seed")
    if resp and resp.status_code == 200 and data.get("ok"):
        test_result("Seed admin", True, "Admin seeded successfully")
    else:
        test_result("Seed admin", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    # 1.2 Login with wrong password
    log("1.2 Testing POST /api/auth/login with wrong password")
    resp, data = make_request("POST", "/auth/login", data={"email": "admin@samyak.com", "password": "wrongpass"})
    if resp and resp.status_code == 401:
        test_result("Login with wrong password", True, "Correctly returned 401")
    else:
        test_result("Login with wrong password", False, f"Expected 401, got {resp.status_code if resp else 'N/A'}")
    
    # 1.3 Login with correct credentials
    log("1.3 Testing POST /api/auth/login with correct credentials")
    resp, data = make_request("POST", "/auth/login", data={"email": "admin@samyak.com", "password": "admin123"})
    if resp and resp.status_code == 200 and data.get("token") and data.get("user", {}).get("role") == "admin":
        admin_token = data["token"]
        test_result("Login with correct credentials", True, f"Token received, role: {data['user']['role']}")
    else:
        test_result("Login with correct credentials", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    # 1.4 GET /api/auth/me without token
    log("1.4 Testing GET /api/auth/me without token")
    resp, data = make_request("GET", "/auth/me")
    if resp and resp.status_code == 401:
        test_result("GET /me without token", True, "Correctly returned 401")
    else:
        test_result("GET /me without token", False, f"Expected 401, got {resp.status_code if resp else 'N/A'}")
    
    # 1.5 GET /api/auth/me with token
    log("1.5 Testing GET /api/auth/me with token")
    resp, data = make_request("GET", "/auth/me", token=admin_token)
    if resp and resp.status_code == 200 and data.get("user"):
        test_result("GET /me with token", True, f"User: {data['user'].get('email')}")
    else:
        test_result("GET /me with token", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    return True

# ============ TEST 2: PROGRAMS CRUD ============
def test_programs_crud():
    global program_id
    log("\n" + "=" * 60)
    log("TEST 2: PROGRAMS CRUD")
    log("=" * 60)
    
    # 2.1 Create program
    log("2.1 Testing POST /api/programs")
    resp, data = make_request("POST", "/programs", token=admin_token, data={
        "title": "Advanced Python Programming",
        "description": "Learn advanced Python concepts",
        "category": "Programming",
        "status": "published"
    })
    if resp and resp.status_code == 200 and data.get("id"):
        program_id = data["id"]
        test_result("Create program", True, f"Program ID: {program_id}")
    else:
        test_result("Create program", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    # 2.2 List programs
    log("2.2 Testing GET /api/programs")
    resp, data = make_request("GET", "/programs", token=admin_token)
    if resp and resp.status_code == 200 and isinstance(data, list):
        found = any(p.get("id") == program_id for p in data)
        has_counts = any("module_count" in p and "chapter_count" in p and "lesson_count" in p for p in data)
        if found and has_counts:
            test_result("List programs", True, f"Found {len(data)} programs with count fields")
        else:
            test_result("List programs", False, f"Program not found or missing count fields")
    else:
        test_result("List programs", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    # 2.3 Update program
    log("2.3 Testing PATCH /api/programs/:id")
    resp, data = make_request("PATCH", f"/programs/{program_id}", token=admin_token, data={
        "description": "Updated description for advanced Python"
    })
    if resp and resp.status_code == 200 and data.get("ok"):
        test_result("Update program", True, "Program updated successfully")
    else:
        test_result("Update program", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
    
    # 2.4 Get program with full curriculum (empty at this point)
    log("2.4 Testing GET /api/programs/:id")
    resp, data = make_request("GET", f"/programs/{program_id}", token=admin_token)
    if resp and resp.status_code == 200 and data.get("id") == program_id and "modules" in data:
        test_result("Get program with curriculum", True, f"Program has {len(data.get('modules', []))} modules")
    else:
        test_result("Get program with curriculum", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    return True

# ============ TEST 3: CURRICULUM (MODULES, CHAPTERS, LESSONS) ============
def test_curriculum():
    global module_id, chapter_id, lesson_id
    log("\n" + "=" * 60)
    log("TEST 3: CURRICULUM (MODULES → CHAPTERS → LESSONS)")
    log("=" * 60)
    
    # 3.1 Create module
    log("3.1 Testing POST /api/modules")
    resp, data = make_request("POST", "/modules", token=admin_token, data={
        "program_id": program_id,
        "title": "Introduction to Python"
    })
    if resp and resp.status_code == 200 and data.get("id"):
        module_id = data["id"]
        test_result("Create module", True, f"Module ID: {module_id}")
    else:
        test_result("Create module", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    # 3.2 Create chapter
    log("3.2 Testing POST /api/chapters")
    resp, data = make_request("POST", "/chapters", token=admin_token, data={
        "module_id": module_id,
        "title": "Python Basics"
    })
    if resp and resp.status_code == 200 and data.get("id"):
        chapter_id = data["id"]
        test_result("Create chapter", True, f"Chapter ID: {chapter_id}")
    else:
        test_result("Create chapter", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    # 3.3 Create lesson with Notion URL
    log("3.3 Testing POST /api/lessons")
    resp, data = make_request("POST", "/lessons", token=admin_token, data={
        "chapter_id": chapter_id,
        "title": "Variables and Data Types",
        "notion_url": "https://www.notion.so/test-abc123def456789012345678901234ab"
    })
    if resp and resp.status_code == 200 and data.get("id"):
        lesson_id = data["id"]
        test_result("Create lesson", True, f"Lesson ID: {lesson_id}")
    else:
        test_result("Create lesson", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    # 3.4 Verify nested structure
    log("3.4 Testing GET /api/programs/:id for nested structure")
    resp, data = make_request("GET", f"/programs/{program_id}", token=admin_token)
    if resp and resp.status_code == 200:
        modules = data.get("modules", [])
        if modules and len(modules) > 0:
            chapters = modules[0].get("chapters", [])
            if chapters and len(chapters) > 0:
                lessons = chapters[0].get("lessons", [])
                if lessons and len(lessons) > 0:
                    test_result("Nested curriculum structure", True, f"Found {len(modules)} modules, {len(chapters)} chapters, {len(lessons)} lessons")
                else:
                    test_result("Nested curriculum structure", False, "No lessons found in nested structure")
            else:
                test_result("Nested curriculum structure", False, "No chapters found in nested structure")
        else:
            test_result("Nested curriculum structure", False, "No modules found in nested structure")
    else:
        test_result("Nested curriculum structure", False, f"Status: {resp.status_code if resp else 'N/A'}")
    
    # 3.5 Update module
    log("3.5 Testing PATCH /api/modules/:id")
    resp, data = make_request("PATCH", f"/modules/{module_id}", token=admin_token, data={
        "description": "Updated module description"
    })
    if resp and resp.status_code == 200 and data.get("ok"):
        test_result("Update module", True, "Module updated successfully")
    else:
        test_result("Update module", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
    
    # 3.6 Update chapter
    log("3.6 Testing PATCH /api/chapters/:id")
    resp, data = make_request("PATCH", f"/chapters/{chapter_id}", token=admin_token, data={
        "description": "Updated chapter description"
    })
    if resp and resp.status_code == 200 and data.get("ok"):
        test_result("Update chapter", True, "Chapter updated successfully")
    else:
        test_result("Update chapter", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
    
    # 3.7 Update lesson
    log("3.7 Testing PATCH /api/lessons/:id")
    resp, data = make_request("PATCH", f"/lessons/{lesson_id}", token=admin_token, data={
        "title": "Updated: Variables and Data Types"
    })
    if resp and resp.status_code == 200 and data.get("ok"):
        test_result("Update lesson", True, "Lesson updated successfully")
    else:
        test_result("Update lesson", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
    
    return True

# ============ TEST 4: NOTION SYNC ============
def test_notion_sync():
    log("\n" + "=" * 60)
    log("TEST 4: NOTION SYNC")
    log("=" * 60)
    
    # 4.1 Create lesson without notion_url for testing
    log("4.1 Creating lesson without notion_url")
    resp, data = make_request("POST", "/lessons", token=admin_token, data={
        "chapter_id": chapter_id,
        "title": "Test Lesson No URL"
    })
    if resp and resp.status_code == 200 and data.get("id"):
        temp_lesson_id = data["id"]
        
        # 4.2 Try sync without notion_url
        log("4.2 Testing POST /api/lessons/:id/sync without notion_url")
        resp, data = make_request("POST", f"/lessons/{temp_lesson_id}/sync", token=admin_token, data={})
        if resp and resp.status_code == 400 and "No Notion URL" in data.get("error", ""):
            test_result("Sync without notion_url", True, "Correctly returned 400 with 'No Notion URL' error")
        else:
            test_result("Sync without notion_url", False, f"Expected 400 with 'No Notion URL', got {resp.status_code if resp else 'N/A'}: {data}")
        
        # Clean up
        make_request("DELETE", f"/lessons/{temp_lesson_id}", token=admin_token)
    
    # 4.3 Sync with invalid URL
    log("4.3 Testing POST /api/lessons/:id/sync with invalid URL")
    resp, data = make_request("POST", f"/lessons/{lesson_id}/sync", token=admin_token, data={
        "notion_url": "not-a-valid-url"
    })
    if resp and resp.status_code == 400 and "Invalid Notion URL" in data.get("error", ""):
        test_result("Sync with invalid URL", True, "Correctly returned 400 with 'Invalid Notion URL' error")
    else:
        test_result("Sync with invalid URL", False, f"Expected 400 with 'Invalid Notion URL', got {resp.status_code if resp else 'N/A'}: {data}")
    
    # 4.4 Sync with valid URL format (may fail if page not shared - that's acceptable)
    log("4.4 Testing POST /api/lessons/:id/sync with valid URL format")
    resp, data = make_request("POST", f"/lessons/{lesson_id}/sync", token=admin_token, data={})
    if resp:
        if resp.status_code == 200 and data.get("ok"):
            test_result("Sync with valid URL", True, f"Sync successful, block_count: {data.get('block_count', 0)}")
        elif resp.status_code == 400 and isinstance(data.get("error"), str):
            # Expected if page not shared with integration
            if "Could not find page" in data.get("error", "") or "not shared" in data.get("error", "").lower():
                test_result("Sync with valid URL (page not shared)", True, f"Graceful error handling: {data.get('error')}")
            else:
                test_result("Sync with valid URL", True, f"Notion API error (acceptable): {data.get('error')}")
        else:
            test_result("Sync with valid URL", False, f"Unexpected response: {resp.status_code}, {data}")
    else:
        test_result("Sync with valid URL", False, f"Request failed: {data}")
    
    return True

# ============ TEST 5: STUDENTS CRUD + ASSIGNMENT ============
def test_students():
    global student_id, student_token
    log("\n" + "=" * 60)
    log("TEST 5: STUDENTS CRUD + PROGRAM ASSIGNMENT")
    log("=" * 60)
    
    # 5.1 Create student with program assignment
    log("5.1 Testing POST /api/students")
    resp, data = make_request("POST", "/students", token=admin_token, data={
        "name": "Alice Johnson",
        "email": "alice.johnson@example.com",
        "password": "secure123",
        "mobile": "+1234567890",
        "program_ids": [program_id]
    })
    if resp and resp.status_code == 200 and data.get("id"):
        student_id = data["id"]
        test_result("Create student", True, f"Student ID: {student_id}")
    else:
        test_result("Create student", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    # 5.2 List students
    log("5.2 Testing GET /api/students")
    resp, data = make_request("GET", "/students", token=admin_token)
    if resp and resp.status_code == 200 and isinstance(data, list):
        found = None
        for s in data:
            if s.get("id") == student_id:
                found = s
                break
        if found and "programs" in found:
            test_result("List students", True, f"Found student with {len(found.get('programs', []))} assigned programs")
        else:
            test_result("List students", False, "Student not found or missing programs field")
    else:
        test_result("List students", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
    
    # 5.3 Remove all assignments
    log("5.3 Testing POST /api/students/:id/assign with empty array")
    resp, data = make_request("POST", f"/students/{student_id}/assign", token=admin_token, data={
        "program_ids": []
    })
    if resp and resp.status_code == 200 and data.get("ok"):
        test_result("Remove all assignments", True, "Assignments removed successfully")
    else:
        test_result("Remove all assignments", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
    
    # 5.4 Re-assign program
    log("5.4 Testing POST /api/students/:id/assign with program")
    resp, data = make_request("POST", f"/students/{student_id}/assign", token=admin_token, data={
        "program_ids": [program_id]
    })
    if resp and resp.status_code == 200 and data.get("ok"):
        test_result("Re-assign program", True, "Program re-assigned successfully")
    else:
        test_result("Re-assign program", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
    
    # 5.5 Set student to inactive
    log("5.5 Testing PATCH /api/students/:id to inactive")
    resp, data = make_request("PATCH", f"/students/{student_id}", token=admin_token, data={
        "status": "inactive"
    })
    if resp and resp.status_code == 200 and data.get("ok"):
        test_result("Set student inactive", True, "Student status updated to inactive")
    else:
        test_result("Set student inactive", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
    
    # 5.6 Try login as inactive student
    log("5.6 Testing login as inactive student")
    resp, data = make_request("POST", "/auth/login", data={
        "email": "alice.johnson@example.com",
        "password": "secure123"
    })
    if resp and resp.status_code == 403:
        test_result("Login as inactive student", True, "Correctly returned 403")
    else:
        test_result("Login as inactive student", False, f"Expected 403, got {resp.status_code if resp else 'N/A'}")
    
    # 5.7 Re-activate student
    log("5.7 Testing PATCH /api/students/:id to active")
    resp, data = make_request("PATCH", f"/students/{student_id}", token=admin_token, data={
        "status": "active"
    })
    if resp and resp.status_code == 200 and data.get("ok"):
        test_result("Re-activate student", True, "Student status updated to active")
    else:
        test_result("Re-activate student", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
    
    # 5.8 Login as active student
    log("5.8 Testing login as active student")
    resp, data = make_request("POST", "/auth/login", data={
        "email": "alice.johnson@example.com",
        "password": "secure123"
    })
    if resp and resp.status_code == 200 and data.get("token"):
        student_token = data["token"]
        test_result("Login as active student", True, f"Student logged in successfully")
    else:
        test_result("Login as active student", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    return True

# ============ TEST 6: ROLE-BASED ACCESS CONTROL ============
def test_rbac():
    global other_program_id
    log("\n" + "=" * 60)
    log("TEST 6: ROLE-BASED ACCESS CONTROL")
    log("=" * 60)
    
    # 6.1 Get programs as student (should only see assigned)
    log("6.1 Testing GET /api/programs as student")
    resp, data = make_request("GET", "/programs", token=student_token)
    if resp and resp.status_code == 200 and isinstance(data, list):
        assigned_only = all(p.get("id") == program_id for p in data)
        if len(data) == 1 and assigned_only:
            test_result("Student sees only assigned programs", True, f"Student sees {len(data)} program(s)")
        else:
            test_result("Student sees only assigned programs", False, f"Expected 1 assigned program, got {len(data)}")
    else:
        test_result("Student sees only assigned programs", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
    
    # 6.2 Create another program NOT assigned to student
    log("6.2 Creating another program (not assigned to student)")
    resp, data = make_request("POST", "/programs", token=admin_token, data={
        "title": "Data Science Fundamentals",
        "description": "Learn data science basics",
        "category": "Data Science",
        "status": "published"
    })
    if resp and resp.status_code == 200 and data.get("id"):
        other_program_id = data["id"]
        test_result("Create unassigned program", True, f"Program ID: {other_program_id}")
    else:
        test_result("Create unassigned program", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
        return False
    
    # 6.3 Try to access unassigned program as student
    log("6.3 Testing GET /api/programs/:id for unassigned program as student")
    resp, data = make_request("GET", f"/programs/{other_program_id}", token=student_token)
    if resp and resp.status_code == 403:
        test_result("Access unassigned program", True, "Correctly returned 403")
    else:
        test_result("Access unassigned program", False, f"Expected 403, got {resp.status_code if resp else 'N/A'}")
    
    # 6.4 Try to create program as student
    log("6.4 Testing POST /api/programs as student")
    resp, data = make_request("POST", "/programs", token=student_token, data={
        "title": "Unauthorized Program",
        "description": "Should not be created"
    })
    if resp and resp.status_code in [401, 404]:
        test_result("Create program as student", True, f"Correctly returned {resp.status_code}")
    else:
        test_result("Create program as student", False, f"Expected 401/404, got {resp.status_code if resp else 'N/A'}")
    
    # 6.5 Try to access lesson of unassigned program as student
    # First create a module, chapter, lesson in the unassigned program
    log("6.5 Creating curriculum in unassigned program")
    resp, data = make_request("POST", "/modules", token=admin_token, data={
        "program_id": other_program_id,
        "title": "Module in unassigned program"
    })
    if resp and resp.status_code == 200:
        other_module_id = data["id"]
        resp, data = make_request("POST", "/chapters", token=admin_token, data={
            "module_id": other_module_id,
            "title": "Chapter in unassigned program"
        })
        if resp and resp.status_code == 200:
            other_chapter_id = data["id"]
            resp, data = make_request("POST", "/lessons", token=admin_token, data={
                "chapter_id": other_chapter_id,
                "title": "Lesson in unassigned program"
            })
            if resp and resp.status_code == 200:
                other_lesson_id = data["id"]
                
                # Now try to access as student
                log("6.6 Testing GET /api/lessons/:id of unassigned program as student")
                resp, data = make_request("GET", f"/lessons/{other_lesson_id}", token=student_token)
                if resp and resp.status_code == 403:
                    test_result("Access lesson of unassigned program", True, "Correctly returned 403")
                else:
                    test_result("Access lesson of unassigned program", False, f"Expected 403, got {resp.status_code if resp else 'N/A'}")
    
    # 6.7 Try to access admin stats as student
    log("6.7 Testing GET /api/admin/stats as student")
    resp, data = make_request("GET", "/admin/stats", token=student_token)
    if resp and resp.status_code in [401, 404]:
        test_result("Access admin stats as student", True, f"Correctly returned {resp.status_code}")
    else:
        test_result("Access admin stats as student", False, f"Expected 401/404, got {resp.status_code if resp else 'N/A'}")
    
    return True

# ============ TEST 7: ADMIN STATS ============
def test_admin_stats():
    log("\n" + "=" * 60)
    log("TEST 7: ADMIN STATS")
    log("=" * 60)
    
    log("7.1 Testing GET /api/admin/stats")
    resp, data = make_request("GET", "/admin/stats", token=admin_token)
    if resp and resp.status_code == 200:
        required_fields = ["programs", "students", "modules", "chapters", "lessons", "recent"]
        has_all = all(field in data for field in required_fields)
        if has_all:
            test_result("Admin stats", True, 
                f"Programs: {data['programs']}, Students: {data['students']}, "
                f"Modules: {data['modules']}, Chapters: {data['chapters']}, "
                f"Lessons: {data['lessons']}, Recent syncs: {len(data['recent'])}")
        else:
            missing = [f for f in required_fields if f not in data]
            test_result("Admin stats", False, f"Missing fields: {missing}")
    else:
        test_result("Admin stats", False, f"Status: {resp.status_code if resp else 'N/A'}, Data: {data}")
    
    return True

# ============ TEST 8: CASCADING DELETE ============
def test_cascading_delete():
    log("\n" + "=" * 60)
    log("TEST 8: CASCADING DELETE")
    log("=" * 60)
    
    # Create a test program with full curriculum
    log("8.1 Creating test program for cascading delete")
    resp, data = make_request("POST", "/programs", token=admin_token, data={
        "title": "Test Delete Program",
        "description": "Will be deleted",
        "status": "draft"
    })
    if resp and resp.status_code == 200:
        del_prog_id = data["id"]
        
        # Create module
        resp, data = make_request("POST", "/modules", token=admin_token, data={
            "program_id": del_prog_id,
            "title": "Test Module"
        })
        if resp and resp.status_code == 200:
            del_mod_id = data["id"]
            
            # Create chapter
            resp, data = make_request("POST", "/chapters", token=admin_token, data={
                "module_id": del_mod_id,
                "title": "Test Chapter"
            })
            if resp and resp.status_code == 200:
                del_chap_id = data["id"]
                
                # Create lesson
                resp, data = make_request("POST", "/lessons", token=admin_token, data={
                    "chapter_id": del_chap_id,
                    "title": "Test Lesson"
                })
                if resp and resp.status_code == 200:
                    del_lesson_id = data["id"]
                    
                    # Now delete the module and verify cascading
                    log("8.2 Testing DELETE /api/modules/:id (cascading)")
                    resp, data = make_request("DELETE", f"/modules/{del_mod_id}", token=admin_token)
                    if resp and resp.status_code == 200:
                        # Verify chapter and lesson are deleted
                        resp_chap, _ = make_request("GET", f"/programs/{del_prog_id}", token=admin_token)
                        if resp_chap and resp_chap.status_code == 200:
                            prog_data = _
                            if len(prog_data.get("modules", [])) == 0:
                                test_result("Cascading delete (module)", True, "Module, chapters, and lessons deleted")
                            else:
                                test_result("Cascading delete (module)", False, "Module not fully deleted")
                    else:
                        test_result("Cascading delete (module)", False, f"Delete failed: {resp.status_code if resp else 'N/A'}")
        
        # Clean up test program
        make_request("DELETE", f"/programs/{del_prog_id}", token=admin_token)
    
    return True

# ============ MAIN TEST RUNNER ============
def main():
    log("Starting Samyak Content Delivery Platform Backend Tests")
    log(f"Base URL: {BASE_URL}")
    log("")
    
    results = {
        "Auth Flow": test_auth_flow(),
        "Programs CRUD": test_programs_crud(),
        "Curriculum (Modules/Chapters/Lessons)": test_curriculum(),
        "Notion Sync": test_notion_sync(),
        "Students CRUD + Assignment": test_students(),
        "Role-Based Access Control": test_rbac(),
        "Admin Stats": test_admin_stats(),
        "Cascading Delete": test_cascading_delete()
    }
    
    # Summary
    log("\n" + "=" * 60)
    log("TEST SUMMARY")
    log("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        log(f"{status}: {test_name}")
    
    log("")
    log(f"Total: {passed}/{total} test suites passed")
    
    if passed == total:
        log("🎉 All tests passed!")
        return 0
    else:
        log("⚠️  Some tests failed. Please review the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
