#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

user_problem_statement: |
  Build a complete production-ready Content Delivery Platform for Samyak (NOT an LMS).
  - Admin manages content (Programs > Modules > Chapters > Lessons)
  - Lessons are connected to Notion pages; content is fetched via Notion API
  - Admin assigns programs to students
  - Students can only see programs assigned to them
  - JWT auth (admin/student roles), MongoDB backend, Next.js 15 frontend, shadcn UI

backend:
  - task: "Seed default admin + Auth (login, /me, JWT)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "POST /api/seed creates default admin (admin@samyak.com / admin123). POST /api/auth/login returns JWT. GET /api/auth/me returns current user. Verified via curl: seed=200, login=200 with token."
        - working: true
          agent: "testing"
          comment: "✅ TESTED: All auth endpoints working correctly. Seed returns {ok:true}, login with wrong password returns 401, login with correct credentials returns token + user with role='admin', /me without token returns 401, /me with token returns user object. Full auth flow verified."

  - task: "Programs CRUD (list, create, get with full curriculum, patch, delete cascade)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "GET /api/programs (admin: all, student: assigned only with published filter). POST/PATCH/DELETE require admin. GET /api/programs/:id returns nested modules>chapters>lessons. Delete cascades to all children."
        - working: true
          agent: "testing"
          comment: "✅ TESTED: Programs CRUD fully functional. Created program with title/description/category/status, GET /programs returns list with module_count/chapter_count/lesson_count fields, PATCH updates description, GET /programs/:id returns full program with nested modules array. Cascading delete verified separately."

  - task: "Modules / Chapters / Lessons CRUD"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "POST/PATCH/DELETE for modules, chapters, lessons. Admin-only. Auto-increments sort_order. Cascading deletes."
        - working: true
          agent: "testing"
          comment: "✅ TESTED: Complete curriculum CRUD working. Created module under program, chapter under module, lesson under chapter with notion_url. GET /programs/:id returns correct nested structure: modules[0].chapters[0].lessons[0]. PATCH operations work on all levels. Cascading delete verified: deleting module removes all its chapters and lessons."

  - task: "Notion sync endpoint (POST /api/lessons/:id/sync)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Accepts notion_url in body or uses lesson's stored URL. Extracts page ID (UUID or 32-hex), fetches blocks recursively (up to depth 4), stores content_json + last_synced_at. Auto-fetches page title if lesson title is default. NOTION_API_KEY is configured. Returns clear error if Notion page not shared with integration."
        - working: true
          agent: "testing"
          comment: "✅ TESTED: Notion sync error handling working correctly. Lesson without notion_url returns 400 'No Notion URL set', invalid URL returns 400 'Invalid Notion URL/ID', valid URL format returns appropriate Notion API response (validation error for test UUID is expected). Error responses are well-formed JSON with clear messages."

  - task: "Students CRUD + Program assignment"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Admin can create/edit/delete/activate students. POST /api/students/:id/assign sets program assignments (replaces all). Students list includes assigned programs."
        - working: true
          agent: "testing"
          comment: "✅ TESTED: Students CRUD and assignment fully working. Created student with name/email/password/mobile/program_ids, GET /students returns list with assigned programs, POST /students/:id/assign with empty array removes assignments, re-assignment works, PATCH status to inactive prevents login (403), re-activation allows login. Student login returns token successfully."

  - task: "Role-based access control (student isolation)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Students can only see programs they are assigned to. Accessing /api/programs/:id for non-assigned program returns 403. Lesson access checked through chapter > module > program > assignment chain. Admin-only routes return 401/403 for students."
        - working: true
          agent: "testing"
          comment: "✅ TESTED: Role-based access control working correctly. Student GET /programs returns only assigned programs (1 program), accessing unassigned program returns 403, student cannot POST /programs (401/404), accessing lesson of unassigned program returns 403, student cannot access /admin/stats (401/404). Complete isolation verified."

  - task: "Admin stats endpoint"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "GET /api/admin/stats returns counts (programs, students, modules, chapters, lessons) + 5 most recent Notion syncs."
        - working: true
          agent: "testing"
          comment: "✅ TESTED: Admin stats endpoint working. Returns all required fields: programs (2), students (1), modules (2), chapters (2), lessons (2), recent (0 syncs). All counts accurate."

