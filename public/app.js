const form = document.getElementById('roastForm');
const urlInput = document.getElementById('hyroxUrl');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const results = document.getElementById('results');
const adSection = document.getElementById('ad-section');
const adSenseContainer = document.getElementById('adsense-container');

// Store URL for later use
let pendingUrl = null;
let adObserver = null;
let roastGenerated = false;

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('Please enter a Hyrox results URL');
        return;
    }
    
    if (!url.includes('hyresult.com')) {
        showError('Please enter a valid Hyrox results URL');
        return;
    }
    
    pendingUrl = url;
    roastGenerated = false;
    
    // Hide previous results and errors
    results.classList.add('hidden');
    error.classList.add('hidden');
    form.classList.add('hidden');
    
    // Show ad section
    adSection.classList.remove('hidden');
    adSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Initialize AdSense ad
    initializeAdSense();
});

function initializeAdSense() {
    try {
        // Push ad to AdSense
        (adsbygoogle = window.adsbygoogle || []).push({});
        
        // Wait a moment for ad to start loading, then set up visibility observer
        setTimeout(() => {
            setupAdVisibilityObserver();
        }, 500);
    } catch (err) {
        console.error('Error initializing AdSense:', err);
        // If AdSense fails, proceed with roast generation anyway
        setTimeout(() => {
            generateRoast(pendingUrl);
        }, 2000);
    }
}

function setupAdVisibilityObserver() {
    // Use Intersection Observer to detect when ad is visible
    if (!('IntersectionObserver' in window)) {
        // Fallback for browsers without IntersectionObserver
        setTimeout(() => {
            if (!roastGenerated) {
                generateRoast(pendingUrl);
            }
        }, 3000);
        return;
    }
    
    // Find the ad iframe or container
    const adElement = adSenseContainer.querySelector('ins.adsbygoogle') || 
                     adSenseContainer.querySelector('iframe') ||
                     adSenseContainer;
    
    adObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
                // Ad is visible, wait a moment then generate roast
                if (!roastGenerated) {
                    roastGenerated = true;
                    setTimeout(() => {
                        generateRoast(pendingUrl);
                    }, 1000); // Give user a moment to see the ad
                    
                    // Disconnect observer after first trigger
                    if (adObserver) {
                        adObserver.disconnect();
                    }
                }
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of ad is visible
    });
    
    adObserver.observe(adElement);
    
    // Fallback: if ad doesn't become visible within 10 seconds, generate anyway
    setTimeout(() => {
        if (!roastGenerated) {
            roastGenerated = true;
            if (adObserver) {
                adObserver.disconnect();
            }
            generateRoast(pendingUrl);
        }
    }, 10000);
}

async function generateRoast(url) {
    // Hide ad section and show loading
    adSection.classList.add('hidden');
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    
    try {
        const response = await fetch('/api/roast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate roast');
        }
        
        displayResults(data);
        
    } catch (err) {
        showError(err.message || 'Something went wrong. Please try again.');
    } finally {
        loading.classList.add('hidden');
        form.classList.remove('hidden');
    }
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
    adSection.classList.add('hidden');
    form.classList.remove('hidden');
}

function displayResults(data) {
    // Display athlete info
    document.getElementById('athleteName').textContent = data.data.athleteName || 'Unknown Athlete';
    document.getElementById('totalTime').textContent = data.data.totalTime || 'N/A';
    document.getElementById('overallPosition').textContent = `#${data.data.overallPosition}`;
    document.getElementById('categoryPosition').textContent = `#${data.data.categoryPosition}`;
    
    // Display roast
    document.getElementById('roastText').textContent = data.roast;
    
    // Setup sharing buttons (this will also generate the share card)
    setupSharing(data);
    
    // Show results
    results.classList.remove('hidden');
    
    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Store current sharing data
let currentShareData = null;

function setupSharing(data) {
    currentShareData = data;
    const roastText = data.roast;
    const athleteName = data.data.athleteName || 'Unknown Athlete';
    const shareText = `${athleteName}'s Hyrox Roast:\n\n${roastText}\n\n🔥 Get your own roast at: ${window.location.href}`;
    
    // Remove old listeners by cloning and replacing elements
    const copyBtn = document.getElementById('copyText');
    const newCopyBtn = copyBtn.cloneNode(true);
    copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
    
    const downloadBtn = document.getElementById('downloadImage');
    const newDownloadBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
    
    // Copy text button
    newCopyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(shareText).then(() => {
            const originalText = newCopyBtn.textContent;
            newCopyBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                newCopyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            showError('Failed to copy to clipboard');
        });
    });
    
    // Twitter share
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    document.getElementById('twitterShare').href = twitterUrl;
    
    // Facebook share
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
    document.getElementById('facebookShare').href = facebookUrl;
    
    // Download image button
    newDownloadBtn.addEventListener('click', () => {
        const canvas = document.getElementById('shareCard');
        if (canvas && canvas.width > 0) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `hyrox-roast-${athleteName.replace(/\s+/g, '-')}.png`;
            link.href = url;
            link.click();
        } else {
            showError('Share card not ready yet. Please wait a moment.');
        }
    });
    
    // Generate share card (with slight delay to ensure DOM is ready)
    setTimeout(() => {
        if (typeof generateShareCardImage === 'function') {
            generateShareCardImage(data);
        }
    }, 100);
}
