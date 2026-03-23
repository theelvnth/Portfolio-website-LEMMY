/**
 * Gallery Functionality
 * - Filter by collection
 * - Click to open detail modal
 * - Toggle masked/unmasked in modal
 * - Tab navigation for Description/Context
 * - Fetches painting data from JSON
 */

// Global paintings data
let paintingsData = {};

document.addEventListener('DOMContentLoaded', async () => {
    await loadPaintingsData();
    initFilterToggle();
    initGalleryFilters();
    initDetailModal();
});

/**
 * Load paintings data from JSON file
 */
async function loadPaintingsData() {
    try {
        const response = await fetch('data/paintings-data.json');
        paintingsData = await response.json();
    } catch (error) {
        console.error('Failed to load paintings data:', error);
        paintingsData = {};
    }
}

/**
 * Filter toggle hamburger - slide out filters horizontally
 */
function initFilterToggle() {
    const toggle = document.getElementById('filterToggle');
    const filters = document.getElementById('galleryFilters');

    if (!toggle || !filters) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        filters.classList.toggle('filters--open');
    });
}

/**
 * Filter gallery items by collection
 */
function initGalleryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            galleryItems.forEach(item => {
                const collections = item.dataset.collection || '';

                if (filter === 'all') {
                    item.classList.remove('hidden');
                } else if (filter === 'gifs') {
                    // Special case: show items tagged with data-is-gif
                    if (item.dataset.isGif === 'true') {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                } else {
                    // Standard collection filter (Strict matching)
                    const collectionTags = collections.split(' ');

                    if (collectionTags.includes(filter)) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                }
            });
        });
    });
}

/**
 * Painting Detail Modal
 */
