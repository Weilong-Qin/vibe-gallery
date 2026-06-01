import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MarkdownTextProps = {
  content: string
  className?: string
  /** When true, render as inline text without wrapping block elements.
   *  Use for short fragments inside <p>, <li>, etc. */
  inline?: boolean
}

/**
 * Markdown renderer supporting full GFM syntax (headings, lists, code blocks,
 * tables, strikethrough, etc.) via react-markdown + remark-gfm.
 *
 * Use `inline` mode for short text fragments that live inside another block
 * element (e.g. a <p> or <li>) — it strips the outer <p> wrapper that
 * react-markdown produces by default.
 */
export function MarkdownText({ content, className, inline = false }: MarkdownTextProps) {
  if (!content) return null

  if (inline) {
    return (
      <span className={className}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          allowedElements={['strong', 'em', 'del', 'code', 'a', 'span']}
          unwrapDisallowed
        >
          {content}
        </ReactMarkdown>
      </span>
    )
  }

  return (
    <div className={`md-text${className ? ` ${className}` : ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
