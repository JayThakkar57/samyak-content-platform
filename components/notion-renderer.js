'use client'
import React from 'react'

function renderRichText(arr) {
  if (!arr || !arr.length) return null
  return arr.map((rt, i) => {
    const a = rt.annotations || {}
    let cls = ''
    if (a.bold) cls += ' font-semibold'
    if (a.italic) cls += ' italic'
    if (a.underline) cls += ' underline'
    if (a.strikethrough) cls += ' line-through'
    if (a.code) cls += ' font-mono text-[0.875em] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded'
    const color = a.color && a.color !== 'default' ? a.color : null
    const style = {}
    if (color && !color.endsWith('_background')) style.color = color
    if (color && color.endsWith('_background')) style.backgroundColor = `var(--notion-${color}, #fef3c7)`
    const content = rt.text?.link?.url
      ? <a href={rt.text.link.url} target="_blank" rel="noreferrer" className="text-blue-600 underline underline-offset-2 hover:text-blue-700">{rt.plain_text}</a>
      : rt.plain_text
    return <span key={i} className={cls.trim()} style={style}>{content}</span>
  })
}

function Block({ block, listIndex }) {
  const t = block.type
  const data = block[t] || {}

  switch (t) {
    case 'paragraph':
      return <p className="text-slate-800 leading-7 my-2">{renderRichText(data.rich_text)}</p>
    case 'heading_1':
      return <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-8 mb-3">{renderRichText(data.rich_text)}</h1>
    case 'heading_2':
      return <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-6 mb-2">{renderRichText(data.rich_text)}</h2>
    case 'heading_3':
      return <h3 className="text-xl font-semibold tracking-tight text-slate-900 mt-5 mb-2">{renderRichText(data.rich_text)}</h3>
    case 'bulleted_list_item':
      return (
        <ul className="list-disc ml-6 my-1">
          <li className="text-slate-800 leading-7">
            {renderRichText(data.rich_text)}
            {block.children && <Renderer blocks={block.children} />}
          </li>
        </ul>
      )
    case 'numbered_list_item':
      return (
        <ol className="list-decimal ml-6 my-1">
          <li className="text-slate-800 leading-7">
            {renderRichText(data.rich_text)}
            {block.children && <Renderer blocks={block.children} />}
          </li>
        </ol>
      )
    case 'to_do':
      return (
        <div className="flex items-start gap-2 my-1">
          <input type="checkbox" readOnly checked={!!data.checked} className="mt-2 accent-blue-600" />
          <div className={`text-slate-800 leading-7 ${data.checked ? 'line-through text-slate-400' : ''}`}>
            {renderRichText(data.rich_text)}
            {block.children && <Renderer blocks={block.children} />}
          </div>
        </div>
      )
    case 'callout': {
      const icon = data.icon?.emoji || '💡'
      return (
        <div className="my-3 flex gap-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <div className="text-xl leading-7">{icon}</div>
          <div className="flex-1 text-slate-800 leading-7">
            {renderRichText(data.rich_text)}
            {block.children && <Renderer blocks={block.children} />}
          </div>
        </div>
      )
    }
    case 'quote':
      return (
        <blockquote className="my-3 border-l-4 border-blue-500 bg-slate-50 px-4 py-2 italic text-slate-700">
          {renderRichText(data.rich_text)}
        </blockquote>
      )
    case 'divider':
      return <hr className="my-6 border-slate-200" />
    case 'toggle':
      return (
        <details className="my-2 rounded-md border border-slate-200 bg-white">
          <summary className="cursor-pointer px-3 py-2 font-medium text-slate-800 hover:bg-slate-50 rounded-md">{renderRichText(data.rich_text)}</summary>
          <div className="px-4 pb-3 pt-1">
            {block.children && <Renderer blocks={block.children} />}
          </div>
        </details>
      )
    case 'code': {
      const lang = data.language || 'text'
      const code = (data.rich_text || []).map(t => t.plain_text).join('')
      return (
        <div className="my-3 rounded-lg overflow-hidden border border-slate-200">
          <div className="bg-slate-100 text-slate-500 text-xs px-3 py-1 border-b border-slate-200 font-mono">{lang}</div>
          <pre className="bg-slate-900 text-slate-100 p-4 overflow-x-auto text-sm leading-6"><code>{code}</code></pre>
        </div>
      )
    }
    case 'image': {
      const url = data.type === 'external' ? data.external?.url : data.file?.url
      const caption = (data.caption || []).map(t => t.plain_text).join('')
      return (
        <figure className="my-4">
          {url && <img src={url} alt={caption || 'image'} className="rounded-lg w-full max-w-3xl border border-slate-200" />}
          {caption && <figcaption className="text-center text-sm text-slate-500 mt-1">{caption}</figcaption>}
        </figure>
      )
    }
    case 'video': {
      const url = data.type === 'external' ? data.external?.url : data.file?.url
      if (!url) return null
      const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?\s]+)/)
      if (yt) {
        return <div className="my-4 aspect-video rounded-lg overflow-hidden border border-slate-200"><iframe src={`https://www.youtube.com/embed/${yt[1]}`} className="w-full h-full" allowFullScreen /></div>
      }
      return <video src={url} controls className="my-4 w-full rounded-lg border border-slate-200" />
    }
    case 'embed':
    case 'bookmark': {
      const url = data.url
      return <a href={url} target="_blank" rel="noreferrer" className="my-3 block rounded-lg border border-slate-200 p-3 hover:bg-slate-50 text-blue-600 underline truncate">{url}</a>
    }
    case 'table': {
      const rows = block.children || []
      return (
        <div className="my-4 overflow-x-auto">
          <table className="min-w-full border border-slate-200 text-sm">
            <tbody>
              {rows.map((row, ri) => {
                const cells = row.table_row?.cells || []
                const isHeader = data.has_column_header && ri === 0
                return (
                  <tr key={row.id} className={isHeader ? 'bg-slate-100 font-semibold' : ''}>
                    {cells.map((cell, ci) => (
                      <td key={ci} className="border border-slate-200 px-3 py-2 align-top">{renderRichText(cell)}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }
    case 'column_list':
      return <div className="my-3 grid gap-4" style={{ gridTemplateColumns: `repeat(${(block.children||[]).length}, minmax(0, 1fr))` }}>{(block.children||[]).map(c => <div key={c.id}><Renderer blocks={c.children||[]} /></div>)}</div>
    default:
      return null
  }
}

export function Renderer({ blocks }) {
  if (!blocks || !blocks.length) return <p className="text-slate-400 italic">No content yet.</p>
  return <div>{blocks.map(b => <Block key={b.id} block={b} />)}</div>
}

export default Renderer