function initDetailModal() {
    const modal = document.getElementById('paintingModal');
    const galleryItems = document.querySelectorAll('.gallery-item');

    // Modal elements
    const modalImg = document.getElementById('modalPaintingImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalCollection = document.getElementById('modalCollection');
    const modalSize = document.getElementById('modalSize');
    const modalYear = document.getElementById('modalYear');
    const modalDescription = document.getElementById('modalDescription');
    const modalContext = document.getElementById('modalContext');
    const modalCredits = document.getElementById('modalCredits');
    const contextTab = document.getElementById('contextTab');
    const modalTabs = modal?.querySelectorAll('.modal-tab');
    const modalPanels = modal?.querySelectorAll('.modal-tab-panel');
    const modalPainting = modal?.querySelector('.modal-painting');

    // Current item state
    let currentItem = null;
    let currentImageState = 'masked'; // 'masked', 'unmasked', 'gif'

    // Open modal when clicking gallery item
    galleryItems.forEach(item => {
        const card = item.querySelector('.gallery-card');
        if (card) {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(item);
            });
        }
    });

    // Close modal when clicking backdrop (outside card)
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with X button
    const closeBtn = document.getElementById('modalCloseBtn');
    closeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    });

    // Close modal with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeModal();
        }
    });

    // Toggle painting when clicking image in modal
    modalPainting?.addEventListener('click', () => {
        if (!currentItem) return;
        togglePaintingInModal();
    });

    // Tab switching
    modalTabs?.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('disabled')) return;

            // Update active tab
            modalTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding panel
            const targetPanel = tab.dataset.tab;
            modalPanels?.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `${targetPanel}Panel`) {
                    panel.classList.add('active');
                }
            });

            // Update scroll fade state
            updateScrollFade();
        });
    });

    // Scroll fade detection
    const tabContent = modal?.querySelector('.modal-tab-content');
    tabContent?.addEventListener('scroll', updateScrollFade);

    /**
     * Update scroll fade gradient visibility
     */
    function updateScrollFade() {
        if (!tabContent) return;

        const isScrollable = tabContent.scrollHeight > tabContent.clientHeight;
        const isAtBottom = tabContent.scrollTop + tabContent.clientHeight >= tabContent.scrollHeight - 10;

        if (isScrollable) {
            tabContent.classList.add('has-scroll');
        } else {
            tabContent.classList.remove('has-scroll');
        }

        if (isAtBottom) {
            tabContent.classList.add('at-bottom');
        } else {
            tabContent.classList.remove('at-bottom');
        }
    }

    /**
     * Open the modal with painting details
     */
    function openModal(item) {
        currentItem = item;

        // Get painting ID from data attribute
        const paintingId = item.dataset.id;
        const data = paintingsData[paintingId] || {};

        // Fallback to data attributes if JSON data not found
        const title = data.title || item.dataset.title || 'Untitled';
        const collection = data.collection || item.dataset.collection?.split(' ')[0] || '';
        const series = data.series || item.dataset.series || '';
        const size = data.size || item.dataset.size || '';
        const year = data.year || item.dataset.year || '';
        // Use JSON description, then HTML data attribute, then placeholder only as last resort
        const description = data.description || item.dataset.description || 'Description coming soon.';
        const context = data.context || '';
        // Use JSON data first, then fallback to HTML data attributes
        const featured = data.featured || item.dataset.featured || '';
        const exhibited = data.exhibited || item.dataset.exhibited || '';
        const hasGif = item.dataset.gif;

        // Determine initial image
        let initialImage = item.dataset.masked || item.querySelector('.card-image--active')?.src || '';

        // For GIF items, start with GIF
        if (hasGif) {
            initialImage = hasGif;
            currentImageState = 'gif';
        } else {
            currentImageState = 'masked';
        }

        // Populate modal
        modalImg.src = initialImage;
        modalImg.alt = title;
        modalTitle.textContent = title;

        // Format collection display
        let collectionDisplay = formatCollection(collection);
        if (series) {
            collectionDisplay += ` · ${series.toUpperCase()} SERIES`;
        }
        modalCollection.textContent = collectionDisplay;

        modalSize.textContent = size ? `${size} px` : '';
        modalYear.textContent = year;

        // Use innerHTML to render HTML formatting in descriptions
        modalDescription.innerHTML = description;

        // Build credits section (two-tone: labels muted, values gold)
        let creditsHtml = '';
        if (featured) {
            creditsHtml += `<span>Featured in: <span class="credit-value">${featured}</span></span>`;
        }
        if (exhibited) {
            creditsHtml += `<span>Exhibited at: <span class="credit-value">${exhibited}</span></span>`;
        }
        modalCredits.innerHTML = creditsHtml;

        // Handle context tab
        if (context) {
            modalContext.innerHTML = context;
            contextTab?.classList.remove('disabled');
        } else {
            modalContext.innerHTML = '';
            contextTab?.classList.add('disabled');
        }

        // Reset to Description tab
        modalTabs?.forEach(t => t.classList.remove('active'));
        modalTabs?.[0]?.classList.add('active');
        modalPanels?.forEach(p => p.classList.remove('active'));
        modalPanels?.[0]?.classList.add('active');

        // Show modal
        modal?.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Update scroll fade after modal opens
        setTimeout(updateScrollFade, 100);
    }

    /**
     * Close the modal
     */
    function closeModal() {
        modal?.classList.remove('active');
        document.body.style.overflow = '';
        currentItem = null;
    }

    /**
     * Toggle painting between states in modal
     */
    function togglePaintingInModal() {
        if (!currentItem) return;

        const hasGif = currentItem.dataset.gif;
        const maskedPath = currentItem.dataset.masked;
        const unmaskedPath = currentItem.dataset.unmasked;

        // Tri-state items (has GIF)
        if (hasGif) {
            // Cycle: GIF -> Unmasked -> Masked -> GIF
            if (currentImageState === 'gif') {
                if (unmaskedPath) {
                    modalImg.src = unmaskedPath;
                    currentImageState = 'unmasked';
                } else if (maskedPath) {
                    modalImg.src = maskedPath;
                    currentImageState = 'masked';
                }
            } else if (currentImageState === 'unmasked') {
                if (maskedPath) {
                    modalImg.src = maskedPath;
                    currentImageState = 'masked';
                } else {
                    modalImg.src = hasGif;
                    currentImageState = 'gif';
                }
            } else if (currentImageState === 'masked') {
                modalImg.src = hasGif;
                currentImageState = 'gif';
            }
            return;
        }

        // Standard toggle (Masked <-> Unmasked)
        if (!unmaskedPath) return;

        if (currentImageState === 'masked') {
            modalImg.src = unmaskedPath;
            currentImageState = 'unmasked';
        } else {
            modalImg.src = maskedPath;
            currentImageState = 'masked';
        }
    }


    /**
     * Format collection name for display
     */
    function formatCollection(collection) {
        const formats = {
            'renaissance': 'Renaissance',
            'renaissance-ii': 'Renaissance II',
            'Renaissance II': 'Renaissance II',
            'Renaissance': 'Renaissance',
            'masked-menace': 'Masked Menace',
            'Masked Menace': 'Masked Menace'
        };
        return formats[collection] || collection.charAt(0).toUpperCase() + collection.slice(1);
    }
}
