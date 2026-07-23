document.getElementById("year").textContent = new Date().getFullYear();

function buildMasonry(containerId) {
    const masonry = document.getElementById(containerId);
    if (!masonry) return;

    const allCols = Array.from(masonry.querySelectorAll(".masonry-col"));
    const items = Array.from(masonry.querySelectorAll(".masonry-item"));

    if (!allCols.length || !items.length) return;

    allCols.forEach(col => col.innerHTML = "");

    let columnsToUse = 3;
    if (window.innerWidth <= 700) columnsToUse = 1;
    else if (window.innerWidth <= 1100) columnsToUse = 2;

    allCols.forEach((col, index) => {
        col.style.display = index < columnsToUse ? "flex" : "none";
    });

    const activeCols = allCols.slice(0, columnsToUse);

    items.forEach(item => {
        const shortestCol = activeCols.reduce((a, b) =>
            a.offsetHeight <= b.offsetHeight ? a : b
        );
        shortestCol.appendChild(item);
    });
}

function waitForAssetsAndBuild() {
    const allImgs = Array.from(document.querySelectorAll("#drawingsMasonry img, #modelsMasonry img"));

    if (!allImgs.length) {
        buildMasonry("modelsMasonry");
        buildMasonry("drawingsMasonry");
        return;
    }

    let loaded = 0;
    const done = () => {
        loaded++;
        if (loaded === allImgs.length) {
            buildMasonry("modelsMasonry");
            buildMasonry("drawingsMasonry");
        }
    };

    allImgs.forEach(img => {
        if (img.complete) done();
        else {
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
        }
    });

    if (document.querySelectorAll("model-viewer").length) {
        requestAnimationFrame(() => {
            buildMasonry("modelsMasonry");
            buildMasonry("drawingsMasonry");
        });
    }
}

function getCarouselImages(element) {
    const images = (element.dataset.images || "")
        .split(",")
        .map(src => src.trim())
        .filter(Boolean);
    const fallback = element.querySelector("img")?.getAttribute("src");
    return images.length ? images : (fallback ? [fallback] : []);
}

function setCarouselImage(carousel, index) {
    const images = getCarouselImages(carousel);
    const img = carousel.querySelector("img");
    if (!img || !images.length) return 0;

    const nextIndex = (index + images.length) % images.length;
    carousel.dataset.activeIndex = String(nextIndex);
    img.src = images[nextIndex];

    carousel.querySelectorAll(".carousel-dots span").forEach((dot, dotIndex) => {
        dot.classList.toggle("active", dotIndex === nextIndex);
    });

    return nextIndex;
}

function setupMediaCarousels() {
    const autoplayDelay = 3600;

    document.querySelectorAll(".media-carousel").forEach(carousel => {
        const images = getCarouselImages(carousel);
        const dots = carousel.querySelector(".carousel-dots");
        const prevButton = carousel.querySelector(".carousel-prev");
        const nextButton = carousel.querySelector(".carousel-next");

        if (images.length <= 1) {
            prevButton?.setAttribute("hidden", "");
            nextButton?.setAttribute("hidden", "");
            dots?.setAttribute("hidden", "");
            setCarouselImage(carousel, 0);
            return;
        }

        prevButton?.removeAttribute("hidden");
        nextButton?.removeAttribute("hidden");
        dots?.removeAttribute("hidden");

        let autoplayTimer = null;
        const restartAutoplay = () => {
            window.clearTimeout(autoplayTimer);
            autoplayTimer = window.setTimeout(() => {
                const current = Number(carousel.dataset.activeIndex || 0);
                setCarouselImage(carousel, current + 1);
                restartAutoplay();
            }, autoplayDelay);
        };

        if (dots && !dots.children.length) {
            images.forEach((_, index) => {
                const dot = document.createElement("span");
                dot.classList.toggle("active", index === 0);
                dots.appendChild(dot);
            });
        }

        setCarouselImage(carousel, Number(carousel.dataset.activeIndex || 0));

        prevButton?.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const current = Number(carousel.dataset.activeIndex || 0);
            setCarouselImage(carousel, current - 1);
            restartAutoplay();
        });

        nextButton?.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const current = Number(carousel.dataset.activeIndex || 0);
            setCarouselImage(carousel, current + 1);
            restartAutoplay();
        });

        restartAutoplay();
    });
}

const lightbox = document.getElementById("lightbox");
const lightboxStage = document.getElementById("lightboxStage");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxBackdrop = document.getElementById("lightboxBackdrop");
const lightboxHint = document.getElementById("lightboxHint");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

let activeImage = null;
let activeLightboxImages = [];
let activeLightboxIndex = 0;
let scale = 1;
let minScale = 0.2;
let maxScale = 5;
let fittedScale = 1;
let pointX = 0;
let pointY = 0;
let startX = 0;
let startY = 0;
let isDragging = false;

function updateImageTransform() {
    if (!activeImage) return;
    activeImage.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
}