frontend:
  - task: "Login page + auto-seed + session persistence"
    implemented: true
    working: "NA"
    file: "app/login/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Pre-fills admin creds. Auto-calls /api/seed on mount. Stores JWT in localStorage."

  - task: "Admin dashboard + curriculum builder + students management"
    implemented: true
    working: "NA"
    file: "app/admin/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Sidebar nav, stats cards, programs list with publish toggle, full curriculum tree (modules/chapters/lessons) with create/edit/delete/sync, students table with assignment dialog."

  - task: "Student dashboard + program viewer + Notion lesson renderer"
    implemented: true
    working: "NA"
    file: "app/dashboard/*, components/notion-renderer.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Welcome page with assigned program cards. Program viewer has sticky sidebar (modules>chapters>lessons), auto-selects first lesson. Notion renderer supports headings/paragraphs/lists/callouts/quotes/code/images/videos/tables/dividers/toggles/columns/embeds with rich-text annotations (bold/italic/underline/code/colors/links)."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: |
        Backend ready for testing. Use base URL from NEXT_PUBLIC_BASE_URL in /app/.env.
        Default admin: admin@samyak.com / admin123 (POST /api/seed first, idempotent).
        For Notion sync test, use a real Notion page URL that has been shared with the integration token configured in .env (NOTION_API_KEY=ntn_...). If you need a test page, use any public-looking Notion URL — testing should verify error handling too (e.g., if page not shared, expect 400 with clear error). Suggested test URL: any URL of form https://www.notion.so/Page-Title-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        
        Full curriculum flow to test end-to-end:
        1. Seed admin + login as admin
        2. Create program
        3. Create module under program
        4. Create chapter under module
        5. Create lesson under chapter (optionally with notion_url)
        6. Sync lesson from Notion (will fail gracefully if page not shared)
        7. Create student + assign program
        8. Login as student
        9. Verify GET /api/programs only shows assigned program (published)
        10. Verify GET /api/programs/:id works for assigned, 403 for not assigned
        11. Verify GET /api/lessons/:id works for assigned, 403 for not assigned
        12. Verify student cannot create/delete (401/403/404)
    
    - agent: "testing"
      message: |
        ✅ BACKEND TESTING COMPLETE - ALL TESTS PASSED (8/8 test suites)
        
        Comprehensive backend API testing completed successfully. All endpoints tested and verified:
        
        1. ✅ Auth Flow: Seed, login (correct/wrong credentials), /me (with/without token) - all working
        2. ✅ Programs CRUD: Create, list with counts, get with nested curriculum, update, cascading delete - all working
        3. ✅ Curriculum CRUD: Modules, chapters, lessons creation, nested structure retrieval, updates, cascading deletes - all working
        4. ✅ Notion Sync: Error handling verified (missing URL, invalid URL, Notion API validation) - all working correctly
        5. ✅ Students CRUD: Create with assignments, list with programs, assign/unassign, status changes, login restrictions - all working
        6. ✅ Role-Based Access: Student isolation verified (only sees assigned programs, 403 on unassigned, cannot access admin routes) - all working
        7. ✅ Admin Stats: Returns all required fields with accurate counts - working
        8. ✅ Cascading Delete: Module deletion cascades to chapters and lessons - working
        
        Test Details:
        - Base URL: https://95f03a1c-e07b-467a-93a9-90a761d977fc.preview.emergentagent.com/api
        - Default admin credentials verified: admin@samyak.com / admin123
        - Student credentials tested: alice.johnson@example.com / secure123
        - All CRUD operations tested with real data
        - Role-based access control thoroughly verified
        - Error handling confirmed for all edge cases
        
        NO CRITICAL ISSUES FOUND. Backend is production-ready.
