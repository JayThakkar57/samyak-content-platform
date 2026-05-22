import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getDb } from './db'

const SECRET = process.env.JWT_SECRET || 'dev_secret'

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch (e) {
    return null
  }
}

export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10)
}

export async function comparePassword(pw, hash) {
  return bcrypt.compare(pw, hash)
}

export async function getUserFromRequest(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const db = await getDb()
  const user = await db.collection('profiles').findOne({ id: decoded.id })
  if (!user || user.status === 'inactive') return null
  const { password_hash, _id, ...safe } = user
  return safe
}
