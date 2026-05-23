import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Client as NotionClient } from '@notionhq/client'

const SECRET = process.env.JWT_SECRET || 'dev_secret'
let client, db

async function getDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
    await db.collection('profiles').createIndex({ email: 1 }, { unique: true })
  }
  return db
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}
function json(data, status = 200) { return cors(NextResponse.json(data, { status })) }

async function getUser(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  try {
    const decoded = jwt.verify(token, SECRET)
    const db = await getDb()
    const user = await db.collection('profiles').findOne({ id: decoded.id })
    if (!user || user.status === 'inactive') return null
    const { password_hash, _id, ...safe } = user
    return safe
  } catch { return null }
}

function extractNotionPageId(input) {
  if (!input) return null
  const trimmed = String(input).trim()
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (UUID.test(trimmed)) return trimmed.toLowerCase()
  const m = trimmed.match(/[0-9a-f]{32}/i)
  if (!m) return null
  const raw = m[0].toLowerCase()
  return `${raw.slice(0,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}-${raw.slice(16,20)}-${raw.slice(20)}`
}

async function fetchAllChildren(notion, blockId, depth = 0) {
  if (depth > 4) return []
  const all = []
  let cursor
  do {
    const res = await notion.blocks.children.list({ block_id: blockId, page_size: 100, start_cursor: cursor })
    for (const block of res.results) {
      const enriched = { ...block }
      if (block.has_children) {
        enriched.children = await fetchAllChildren(notion, block.id, depth + 1)
      }
      all.push(enriched)
    }
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  return all
}

async function fetchPageTitle(notion, pageId) {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId })
    const props = page.properties || {}
    for (const key of Object.keys(props)) {
      const p = props[key]
      if (p && p.type === 'title' && Array.isArray(p.title)) {
        return p.title.map(t => t.plain_text).join('') || 'Untitled'
      }
    }
    return 'Untitled'
  } catch { return null }
}

export async function OPTIONS() { return cors(new NextResponse(null, { status: 200 })) }

