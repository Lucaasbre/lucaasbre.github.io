document.getElementById("year").textContent = new Date().getFullYear();

function getProjectImages(project) {
    return (project.dataset.images || "")
        .split(",")
        .map(src => src.trim())
        .filter(Boolean);
}

function setProjectImages(project, images) {
    project.dataset.images = images.join(",");
}

function openProjectSite(project) {
    const siteUrl = project.dataset.site || "#";
    if (siteUrl !== "#") window.open(siteUrl, "_blank", "noopener");
}

function removeProjectMedia(project) {
    window.clearTimeout(project.previewTimer);
    project.classList.add("no-media");
    project.querySelector(".project-media")?.remove();
}

function setProjectPreview(project, index) {
    const images = getProjectImages(project);
    const img = project.querySelector(".project-media img");
    if (!images.length || !img) {
        removeProjectMedia(project);
        return 0;
    }

    const nextIndex = (index + images.length) % images.length;
    project.dataset.activeIndex = String(nextIndex);
    img.src = images[nextIndex];

    project.querySelectorAll(".project-media-dots span").forEach((dot, dotIndex) => {
        dot.classList.toggle("active", dotIndex === nextIndex);
    });

    return nextIndex;
}

function setupProjectPreviews() {
    const autoplayDelay = 3800;

    document.querySelectorAll(".project").forEach(project => {
        const images = getProjectImages(project);
        const media = project.querySelector(".project-media");
        const dots = project.querySelector(".project-media-dots");

        if (!images.length) {
            removeProjectMedia(project);
            return;
        }

        if (dots && !dots.children.length) {
            images.forEach((_, index) => {
                const dot = document.createElement("span");
                dot.classList.toggle("active", index === 0);
                dots.appendChild(dot);
            });
        }

        media?.querySelector("img")?.addEventListener("error", () => {
            const failedSrc = media.querySelector("img")?.getAttribute("src");
            const remainingImages = getProjectImages(project).filter(src => src !== failedSrc);
            setProjectImages(project, remainingImages);

            if (!remainingImages.length) {
                removeProjectMedia(project);
                return;
            }

            setProjectPreview(project, Number(project.dataset.activeIndex || 0));
        });

        setProjectPreview(project, Number(project.dataset.activeIndex || 0));

        if (images.length <= 1) return;

        const scheduleNextPreview = () => {
            window.clearTimeout(project.previewTimer);
            project.previewTimer = window.setTimeout(() => {
                const current = Number(project.dataset.activeIndex || 0);
                setProjectPreview(project, current + 1);
                scheduleNextPreview();
            }, autoplayDelay);
        };

        scheduleNextPreview();
    });
}

const lightbox = document.getElementById("projectLightbox");
const lightboxImage = document.getElementById("projectLightboxImage");
const lightboxClose = document.getElementById("projectLightboxClose");
const lightboxBackdrop = document.getElementById("projectLightboxBackdrop");
const lightboxPrev = document.getElementById("projectLightboxPrev");
const lightboxNext = document.getElementById("projectLightboxNext");
const siteButton = document.getElementById("projectSiteButton");

let activeImages = [];
let activeIndex = 0;

function renderProjectLightbox() {
    if (!activeImages.length) return;
    lightboxImage.src = activeImages[activeIndex];
}

function openProjectLightbox(project) {
    activeImages = getProjectImages(project);
    const siteUrl = project.dataset.site || "#";

    if (!activeImages.length) {
        openProjectSite(project);
        return;
    }

    activeIndex = Number(project.dataset.activeIndex || 0);
    siteButton.href = siteUrl;

    const hasMultipleImages = activeImages.length > 1;
    lightboxPrev.hidden = !hasMultipleImages;
    lightboxNext.hidden = !hasMultipleImages;

    renderProjectLightbox();

    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
}

function closeProjectLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    lightboxImage.src = "";
    lightboxPrev.hidden = false;
    lightboxNext.hidden = false;
    activeImages = [];
    activeIndex = 0;
}

function showProjectImage(direction) {
    if (activeImages.length <= 1) return;
    activeIndex = (activeIndex + direction + activeImages.length) % activeImages.length;
    renderProjectLightbox();
}

document.querySelectorAll(".project").forEach(project => {
    project.addEventListener("click", () => openProjectLightbox(project));
});

lightboxClose.addEventListener("click", closeProjectLightbox);
lightboxBackdrop.addEventListener("click", closeProjectLightbox);
lightboxPrev.addEventListener("click", () => showProjectImage(-1));
lightboxNext.addEventListener("click", () => showProjectImage(1));

document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) return;

    if (event.key === "Escape") closeProjectLightbox();
    if (event.key === "ArrowLeft") showProjectImage(-1);
    if (event.key === "ArrowRight") showProjectImage(1);
});

setupProjectPreviews();