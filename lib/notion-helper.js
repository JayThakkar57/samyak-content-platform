import { Client } from '@notionhq/client'

export function getNotionClient() {
  const key = process.env.NOTION_API_KEY
  if (!key) return null
  return new Client({ auth: key })
}

export function extractNotionPageId(input) {
  if (!input) return null
  const trimmed = input.trim()
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (UUID.test(trimmed)) return trimmed.toLowerCase()
  const m = trimmed.match(/[0-9a-f]{32}/i)
  if (!m) return null
  const raw = m[0].toLowerCase()
  return `${raw.slice(0,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}-${raw.slice(16,20)}-${raw.slice(20)}`
}

export async function fetchAllChildren(notion, blockId, depth = 0) {
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

export async function fetchPageTitle(notion, pageId) {
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
  } catch {
    return null
  }
}
