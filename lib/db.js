import { MongoClient } from 'mongodb'

let client
let db

export async function getDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
    // Create indexes
    await db.collection('profiles').createIndex({ email: 1 }, { unique: true })
    await db.collection('programs').createIndex({ id: 1 }, { unique: true })
    await db.collection('student_programs').createIndex({ student_id: 1, program_id: 1 }, { unique: true })
  }
  return db
}
