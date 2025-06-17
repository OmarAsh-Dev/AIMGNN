// Import the Supabase client as an ES module.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

document.addEventListener('DOMContentLoaded', async() => {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Add preset button handler
    document.querySelector('.preset-button').addEventListener('click', () => {
        loadPreset('default');
        showNotification('Default settings loaded!');
    });

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Slider value updates
    const sliders = {
        'use-sampling': { format: value => value === '1' ? 'True' : 'False' },
        'top-k': { format: value => value },
        'top-p': { format: value => (value / 100).toFixed(1) },
        'temperature': { format: value => (value / 10).toFixed(1) },
        'cfg-coef': { format: value => value },
        'two-step-cfg': { format: value => value === '1' ? 'True' : 'False' },
        'extend-stride': { format: value => value }
    };

    Object.keys(sliders).forEach(id => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(`${id}-value`);

        if (slider && valueDisplay) {
            slider.addEventListener('input', () => {
                valueDisplay.textContent = sliders[id].format(slider.value);
            });
        }
    });

    // Supabase initialization
    const supabaseUrl = 'https://pcaiuorgyybjupibnqxu.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWl1b3JneXlianVwaWJucXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMjc2MTUsImV4cCI6MjA1OTgwMzYxNX0.7sPShr6J4oa7nQ-MFjXmVUghB-ORNW5n97l3rHWMAls';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // UI Elements
    const bookmarkButton = document.querySelector('.bookmark');
    const generateButton = document.querySelector('.generate-button');
    const promptTextarea = document.getElementById('prompt-textarea');
    const durationInput = document.getElementById('duration-input');
    const playPauseButton = document.querySelector('.play-pause');
    const progressBar = document.querySelector('.progress-bar .progress');
    const trackTime = document.querySelector('.track-time');
    const muteButton = document.querySelector('.mute');
    const loadingContainer = document.querySelector('.loading-container');
    const addAudioButton = document.querySelector('.add-audio-button');
    const audioElement = new Audio();

    // Musical notes animation
    const noteSymbols = ['♪', '♫', '♬', '♩', '♭', '♮', '♯'];
    const colors = [
        // Warm colors
        '#fe841c', '#ff4f7e', '#ff0055', '#ff3300', '#ff9500',
        // Cool colors
        '#00ffdd', '#00ff88', '#4158D0', '#1e90ff', '#7b68ee',
        // Vibrant colors
        '#ff1493', '#00ff00', '#ff00ff', '#ffff00', '#00ffff',
        // Neon colors
        '#39ff14', '#ff2d95', '#ff9933', '#ff3377', '#bf00ff'
    ];
    let noteInterval;
    let currentPattern = 0;
    const patterns = ['pattern-spiral', 'pattern-zigzag', 'pattern-circle', 'pattern-wave'];
    let patternChangeInterval;

    function createFloatingNote() {
        const note = document.createElement('div');
        note.className = `music-note ${patterns[currentPattern]}`;
        
        // Random note symbol
        note.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
        
        // Random position near the play controls
        const playControls = document.querySelector('.playback-controls');
        const rect = playControls.getBoundingClientRect();
        const startX = rect.left + (Math.random() * rect.width);
        const startY = rect.top;
        
        // Random movement - increased range and more upward movement
        const moveX = (Math.random() - 0.5) * 500 + 'px';  // Wider horizontal range
        const moveY = -(window.innerHeight * 0.7 + Math.random() * 200) + 'px';  // Higher vertical movement
        const rotation = (Math.random() - 0.5) * 720 + 'deg';
        
        // Random color
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        note.style.left = startX + 'px';
        note.style.top = startY + 'px';
        note.style.setProperty('--moveX', moveX);
        note.style.setProperty('--moveY', moveY);
        note.style.setProperty('--rotation', rotation);
        note.style.color = color;
        
        document.body.appendChild(note);
        
        // Remove note after animation
        setTimeout(() => {
            note.remove();
        }, 5000);
    }

    function startNoteAnimation() {
        if (!noteInterval) {
            noteInterval = setInterval(createFloatingNote, 200);
            // Start pattern cycling
            patternChangeInterval = setInterval(() => {
                currentPattern = (currentPattern + 1) % patterns.length;
            }, 5000);
        }
    }

    function stopNoteAnimation() {
        if (noteInterval) {
            clearInterval(noteInterval);
            clearInterval(patternChangeInterval);
            noteInterval = null;
            patternChangeInterval = null;
            currentPattern = 0;
        }
    }

    // Add animation control to audio playback
    audioElement.addEventListener('play', startNoteAnimation);
    audioElement.addEventListener('pause', stopNoteAnimation);
    audioElement.addEventListener('ended', stopNoteAnimation);

    // Background gradient animation
    let gradientDegree = 32; // Starting degree from your current CSS
    function animateGradient() {
        gradientDegree = (gradientDegree + 1) % 360; // Increment and reset at 360
        document.documentElement.style.setProperty(
            '--gradient-degree',
            `${gradientDegree}deg`
        );
    }

    // Start the gradient animation
    setInterval(animateGradient, 50); // Update every second

    // State variables
    let isPlaying = false;
    let uploadedFilePath = null;
    let currentCompositionId = null;
    let currentAudioBlob = null;
    let selectedRating = 0;

    // Notification system
    const notification = document.createElement('div');
    notification.className = 'notification';
    document.body.appendChild(notification);

    // Get composition ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const compId = urlParams.get('compId');

    // Load existing composition if editing
    if (compId) {
        try {
            const { data, error } = await supabase
                .from('musicpiecemaster')
                .select('*')
                .eq('music_piece_id', compId)
                .single();

            if (data) {
                promptTextarea.value = data.prompt || '';
                durationInput.value = data.duration || 30;
                if (data.audio_url) {
                    audioElement.src = data.audio_url;
                    currentCompositionId = data.music_piece_id;
                    bookmarkButton.classList.add('active');
                }
            }
        } catch (error) {
            console.error('Error loading composition:', error);
        }
    }

    // File upload setup
    const audioInput = document.createElement('input');
    audioInput.type = 'file';
    audioInput.accept = 'audio/*';
    audioInput.style.display = 'none';
    document.body.appendChild(audioInput);

    addAudioButton.addEventListener('click', () => audioInput.click());

    audioInput.addEventListener('change', async(e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            addAudioButton.disabled = true;
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadResponse = await fetch('https://8080-01jn12c923ggt7x62zr7n2zekz.cloudspaces.litng.ai/upload', {
                method: 'POST',
                body: uploadFormData
            });

            const { file_path } = await uploadResponse.json();
            uploadedFilePath = file_path;
            showNotification('Audio added! Click "Compose Music" for interpolation');
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Error: ${error.message || 'File upload failed'}`);
        } finally {
            addAudioButton.disabled = false;
        }
    });

    // Common names list (most common names across different cultures)
    const commonNames = new Set([
        // English/Western names
        "james", "john", "robert", "michael", "william", "david", "joseph", "thomas", "charles", "mary",
        "patricia", "jennifer", "linda", "elizabeth", "barbara", "susan", "jessica", "sarah", "karen",
        "christopher", "daniel", "paul", "mark", "donald", "george", "kenneth", "steven", "edward", "brian",
        "ronald", "anthony", "kevin", "jason", "matthew", "gary", "timothy", "jose", "larry", "jeffrey",
        "frank", "scott", "eric", "stephen", "andrew", "raymond", "gregory", "joshua", "jerry", "dennis",
        "walter", "patrick", "peter", "harold", "douglas", "henry", "carl", "arthur", "ryan", "roger",
        "margaret", "dorothy", "lisa", "sandra", "ashley", "kimberly", "donna", "emily", "michelle", "carol",
        "amanda", "melissa", "deborah", "stephanie", "rebecca", "laura", "sharon", "cynthia", "kathleen", "amy",
        "angela", "shirley", "anna", "ruth", "brenda", "pamela", "nicole", "katherine", "samantha", "christine",
        "catherine", "virginia", "debra", "rachel", "janet", "emma", "carolyn", "maria", "heather", "diane",
        "julie", "joyce", "victoria", "kelly", "christina", "lauren", "joan", "evelyn", "olivia", "judith",
        "megan", "cheryl", "martha", "andrea", "frances", "hannah", "jacqueline", "ann", "gloria", "jean",
        
        // Arabic names
        "mohammed", "mohammad", "muhammad", "ahmed", "ahmad", "ali", "hassan", "hussein", "ibrahim", "omar",
        "abdullah", "abdul", "rahman", "raheem", "kareem", "karim", "yusuf", "yousef", "youssef", "hamza",
        "bilal", "malik", "malek", "nasser", "nasir", "rashid", "samir", "sameer", "tarek", "tariq",
        "waleed", "walid", "zaid", "zayd", "hakeem", "hakim", "jamal", "jalal", "kader", "qadir",
        "mustafa", "mustapha", "nabil", "nadeem", "nadim", "nadir", "qasim", "rami", "sami", "shadi",
        "aisha", "ayesha", "fatima", "fatema", "khadija", "layla", "leila", "mariam", "maryam", "noor",
        "nur", "raja", "rania", "salma", "sara", "sarah", "yasmin", "yasmeen", "zahra", "zainab",
        "amira", "dalal", "dalia", "farah", "hana", "hanaa", "huda", "karima", "latifa", "lina",
        "malak", "maha", "manal", "mona", "nada", "nahla", "naima", "rasha", "reem", "rowan",
        "sabah", "sahar", "samira", "sanaa", "shahd", "shaima", "wafa", "zaina", "zaynab", "asma",

        // Common nicknames and shortened names
        "alex", "sam", "chris", "pat", "tony", "joe", "mike", "tom", "jim", "bob",
        "nick", "rick", "dave", "steve", "andy", "dan", "fred", "greg", "jack", "jeff",
        "kate", "liz", "meg", "pam", "sue", "tim", "vic", "will", "zack", "ben"
    ]);

    // Prompt validation functions
    function isNumbersOnly(text) {
        return /^\d+$/.test(text.replace(/\s/g, ''));
    }

    function hasMinimumWords(text, minWords = 3) {
        const words = text.trim().split(/\s+/);
        return words.length >= minWords;
    }

    function isMostlyNames(text) {
        const words = text.toLowerCase().trim().split(/\s+/);
        const nameCount = words.filter(word => commonNames.has(word)).length;
        
        // If more than 50% of words are names, consider it invalid
        return (nameCount / words.length) > 0.5;
    }

    function isGibberish(text) {
        // Check for repeated characters
        if (/(.)\1{4,}/.test(text)) return true;
        
        // Check for lack of vowels in words
        const words = text.trim().split(/\s+/);
        const noVowelWords = words.filter(word => 
            word.length > 2 && !/[aeiou]/i.test(word)
        );
        
        // If more than 30% of words have no vowels, likely gibberish
        if (noVowelWords.length / words.length > 0.3) return true;

        // Check for random character sequences
        const randomCharPattern = /[^a-zA-Z0-9\s]{3,}/;
        if (randomCharPattern.test(text)) return true;

        return false;
    }

    function validatePrompt(prompt) {
        if (!prompt) {
            return { isValid: false, message: "Please enter a prompt!" };
        }

        if (isNumbersOnly(prompt)) {
            return { isValid: false, message: "Prompt cannot contain only numbers!" };
        }

        if (!hasMinimumWords(prompt)) {
            return { isValid: false, message: "Prompt must contain at least 3 words!" };
        }

        if (isMostlyNames(prompt)) {
            return { isValid: false, message: "Prompt cannot be primarily composed of names. Please describe the music you want to generate!" };
        }

        if (isGibberish(prompt)) {
            return { isValid: false, message: "Please enter a meaningful prompt with real words!" };
        }

        return { isValid: true };
    }

    // Generate music handler
    generateButton.addEventListener('click', async() => {
        const prompt = promptTextarea.value.trim();
        const duration = parseInt(durationInput.value);

        const validation = validatePrompt(prompt);
        if (!validation.isValid) {
            showNotification(validation.message);
            return;
        }

        if (duration < 10 || duration > 120) {
            showNotification("Duration must be between 10 and 120 seconds!");
            return;
        }

        try {
            loadingContainer.classList.add('loading-active');
            generateButton.disabled = true;

            // Generate music via API
            const endpoint = uploadedFilePath ? '/interpolation' : '/predict';
            const requestBody = uploadedFilePath ? {
                prompt,
                duration,
                file_path: uploadedFilePath
            } : { prompt, duration, chunked: true };

            // Choose base URL depending on endpoint
            let baseUrl;
            if (endpoint === '/predict') {
                baseUrl = 'https://8080-01jn12c923ggt7x62zr7n2zekz.cloudspaces.litng.ai';
            } else {
                baseUrl = 'https://8080-01jn12c923ggt7x62zr7n2zekz.cloudspaces.litng.ai';
            }

            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error("Failed to generate music");

            currentAudioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(currentAudioBlob);
            audioElement.src = audioUrl;

            showNotification('Music generated successfully!');
            resetPlayback();
            audioElement.play();
            isPlaying = true;
            playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
            bookmarkButton.classList.remove('active');

            // Reset bookmark icon to regular when generating new music
            bookmarkButton.classList.remove('fa-solid');
            bookmarkButton.classList.add('fa-regular');
            bookmarkButton.classList.remove('active');

        } catch (error) {
            console.error('Error:', error);
            showNotification('An error occurred during generation.');
        } finally {
            loadingContainer.classList.remove('loading-active');
            generateButton.disabled = false;
        }
    });

    // Save composition handler with redirect
    bookmarkButton.addEventListener('click', async() => {
        if (!currentAudioBlob && !compId) {
            showNotification('Generate music first!');
            return;
        }
        try {
            const prompt = promptTextarea.value.trim();
            const duration = parseInt(durationInput.value);
            const userId = sessionStorage.getItem('userId');

            if (!userId) {
                showNotification('Please login to save compositions');
                return;
            }

            // Fetch composer_id
            const { data: composerData, error: composerError } = await supabase
                .from('composer')
                .select('composer_id')
                .eq('user_id', userId)
                .single();

            if (composerError) throw new Error('Composer not found. Please contact support.');

            const composerId = composerData.composer_id;

            // Upload audio if new
            let publicUrl = audioElement.src;
            if (currentAudioBlob) {
                const fileName = `${Date.now()}-${prompt.slice(0, 20)}.mp3`;
                const { error: uploadError } = await supabase.storage
                    .from('music-files')
                    .upload(fileName, currentAudioBlob);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('music-files')
                    .getPublicUrl(fileName);
                publicUrl = urlData.publicUrl;
            }

            // Prepare composition data
            const compositionData = {
                title: prompt.substring(0, 50),
                prompt: prompt,
                duration: duration,
                audio_oid: publicUrl,
                composer_id: composerId
            };

            if (compId) {
                // Update existing
                await supabase
                    .from('musicpiecemaster')
                    .update(compositionData)
                    .eq('music_piece_id', compId);
                showNotification('Composition updated!');
            } else {
                // Create new
                const { data: newComp, error: insertError } = await supabase
                    .from('musicpiecemaster')
                    .insert([compositionData])
                    .select()
                    .single();
                if (insertError) throw insertError;

                currentCompositionId = newComp.music_piece_id;
                showNotification('Composition saved!');
            }

            // Change bookmark icon from regular to solid
            bookmarkButton.classList.remove('fa-regular');
            bookmarkButton.classList.add('fa-solid');
            bookmarkButton.classList.add('active');
            currentAudioBlob = null;

            // Show feedback modal after successful save
            showFeedbackModal();

        } catch (error) {
            console.error('Save error:', error);
            showNotification(`Error saving: ${error.message}`);
        }
    });

    // Playback controls
    playPauseButton.addEventListener('click', () => togglePlayback());
    audioElement.addEventListener('timeupdate', updateProgress);

    // Mute/unmute control
    muteButton.addEventListener('click', function() {
        audioElement.muted = !audioElement.muted;
        muteButton.innerHTML = audioElement.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    });
    // Add this for seeking functionality
    document.querySelector('.progress-bar').addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percent = x / width;
        if (!isNaN(audioElement.duration)) {
            audioElement.currentTime = percent * audioElement.duration;
        }
    });

    // Helper functions
    function showNotification(message, persist = false) {
        notification.textContent = message;
        notification.classList.add('show');
        if (!persist) setTimeout(() => notification.classList.remove('show'), 3000);
    }

    function togglePlayback() {
        isPlaying = !isPlaying;
        audioElement[isPlaying ? 'play' : 'pause']();
        playPauseButton.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }

    function updateProgress() {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressBar.style.width = `${progress}%`;
        trackTime.textContent = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;
    }

    function resetPlayback() {
        progressBar.style.width = '0%';
        trackTime.textContent = '00:00 / 00:00';
        isPlaying = false;
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Prompt examples functionality
    document.querySelectorAll('.prompt-example div').forEach(div => {
        div.addEventListener('click', function() {
            const prompt = this.querySelector('p').textContent;
            promptTextarea.value = prompt;
            promptTextarea.focus();
            showNotification('Prompt copied to input!');
        });
    });

    // Feedback modal elements
    const feedbackModal = document.getElementById('feedback-modal');
    const closeFeedbackBtn = document.getElementById('close-feedback-btn');
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
    const skipFeedbackBtn = document.getElementById('skip-feedback-btn');

    // Function to show feedback modal
    function showFeedbackModal() {
        feedbackModal.classList.add('active');
    }

    // Function to redirect to dashboard
    function redirectToDashboard(seconds = 3) {
        showNotification(`Redirecting to dashboard in ${seconds} seconds...`);
        setTimeout(() => {
            window.location.href = 'user_dashboard.html';
        }, seconds * 1000);
    }

    // Add event listeners for rating buttons
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove selected class from all buttons
            document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
            // Add selected class to clicked button
            btn.classList.add('selected');
            selectedRating = parseInt(btn.dataset.value);
        });
    });

    // Handle feedback submission
    async function handleFeedback() {
        if (selectedRating === 0) {
            alert('Please select a rating before submitting.');
            return;
        }
        try {
            const userId = sessionStorage.getItem('userId');
            if (!userId) {
                showNotification('Please login to submit feedback');
                return;
            }

            // Get composer_id
            const { data: composerData, error: composerError } = await supabase
                .from('composer')
                .select('composer_id')
                .eq('user_id', userId)
                .single();

            if (composerError) throw new Error('Composer not found. Please contact support.');

            // Insert feedback into Supabase
            const { error: feedbackError } = await supabase
                .from('feedbackform')
                .insert([{
                    composer_id: composerData.composer_id,
                    fb_details: selectedRating.toString(),
                    submission_time: new Date().toISOString()
                }]);
            if (feedbackError) throw feedbackError;
            // Close the modal
            document.getElementById('feedback-modal').classList.remove('active');
            // Show success notification
            showNotification('Thank you for your rating!');
            // Reset the form
            selectedRating = 0;
            document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('selected'));
            // Redirect to dashboard after feedback submission
            redirectToDashboard();
        } catch (error) {
            console.error('Error submitting rating:', error);
            showNotification('Error submitting rating. Please try again.');
        }
    }

    // Event listeners for feedback modal
    submitFeedbackBtn.addEventListener('click', handleFeedback);
    skipFeedbackBtn.addEventListener('click', () => {
        feedbackModal.classList.remove('active');
        redirectToDashboard();
    });
    closeFeedbackBtn.addEventListener('click', () => {
        feedbackModal.classList.remove('active');
        redirectToDashboard();
    });

    const presets = {
        default: {
            top_k: 250.0,
            top_p: 0.0,
            temperature: 1.0,
            cfg_coef: 3.0,
            two_step_cfg: 0,
            extend_stride: 18
        },
        creative: {
            top_k: 100,
            top_p: 90,
            temperature: 15,
            cfg_coef: 4.5,
            two_step_cfg: 0,
            extend_stride: 20
        },
        precise: {
            top_k: 400,
            top_p: 10,
            temperature: 5,
            cfg_coef: 2,
            two_step_cfg: 1,
            extend_stride: 15
        }
    };
    
    function loadPreset(type) {
        const preset = presets[type];
        
        document.getElementById('top-k').value = preset.top_k;
        document.getElementById('top-p').value = preset.top_p;
        document.getElementById('temperature').value = preset.temperature;
        document.getElementById('cfg-coef').value = preset.cfg_coef;
        document.getElementById('two-step-cfg').value = preset.two_step_cfg;
        document.getElementById('extend-stride').value = preset.extend_stride;
    
        document.querySelectorAll('input[type="range"]').forEach(element => {
            element.dispatchEvent(new Event('input'));
        });
    }
    

    // Update save button click handler
    document.querySelector('.save-btn').addEventListener('click', async() => {
        try {
            const settings = {
                top_k: parseInt(document.getElementById('top-k').value),
                top_p: parseFloat(document.getElementById('top-p').value)   ,
                temperature: parseFloat(document.getElementById('temperature').value),
                cfg_coef: parseFloat(document.getElementById('cfg-coef').value),
                two_step_cfg: !!parseInt(document.getElementById('two-step-cfg').value),
                extend_stride: parseInt(document.getElementById('extend-stride').value)
            };

            console.log('Saving settings locally:', settings);

            // Send the parameters to the FastAPI /set-params endpoint
            const response = await fetch('https://8080-01jn12c923ggt7x62zr7n2zekz.cloudspaces.litng.ai/set-params', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Server response:', data);
            showNotification('Settings saved successfully!');
        } catch (err) {
            console.error('Failed to set parameters:', err);
            alert('Error saving settings via API. See console for details.');
        }
    });

    // Add event listeners for all range inputs
    document.querySelectorAll('input[type="range"]').forEach(element => {
        element.addEventListener('input', updateDisplay);
    });

    function updateDisplay(event) {
        const element = event.target;
        const displayElement = document.getElementById(`${element.id}-value`);
        const rawValue = parseFloat(element.value);
        
        // Handle boolean sliders
        if(element.id === 'use-sampling' || element.id === 'two-step-cfg') {
            displayElement.textContent = rawValue ? 'True' : 'False';
            return;
        }
        
        if(element.id === 'temperature') {
            displayElement.textContent = rawValue.toFixed(1);
        } else if(element.id === 'top-p') {
            displayElement.textContent = (rawValue / 100).toFixed(2);
        } else {
            displayElement.textContent = rawValue.toFixed(1);
        }
    }

    // Add preset button handler
    document.querySelector('.preset-button').addEventListener('click', () => {
        loadPreset('default');
        showNotification('Default settings loaded!');
    });
});