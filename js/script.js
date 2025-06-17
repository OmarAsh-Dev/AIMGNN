document.addEventListener('DOMContentLoaded', function () {
  // Navbar and Samples Section Logic
  const navbar = document.querySelector('.navbar');
  const samplesSection = document.querySelector('.samples');

  // Check localStorage for navbar visibility
  const navbarVisibility = localStorage.getItem('navbarVisible');
  if (navbarVisibility === 'true') {
    navbar.classList.add('visible');
  }

  // Observer for Samples section to toggle navbar visibility
  const samplesObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navbar.classList.add('visible'); // Show navbar when samples section is in view
          localStorage.setItem('navbarVisible', 'true'); // Save visibility state
        } else if (window.scrollY < samplesSection.offsetTop) {
          navbar.classList.remove('visible'); // Hide navbar when scrolling up past samples section
          localStorage.setItem('navbarVisible', 'false'); // Save visibility state
        }
      });
    },
    {
      root: null,
      rootMargin: '0px',
      threshold: 0.3,
    }
  );

  samplesObserver.observe(samplesSection);

  // Initialize Swiper for Feature Cards
  const swiper = new Swiper('.swiper-container', {
    loop: true,
    effect: 'coverflow',
    grabCursor: false,
    centeredSlides: true,
    slidesPerView: 'auto',
    coverflowEffect: {
      rotate: 50,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: false,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });

  // Feature Card Scroll Behavior
  const featureCards = document.querySelectorAll('.feature-card');
  const featureObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    },
    {
      root: null,
      threshold: 0.5,
    }
  );

  featureCards.forEach((card) => {
    featureObserver.observe(card);
  });

  // FAQ Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const toggleButton = item.querySelector('.toggle-button');
    const faqAnswer = item.querySelector('.faq-answer');

    toggleButton.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });

  // Play Button Functionality
  let currentAudio = null;
  let currentButton = null;
  const floatingGif = document.getElementById('floating-gif');

  const playButtons = document.querySelectorAll('.play-button');
  playButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const audioFile = button.getAttribute('data-audio');

      if (currentButton === button) {
        if (currentAudio.paused) {
          currentAudio.play();
          button.classList.add('playing');
          floatingGif.classList.add('visible'); // Show floating GIF
        } else {
          currentAudio.pause();
          button.classList.remove('playing');
          floatingGif.classList.remove('visible'); // Hide floating GIF
        }
      } else {
        if (currentAudio) {
          currentAudio.pause();
          currentButton.classList.remove('playing');
          floatingGif.classList.remove('visible'); // Hide floating GIF
        }

        currentAudio = new Audio(audioFile);
        currentAudio.play();
        currentButton = button;
        button.classList.add('playing');
        floatingGif.classList.add('visible'); // Show floating GIF
      }
    });
  });

  // Stop music when the tab is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && currentAudio) {
      currentAudio.pause();
      if (currentButton) {
        currentButton.classList.remove('playing');
      }
      floatingGif.classList.remove('visible'); // Hide floating GIF
    }
  });

  // Share Functionality
  const shareIcon = document.getElementById('share-icon');
  shareIcon.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
          title: 'AIMGNN',
          text: 'Create music with AI using AIMGNN!',
          url: window.location.href,
        })
        .then(() => console.log('Shared successfully'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
      alert('Web Share API is not supported in your browser.');
    }
  });

  // Color scheme
  const colors = {
    orange: '#fe841c',
    cyan: '#0dcaf0',
    darkBlue: '#0b1739',
    navy: '#070f26'
  };

  // Mock data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Users data (column chart)
  const usersData = {
    labels: months,
    datasets: [{
      label: 'Monthly Active Users',
      data: [120, 250, 600, 200, 100, 30, 150, 380, 80, 420, 350, 500],
      backgroundColor: colors.cyan,
      borderColor: colors.cyan,
      borderWidth: 2,
      tension: 0.4,
      fill: false
    }]
  };

  // Music generation data (line chart)
  const musicData = {
    labels: months,
    datasets: [{
      label: 'Music Generations',
      data: [80, 100, 120, 70, 180, 200, 240, 380, 250, 300, 320, 350],
      borderColor: colors.orange,
      tension: 0.4,
      borderWidth: 3,
      pointBackgroundColor: colors.orange,
      fill: false
    }]
  };

  // Update total numbers
  document.getElementById('totalUsers').textContent =
    usersData.datasets[0].data.reduce((a, b) => a + b, 0);
  document.getElementById('totalGenerations').textContent =
    musicData.datasets[0].data.reduce((a, b) => a + b, 0);

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'white'
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#1a255a'
        },
        ticks: {
          color: 'white'
        }
      },
      y: {
        grid: {
          color: '#1a255a'
        },
        ticks: {
          color: 'white'
        }
      }
    }
  };

  // Initialize Users Chart (Column)
  new Chart(document.getElementById('usersChart'), {
    type: 'bar',
    data: usersData,
    options: {
      ...chartOptions,
      plugins: {
        title: {
          display: true,
          text: 'Monthly User Activity',
          color: 'white',
          font: {
            size: 16
          }
        }
      }
    }
  });

  // Initialize Music Chart (Line)
  new Chart(document.getElementById('musicChart'), {
    type: 'line',
    data: musicData,
    options: {
      ...chartOptions,
      plugins: {
        title: {
          display: true,
          text: 'Music Generations per Month',
          color: 'white',
          font: {
            size: 16
          }
        }
      }
    }
  });
});

// FAQ Toggle Functionality
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const faqItem = question.closest('.faq-item');
    faqItem.classList.toggle('active');
    
    // Close other open FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
      if (item !== faqItem && item.classList.contains('active')) {
        item.classList.remove('active');
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', function() {
    const navGetStartedBtn = document.getElementById('get-started-btn');
    const heroGetStartedBtn = document.getElementById('hero-get-started-btn');
    
    function handleGetStarted() {
        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            const userRole = sessionStorage.getItem('userRole');
            if (userRole === 'programmer') {
                window.location.href = 'AiSettings.html';
            } else if (userRole === 'admin' || userRole === 'manager') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'user_dashboard.html';
            }
        } else {
            window.location.href = 'login.html';
        }
    }

    if (navGetStartedBtn) {
        navGetStartedBtn.addEventListener('click', handleGetStarted);
    }
    
    if (heroGetStartedBtn) {
        heroGetStartedBtn.addEventListener('click', handleGetStarted);
    }
});
