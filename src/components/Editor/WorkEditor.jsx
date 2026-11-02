import React, { useCallback, useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Extension, Mark, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  Quote, List, ListOrdered, Minus, AlignLeft, AlignCenter, AlignRight,
  Link2, Link2Off, ImagePlus, Captions, RemoveFormatting, Undo2, Redo2
} from 'lucide-react';
import { INK } from '../../data/content';

const MUTED = 'var(--muted, #6b675e)';
// The chrome around the writing surface. One tone, matching the cream the
// site's form fields use, rather than three near-identical off-whites.
const CHROME = '#f9f7f1';
const CHROME_LINE = '#e2ddd0';
import { api } from '../../services/api';

// ---------------------------------------------------------------------------
// The work surface.
//
// Loaded lazily — Tiptap is far too large to sit in the bundle every reader
// downloads. The node set is trimmed to exactly what the server's allowlist
// accepts, so a author cannot compose something that will be stripped on save.
// ---------------------------------------------------------------------------

/**
 * Images are stored by id, never by URL. The editor resolves the id to our own
 * access-checked route for display, and serialises only the id back out — the
 * same contract the server enforces.
 */
const LibraryImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      imageId: { default: null },
      alt: { default: null }
    };
  },
  parseHTML() {
    return [{ tag: 'img[data-image-id]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const id = HTMLAttributes.imageId;
    return ['img', mergeAttributes({
      'data-image-id': id,
      src: api.libraryImageUrl(id),
      alt: HTMLAttributes.alt || ''
    })];
  }
});

/**
 * Highlight. A flag with no colour attribute on purpose: the server's mark
 * allowlist stores the mark alone, so a writer cannot inject a style value.
 */
