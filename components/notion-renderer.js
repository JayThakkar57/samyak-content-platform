'use client'
import React from 'react'

function renderRichText(arr) {
  if (!arr || !arr.length) return null
  return arr.map((rt, i) => {
    const a = rt.annotations || {}
    let cls = ''
    if (a.bold) cls += ' font-semibold text-slate-900'
    if (a.italic) cls += ' italic'
    if (a.underline) cls += ' underline underline-offset-2'
    if (a.strikethrough) cls += ' line-through'
    if (a.code) cls += ' font-mono text-[0.875em] bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 px-1.5 py-0.5 rounded-md border border-rose-100'
    const color = a.color && a.color !== 'default' ? a.color : null
    const style = {}
    if (color && !color.endsWith('_background')) style.color = color
    const content = rt.text?.link?.url
      ? <a href={rt.text.link.url} target="_blank" rel="noreferrer" className="text-blue-600 underline underline-offset-2 hover:text-blue-700 transition decoration-blue-300 hover:decoration-blue-600">{rt.plain_text}</a>
      : rt.plain_text
    return <span key={i} className={cls.trim()} style={style}>{content}</span>
  })
}

const calloutColors = {
  blue_background: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-900',
  gray_background: 'from-slate-50 to-gray-50 border-slate-200 text-slate-800',
  brown_background: 'from-amber-50 to-orange-50 border-amber-200 text-amber-900',
  orange_background: 'from-orange-50 to-amber-50 border-orange-200 text-orange-900',
  yellow_background: 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-900',
  green_background: 'from-emerald-50 to-green-50 border-emerald-200 text-emerald-900',
  pink_background: 'from-pink-50 to-rose-50 border-pink-200 text-pink-900',
  red_background: 'from-rose-50 to-red-50 border-rose-200 text-rose-900',
  purple_background: 'from-violet-50 to-purple-50 border-violet-200 text-violet-900',
  default: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-900',
}

