export interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  format?: number | string
  tag?: string
  listType?: string
  fields?: { url?: string }
  url?: string
  direction?: 'ltr' | 'rtl' | null
  indent?: number
  version?: number
  [key: string]: unknown
}

export interface LexicalContent {
  root?: LexicalNode
  [key: string]: unknown
}

/**
 * Serialize Payload's Lexical rich text to HTML
 */
export function serializeRichText(content: LexicalContent): string {
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

function serializeNode(node: LexicalNode): string {
  if (!node) return ''

  const type = node.type
  const children = node.children || []

  // Determine direction - default to RTL for this Persian/Dari app
  const isLtr = node.direction === 'ltr'
  const dirAttr = isLtr ? ' dir="ltr"' : ' dir="rtl"'
  const textAlign = isLtr ? 'text-left' : 'text-right'

  switch (type) {
    case 'root':
      return children.map(serializeNode).join('')

    case 'paragraph':
      const paragraphContent = children.map(serializeNode).join('')
      return paragraphContent ? `<p class="${textAlign}"${dirAttr}>${paragraphContent}</p>` : ''

    case 'heading':
      const level = node.tag || 'h2'
      const headingContent = children.map(serializeNode).join('')
      return `<${level} class="${textAlign}"${dirAttr}>${headingContent}</${level}>`

    case 'text':
      let text = node.text || ''

      // Apply formatting
      if (node.format && typeof node.format === 'number') {
        if (node.format & 1) text = `<strong>${text}</strong>` // Bold
        if (node.format & 2) text = `<em>${text}</em>` // Italic
        if (node.format & 4) text = `<s>${text}</s>` // Strikethrough
        if (node.format & 8) text = `<u>${text}</u>` // Underline
        if (node.format & 16) text = `<code class="bg-base-200 px-1 rounded">${text}</code>` // Code
      }

      return text

    case 'link':
      const url = node.fields?.url || node.url || '#'
      const linkContent = children.map(serializeNode).join('')
      return `<a href="${url}" class="link link-primary" target="_blank" rel="noopener noreferrer">${linkContent}</a>`

    case 'list':
      const listTag = node.listType === 'number' ? 'ol' : 'ul'
      const listContent = children.map(serializeNode).join('')
      const listClass = isLtr ? 'list-inside text-left' : 'list-inside text-right'
      return `<${listTag} class="${listClass}"${dirAttr}>${listContent}</${listTag}>`

    case 'listitem':
      const itemContent = children.map(serializeNode).join('')
      return `<li class="${textAlign}"${dirAttr}>${itemContent}</li>`

    case 'quote':
      const quoteContent = children.map(serializeNode).join('')
      // For RTL, use border-r instead of border-l
      const quoteClass = isLtr
        ? 'border-l-4 border-primary pl-4 italic text-left my-4'
        : 'border-r-4 border-primary pr-4 italic text-right my-4'
      return `<blockquote class="${quoteClass}"${dirAttr}>${quoteContent}</blockquote>`

    case 'code':
      const codeContent = children.map(serializeNode).join('')
      return `<pre class="bg-base-200 p-4 rounded-lg overflow-x-auto my-4" dir="ltr"><code>${codeContent}</code></pre>`

    case 'linebreak':
      return '<br />'

    default:
      // For unknown types, try to render children
      return children.map(serializeNode).join('')
  }
}

/**
 * Convert plain text to Lexical JSON format
 * Each line becomes a paragraph
 */
export function textToLexical(text: string): LexicalContent {
  if (!text || typeof text !== 'string') {
    return {
      root: {
        type: 'root',
        children: [],
        direction: 'rtl',
        format: '',
        indent: 0,
        version: 1,
      },
    }
  }

  // Split by newlines and create paragraphs
  const lines = text.split('\n')
  const children: LexicalNode[] = lines.map((line) => ({
    type: 'paragraph',
    children: line.trim()
      ? [
          {
            type: 'text',
            text: line,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ]
      : [],
    direction: 'rtl' as const,
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }))

  return {
    root: {
      type: 'root',
      children,
      direction: 'rtl',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

/**
 * Convert Lexical JSON to plain text
 * Useful for editing rich text as plain text
 */
export function lexicalToText(content: LexicalContent): string {
  if (!content || !content.root) {
    return ''
  }

  const extractText = (node: LexicalNode): string => {
    if (node.type === 'text') {
      return node.text || ''
    }

    if (node.children && Array.isArray(node.children)) {
      const childTexts = node.children.map(extractText)
      // Add newline between paragraphs
      if (node.type === 'paragraph') {
        return childTexts.join('')
      }
      return childTexts.join('\n')
    }

    return ''
  }

  const root = content.root
  if (root.children && Array.isArray(root.children)) {
    return root.children.map(extractText).join('\n')
  }

  return ''
}

/**
 * Convert Lexical JSON to HTML for editing in rich text editor
 */
export function lexicalToHtml(content: LexicalContent): string {
  return serializeRichText(content)
}

/**
 * Convert HTML (from Quill editor) to Lexical JSON format
 * This is a simplified parser that handles common HTML elements
 */
export function htmlToLexical(html: string): LexicalContent {
  if (!html || typeof html !== 'string' || html.trim() === '' || html === '<p><br></p>') {
    return {
      root: {
        type: 'root',
        children: [],
        direction: 'rtl',
        format: '',
        indent: 0,
        version: 1,
      },
    }
  }

  // Parse HTML string
  const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null
  if (!parser) {
    // Fallback for SSR - treat as plain text
    return textToLexical(html.replace(/<[^>]*>/g, ''))
  }

  const doc = parser.parseFromString(html, 'text/html')
  const body = doc.body

  const children: LexicalNode[] = []

  // Process each child node
  const processNode = (node: Node): LexicalNode | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (!text.trim()) return null
      return {
        type: 'text',
        text,
        format: 0,
        detail: 0,
        mode: 'normal',
        style: '',
        version: 1,
      }
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null

    const element = node as HTMLElement
    const tagName = element.tagName.toLowerCase()

    // Process text formatting
    const processInlineContent = (el: HTMLElement): LexicalNode[] => {
      const nodes: LexicalNode[] = []

      el.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || ''
          if (text) {
            nodes.push({
              type: 'text',
              text,
              format: 0,
              detail: 0,
              mode: 'normal',
              style: '',
              version: 1,
            })
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const childEl = child as HTMLElement
          const childTag = childEl.tagName.toLowerCase()

          // Get text content and determine format
          const innerNodes = processInlineContent(childEl)

          innerNodes.forEach((innerNode) => {
            if (innerNode.type === 'text') {
              let format = (innerNode.format as number) || 0
              if (childTag === 'strong' || childTag === 'b') format |= 1
              if (childTag === 'em' || childTag === 'i') format |= 2
              if (childTag === 's' || childTag === 'strike' || childTag === 'del') format |= 4
              if (childTag === 'u') format |= 8
              if (childTag === 'code') format |= 16
              innerNode.format = format
            }
            nodes.push(innerNode)
          })

          // Handle links
          if (childTag === 'a') {
            const href = childEl.getAttribute('href') || '#'
            const linkText = childEl.textContent || ''
            nodes.push({
              type: 'link',
              children: [
                {
                  type: 'text',
                  text: linkText,
                  format: 0,
                  detail: 0,
                  mode: 'normal',
                  style: '',
                  version: 1,
                },
              ],
              fields: { url: href },
              direction: 'rtl',
              format: '',
              indent: 0,
              version: 1,
            })
          }
        }
      })

      return nodes
    }

    // Handle different elements
    switch (tagName) {
      case 'p': {
        const inlineChildren = processInlineContent(element)
        return {
          type: 'paragraph',
          children: inlineChildren.length > 0 ? inlineChildren : [],
          direction: 'rtl',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1,
        }
      }

      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const inlineChildren = processInlineContent(element)
        return {
          type: 'heading',
          tag: tagName,
          children: inlineChildren,
          direction: 'rtl',
          format: '',
          indent: 0,
          version: 1,
        }
      }

      case 'ul':
      case 'ol': {
        const listItems: LexicalNode[] = []
        element.querySelectorAll(':scope > li').forEach((li) => {
          const liChildren = processInlineContent(li as HTMLElement)
          listItems.push({
            type: 'listitem',
            children: liChildren,
            direction: 'rtl',
            format: '',
            indent: 0,
            value: 1,
            version: 1,
          })
        })
        return {
          type: 'list',
          listType: tagName === 'ol' ? 'number' : 'bullet',
          children: listItems,
          direction: 'rtl',
          format: '',
          indent: 0,
          start: 1,
          tag: tagName,
          version: 1,
        }
      }

      case 'blockquote': {
        const quoteChildren = processInlineContent(element)
        return {
          type: 'quote',
          children: quoteChildren,
          direction: 'rtl',
          format: '',
          indent: 0,
          version: 1,
        }
      }

      case 'br': {
        return {
          type: 'linebreak',
          version: 1,
        }
      }

      default: {
        // For unknown elements, try to extract as paragraph
        const inlineChildren = processInlineContent(element)
        if (inlineChildren.length > 0) {
          return {
            type: 'paragraph',
            children: inlineChildren,
            direction: 'rtl',
            format: '',
            indent: 0,
            textFormat: 0,
            version: 1,
          }
        }
        return null
      }
    }
  }

  // Process all child nodes of body
  body.childNodes.forEach((node) => {
    const processed = processNode(node)
    if (processed) {
      children.push(processed)
    }
  })

  // If no children were processed, create an empty paragraph
  if (children.length === 0) {
    children.push({
      type: 'paragraph',
      children: [],
      direction: 'rtl',
      format: '',
      indent: 0,
      textFormat: 0,
      version: 1,
    })
  }

  return {
    root: {
      type: 'root',
      children,
      direction: 'rtl',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
