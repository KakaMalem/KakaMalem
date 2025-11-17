import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

/**
 * Serialize Payload's Lexical rich text to HTML
 */
export function serializeRichText(content: any): string {
  if (!content || !content.root) {
    return ''
  }

  try {
    const root = content.root
    return serializeNode(root)
  } catch (error) {
    console.error('Error serializing rich text:', error)
    return ''
  }
}

function serializeNode(node: any): string {
  if (!node) return ''

  const type = node.type
  const children = node.children || []

  switch (type) {
    case 'root':
      return children.map(serializeNode).join('')

    case 'paragraph':
      const paragraphContent = children.map(serializeNode).join('')
      return paragraphContent ? `<p>${paragraphContent}</p>` : ''

    case 'heading':
      const level = node.tag || 'h2'
      const headingContent = children.map(serializeNode).join('')
      return `<${level}>${headingContent}</${level}>`

    case 'text':
      let text = node.text || ''

      // Apply formatting
      if (node.format) {
        if (node.format & 1) text = `<strong>${text}</strong>` // Bold
        if (node.format & 2) text = `<em>${text}</em>` // Italic
        if (node.format & 4) text = `<s>${text}</s>` // Strikethrough
        if (node.format & 8) text = `<u>${text}</u>` // Underline
        if (node.format & 16) text = `<code>${text}</code>` // Code
      }

      return text

    case 'link':
      const url = node.fields?.url || node.url || '#'
      const linkContent = children.map(serializeNode).join('')
      return `<a href="${url}" class="link link-primary">${linkContent}</a>`

    case 'list':
      const listTag = node.listType === 'number' ? 'ol' : 'ul'
      const listContent = children.map(serializeNode).join('')
      return `<${listTag}>${listContent}</${listTag}>`

    case 'listitem':
      const itemContent = children.map(serializeNode).join('')
      return `<li>${itemContent}</li>`

    case 'quote':
      const quoteContent = children.map(serializeNode).join('')
      return `<blockquote class="border-l-4 border-primary pl-4 italic">${quoteContent}</blockquote>`

    case 'code':
      const codeContent = children.map(serializeNode).join('')
      return `<pre class="bg-base-200 p-4 rounded-lg overflow-x-auto"><code>${codeContent}</code></pre>`

    case 'linebreak':
      return '<br />'

    default:
      // For unknown types, try to render children
      return children.map(serializeNode).join('')
  }
}