const Highlight = Mark.create({
  name: 'highlight',
  parseHTML() {
    return [{ tag: 'mark' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      toggleHighlight: () => ({ commands }) => commands.toggleMark(this.name)
    };
  }
});

/**
 * Paragraph alignment. The server allows textAlign on `paragraph` only, and
 * only left/center/right — so this extension offers exactly that and nothing
 * more, rather than letting a writer set an alignment the save would strip.
 */
const TextAlign = Extension.create({
  name: 'textAlign',
  addGlobalAttributes() {
    return [{
      types: ['paragraph'],
      attributes: {
        textAlign: {
          default: null,
          parseHTML: el => el.style.textAlign || null,
          renderHTML: attrs => (attrs.textAlign && attrs.textAlign !== 'left'
            ? { style: `text-align: ${attrs.textAlign}` }
            : {})
        }
      }
    }];
  },
  addCommands() {
    return {
      setTextAlign: alignment => ({ commands }) =>
        ['left', 'center', 'right'].includes(alignment) &&
        commands.updateAttributes('paragraph', { textAlign: alignment })
    };
  }
});

// id, label key, run, active test, mark, and an optional English fallback for
// the tooltip so a missing translation never leaves a button unlabelled.
const TOOL_GROUPS = [
  [
    ['bold', 'editorBold', e => e.chain().focus().toggleBold().run(), e => e.isActive('bold'), Bold, 'Bold'],
    ['italic', 'editorItalic', e => e.chain().focus().toggleItalic().run(), e => e.isActive('italic'), Italic, 'Italic'],
    ['underline', 'editorUnderline', e => e.chain().focus().toggleUnderline().run(), e => e.isActive('underline'), UnderlineIcon, 'Underline'],
    ['strike', 'editorStrike', e => e.chain().focus().toggleStrike().run(), e => e.isActive('strike'), Strikethrough, 'Strikethrough'],
    ['highlight', 'editorHighlight', e => e.chain().focus().toggleHighlight().run(), e => e.isActive('highlight'), Highlighter, 'Highlight']
  ],
  [
    ['h2', 'editorH2', e => e.chain().focus().toggleHeading({ level: 2 }).run(), e => e.isActive('heading', { level: 2 }), 'H2', 'Heading'],
    ['h3', 'editorH3', e => e.chain().focus().toggleHeading({ level: 3 }).run(), e => e.isActive('heading', { level: 3 }), 'H3', 'Subheading']
  ],
  [
    ['quote', 'editorQuote', e => e.chain().focus().toggleBlockquote().run(), e => e.isActive('blockquote'), Quote, 'Quote'],
    ['bullet', 'editorBullet', e => e.chain().focus().toggleBulletList().run(), e => e.isActive('bulletList'), List, 'Bulleted list'],
    ['ordered', 'editorNumbered', e => e.chain().focus().toggleOrderedList().run(), e => e.isActive('orderedList'), ListOrdered, 'Numbered list'],
    ['rule', 'editorRule', e => e.chain().focus().setHorizontalRule().run(), () => false, Minus, 'Divider']
  ],
  [
    ['alignLeft', 'editorAlignLeft', e => e.chain().focus().setTextAlign('left').run(), e => e.isActive({ textAlign: 'left' }) || (e.isActive('paragraph') && !e.getAttributes('paragraph').textAlign), AlignLeft, 'Align left'],
    ['alignCenter', 'editorAlignCenter', e => e.chain().focus().setTextAlign('center').run(), e => e.isActive({ textAlign: 'center' }), AlignCenter, 'Align centre'],
    ['alignRight', 'editorAlignRight', e => e.chain().focus().setTextAlign('right').run(), e => e.isActive({ textAlign: 'right' }), AlignRight, 'Align right']
  ]
];

export default function WorkEditor({ value, onChange, onDirty, workKey, docKey, t, placeholder }) {
  const fileRef = useRef(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // The server's allowlist has no code or code block; keeping them out of
        // the editor means an author never loses work to the sanitizer.
        code: false,
        codeBlock: false,
        // StarterKit ships its own Link; ours is configured below, and having
        // both registers the mark twice.
        link: false
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: { rel: 'nofollow ugc noopener noreferrer', target: '_blank' }
      }),
      Underline,
      Highlight,
      TextAlign,
      Placeholder.configure({ placeholder: placeholder || t.editorPlaceholder }),
      LibraryImage
    ],
    content: value || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor: e }) => {
      onDirty?.(true);
      changeRef.current?.(e.getJSON());
    }
  });

  // Replace the document only when the editor is showing a different piece or
  // chapter (docKey) —
  // resetting on every keystroke would fight the author for the caret.
  // `editor` is null on the first render and destroyed on unmount, so both
  // ends are guarded.
  useEffect(() => {
    if (!editor || editor.isDestroyed || !value) return;
    const current = JSON.stringify(editor.getJSON());
    if (current !== JSON.stringify(value)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, workKey, docKey]);

  /** A tool's tooltip: the translation when there is one, else the English fallback. */
  const label = (key, fallback) => t[key] || fallback;

  const removeLink = useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

  /** Alt text is what a screen reader announces, so it is editable, not fixed at upload. */
  const editAlt = useCallback(() => {
    if (!editor || !editor.isActive('image')) return;
    const current = editor.getAttributes('image').alt || '';
    const next = window.prompt(label('editorImageAlt', 'Describe this image for screen readers'), current);
    if (next === null) return;
    editor.chain().focus().updateAttributes('image', { alt: next.trim().slice(0, 255) }).run();
  }, [editor, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const addLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href || 'https://';
    const url = window.prompt(t.editorLinkUrl, previous);
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (!/^(https?:|mailto:)/i.test(url.trim())) {
      window.alert(t.editorLinkUrl);
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }, [editor, t]);

  const addImage = useCallback(async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !editor) return;
    const res = await api.uploadLibraryImage(file, { purpose: 'inline', workKey });
    if (!res.ok) {
      window.alert(res.error || t.deskImageHint);
      return;
    }
    editor.chain().focus().insertContent({ type: 'image', attrs: { imageId: res.data.id, alt: '' } }).run();
  }, [editor, workKey, t]);

  if (!editor) return <div style={{ padding: 20, color: MUTED }}>…</div>;

  return (
    <div style={{ border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 14, background: 'var(--card, var(--card, #fff))', overflow: 'hidden' }}>
      <style>{`
        .we .ProseMirror { min-height: 340px; padding: 20px; outline: none; font-size: 17px; line-height: 1.8; color: ${INK}; }
        .we .ProseMirror p { margin: 0 0 1em; }
        .we .ProseMirror h2 { font-family: Sora, system-ui, sans-serif; font-size: 25px; font-weight: 800; margin: 1.4em 0 .5em; }
        .we .ProseMirror h3 { font-family: Sora, system-ui, sans-serif; font-size: 20px; font-weight: 800; margin: 1.3em 0 .5em; }
        .we .ProseMirror blockquote { border-left: 4px solid var(--acc, #6f6758); padding-left: 16px; font-style: italic; color: #3c3a35; }
        .we .ProseMirror hr { border: 0; border-top: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); opacity: .25; margin: 1.6em 0; }
        .we .ProseMirror img { max-width: 100%; height: auto; border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); border-radius: 10px; }
        .we .ProseMirror img.ProseMirror-selectednode { outline: 3px solid var(--acc, #6f6758); }
        .we .ProseMirror a { color: ${INK}; text-decoration: underline; text-decoration-color: var(--acc, #6f6758); }
        .we .ProseMirror mark { background: color-mix(in srgb, var(--acc, #6f6758) 26%, transparent); color: inherit; padding: 0 2px; border-radius: 2px; }
        .we .ProseMirror ul, .we .ProseMirror ol { padding-left: 1.4em; }
        .we .ProseMirror li { margin-bottom: .3em; }
        .we .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; height: 0; pointer-events: none; color: #a09a8e; }
        .we-tool:hover:not(:disabled) { background: #e8e3d6 !important; transform: none; }
        .we-tool:focus-visible { outline: none; border-color: var(--acc, #6f6758) !important; }
        .we-tool[aria-pressed="true"]:hover { background: #2e2e2e !important; }
        .we-tool:disabled { opacity: .35; cursor: default; }
      `}</style>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, padding: '9px 10px',
        borderBottom: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, background: CHROME, alignItems: 'center'
      }}>
        {TOOL_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <span style={{ width: 1, alignSelf: 'stretch', background: CHROME_LINE, margin: '2px 4px' }} />}
            {group.map(([id, labelKey, run, active, glyph, fallback]) => (
              <button
                key={id}
                type="button"
                className="we-tool"
                title={label(labelKey, fallback)}
                aria-label={label(labelKey, fallback)}
                aria-pressed={active(editor)}
                onClick={() => run(editor)}
                style={toolStyle(active(editor))}
              ><Glyph of={glyph} /></button>
            ))}
          </React.Fragment>
        ))}

        <span style={{ width: 1, alignSelf: 'stretch', background: '#d6d0c2', margin: '2px 4px' }} />
        <button
          type="button"
          className="we-tool"
          title={label('editorLink', 'Add link')}
          aria-label={label('editorLink', 'Add link')}
          aria-pressed={editor.isActive('link')}
          onClick={addLink}
          style={toolStyle(editor.isActive('link'))}
        ><Link2 size={16} /></button>
        {/* Offered only on an actual link, so the row does not carry a control
            that would do nothing where the caret happens to be. */}
        {editor.isActive('link') && (
          <button
            type="button"
            className="we-tool"
            title={label('editorUnlink', 'Remove link')}
            aria-label={label('editorUnlink', 'Remove link')}
            onClick={removeLink}
            style={toolStyle(false)}
          ><Link2Off size={16} /></button>
        )}
        <button
          type="button"
          className="we-tool"
          title={label('editorImage', 'Insert image')}
          aria-label={label('editorImage', 'Insert image')}
          onClick={() => fileRef.current?.click()}
          style={toolStyle(false)}
        ><ImagePlus size={16} /></button>
        {editor.isActive('image') && (
          <button
            type="button"
            className="we-tool"
            title={label('editorImageAltBtn', 'Describe image')}
            aria-label={label('editorImageAltBtn', 'Describe image')}
            onClick={editAlt}
            style={toolStyle(false)}
          ><Captions size={16} /></button>
        )}
        <button
          type="button"
          className="we-tool"
          title={label('editorClearFormat', 'Clear formatting')}
          aria-label={label('editorClearFormat', 'Clear formatting')}
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          style={toolStyle(false)}
        ><RemoveFormatting size={16} /></button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={addImage} />

        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" className="we-tool" title={label('editorUndo', 'Undo')} aria-label={label('editorUndo', 'Undo')} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} style={toolStyle(false)}><Undo2 size={16} /></button>
          <button type="button" className="we-tool" title={label('editorRedo', 'Redo')} aria-label={label('editorRedo', 'Redo')} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} style={toolStyle(false)}><Redo2 size={16} /></button>
        </span>
      </div>

      <div className="we"><EditorContent editor={editor} /></div>

      <div style={{
        padding: '8px 14px', borderTop: `2px solid ${CHROME_LINE}`, background: CHROME,
        fontSize: 12.5, color: MUTED, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap'
      }}>
        <span>{t.editorPoetryHint}</span>
        <span>{(t.deskWordCount || '{n} words · {m} min')
          .replace('{n}', countWords(editor.getText()))
          .replace('{m}', Math.max(1, Math.round(countWords(editor.getText()) / 200)))}</span>
      </div>
    </div>
  );
}

// Unicode-aware, matching the server: a \w-based count returns zero for Bangla.
function countWords(text) {
  const m = String(text || '').match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’-]*/gu);
  return m ? m.length : 0;
}

// A tool reads as a box only once it is doing something. Giving all thirteen a
// permanent border made the toolbar compete with the prose underneath it, and
// left an active tool no way to stand out.
function toolStyle(active) {
  return {
    minWidth: 30, height: 30, padding: '0 7px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid transparent', borderRadius: 8,
    background: active ? 'var(--ink-bg, #151515)' : 'transparent', color: active ? '#fff' : INK,
    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1,
    transition: 'background 0.12s ease, border-color 0.12s ease'
  };
}

/** A tool's mark: a letterform where that is the convention (H2), else an icon. */
function Glyph({ of: Mark }) {
  return typeof Mark === 'string' ? <>{Mark}</> : <Mark size={16} />;
}
