// Get all forms and inputs
const forms = document.querySelectorAll('.roast-form');
const urlInputs = document.querySelectorAll('.hyrox-url-input');
const submitBtns = document.querySelectorAll('.submit-btn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const results = document.getElementById('results');

// Function to sync input values between both forms
function syncInputs() {
    const values = Array.from(urlInputs).map(input => input.value);
    const firstValue = values[0] || '';
    urlInputs.forEach(input => {
        if (input.value !== firstValue) {
            input.value = firstValue;
        }
    });
}

// Sync inputs when user types
urlInputs.forEach(input => {
    input.addEventListener('input', syncInputs);
});

// Add submit listener to all forms
forms.forEach((form, index) => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get the URL from the form that was submitted
        const formInput = form.querySelector('.hyrox-url-input');
        const formSubmitBtn = form.querySelector('.submit-btn');
        const url = formInput.value.trim();
        
        // Sync all inputs
        syncInputs();
        
        if (!url) {
            showError('Please enter a Hyrox results URL');
            return;
        }
        
        if (!url.includes('hyresult.com')) {
            showError('Please enter a valid Hyrox results URL');
            return;
        }
        
        // Hide previous results and errors
        results.classList.add('hidden');
        error.classList.add('hidden');
        loading.classList.remove('hidden');
        
        // Disable all submit buttons
        submitBtns.forEach(btn => btn.disabled = true);
        
        // Generate roast directly (ads are in sidebar)
        generateRoast(url);
    });
});

async function generateRoast(url) {
    // Loading state is already shown
    
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
        // Re-enable all submit buttons
        submitBtns.forEach(btn => btn.disabled = false);
    }
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
    loading.classList.add('hidden');
    // Re-enable all submit buttons
    submitBtns.forEach(btn => btn.disabled = false);
}

function displayResults(data) {
    // Display athlete info
    document.getElementById('athleteName').textContent = data.data.athleteName || 'Unknown Athlete';
    document.getElementById('totalTime').textContent = data.data.totalTime || 'N/A';
    
    // Display roast
    document.getElementById('roastText').textContent = data.roast;
    
    // Display title if available
    if (data.title && document.getElementById('roastTitle')) {
        document.getElementById('roastTitle').textContent = data.title;
    }
    
    // Display hashtags if available
    if (data.hashtags && document.getElementById('hashtagsText')) {
        document.getElementById('hashtagsText').textContent = data.hashtags;
    }
    
    // Setup sharing buttons (this will also generate the share card)
    setupSharing(data);
    
    // Show results
    results.classList.remove('hidden');
    
    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Store current sharing data
let currentShareData = null;
let currentFormat = 'stories'; // Default to stories format

function setupSharing(data) {
    currentShareData = data;
    const roastText = data.roast;
    const athleteName = data.data.athleteName || 'Unknown Athlete';
    const hashtags = data.hashtags || '';
    const shareText = `${athleteName}'s Hyrox Roast:\n\n${roastText}\n\n${hashtags}\n\n🔥 Get your own roast at: ${window.location.href}`;
    
    // Remove old listeners by cloning and replacing elements
    const copyBtn = document.getElementById('copyText');
    const newCopyBtn = copyBtn.cloneNode(true);
    copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
    
    const downloadBtn = document.getElementById('downloadImage');
    const newDownloadBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
    
    const copyHashtagsBtn = document.getElementById('copyHashtags');
    if (copyHashtagsBtn) {
        const newCopyHashtagsBtn = copyHashtagsBtn.cloneNode(true);
        copyHashtagsBtn.parentNode.replaceChild(newCopyHashtagsBtn, copyHashtagsBtn);
        
        // Copy hashtags button
        newCopyHashtagsBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(hashtags).then(() => {
                const originalText = newCopyHashtagsBtn.textContent;
                newCopyHashtagsBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    newCopyHashtagsBtn.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                showError('Failed to copy to clipboard');
            });
        });
    }
    
    // Format selector
    const formatSelectors = document.querySelectorAll('input[name="imageFormat"]');
    formatSelectors.forEach(selector => {
        selector.addEventListener('change', (e) => {
            currentFormat = e.target.value;
            regenerateImage();
        });
    });
    
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
            const formatSuffix = currentFormat === 'stories' ? '-stories' : '-square';
            link.download = `hyrox-roast-${athleteName.replace(/\s+/g, '-')}${formatSuffix}.png`;
            link.href = url;
            link.click();
        } else {
            showError('Share card not ready yet. Please wait a moment.');
        }
    });
    
    // Generate share card (with slight delay to ensure DOM is ready and images loaded)
    setTimeout(() => {
        regenerateImage();
    }, 200);
}

function regenerateImage() {
    if (currentShareData && typeof generateShareCardImage === 'function') {
        generateShareCardImage(currentShareData, currentFormat);
        // Update container data attribute for styling
        const container = document.getElementById('shareCardContainer');
        if (container) {
            container.setAttribute('data-format', currentFormat);
        }
    }
}