function fitImageToStage() {
    if (!activeImage) return;

    const stageRect = lightboxStage.getBoundingClientRect();
    const imgNaturalWidth = activeImage.naturalWidth;
    const imgNaturalHeight = activeImage.naturalHeight;

    if (!imgNaturalWidth || !imgNaturalHeight || !stageRect.width || !stageRect.height) return;

    const scaleX = (stageRect.width * 0.92) / imgNaturalWidth;
    const scaleY = (stageRect.height * 0.92) / imgNaturalHeight;

    fittedScale = Math.min(scaleX, scaleY, 1);
    scale = fittedScale;
    minScale = fittedScale;
    pointX = 0;
    pointY = 0;

    updateImageTransform();
}

function renderLightboxImage() {
    lightboxStage.innerHTML = "";
    activeImage = document.createElement("img");
    activeImage.src = activeLightboxImages[activeLightboxIndex];
    activeImage.alt = "Gallery image";
    activeImage.draggable = false;
    lightboxStage.appendChild(activeImage);

    const hasMultiple = activeLightboxImages.length > 1;
    lightboxPrev.hidden = !hasMultiple;
    lightboxNext.hidden = !hasMultiple;
    lightboxHint.textContent = hasMultiple
        ? "Arrows for scrolling through images · Mouse wheel for zooming · Drag to move · Esc to close"
        : "Mouse wheel for zooming · Drag to move · Esc to close";

    activeImage.addEventListener("load", fitImageToStage, { once: true });
}

function openImageLightbox(images, startIndex = 0) {
    activeLightboxImages = Array.isArray(images) ? images.filter(Boolean) : [images].filter(Boolean);
    if (!activeLightboxImages.length) return;

    activeLightboxIndex = Math.min(Math.max(startIndex, 0), activeLightboxImages.length - 1);
    renderLightboxImage();

    lightbox.classList.add("open");
    document.body.classList.add("lightbox-open");
    lightbox.setAttribute("aria-hidden", "false");
}

function showLightboxImage(direction) {
    if (activeLightboxImages.length <= 1) return;
    activeLightboxIndex = (activeLightboxIndex + direction + activeLightboxImages.length) % activeLightboxImages.length;
    renderLightboxImage();
}

function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.classList.remove("lightbox-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxStage.innerHTML = "";
    activeImage = null;
    activeLightboxImages = [];
    activeLightboxIndex = 0;
    scale = 1;
    pointX = 0;
    pointY = 0;
    isDragging = false;
}

function setupGalleryLightbox() {
    const cards = document.querySelectorAll(".art-card");

    cards.forEach(card => {
        card.addEventListener("click", () => {
            const carousel = card.querySelector(".media-carousel");
            const img = card.querySelector(".thumb img");
            if (!img) return;

            const images = carousel ? getCarouselImages(carousel) : [img.getAttribute("src")];
            const startIndex = carousel ? Number(carousel.dataset.activeIndex || 0) : 0;
            openImageLightbox(images, startIndex);
        });
    });
}

lightboxClose.addEventListener("click", closeLightbox);
lightboxBackdrop.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", () => showLightboxImage(-1));
lightboxNext.addEventListener("click", () => showLightboxImage(1));

document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showLightboxImage(-1);
    if (e.key === "ArrowRight") showLightboxImage(1);
});

lightboxStage.addEventListener("wheel", (e) => {
    if (!activeImage) return;

    e.preventDefault();

    const rect = lightboxStage.getBoundingClientRect();
    const xs = (e.clientX - rect.left - rect.width / 2 - pointX) / scale;
    const ys = (e.clientY - rect.top - rect.height / 2 - pointY) / scale;

    const delta = e.deltaY < 0 ? 1.15 : 0.9;
    const newScale = Math.min(maxScale, Math.max(minScale, scale * delta));

    pointX -= xs * (newScale - scale);
    pointY -= ys * (newScale - scale);
    scale = newScale;

    if (scale <= minScale) {
        scale = minScale;
        pointX = 0;
        pointY = 0;
    }

    updateImageTransform();
}, { passive: false });

lightboxStage.addEventListener("mousedown", (e) => {
    if (!activeImage || scale <= minScale) return;

    isDragging = true;
    activeImage.classList.add("dragging");
    startX = e.clientX - pointX;
    startY = e.clientY - pointY;
});

let rafPending = false;
let nextPointX = 0;
let nextPointY = 0;

window.addEventListener("mousemove", (e) => {
    if (!activeImage || !isDragging) return;

    nextPointX = e.clientX - startX;
    nextPointY = e.clientY - startY;

    if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
            pointX = nextPointX;
            pointY = nextPointY;
            updateImageTransform();
            rafPending = false;
        });
    }
});

window.addEventListener("mouseup", () => {
    if (!activeImage) return;
    isDragging = false;
    activeImage.classList.remove("dragging");
});

lightboxStage.addEventListener("dragstart", (e) => e.preventDefault());

window.addEventListener("load", () => {
    setupMediaCarousels();
    waitForAssetsAndBuild();
    setupGalleryLightbox();
});

window.addEventListener("resize", () => {
    buildMasonry("modelsMasonry");
    buildMasonry("drawingsMasonry");
    if (lightbox.classList.contains("open")) fitImageToStage();
});