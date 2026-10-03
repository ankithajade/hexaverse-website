import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import ScrollReveal from '../components/ScrollReveal';
import { GALLERY_IMAGES } from '../data/galleryImages';

export default function GalleryPage() {
  const [openIndex, setOpenIndex] = useState(null); // null = lightbox closed

  const close = useCallback(() => setOpenIndex(null), []);
  const showPrev = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length)),
    []
  );
  const showNext = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % GALLERY_IMAGES.length)),
    []
  );

  // Keyboard support while lightbox is open: Escape closes, arrows navigate
  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openIndex, close, showPrev, showNext]);

  return (
    <div>
      <Nav />

      <div className="container" style={{ paddingTop: '90px' }}>
        <BackButton style={{ marginBottom: '12px' }} />
        <ScrollReveal className="dept-breadcrumb" style={{ padding: 0 }}>
          <Link to="/">Home</Link> <span>/</span> <span>Gallery</span>
        </ScrollReveal>
      </div>

      <main className="container" style={{ marginBottom: '80px' }}>
        <ScrollReveal>
          <div className="section-label">Moments</div>
          <h1 className="section-title">Gallery</h1>
          <p className="section-desc">
            Highlights and moments from HexaVerse CloudFest &mdash; tap any photo to view it full-size.
          </p>
        </ScrollReveal>

        <ScrollReveal style={{ marginTop: '32px' }}>
          <div className="gallery-page-grid">
            {GALLERY_IMAGES.map((src, i) => (
              <button
                key={src}
                type="button"
                className="gallery-page-cell"
                onClick={() => setOpenIndex(i)}
                aria-label={`Open photo ${i + 1} of ${GALLERY_IMAGES.length}`}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </ScrollReveal>
      </main>

      <Footer />

      {openIndex !== null && (
        <div
          className="lightbox-overlay"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={close}
            aria-label="Close"
          >
            &times;
          </button>

          <button
            type="button"
            className="lightbox-nav-btn lightbox-prev"
            onClick={(e) => { e.stopPropagation(); showPrev(); }}
            aria-label="Previous photo"
          >
            &#8249;
          </button>

          <img
            src={GALLERY_IMAGES[openIndex]}
            alt={`Gallery photo ${openIndex + 1}`}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            className="lightbox-nav-btn lightbox-next"
            onClick={(e) => { e.stopPropagation(); showNext(); }}
            aria-label="Next photo"
          >
            &#8250;
          </button>

          <div className="lightbox-counter">
            {openIndex + 1} / {GALLERY_IMAGES.length}
          </div>
        </div>
      )}
    </div>
  );
}
