import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { INK } from '../data/content';
import { UserRound, MessageSquare, Send, Pencil, Trash2 } from 'lucide-react';
import ReportButton from './ReportButton';

// A quiet affordance: the control sits on the reader's own comment and
// carries no weight until it is hovered.
const rowActionStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 26,
  padding: 0,
  borderRadius: 7,
  border: '2px solid transparent',
  background: 'transparent',
  color: 'var(--muted, #6b675e)',
  cursor: 'pointer',
  fontFamily: 'inherit'
};

export default function CommentsSection({ workKey, chapterNum = 0, user, lang = 'bn', base = '', t = {} }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  // The comment being edited in place, and the text it currently holds.
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [rowBusy, setRowBusy] = useState(null);
  const [rowError, setRowError] = useState('');

  /** Only the reader who wrote a comment may change it from here. */
  const isMine = c => !!user && c.user_id === user.id;

  const loadComments = useCallback(async () => {
    if (!workKey) return;
    setLoading(true);
    const res = await api.getLibraryComments(workKey, chapterNum);
    if (res.ok) {
      setComments(res.data || []);
    }
    setLoading(false);
  }, [workKey, chapterNum]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setSubmitting(true);
    const res = await api.postLibraryComment(workKey, {
      content: content.trim(),
      chapter_num: chapterNum || 0
    });
    setSubmitting(false);

    if (res.ok && res.data) {
      setContent('');
      setComments(prev => [res.data, ...prev]);
    } else {
      setError(res.error || (lang === 'bn' ? 'আপনার মন্তব্যটি প্রকাশ করা যায়নি' : 'Your comment could not be posted. Please try again.'));
    }
  };

  const T = {
    edit: lang === 'bn' ? 'সম্পাদনা' : 'Edit',
    remove: lang === 'bn' ? 'মুছুন' : 'Delete',
    save: lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    confirm: lang === 'bn' ? 'এই মন্তব্যটি মুছে ফেলবেন?' : 'Delete this comment?',
    edited: lang === 'bn' ? 'সম্পাদিত' : 'edited',
    failed: lang === 'bn' ? 'কাজটি সম্পন্ন করা যায়নি; অনুগ্রহ করে আবার চেষ্টা করুন' : 'The action could not be completed. Please try again.'
  };

  const startEdit = (c) => {
    setRowError('');
    setEditingId(c.id);
    setEditText(c.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setRowError('');
  };

  const saveEdit = async (c) => {
    const next = editText.trim();
    if (!next || next === c.content) return cancelEdit();
    setRowBusy(c.id);
    setRowError('');
    const res = await api.updateLibraryComment(workKey, c.id, { content: next });
    setRowBusy(null);
    if (!res.ok) return setRowError(res.error || T.failed);
    // Merged from the response, so the row shows the server's own updated_at
    // rather than a guess made here.
    setComments(prev => prev.map(x => (x.id === c.id ? { ...x, ...res.data } : x)));
    cancelEdit();
  };

  const removeComment = async (c) => {
    if (!window.confirm(T.confirm)) return;
    setRowBusy(c.id);
    setRowError('');
    const res = await api.deleteLibraryComment(workKey, c.id);
    setRowBusy(null);
    if (!res.ok) return setRowError(res.error || T.failed);
    setComments(prev => prev.filter(x => x.id !== c.id));
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section
      aria-label="Comments"
      style={{
        marginTop: 48,
        paddingTop: 32,
        borderTop: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 24
      }}
    >
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
            fontSize: 'clamp(20px, 2.2vw, 26px)',
            fontWeight: 800,
            letterSpacing: '-.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <MessageSquare size={22} />
          {lang === 'bn' ? 'মন্তব্য' : 'Comments'}
          <span
            style={{
              fontSize: 14,
              padding: '2px 10px',
              borderRadius: 999,
              background: 'var(--card, var(--card, #fff))',
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              fontWeight: 800,
              boxShadow: `calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 ${INK}`
            }}
          >
            {comments.length}
          </span>
        </h3>
      </div>

      {/* Input box or Login Callout */}
      {user ? (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: 'var(--card, var(--card, #fff))',
            border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: `calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 ${INK}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--acc)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: 14
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{user.name}</span>
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'লেখাটা কেমন লাগল? লিখে জানান…'
                : 'What did you make of it?'
            }
            rows={3}
            maxLength={2000}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: 10,
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              fontSize: 14.5,
              fontFamily: 'inherit',
              lineHeight: 1.5,
              resize: 'vertical',
              outline: 'none',
              background: 'var(--card-2, #fdfbf7)'
            }}
          />

          {error && (
            <div style={{ color: '#b91c1c', fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--muted, #6b675e)' }}>
              {content.length}/2000
            </span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 10,
                border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                background: 'var(--ink-bg, #151515)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 13.5,
                cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
                opacity: submitting || !content.trim() ? 0.6 : 1,
                boxShadow: `calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 var(--acc)`,
                transition: 'transform 0.15s, opacity 0.15s'
              }}
            >
              <Send size={15} />
              {submitting
                ? (lang === 'bn' ? 'প্রকাশ করা হচ্ছে…' : 'Posting…')
                : (lang === 'bn' ? 'মন্তব্য করুন' : 'Post comment')}
            </button>
          </div>
        </form>
      ) : (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            background: '#fffdf8',
            border: `calc(2px * var(--bwk, 1)) dashed var(--edge, #151515)`,
            borderRadius: 16,
            padding: '18px 24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'var(--paper, var(--paper, #f4f1ea))',
                border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                display: 'grid',
                placeItems: 'center',
                color: INK
              }}
            >
              <UserRound size={20} />
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>
                {lang === 'bn' ? 'মন্তব্য করতে সাইন ইন করুন' : 'Sign in to comment'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted, #6b675e)' }}>
                {lang === 'bn'
                  ? 'সাইন ইন করলেই মন্তব্য করতে পারবেন — লেখক আর অন্য পাঠকেরা দেখতে পাবেন।'
                  : 'Sign in to comment — the writer and other readers will see it.'}
              </div>
            </div>
          </div>
          <a
            href={`${base}/account`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 18px',
              borderRadius: 10,
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              background: 'var(--ink-bg, #151515)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13.5,
              textDecoration: 'none',
              boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--acc)`
            }}
          >
            {lang === 'bn' ? 'সাইন ইন' : 'Sign in'}
          </a>
        </div>
      )}

      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <p style={{ color: 'var(--muted, #6b675e)', fontSize: 14, margin: 0 }}>
            {lang === 'bn' ? 'মন্তব্য লোড করা হচ্ছে…' : 'Loading comments…'}
          </p>
        ) : comments.length === 0 ? (
          <div
            style={{
              padding: '24px 20px',
              borderRadius: 14,
              background: 'var(--card-2, #f9f7f1)',
              border: '2px solid #e5e0d3',
              textAlign: 'center',
              color: 'var(--muted, #6b675e)',
              fontSize: 14
            }}
          >
            {lang === 'bn'
              ? 'এখনো কেউ কিছু লেখেননি। প্রথম মন্তব্যটা আপনার হোক।'
              : 'No comments yet. Be the first.'}
          </div>
        ) : (
          comments.map(c => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                background: 'var(--card, var(--card, #fff))',
                border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                borderRadius: 14,
                padding: '16px 18px',
                boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 #ded8ca`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--acc)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: 12
                    }}
                  >
                    {(c.user_name || 'R').charAt(0).toUpperCase()}
                  </span>
                  <strong style={{ fontSize: 14.5 }}>{c.user_name || 'Reader'}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#8c8577' }}>
                    {formatDate(c.created_at)}
                    {c.updated_at && c.updated_at !== c.created_at ? ` · ${T.edited}` : ''}
                  </span>
                  {isMine(c) && editingId !== c.id && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        disabled={rowBusy === c.id}
                        title={T.edit}
                        aria-label={T.edit}
                        style={rowActionStyle}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeComment(c)}
                        disabled={rowBusy === c.id}
                        title={T.remove}
                        aria-label={T.remove}
                        style={rowActionStyle}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  {!isMine(c) && (
                    <ReportButton targetType="comment" targetId={c.id} user={user} t={t} base={base} compact />
                  )}
                </div>
              </div>
              {editingId === c.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 38 }}>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    autoFocus
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                      fontSize: 14.5,
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                      resize: 'vertical',
                      outline: 'none',
                      background: 'var(--card-2, #fdfbf7)'
                    }}
                  />
                  {rowError && <span style={{ color: '#b91c1c', fontSize: 12.5, fontWeight: 700 }}>{rowError}</span>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => saveEdit(c)}
                      disabled={rowBusy === c.id || !editText.trim()}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 9,
                        border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                        background: 'var(--ink-bg, #151515)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        cursor: rowBusy === c.id || !editText.trim() ? 'not-allowed' : 'pointer',
                        opacity: rowBusy === c.id || !editText.trim() ? 0.6 : 1
                      }}
                    >{T.save}</button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 9,
                        border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                        background: 'var(--card, var(--card, #fff))',
                        color: INK,
                        fontWeight: 800,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        cursor: 'pointer'
                      }}
                    >{T.cancel}</button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14.5,
                      lineHeight: 1.6,
                      color: '#2a2824',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      paddingLeft: 38
                    }}
                  >
                    {c.content}
                  </p>
                  {rowError && editingId === null && (
                    <span style={{ paddingLeft: 38, color: '#b91c1c', fontSize: 12.5, fontWeight: 700 }}>{rowError}</span>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
