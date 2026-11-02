// Inline icons sized to the surrounding text (replaces emoji / glyph icons).
import React from 'react';
import {
  Star, Play, ArrowRight, ArrowLeft, X, Check, ArrowUpRight, Maximize2,
  RotateCw, Mail, LoaderCircle, TriangleAlert, BookOpen, Flag,
  Search, Bell, Share2, Link, Rss, Download, Trash2, UserPlus, UserCheck
} from 'lucide-react';

const inline = (Icon, extra = {}) => {
  const C = props => (
    <Icon
      size="1em"
      strokeWidth={2.5}
      aria-hidden="true"
      focusable="false"
      {...extra}
      {...props}
      style={{ display: 'inline-block', verticalAlign: '-0.14em', flex: 'none', ...extra.style, ...props.style }}
    />
  );
  C.displayName = `Icon(${Icon.displayName || Icon.name})`;
  return C;
};

export const IStar = inline(Star, { fill: 'currentColor', strokeWidth: 1.5 });
export const IPlay = inline(Play, { fill: 'currentColor', strokeWidth: 1.5 });
export const IArrowRight = inline(ArrowRight);
export const IArrowLeft = inline(ArrowLeft);
export const IClose = inline(X);
export const ICheck = inline(Check);
export const IExternal = inline(ArrowUpRight);
export const IExpand = inline(Maximize2);
export const IFlip = inline(RotateCw);
export const IMail = inline(Mail);
export const ISpinner = inline(LoaderCircle, { className: 'rs-icon-spin' });
export const IAlert = inline(TriangleAlert);
export const IBook = inline(BookOpen);
export const IFlag = inline(Flag);
export const ISearch = inline(Search);
export const IBell = inline(Bell);
export const IShare = inline(Share2);
export const ILink = inline(Link);
export const IRss = inline(Rss);
export const IDownload = inline(Download);
export const ITrash = inline(Trash2);
export const IUserPlus = inline(UserPlus);
export const IUserCheck = inline(UserCheck);
