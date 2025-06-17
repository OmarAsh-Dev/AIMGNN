// Video Slider Functionality
const videoContainer = document.getElementById('videoContainer');
const videoSlides = document.querySelectorAll('.video-slide');
const prevVideoBtn = document.getElementById('prevVideo');
const nextVideoBtn = document.getElementById('nextVideo');
let videoCurrentIndex = 0;

function showVideoSlide(index) {
    if (index < 0) {
        videoCurrentIndex = videoSlides.length - 1;
    } else if (index >= videoSlides.length) {
        videoCurrentIndex = 0;
    } else {
        videoCurrentIndex = index;
    }

    videoContainer.scrollTo({
        left: videoSlides[videoCurrentIndex].offsetLeft,
        behavior: 'smooth'
    });
}

prevVideoBtn.addEventListener('click', () => {
    showVideoSlide(videoCurrentIndex - 1);
});

nextVideoBtn.addEventListener('click', () => {
    showVideoSlide(videoCurrentIndex + 1);
});

// Gallery book
const galleryData = [
    {
        id: 1,
        title: "Mountain xxx",
        category: "guitar",
        url: "images/Guitar-1.png",
        description: "A beautiful mountain landscape with a serene lake."
    },
    {
        id: 2,
        title: "Modern Building",
        category: "jazz",
        url: "images/Jazz -1.png",
        description: "A stunning example of modern architectural design."
    },
    {
        id: 3,
        title: "Portrait Study",
        category: "piano",
        url: "images/Piano-1.png",
        description: "An expressive portrait capturing human emotion."
    },
    {
        id: 4,
        title: "Color Explosion",
        category: "rock",
        url: "images/Rock-1.png",
        description: "An abstract composition of vibrant colors."
    },
    {
        id: 5,
        title: "Forest Path",
        category: "guitar",
        url: "images/Guitar-2.png",
        description: "A peaceful path through a dense forest."
    },
    {
        id: 6,
        title: "Historic Cathedral",
        category: "jazz",
        url: "images/Jazz -2.png",
        description: "A magnificent cathedral with intricate details."
    },
    {
        id: 7,
        title: "Street Life",
        category: "jazz",
        url: "images/Jazz -3.png",
        description: "Candid shot of people in a busy street."
    },
    {
        id: 8,
        title: "Geometric Patterns",
        category: "piano",
        url: "images/Piano-2.png",
        description: "Mesmerizing patterns creating optical illusions."
    },
    {
        id: 9,
        title: "Coastal Sunset",
        category: "jazz",
        url: "images/Jazz -4.png",
        description: "Breathtaking sunset over the ocean."
    },
    {
        id: 10,
        title: "Urban Skyline",
        category: "piano",
        url: "images/Piano-3.png",
        description: "Panoramic view of a city skyline at dusk."
    },
    {
        id: 11,
        title: "Cultural Celebration",
        category: "jazz",
        url: "images/Jazz -5.png",
        description: "Vibrant scene from a traditional cultural festival."
    },
    {
        id: 12,
        title: "Fluid Art",
        category: "jazz",
        url: "images/jazz-6.png",
        description: "Mesmerizing fluid art with swirling colors."
    }
];

// DOM elements
const gallery = document.getElementById('gallery');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxCategory = document.getElementById('lightbox-category');
const lightboxClose = document.getElementById('lightbox-close');

// Populate gallery
function populateGallery(items) {
    gallery.innerHTML = '';

    if (items.length === 0) {
        gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No items found matching your search criteria.</p>';
        return;
    }

    items.forEach(item => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.dataset.id = item.id;

        galleryItem.innerHTML = `
                    <img src="${item.url}" alt="${item.title}" class="gallery-img">
                    <div class="gallery-overlay">
                        <h3 class="gallery-title">${item.title}</h3>
                        <p class="gallery-category">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</p>
                    </div>
                `;

        gallery.appendChild(galleryItem);
    });

    // Add click event to new items
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', openLightbox);
    });
}

// Filter gallery items
function filterGallery(category) {
    let filteredItems;

    if (category === 'all') {
        filteredItems = galleryData;
    } else {
        filteredItems = galleryData.filter(item => item.category === category);
    }

    populateGallery(filteredItems);
}

// Search gallery items
function searchGallery(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();

    if (searchTerm === '') {
        populateGallery(galleryData);
        return;
    }

    const searchResults = galleryData.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
    );

    populateGallery(searchResults);
}

// Open lightbox
function openLightbox() {
    const itemId = parseInt(this.dataset.id);
    const item = galleryData.find(i => i.id === itemId);

    lightboxImg.src = item.url;
    lightboxImg.alt = item.title;
    lightboxTitle.textContent = item.title;
    lightboxCategory.textContent = `${item.category.charAt(0).toUpperCase() + item.category.slice(1)} • ${item.description}`;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close lightbox
function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

// Event listeners
filterButtons.forEach(button => {
    button.addEventListener('click', function () {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        filterGallery(this.dataset.filter);
    });
});

searchBtn.addEventListener('click', function () {
    searchGallery(searchInput.value);
});

searchInput.addEventListener('keyup', function (e) {
    if (e.key === 'Enter') {
        searchGallery(this.value);
    }
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

// Initialize gallery
populateGallery(galleryData);

// Adding keyboard support
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
    }
});

// Article Grid Navigation
document.addEventListener('DOMContentLoaded', function() {
    const grids = document.querySelectorAll('.article-grid');
    const prevBtn = document.getElementById('prevArticle');
    const nextBtn = document.getElementById('nextArticle');
    let currentGridIndex = 0;

    // Initialize first grid as active
    grids[0].classList.add('active');

    // Update button states
    function updateButtons() {
        prevBtn.disabled = currentGridIndex === 0;
        nextBtn.disabled = currentGridIndex === grids.length - 1;
    }

    // Initial button state
    updateButtons();

    // Previous button click handler
    prevBtn.addEventListener('click', () => {
        if (currentGridIndex > 0) {
            grids[currentGridIndex].classList.remove('active');
            currentGridIndex--;
            grids[currentGridIndex].classList.add('active');
            updateButtons();
        }
    });

    // Next button click handler
    nextBtn.addEventListener('click', () => {
        if (currentGridIndex < grids.length - 1) {
            grids[currentGridIndex].classList.remove('active');
            currentGridIndex++;
            grids[currentGridIndex].classList.add('active');
            updateButtons();
        }
    });
});
