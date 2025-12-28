'use client'

import React, { useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  RemoveFormatting,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'متن خود را وارد کنید...',
  className = '',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'right',
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[150px] p-4 text-right',
        dir: 'rtl',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
  })

  // Sync external value changes to editor
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('آدرس لینک را وارد کنید:', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty - remove link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return (
      <div className="h-48 bg-base-200 rounded-lg animate-pulse flex items-center justify-center">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    )
  }

  return (
    <div
      className={`rich-text-editor border border-base-300 rounded-lg overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-1 p-2 bg-base-200 border-b border-base-300"
        dir="ltr"
      >
        {/* History */}
        <div className="flex items-center gap-0.5 pl-2 border-l border-base-300">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="btn btn-ghost btn-xs btn-square"
            title="بازگشت (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="btn btn-ghost btn-xs btn-square"
            title="تکرار (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 px-2 border-l border-base-300">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive('heading', { level: 1 }) ? 'btn-active' : ''}`}
            title="سرتیتر ۱"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive('heading', { level: 2 }) ? 'btn-active' : ''}`}
            title="سرتیتر ۲"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive('heading', { level: 3 }) ? 'btn-active' : ''}`}
            title="سرتیتر ۳"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Text formatting */}
        <div className="flex items-center gap-0.5 px-2 border-l border-base-300">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive('bold') ? 'btn-active' : ''}`}
            title="پررنگ (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive('italic') ? 'btn-active' : ''}`}
            title="کج (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive('underline') ? 'btn-active' : ''}`}
            title="زیرخط (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive('strike') ? 'btn-active' : ''}`}
            title="خط‌خورده"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Text alignment */}
        <div className="flex items-center gap-0.5 px-2 border-l border-base-300">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive({ textAlign: 'right' }) ? 'btn-active' : ''}`}
            title="راست‌چین"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive({ textAlign: 'center' }) ? 'btn-active' : ''}`}
            title="وسط‌چین"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive({ textAlign: 'left' }) ? 'btn-active' : ''}`}
            title="چپ‌چین"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 px-2 border-l border-base-300">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive('bulletList') ? 'btn-active' : ''}`}
            title="لیست نقطه‌ای"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive('orderedList') ? 'btn-active' : ''}`}
            title="لیست شماره‌دار"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Link */}
        <div className="flex items-center gap-0.5 px-2 border-l border-base-300">
          <button
            type="button"
            onClick={setLink}
            className={`btn btn-ghost btn-xs btn-square ${editor.isActive('link') ? 'btn-active' : ''}`}
            title="افزودن لینک"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="btn btn-ghost btn-xs btn-square"
              title="حذف لینک"
            >
              <Unlink className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Clear formatting */}
        <div className="flex items-center gap-0.5 px-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            className="btn btn-ghost btn-xs btn-square"
            title="حذف قالب‌بندی"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-base-100" />

      {/* Styles */}
      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          min-height: 150px;
          direction: rtl;
          text-align: right;
        }

        .rich-text-editor .ProseMirror:focus {
          outline: none;
        }

        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: right;
          color: oklch(var(--bc) / 0.4);
          pointer-events: none;
          height: 0;
        }

        .rich-text-editor .ProseMirror h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 2.25rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .rich-text-editor .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 2rem;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .rich-text-editor .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.75rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .rich-text-editor .ProseMirror p {
          margin-bottom: 0.75rem;
        }

        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          padding-right: 1.5rem;
          padding-left: 0;
          margin-bottom: 0.75rem;
        }

        .rich-text-editor .ProseMirror li {
          margin-bottom: 0.25rem;
        }

        .rich-text-editor .ProseMirror ul {
          list-style-type: disc;
        }

        .rich-text-editor .ProseMirror ol {
          list-style-type: decimal;
        }

        .rich-text-editor .ProseMirror a {
          color: oklch(var(--p));
          text-decoration: underline;
          cursor: pointer;
        }

        .rich-text-editor .ProseMirror a:hover {
          opacity: 0.8;
        }

        .rich-text-editor .ProseMirror blockquote {
          border-right: 4px solid oklch(var(--bc) / 0.2);
          padding-right: 1rem;
          margin-right: 0;
          margin-left: 0;
          font-style: italic;
          color: oklch(var(--bc) / 0.7);
        }

        .rich-text-editor .ProseMirror hr {
          border: none;
          border-top: 1px solid oklch(var(--bc) / 0.2);
          margin: 1.5rem 0;
        }

        .rich-text-editor .ProseMirror code {
          background: oklch(var(--b2));
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: ui-monospace, monospace;
        }

        .rich-text-editor .ProseMirror pre {
          background: oklch(var(--b2));
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 0.75rem;
        }

        .rich-text-editor .ProseMirror pre code {
          background: none;
          padding: 0;
        }

        /* Text alignment classes */
        .rich-text-editor .ProseMirror [style*='text-align: right'] {
          text-align: right;
        }

        .rich-text-editor .ProseMirror [style*='text-align: center'] {
          text-align: center;
        }

        .rich-text-editor .ProseMirror [style*='text-align: left'] {
          text-align: left;
        }
      `}</style>
    </div>
  )
}