function Block({ block }) {
  const t = block.type
  const data = block[t] || {}

  switch (t) {
    case 'paragraph':
      return <p className="text-slate-800 leading-[1.75] my-3 text-[17px]">{renderRichText(data.rich_text)}</p>
    case 'heading_1':
      return <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 mt-12 mb-4 leading-tight">{renderRichText(data.rich_text)}</h1>
    case 'heading_2':
      return <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 mt-10 mb-3 leading-tight">{renderRichText(data.rich_text)}</h2>
    case 'heading_3':
      return <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-900 mt-8 mb-3 leading-tight">{renderRichText(data.rich_text)}</h3>
    case 'bulleted_list_item':
      return (
        <ul className="ml-6 my-1 list-none">
          <li className="text-slate-800 leading-[1.75] text-[17px] relative pl-2 before:content-[''] before:absolute before:-left-4 before:top-[0.8rem] before:w-1.5 before:h-1.5 before:rounded-full before:bg-gradient-to-br before:from-blue-500 before:to-violet-500">
            {renderRichText(data.rich_text)}
            {block.children && <Renderer blocks={block.children} />}
          </li>
        </ul>
      )
    case 'numbered_list_item':
      return (
        <ol className="ml-6 my-1 list-decimal marker:text-blue-600 marker:font-semibold">
          <li className="text-slate-800 leading-[1.75] text-[17px] pl-2">
            {renderRichText(data.rich_text)}
            {block.children && <Renderer blocks={block.children} />}
          </li>
        </ol>
      )
    case 'to_do':
      return (
        <div className="flex items-start gap-3 my-2 group">
          <div className={`mt-1.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition ${data.checked ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-500' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
            {data.checked && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </div>
          <div className={`text-[17px] leading-[1.75] flex-1 ${data.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {renderRichText(data.rich_text)}
            {block.children && <Renderer blocks={block.children} />}
          </div>
        </div>
      )
    case 'callout': {
      const icon = data.icon?.emoji || '💡'
      const color = calloutColors[data.color] || calloutColors.default
      return (
        <div className={`my-4 flex gap-4 rounded-2xl bg-gradient-to-br ${color} border px-5 py-4 shadow-sm`}>
          <div className="text-2xl leading-none mt-0.5 select-none">{icon}</div>
          <div className="flex-1 text-[16px] leading-[1.7]">
            {renderRichText(data.rich_text)}
            {block.children && <Renderer blocks={block.children} />}
          </div>
        </div>
      )
    }
    case 'quote':
      return (
        <blockquote className="my-5 relative pl-6 py-2 italic text-slate-700 text-[18px] leading-[1.7]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-violet-500 rounded-full" />
          {renderRichText(data.rich_text)}
          {block.children && <Renderer blocks={block.children} />}
        </blockquote>
      )
    case 'divider':
      return <div className="my-10 flex items-center justify-center"><div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent" /></div>
    case 'toggle':
      return (
        <details className="my-3 group rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition overflow-hidden">
          <summary className="cursor-pointer px-4 py-3 font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2 select-none list-none">
            <svg className="h-4 w-4 text-slate-400 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="flex-1">{renderRichText(data.rich_text)}</span>
          </summary>
          <div className="px-5 pb-4 pt-1 border-t border-slate-100">
            {block.children && <Renderer blocks={block.children} />}
          </div>
        </details>
      )
    case 'code': {
      const lang = data.language || 'text'
      const code = (data.rich_text || []).map(t => t.plain_text).join('')
      return (
        <div className="my-5 rounded-xl overflow-hidden border border-slate-700 shadow-xl shadow-slate-200">
          <div className="bg-slate-800 text-slate-400 text-xs px-4 py-2 border-b border-slate-700 font-mono flex items-center gap-2">
            <div className="flex gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-500/70" /><div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" /><div className="h-2.5 w-2.5 rounded-full bg-green-500/70" /></div>
            <span className="ml-2">{lang}</span>
          </div>
          <pre className="bg-slate-900 text-slate-100 p-5 overflow-x-auto text-sm leading-6 font-mono"><code>{code}</code></pre>
        </div>
      )
    }
    case 'image': {
      const url = data.type === 'external' ? data.external?.url : data.file?.url
      const caption = (data.caption || []).map(t => t.plain_text).join('')
      return (
        <figure className="my-6">
          {url && <img src={url} alt={caption || 'image'} className="rounded-2xl w-full max-w-3xl shadow-lg shadow-slate-200" />}
          {caption && <figcaption className="text-center text-sm text-slate-500 mt-3 italic">{caption}</figcaption>}
        </figure>
      )
    }
    case 'video': {
      const url = data.type === 'external' ? data.external?.url : data.file?.url
      if (!url) return null
      const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?\s]+)/)
      if (yt) {
        return <div className="my-6 aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200"><iframe src={`https://www.youtube.com/embed/${yt[1]}`} className="w-full h-full" allowFullScreen /></div>
      }
      return <video src={url} controls className="my-6 w-full rounded-2xl border border-slate-200 shadow-lg" />
    }
    case 'embed':
    case 'bookmark': {
      const url = data.url
      return <a href={url} target="_blank" rel="noreferrer" className="my-4 block rounded-xl border border-slate-200 p-4 hover:bg-blue-50/50 hover:border-blue-200 transition text-blue-600 truncate flex items-center gap-2 group">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        <span className="truncate group-hover:underline">{url}</span>
      </a>
    }
    case 'table': {
      const rows = block.children || []
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="min-w-full text-sm">
            <tbody>
              {rows.map((row, ri) => {
                const cells = row.table_row?.cells || []
                const isHeader = data.has_column_header && ri === 0
                return (
                  <tr key={row.id} className={isHeader ? 'bg-gradient-to-r from-blue-50 to-indigo-50 font-semibold text-slate-900' : ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    {cells.map((cell, ci) => (
                      <td key={ci} className="border-t border-slate-200 px-4 py-3 align-top">{renderRichText(cell)}</td>
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
      return <div className="my-4 grid gap-5" style={{ gridTemplateColumns: `repeat(${(block.children||[]).length}, minmax(0, 1fr))` }}>{(block.children||[]).map(c => <div key={c.id}><Renderer blocks={c.children||[]} /></div>)}</div>
    default:
      return null
  }
}

export function Renderer({ blocks }) {
  if (!blocks || !blocks.length) return <p className="text-slate-400 italic">No content yet.</p>
  return <div>{blocks.map(b => <Block key={b.id} block={b} />)}</div>
}

export default Renderer