async function handle(request, { params }) {
  const { path = [] } = params
  const route = '/' + path.join('/')
  const method = request.method
  const db = await getDb()
  let body = {}
  if (['POST','PUT','PATCH'].includes(method)) {
    try { body = await request.json() } catch { body = {} }
  }

  try {
    // ============ SEED ============
    if (route === '/seed' && method === 'POST') {
      const exists = await db.collection('profiles').findOne({ email: 'admin@samyak.com' })
      if (!exists) {
        await db.collection('profiles').insertOne({
          id: uuidv4(), role: 'admin', name: 'Samyak Admin',
          email: 'admin@samyak.com', mobile: '', status: 'active',
          password_hash: await bcrypt.hash('admin123', 10),
          created_at: new Date()
        })
      }
      return json({ ok: true })
    }

    // ============ AUTH ============
    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = body
      const user = await db.collection('profiles').findOne({ email })
      if (!user) return json({ error: 'Invalid credentials' }, 401)
      if (user.status === 'inactive') return json({ error: 'Account inactive' }, 403)
      const ok = await bcrypt.compare(password, user.password_hash || '')
      if (!ok) return json({ error: 'Invalid credentials' }, 401)
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' })
      const { password_hash, _id, ...safe } = user
      return json({ token, user: safe })
    }
    if (route === '/auth/me' && method === 'GET') {
      const user = await getUser(request)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      return json({ user })
    }
    if (route === '/auth/change-password' && method === 'POST') {
      const u = await getUser(request)
      if (!u) return json({ error: 'Unauthorized' }, 401)
      const { current_password, new_password } = body
      if (!new_password || new_password.length < 6) return json({ error: 'New password must be at least 6 characters' }, 400)
      const user = await db.collection('profiles').findOne({ id: u.id })
      const ok = await bcrypt.compare(current_password || '', user.password_hash || '')
      if (!ok) return json({ error: 'Current password is incorrect' }, 401)
      await db.collection('profiles').updateOne({ id: u.id }, { $set: { password_hash: await bcrypt.hash(new_password, 10) } })
      return json({ ok: true })
    }

    const user = await getUser(request)
    if (!user) return json({ error: 'Unauthorized' }, 401)
    const isAdmin = user.role === 'admin'

    // ============ STATS ============
    if (route === '/admin/stats' && method === 'GET' && isAdmin) {
      const [programs, students, modules, chapters, lessons] = await Promise.all([
        db.collection('programs').countDocuments(),
        db.collection('profiles').countDocuments({ role: 'student' }),
        db.collection('modules').countDocuments(),
        db.collection('chapters').countDocuments(),
        db.collection('lessons').countDocuments(),
      ])
      const recent = await db.collection('lessons').find({ last_synced_at: { $ne: null } }).sort({ last_synced_at: -1 }).limit(5).project({ _id: 0, id: 1, title: 1, last_synced_at: 1 }).toArray()
      return json({ programs, students, modules, chapters, lessons, recent })
    }

    // ============ PROGRAMS ============
    if (route === '/programs' && method === 'GET') {
      let progs
      if (isAdmin) {
        progs = await db.collection('programs').find({}).project({ _id: 0 }).sort({ created_at: -1 }).toArray()
      } else {
        const assignments = await db.collection('student_programs').find({ student_id: user.id }).toArray()
        const ids = assignments.map(a => a.program_id)
        progs = await db.collection('programs').find({ id: { $in: ids }, status: 'published' }).project({ _id: 0 }).toArray()
      }
      // Enrich with counts
      for (const p of progs) {
        const mods = await db.collection('modules').find({ program_id: p.id }).project({ id: 1 }).toArray()
        const modIds = mods.map(m => m.id)
        const chaps = await db.collection('chapters').find({ module_id: { $in: modIds } }).project({ id: 1 }).toArray()
        const chapIds = chaps.map(c => c.id)
        p.module_count = mods.length
        p.chapter_count = chaps.length
        p.lesson_count = await db.collection('lessons').countDocuments({ chapter_id: { $in: chapIds } })
      }
      return json(progs)
    }
    if (route === '/programs' && method === 'POST' && isAdmin) {
      const prog = { id: uuidv4(), title: body.title, description: body.description || '', thumbnail: body.thumbnail || '', category: body.category || '', status: body.status || 'draft', created_at: new Date() }
      await db.collection('programs').insertOne(prog)
      const { _id, ...safe } = prog
      return json(safe)
    }
    const progMatch = route.match(/^\/programs\/([^/]+)$/)
    if (progMatch) {
      const id = progMatch[1]
      if (method === 'GET') {
        if (!isAdmin) {
          const assigned = await db.collection('student_programs').findOne({ student_id: user.id, program_id: id })
          if (!assigned) return json({ error: 'Forbidden' }, 403)
        }
        const prog = await db.collection('programs').findOne({ id }, { projection: { _id: 0 } })
        if (!prog) return json({ error: 'Not found' }, 404)
        const modules = await db.collection('modules').find({ program_id: id }).project({ _id: 0 }).sort({ sort_order: 1 }).toArray()
        for (const m of modules) {
          m.chapters = await db.collection('chapters').find({ module_id: m.id }).project({ _id: 0 }).sort({ sort_order: 1 }).toArray()
          for (const c of m.chapters) {
            c.lessons = await db.collection('lessons').find({ chapter_id: c.id }).project({ _id: 0, content_json: 0 }).sort({ sort_order: 1 }).toArray()
          }
        }
        prog.modules = modules
        return json(prog)
      }
      if (method === 'PATCH' && isAdmin) {
        const upd = {}
        for (const k of ['title','description','thumbnail','category','status']) if (body[k] !== undefined) upd[k] = body[k]
        await db.collection('programs').updateOne({ id }, { $set: upd })
        return json({ ok: true })
      }
      if (method === 'DELETE' && isAdmin) {
        const mods = await db.collection('modules').find({ program_id: id }).toArray()
        const modIds = mods.map(m => m.id)
        const chaps = await db.collection('chapters').find({ module_id: { $in: modIds } }).toArray()
        const chapIds = chaps.map(c => c.id)
        await db.collection('lessons').deleteMany({ chapter_id: { $in: chapIds } })
        await db.collection('chapters').deleteMany({ module_id: { $in: modIds } })
        await db.collection('modules').deleteMany({ program_id: id })
        await db.collection('student_programs').deleteMany({ program_id: id })
        await db.collection('programs').deleteOne({ id })
        return json({ ok: true })
      }
    }

    // ============ MODULES ============
    if (route === '/modules' && method === 'POST' && isAdmin) {
      const count = await db.collection('modules').countDocuments({ program_id: body.program_id })
      const m = { id: uuidv4(), program_id: body.program_id, title: body.title, description: body.description || '', sort_order: body.sort_order ?? count }
      await db.collection('modules').insertOne(m)
      const { _id, ...safe } = m; return json(safe)
    }
    const modMatch = route.match(/^\/modules\/([^/]+)$/)
    if (modMatch && isAdmin) {
      const id = modMatch[1]
      if (method === 'PATCH') {
        const upd = {}
        for (const k of ['title','description','sort_order']) if (body[k] !== undefined) upd[k] = body[k]
        await db.collection('modules').updateOne({ id }, { $set: upd }); return json({ ok: true })
      }
      if (method === 'DELETE') {
        const chaps = await db.collection('chapters').find({ module_id: id }).toArray()
        const chapIds = chaps.map(c => c.id)
        await db.collection('lessons').deleteMany({ chapter_id: { $in: chapIds } })
        await db.collection('chapters').deleteMany({ module_id: id })
        await db.collection('modules').deleteOne({ id })
        return json({ ok: true })
      }
    }

    // ============ CHAPTERS ============
    if (route === '/chapters' && method === 'POST' && isAdmin) {
      const count = await db.collection('chapters').countDocuments({ module_id: body.module_id })
      const c = { id: uuidv4(), module_id: body.module_id, title: body.title, description: body.description || '', sort_order: body.sort_order ?? count }
      await db.collection('chapters').insertOne(c)
      const { _id, ...safe } = c; return json(safe)
    }
    const chapMatch = route.match(/^\/chapters\/([^/]+)$/)
    if (chapMatch && isAdmin) {
      const id = chapMatch[1]
      if (method === 'PATCH') {
        const upd = {}
        for (const k of ['title','description','sort_order']) if (body[k] !== undefined) upd[k] = body[k]
        await db.collection('chapters').updateOne({ id }, { $set: upd }); return json({ ok: true })
      }
      if (method === 'DELETE') {
        await db.collection('lessons').deleteMany({ chapter_id: id })
        await db.collection('chapters').deleteOne({ id }); return json({ ok: true })
      }
    }

    // ============ LESSONS ============
    if (route === '/lessons' && method === 'POST' && isAdmin) {
      const count = await db.collection('lessons').countDocuments({ chapter_id: body.chapter_id })
      const l = { id: uuidv4(), chapter_id: body.chapter_id, title: body.title || 'Untitled Lesson', notion_page_id: null, notion_url: body.notion_url || null, content_json: null, last_synced_at: null, sort_order: body.sort_order ?? count }
      await db.collection('lessons').insertOne(l)
      const { _id, ...safe } = l; return json(safe)
    }
    const lessonMatch = route.match(/^\/lessons\/([^/]+)$/)
    if (lessonMatch) {
      const id = lessonMatch[1]
      if (method === 'GET') {
        const lesson = await db.collection('lessons').findOne({ id }, { projection: { _id: 0 } })
        if (!lesson) return json({ error: 'Not found' }, 404)
        if (!isAdmin) {
          const chap = await db.collection('chapters').findOne({ id: lesson.chapter_id })
          const mod = chap ? await db.collection('modules').findOne({ id: chap.module_id }) : null
          if (!mod) return json({ error: 'Not found' }, 404)
          const assigned = await db.collection('student_programs').findOne({ student_id: user.id, program_id: mod.program_id })
          if (!assigned) return json({ error: 'Forbidden' }, 403)
        }
        return json(lesson)
      }
      if (method === 'PATCH' && isAdmin) {
        const upd = {}
        for (const k of ['title','notion_url','sort_order']) if (body[k] !== undefined) upd[k] = body[k]
        await db.collection('lessons').updateOne({ id }, { $set: upd }); return json({ ok: true })
      }
      if (method === 'DELETE' && isAdmin) {
        await db.collection('lessons').deleteOne({ id }); return json({ ok: true })
      }
    }
    const syncMatch = route.match(/^\/lessons\/([^/]+)\/sync$/)
    if (syncMatch && method === 'POST' && isAdmin) {
      const id = syncMatch[1]
      const lesson = await db.collection('lessons').findOne({ id })
      if (!lesson) return json({ error: 'Not found' }, 404)
      const notionUrl = body.notion_url || lesson.notion_url
      if (!notionUrl) return json({ error: 'No Notion URL set' }, 400)
      const pageId = extractNotionPageId(notionUrl)
      if (!pageId) return json({ error: 'Invalid Notion URL/ID' }, 400)
      const apiKey = process.env.NOTION_API_KEY
      if (!apiKey) return json({ error: 'NOTION_API_KEY not configured on server. Please add it to .env' }, 500)
      try {
        const notion = new NotionClient({ auth: apiKey })
        const blocks = await fetchAllChildren(notion, pageId)
        const title = await fetchPageTitle(notion, pageId)
        const upd = {
          notion_page_id: pageId,
          notion_url: notionUrl,
          content_json: blocks,
          last_synced_at: new Date(),
        }
        if (title && (!lesson.title || lesson.title === 'Untitled Lesson')) upd.title = title
        await db.collection('lessons').updateOne({ id }, { $set: upd })
        return json({ ok: true, block_count: blocks.length, title, last_synced_at: upd.last_synced_at })
      } catch (e) {
        console.error('Notion sync error', e)
        return json({ error: 'Notion sync failed: ' + (e.body?.message || e.message || 'Unknown'), code: e.code }, 400)
      }
    }

    // ============ STUDENTS ============
    if (route === '/students' && method === 'GET' && isAdmin) {
      const students = await db.collection('profiles').find({ role: 'student' }).project({ _id: 0, password_hash: 0 }).sort({ created_at: -1 }).toArray()
      for (const s of students) {
        const assigns = await db.collection('student_programs').find({ student_id: s.id }).toArray()
        const progIds = assigns.map(a => a.program_id)
        s.programs = await db.collection('programs').find({ id: { $in: progIds } }).project({ _id: 0, id: 1, title: 1 }).toArray()
      }
      return json(students)
    }
    if (route === '/students' && method === 'POST' && isAdmin) {
      const { name, email, mobile, password, program_ids = [] } = body
      if (!email || !password) return json({ error: 'Email and password required' }, 400)
      const exists = await db.collection('profiles').findOne({ email })
      if (exists) return json({ error: 'Email already in use' }, 400)
      const s = { id: uuidv4(), role: 'student', name: name || '', email, mobile: mobile || '', status: 'active', password_hash: await bcrypt.hash(password, 10), created_at: new Date() }
      await db.collection('profiles').insertOne(s)
      for (const pid of program_ids) {
        await db.collection('student_programs').insertOne({ id: uuidv4(), student_id: s.id, program_id: pid, created_at: new Date() })
      }
      const { password_hash, _id, ...safe } = s
      return json(safe)
    }
    const studMatch = route.match(/^\/students\/([^/]+)$/)
    if (studMatch && isAdmin) {
      const id = studMatch[1]
      if (method === 'PATCH') {
        const upd = {}
        for (const k of ['name','email','mobile','status']) if (body[k] !== undefined) upd[k] = body[k]
        if (body.password) upd.password_hash = await bcrypt.hash(body.password, 10)
        await db.collection('profiles').updateOne({ id, role: 'student' }, { $set: upd }); return json({ ok: true })
      }
      if (method === 'DELETE') {
        await db.collection('student_programs').deleteMany({ student_id: id })
        await db.collection('profiles').deleteOne({ id, role: 'student' }); return json({ ok: true })
      }
    }
    const assignMatch = route.match(/^\/students\/([^/]+)\/assign$/)
    if (assignMatch && method === 'POST' && isAdmin) {
      const sid = assignMatch[1]
      const { program_ids = [] } = body
      await db.collection('student_programs').deleteMany({ student_id: sid })
      for (const pid of program_ids) {
        await db.collection('student_programs').insertOne({ id: uuidv4(), student_id: sid, program_id: pid, created_at: new Date() })
      }
      return json({ ok: true })
    }

    return json({ error: `Route ${route} not found` }, 404)
  } catch (e) {
    console.error('API Error:', e)
    return json({ error: 'Internal server error', details: e.message }, 500)
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const DELETE = handle
export const PATCH = handle
