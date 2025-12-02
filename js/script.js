
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.app-card, .timeline-event, .intro-content, section');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Carousel / lightbox functionality for galerie
document.addEventListener('DOMContentLoaded', () => {
    const galerieItems = Array.from(document.querySelectorAll('.galerie-full-item'));
    if (!galerieItems.length) return;

    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');
    const modalCaption = document.getElementById('lightbox-caption');
    const btnPrev = document.getElementById('lb-prev');
    const btnNext = document.getElementById('lb-next');
    const btnClose = document.getElementById('lb-close');
    const btnPlay = document.getElementById('lb-play');

    let currentIndex = 0;
    let autoplay = false;
    let autoplayId = null;
    const AUTOPLAY_INTERVAL = 3000;

    function openAt(index) {
        currentIndex = (index + galerieItems.length) % galerieItems.length;
        const item = galerieItems[currentIndex];
        const src = item.getAttribute('data-src');
        const caption = item.getAttribute('data-caption') || '';
        modalImg.src = src;
        modalCaption.textContent = caption;
        modal.classList.remove('lightbox-hidden');
        modal.classList.add('lightbox-visible');
        modal.setAttribute('aria-hidden', 'false');
        // focus for accessibility
        btnClose.focus();
    }

    function closeModal() {
        modal.classList.remove('lightbox-visible');
        modal.classList.add('lightbox-hidden');
        modal.setAttribute('aria-hidden', 'true');
        modalImg.src = '';
        modalCaption.textContent = '';
        stopAutoplay();
    }

    function showNext() {
        openAt(currentIndex + 1);
    }

    function showPrev() {
        openAt(currentIndex - 1);
    }

    function startAutoplay() {
        if (autoplay) return;
        autoplay = true;
        autoplayId = setInterval(showNext, AUTOPLAY_INTERVAL);
    }

    function stopAutoplay() {
        if (!autoplay) return;
        autoplay = false;
        clearInterval(autoplayId);
        autoplayId = null;
    }

    galerieItems.forEach((el, idx) => {
        el.addEventListener('click', () => openAt(idx));
    });

    // Controls
    btnNext && btnNext.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
    btnPrev && btnPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
    btnClose && btnClose.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
    // Play button removed from UI — keep autoplay functions usable via keyboard (Space)

    // Close when clicking overlay outside content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Also allow clicking the image itself to close (familiar UX)
    modalImg && modalImg.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('lightbox-hidden')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); autoplay ? stopAutoplay() : startAutoplay(); }
    });

    // Position navigation buttons so they don't overlap the image
    function positionNavButtons() {
        if (!modal || modal.classList.contains('lightbox-hidden')) return;
        if (!modalImg || !btnPrev || !btnNext) return;
        const imgRect = modalImg.getBoundingClientRect();
        const container = document.querySelector('.lightbox-content');
        if (!container) return;
        const contRect = container.getBoundingClientRect();
        // If image not visible or has no size yet, skip
        if (imgRect.width === 0 || imgRect.height === 0) return;

        const margin = 12; // space between image and buttons
        // Compute positions relative to container
        const imgLeftRel = imgRect.left - contRect.left;
        const imgRightRel = imgLeftRel + imgRect.width;
        const centerYRel = imgRect.top - contRect.top + imgRect.height / 2;

        // Reset any fixed positioning
        btnPrev.style.position = 'absolute';
        btnNext.style.position = 'absolute';
        btnPrev.style.zIndex = 6000;
        btnNext.style.zIndex = 6000;

        // Try to place to the sides of the image inside the container
        // increase side spacing proportionally to image width so wide images push buttons further out
        const sideSpacing = Math.max(margin, Math.round(imgRect.width * 0.06));
        const leftPos = imgLeftRel - btnPrev.offsetWidth - sideSpacing;
        const rightPos = imgRightRel + sideSpacing;

        // Prefer side placement. Clamp positions so buttons stay inside the container
        const minEdge = 8; // minimal distance from container edge
        const maxRightAllowed = contRect.width - btnNext.offsetWidth - minEdge;
        const clampedLeft = Math.max(minEdge, Math.min(leftPos, contRect.width - btnPrev.offsetWidth - minEdge));
        const clampedRight = Math.max(minEdge, Math.min(rightPos, maxRightAllowed));

        // place vertically centered relative to image
        const topPos = Math.round(centerYRel - btnPrev.offsetHeight / 2);
        btnPrev.style.left = `${Math.round(clampedLeft)}px`;
        btnPrev.style.top = `${topPos}px`;
        btnNext.style.left = `${Math.round(clampedRight)}px`;
        btnNext.style.top = `${topPos}px`;
    }

    // Reposition on image load, window resize and when opening
    modalImg.addEventListener('load', () => {
        // slight delay to allow layout to stabilize
        setTimeout(positionNavButtons, 30);
    });
    window.addEventListener('resize', () => {
        // recalc after resize
        setTimeout(positionNavButtons, 50);
    });

    // call positioning after opening
    const _openAt = openAt;
    openAt = function(index) {
        _openAt(index);
        // position once image is set; if already cached, image load may not fire
        setTimeout(positionNavButtons, 50);
    };
});

