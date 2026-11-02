import React from 'react';
import { INK } from '../data/content';
import { api } from '../services/api';

// ---------------------------------------------------------------------------
// Renders an editor document as React elements.
//
// The server hands us sanitized JSON, never HTML, and this walks it into real
// elements — so the client still contains no dangerouslySetInnerHTML and a
// author's prose can never become markup.
//
// Every top-level block carries data-par={index}. Narration highlights by that
// index, and the indices line up with the server's paragraphs() helper.
// ---------------------------------------------------------------------------

const BLOCK_GAP = '1.1em';

export function RichTextStyles() {
  return (
    <style>{`
      .rt { font-size: clamp(17px, 1.15vw, 19px); line-height: 1.85; color: ${INK}; }
      .rt > * { margin: 0 0 ${BLOCK_GAP}; }
      .rt > *:last-child { margin-bottom: 0; }
      .rt h2 { font-family: Sora, system-ui, sans-serif; font-size: clamp(22px, 2vw, 28px); line-height: 1.3; margin-top: 1.8em; font-weight: 800; }
      .rt h3 { font-family: Sora, system-ui, sans-serif; font-size: clamp(18px, 1.5vw, 21px); line-height: 1.35; margin-top: 1.5em; font-weight: 800; }
      .rt h2:first-child, .rt h3:first-child { margin-top: 0; }
      .rt a { color: ${INK}; text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 2px; text-decoration-color: var(--acc, #6f6758); }
      .rt blockquote { border-left: 4px solid var(--acc, #6f6758); padding: 2px 0 2px 18px; font-style: italic; color: #3c3a35; }
      .rt ul, .rt ol { padding-left: 1.4em; }
      .rt li { margin-bottom: 0.4em; }
      .rt hr { border: 0; border-top: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); opacity: 0.25; margin: 2em 0; }
      .rt u { text-decoration: underline; text-underline-offset: 3px; }
      .rt mark { background: color-mix(in srgb, var(--acc, #6f6758) 26%, transparent); color: inherit; padding: 0 2px; border-radius: 2px; }
      .rt figure { margin: 1.8em 0; }
      .rt figure img { width: 100%; height: auto; display: block; border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); border-radius: 10px; }
      .rt figcaption { font-size: 14px; color: #6b675e; margin-top: 8px; }
      /* The paragraph currently being read aloud. */
      .rt [data-par].rt-reading { background: color-mix(in srgb, var(--acc, #6f6758) 16%, transparent); box-shadow: -10px 0 0 color-mix(in srgb, var(--acc, #6f6758) 16%, transparent), 10px 0 0 color-mix(in srgb, var(--acc, #6f6758) 16%, transparent); border-radius: 2px; }
      @media (prefers-reduced-motion: no-preference) { .rt [data-par] { transition: background 220ms ease; } }
    `}</style>
  );
}

function Marked({ node }) {
  let out = node.text;
  for (const mark of node.marks || []) {
    if (mark.type === 'bold') out = <strong>{out}</strong>;
    else if (mark.type === 'italic') out = <em>{out}</em>;
    else if (mark.type === 'underline') out = <u>{out}</u>;
    else if (mark.type === 'strike') out = <s>{out}</s>;
    else if (mark.type === 'highlight') out = <mark>{out}</mark>;
    else if (mark.type === 'link') {
      // The server already enforced the scheme allowlist; rel/target here keep
      // a author's outbound link from carrying referrer or opener.
      out = (
        <a href={mark.attrs?.href} target="_blank" rel="nofollow ugc noopener noreferrer">{out}</a>
      );
    }
  }
  return <>{out}</>;
}

function children(node) {
  return (node.content || []).map((child, i) => (
    <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
  ));
}

/** Node → React element. A plain function so callers can clone the result. */
function renderNode(node) {
  if (!node) return null;
  switch (node.type) {
    case 'text':
      return <Marked node={node} />;
    case 'hardBreak':
      return <br />;
    case 'paragraph': {
      const align = node.attrs?.textAlign;
      return <p style={align && align !== 'left' ? { textAlign: align } : undefined}>{children(node)}</p>;
    }
    case 'heading':
      return node.attrs?.level === 3 ? <h3>{children(node)}</h3> : <h2>{children(node)}</h2>;
    case 'blockquote':
      return <blockquote>{children(node)}</blockquote>;
    case 'bulletList':
      return <ul>{children(node)}</ul>;
    case 'orderedList':
      return <ol start={node.attrs?.start > 1 ? node.attrs.start : undefined}>{children(node)}</ol>;
    case 'listItem':
      return <li>{children(node)}</li>;
    case 'horizontalRule':
      return <hr />;
    case 'image': {
      const src = api.libraryImageUrl(node.attrs?.imageId);
      if (!src) return null;
      return (
        <figure>
          <img src={src} alt={node.attrs?.alt || ''} loading="lazy" />
          {node.attrs?.alt ? <figcaption>{node.attrs.alt}</figcaption> : null}
        </figure>
      );
    }
    default:
      return <>{children(node)}</>;
  }
}

/**
 * @param doc       sanitized editor document from the API
 * @param reading   index of the paragraph being narrated, or -1
 */
export default function RichText({ doc, reading = -1, className = '' }) {
  if (!doc || !Array.isArray(doc.content) || !doc.content.length) return null;
  return (
    <div className={`rt ${className}`.trim()}>
      {doc.content.map((block, i) => (
        <Block key={i} node={block} index={i} highlighted={i === reading} />
      ))}
    </div>
  );
}

/**
 * A top-level block, tagged with its index.
 *
 * renderNode() is called directly rather than rendering <Node/> and cloning it:
 * cloning a component element would attach data-par to the component's props,
 * where it never reaches the DOM — and the narration highlight reads it off
 * the DOM.
 */
function Block({ node, index, highlighted }) {
  const rendered = renderNode(node);
  if (!React.isValidElement(rendered)) return rendered;
  return React.cloneElement(rendered, {
    'data-par': index,
    className: [rendered.props.className, highlighted ? 'rt-reading' : ''].filter(Boolean).join(' ') || undefined
  });
}
