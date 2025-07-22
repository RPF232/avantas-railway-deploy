// Function to check premium status
async function checkPremiumStatus() {
    console.log('🔍 Starting premium status check...');
    const token = localStorage.getItem('authToken');
    console.log('Token found:', !!token);
    
    if (!token) {
        console.log('❌ No token found - hiding premium content');
        hidePremiumContent();
        return;
    }

    try {
        console.log('🌐 Making API call to verify premium status...');
        const response = await fetch('/api/auth/verify-premium', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('API Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('API Response data:', data);
            if (data.isPremium) {
                console.log('✅ User is premium - showing all content');
                showPremiumContent();
            } else {
                console.log('❌ User is not premium - hiding premium content');
                hidePremiumContent();
            }
        } else {
            console.log('❌ API call failed - hiding premium content');
            hidePremiumContent();
        }
    } catch (error) {
        console.error('❌ Error checking premium status:', error);
        hidePremiumContent();
    }
}

// Function to hide premium content (for non-premium users)
function hidePremiumContent() {
    console.log('🔒 Hiding premium content...');
    // Show the premium upgrade slide
    const upgradeSlide = document.getElementById('premium-message-slide');
    if (upgradeSlide) {
        upgradeSlide.style.display = 'block';
        console.log('✅ Premium upgrade slide shown');
    } else {
        console.log('❌ Premium upgrade slide not found');
    }

    // Remove premium articles (articles 4-6) from the DOM
    const premiumElements = document.querySelectorAll('.premium-content');
    console.log('Found premium elements:', premiumElements.length);
    premiumElements.forEach((element, index) => {
        element.parentNode.removeChild(element);
        console.log(`🗑️ Removed premium element ${index + 1}`);
    });

    // Now initialize Swiper for non-premium users
    updateSwiperForNonPremium();
}

// Function to show premium content (for premium users)
function showPremiumContent() {
    console.log('🔓 Showing premium content...');
    // Hide the premium upgrade slide
    const upgradeSlide = document.getElementById('premium-message-slide');
    if (upgradeSlide) {
        upgradeSlide.style.display = 'none';
        console.log('✅ Premium upgrade slide hidden');
    }
    // Show all premium articles (should already be in DOM)
    // No need to change DOM, just initialize Swiper for premium
    updateSwiperForPremium();
}

// Function to update Swiper for non-premium users (show upgrade slide + 3 articles)
function updateSwiperForNonPremium() {
    console.log('🔄 Initializing Swiper for non-premium users...');
    new Swiper('.articles-slider', {
        slidesPerView: 3, // Show 3 articles per view on desktop
        spaceBetween: 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        loop: false, // No loop for non-premium
        breakpoints: {
            0: {
                slidesPerView: 2,
            },
            768: {
                slidesPerView: 2,
            },
            1200: {
                slidesPerView: 3,
            }
        }
    });
}

// Function to update Swiper for premium users (show all articles, no upgrade slide)
function updateSwiperForPremium() {
    console.log('🔄 Initializing Swiper for premium users...');
    new Swiper('.articles-slider', {
        slidesPerView: 3, // Show 3 articles per view on desktop
        spaceBetween: 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        loop: true, // Loop for premium
        breakpoints: {
            0: {
                slidesPerView: 2,
            },
            768: {
                slidesPerView: 2,
            },
            1200: {
                slidesPerView: 3,
            }
        }
    });
}

// Check premium status when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Starting premium check process...');
    // Only check premium status, Swiper will be initialized in the show/hide functions
    console.log('🔍 Calling checkPremiumStatus...');
    checkPremiumStatus();
}); 