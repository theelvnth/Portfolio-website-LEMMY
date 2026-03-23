/**
 * Jewelry Page — Interactions
 * Lightbox, card hover 3D, display mode switching, render image swap, fullscreen
 */

document.addEventListener('DOMContentLoaded', () => {

    // ---- Elements ----
    const lightbox = document.getElementById('lightbox');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxContent = document.getElementById('lightboxContent');
    const viewerContainer = document.getElementById('viewerContainer');
    const imageViewer = document.getElementById('imageViewer');
    const imageViewerImg = document.getElementById('imageViewerImg');
    const viewerControls = document.getElementById('viewerControls');
    const renderStrip = document.getElementById('renderStrip');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const modeBtns = document.querySelectorAll('.mode-btn');

    let lightboxViewer = null; // JewelryViewer instance for lightbox

    // ---- Card Click → Open Lightbox ----
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            openLightbox();
        });
    });

    function openLightbox() {
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Initialize lightbox viewer if not already
        if (!lightboxViewer) {
            import('./viewer3d.js').then(({ JewelryViewer }) => {
                lightboxViewer = new JewelryViewer(
                    'viewerContainer',
                    'assets/jewelry/chrome-hearts/chromzy.glb',
                    { cardMode: false }
                );
                window.jewelryViewer = lightboxViewer;
            });
        } else {
            lightboxViewer.show();
            lightboxViewer.onResize();
        }

        // Reset to 3D view
        showView3D();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Close on ✕ button
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    // ---- Card Hover 3D Interaction ----
    let cardViewers = {};
    cards.forEach((card, idx) => {
        const viewerEl = card.querySelector('.project-card__viewer');
        if (!viewerEl) return;

        // Lazy load 3D on first hover
        let loaded = false;

        card.addEventListener('mouseenter', () => {
            if (!loaded) {
                loaded = true;
                import('./viewer3d.js').then(({ JewelryViewer }) => {
                    const viewer = new JewelryViewer(
                        viewerEl.id,
                        'assets/jewelry/chrome-hearts/chromzy.glb',
                        { cardMode: true }
                    );
                    cardViewers[idx] = viewer;
                });
            }
        });

        card.addEventListener('mousemove', (e) => {
            const viewer = cardViewers[idx];
            if (!viewer) return;

            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
            viewer.onCardHover(x, y);
        });

        card.addEventListener('mouseleave', () => {
            const viewer = cardViewers[idx];
            if (viewer) viewer.onCardLeave();
        });
    });

    // ---- Display Mode Switching ----
    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const mode = btn.dataset.mode;

            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (lightboxViewer) {
                lightboxViewer.applyMode(mode);
            }
        });
    });

    // ---- Render Image Swap ----
    function showView3D() {
        // Show 3D canvas, hide image overlay
        if (imageViewer) imageViewer.classList.remove('active');
        if (viewerControls) viewerControls.style.display = '';

        // Update strip active state
        renderStrip.querySelectorAll('.render-strip__item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === '3d');
        });
    }

    function showRenderImage(src) {
        if (imageViewerImg) imageViewerImg.src = src;
        if (imageViewer) imageViewer.classList.add('active');
        if (viewerControls) viewerControls.style.display = 'none';
    }

    if (renderStrip) {
        renderStrip.querySelectorAll('.render-strip__item').forEach(item => {
            item.addEventListener('click', () => {
                // Update active state
                renderStrip.querySelectorAll('.render-strip__item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                if (item.dataset.view === '3d') {
                    showView3D();
                } else if (item.dataset.view === 'image') {
                    showRenderImage(item.dataset.src);
                }
            });
        });
    }

    // ---- Fullscreen ----
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const viewer = document.getElementById('lightboxViewer') || viewerContainer;
            if (!viewer) return;

            if (!document.fullscreenElement) {
                viewer.requestFullscreen().catch(err => {
                    console.log('Fullscreen not supported:', err);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }
});
