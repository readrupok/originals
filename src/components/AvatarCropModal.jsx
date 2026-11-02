import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Crop } from 'lucide-react';
import { INK } from '../data/content';

/**
 * AvatarCropModal: Lightweight, dependency-free interactive canvas circular cropper.
 * Allows user to pan (drag), zoom in/out, and preview circular crop before saving.
 */
export default function AvatarCropModal({ imageSrc, onApply, onClose, lang = 'en', t = {} }) {
  const modalRef = useRef(null);
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState(null);
  const [imgDim, setImgDim] = useState({ w: 0, h: 0 });

  const size = 320; // Canvas display size
  const radius = 125; // Circle crop radius in canvas pixels

  // Load source image
  useEffect(() => {
    if (!imageSrc) return;
    let isCancelled = false;
    const img = new Image();
    // Do NOT set crossOrigin on blob: or data: URLs to prevent browser CORS failure
    if (!imageSrc.startsWith('blob:') && !imageSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (isCancelled) return;
      setImgElement(img);
      setImgDim({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
      setPan({ x: 0, y: 0 });
      setZoom(1);
    };
    img.onerror = () => {
      if (isCancelled) return;
      // Fallback: retry without crossOrigin if CORS rejected it
      if (img.crossOrigin) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          if (isCancelled) return;
          setImgElement(fallbackImg);
          setImgDim({ w: fallbackImg.naturalWidth || fallbackImg.width, h: fallbackImg.naturalHeight || fallbackImg.height });
          setPan({ x: 0, y: 0 });
          setZoom(1);
        };
        fallbackImg.src = imageSrc;
      }
    };
    img.src = imageSrc;
    return () => {
      isCancelled = true;
    };
  }, [imageSrc]);

  // Compute scale to ensure image covers at least the crop circle diameter
  const baseScale = imgDim.w && imgDim.h
    ? Math.max((2 * radius) / imgDim.w, (2 * radius) / imgDim.h)
    : 1;
  const currentScale = baseScale * zoom;

  // Draw on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, size, size);

    // 1. Draw image with pan and scale (if loaded)
    if (imgElement && imgDim.w && imgDim.h) {
      ctx.save();
      const cx = size / 2 + pan.x;
      const cy = size / 2 + pan.y;
      ctx.translate(cx, cy);
      ctx.scale(currentScale, currentScale);
      ctx.drawImage(imgElement, -imgDim.w / 2, -imgDim.h / 2, imgDim.w, imgDim.h);
      ctx.restore();
    } else {
      ctx.fillStyle = '#191816';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#9e9b92';
      ctx.font = "14px 'Sora', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lang === 'bn' ? 'ছবি লোড হচ্ছে...' : 'Loading photo...', size / 2, size / 2);
    }

    // 2. Draw darkened overlay with circular cutout (evenodd rule)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 15, 15, 0.68)';
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2, true);
    ctx.fill();

    // 3. Draw circle outline guide
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle crosshair guide inside circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(size / 2 - 20, size / 2);
    ctx.lineTo(size / 2 + 20, size / 2);
    ctx.moveTo(size / 2, size / 2 - 20);
    ctx.lineTo(size / 2, size / 2 + 20);
    ctx.stroke();

    ctx.restore();
  }, [imgElement, imgDim, pan, currentScale, radius, size, lang]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Clamp pan position so image boundary always completely covers the crop circle
  const clampPan = useCallback((x, y, scale = currentScale) => {
    if (!imgDim.w || !imgDim.h) return { x: 0, y: 0 };
    const scaledW = imgDim.w * scale;
    const scaledH = imgDim.h * scale;
    const maxPanX = Math.max(0, (scaledW - 2 * radius) / 2);
    const maxPanY = Math.max(0, (scaledH - 2 * radius) / 2);
    return {
      x: Math.min(maxPanX, Math.max(-maxPanX, x)),
      y: Math.min(maxPanY, Math.max(-maxPanY, y))
    };
  }, [imgDim.w, imgDim.h, currentScale, radius]);

  // Keep pan within bounds whenever scale changes
  useEffect(() => {
    if (!imgDim.w || !imgDim.h) return;
    setPan(prev => clampPan(prev.x, prev.y, currentScale));
  }, [currentScale, clampPan, imgDim.w, imgDim.h]);

  // Pointer drag events for panning
  const handlePointerDown = e => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handlePointerMove = e => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStartRef.current.x;
    const rawY = e.clientY - dragStartRef.current.y;
    setPan(clampPan(rawX, rawY, currentScale));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Safety: release dragging if pointer released outside canvas
  useEffect(() => {
    if (!isDragging) return;
    const onUp = () => setIsDragging(false);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging]);

  // Lock background scrolling while modal is open (both body and documentElement)
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  // Prevent background page wheel scroll anywhere inside the modal dialog
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const blockWheel = e => {
      e.preventDefault();
    };
    modal.addEventListener('wheel', blockWheel, { passive: false });
    return () => modal.removeEventListener('wheel', blockWheel);
  }, []);

  // Non-passive wheel listener directly on canvas for smooth zooming
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = e => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      setZoom(z => Math.min(3.5, Math.max(1, +(z + delta).toFixed(2))));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // Export cropped square image
  const handleApply = () => {
    if (!imgElement || !imgDim.w) return;
    const exportSize = 512;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const eCtx = exportCanvas.getContext('2d');

    eCtx.imageSmoothingEnabled = true;
    eCtx.imageSmoothingQuality = 'high';

    // Map from display crop circle (diameter 2*radius) to export canvas (512)
    const factor = exportSize / (2 * radius);
    eCtx.translate(exportSize / 2 + pan.x * factor, exportSize / 2 + pan.y * factor);
    eCtx.scale(currentScale * factor, currentScale * factor);
    eCtx.drawImage(imgElement, -imgDim.w / 2, -imgDim.h / 2, imgDim.w, imgDim.h);

    try {
      exportCanvas.toBlob(blob => {
        if (!blob) return;
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg', lastModified: Date.now() });
        const previewUrl = URL.createObjectURL(blob);
        onApply(file, previewUrl);
      }, 'image/jpeg', 0.92);
    } catch (err) {
      console.error('Failed to export cropped image:', err);
    }
  };

  const modalContent = (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(21, 21, 21, 0.72)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overscrollBehavior: 'contain'
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--card, #fff)',
          border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: `calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 ${INK}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: 'rs-in 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crop size={18} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)" }}>
              {t['crop.title'] || (lang === 'bn' ? 'ছবি ক্রপ ও পজিশন করুন' : 'Crop & Position Photo')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--muted, #6b675e)',
              display: 'grid',
              placeItems: 'center',
              padding: 4,
              borderRadius: 6
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted-2, #55524a)', lineHeight: 1.4 }}>
          {t['crop.desc'] || (lang === 'bn'
            ? 'ছবিটি ড্র্যাগ করে বৃত্তের মাঝে বসান এবং জুম স্লাইডার দিয়ে সাইজ ঠিক করুন।'
            : 'Drag to position photo inside the circle and use the slider to zoom.')}
        </p>

        {/* Canvas Workspace */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#0d0d0d',
            borderRadius: 16,
            overflow: 'hidden',
            border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
            touchAction: 'none'
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: size,
              height: size,
              display: 'block',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>

        {/* Zoom & Control Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(1, +(z - 0.15).toFixed(2)))}
            disabled={zoom <= 1}
            title={t['crop.zoomOut'] || (lang === 'bn' ? 'জুম আউট' : 'Zoom Out')}
            style={{
              border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
              borderRadius: 8,
              background: 'var(--paper, #f4f1ea)',
              color: INK,
              cursor: zoom <= 1 ? 'not-allowed' : 'pointer',
              opacity: zoom <= 1 ? 0.4 : 1,
              padding: 6,
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <ZoomOut size={16} />
          </button>

          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            style={{
              flex: 1,
              accentColor: 'var(--acc, #6f6758)',
              cursor: 'pointer'
            }}
          />

          <button
            type="button"
            onClick={() => setZoom(z => Math.min(3, +(z + 0.15).toFixed(2)))}
            disabled={zoom >= 3}
            title={t['crop.zoomIn'] || (lang === 'bn' ? 'জুম ইন' : 'Zoom In')}
            style={{
              border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
              borderRadius: 8,
              background: 'var(--paper, #f4f1ea)',
              color: INK,
              cursor: zoom >= 3 ? 'not-allowed' : 'pointer',
              opacity: zoom >= 3 ? 0.4 : 1,
              padding: 6,
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <ZoomIn size={16} />
          </button>

          <button
            type="button"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            title={t['crop.reset'] || (lang === 'bn' ? 'রিসেট' : 'Reset')}
            style={{
              border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
              borderRadius: 8,
              background: 'var(--paper, #f4f1ea)',
              color: 'var(--muted-2, #55524a)',
              cursor: 'pointer',
              padding: 6,
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 16px',
              borderRadius: 'var(--r-btn, 999px)',
              border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
              background: 'var(--card, #fff)',
              color: INK,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer'
            }}
          >
            {t['crop.cancel'] || (lang === 'bn' ? 'বাতিল' : 'Cancel')}
          </button>

          <button
            type="button"
            onClick={handleApply}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              borderRadius: 'var(--r-btn, 999px)',
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              background: 'var(--ink-bg, #151515)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
              boxShadow: `calc(2.5px * var(--shk, 1)) calc(2.5px * var(--shk, 1)) 0 #6f6758`
            }}
          >
            <Check size={16} />
            <span>{t['crop.apply'] || (lang === 'bn' ? 'ক্রপ নিশ্চিত করুন' : 'Apply Crop')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
