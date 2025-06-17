// Add at the top of the file with other imports
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase configuration
const SUPABASE_URL = 'https://pcaiuorgyybjupibnqxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWl1b3JneXlianVwaWJucXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMjc2MTUsImV4cCI6MjA1OTgwMzYxNX0.7sPShr6J4oa7nQ-MFjXmVUghB-ORNW5n97l3rHWMAls';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
        header.parentElement.classList.toggle('open');
    });
});

// ====================================================
// Global Variables & Node References
// ====================================================
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioBuffer = null,
    sourceNode = null;
const analyserNode = audioContext.createAnalyser();
analyserNode.fftSize = 2048;
const gainNode = audioContext.createGain();
// Add with other global variables at the top
let bitDepth = 16;
let bitDepthSlider = null;
let bitDepthValue = null;
// Effects Nodes (initialized in initEffects)
let compressorNode = null,
    delayNode = null,
    delayFeedbackGain = null,
    delayDryGain = null,
    delayWetGain = null,
    delayMixer = null,
    chorusDelayNode = null,
    chorusOscillator = null,
    chorusDepthGain = null,
    chorusDryGain = null,
    chorusWetGain = null,
    chorusMixer = null,
    chorusToggle = null,
    stereoSplitter = null,
    leftGain = null,
    rightGain = null,
    rightDelay = null,
    stereoMerger = null,
    pannerNode = null,
    masterFilter = null,
    convolver = null,
    dryGain = null,
    wetGain = null;
// New effect nodes
let bitcrusherNode = null,
    bitcrusherGain = null,
    eqLowNode = null,
    eqMidNode = null,
    eqHighNode = null,
    tremoloNode = null,
    tremoloGain = null,
    tremoloOsc = null,
    phaserNodes = [],
    phaserLFO = null,
    phaserFeedback = null,
    gateNode = null,
    // Gate-related controls and variables
    gateToggle = null,
    gateThresholdSlider = null,
    gateAttackSlider = null,
    gateReleaseSlider = null,
    gateThresholdValue = null,
    gateAttackValue = null,
    gateReleaseValue = null,
    gateAnalyser = null,
    gateUpdateRAF = null;

let loopEnabled = false; // for looping
let enabledChannels = [];
let gl, shaderProgram, vertexBuffer;
let waveformColor = document.getElementById('waveformColor')?.value || '#39a57a'; // Default color
let fftBarColor = document.getElementById('fftColor')?.value || '#4CAF50'; // Default color
let zoomLevel = 1,
    panOffset = 0;
let fftAnimationFrame = null; // Track FFT animation frame
let isDragging = false,
    dragStartX = 0,
    initialPanOffset = 0;
let selectionMode = false,
    isSelecting = false;
let selectionStartX = 0,
    selectionEndX = 0;

// Undo/Redo Stacks
let undoStack = [];
let redoStack = [];
const MAX_UNDO_STEPS = 20; // Limit memory usage

// Copied Region
let copiedRegion = null;

// Path for AI Server
let uploadedFilePath = null;

// Playback State
let isPlaying = false,
    startTime = 0,
    pauseTime = 0;

// ====================================================
// UI Element References
// ====================================================
const canvas = document.getElementById('canvas');
const progressMarker = document.getElementById('progress');
const timeMarkersDiv = document.getElementById('timeMarkers');
const fftCanvas = document.getElementById('fftCanvas');
const fftCtx = fftCanvas?.getContext('2d'); // Add null check
const channelControlsDiv = document.getElementById('channelControls');
const volumeMeterDiv = document.getElementById('volumeMeter');
const mainContainer = document.getElementById('mainContainer');
const waveformContainer = document.getElementById('waveformContainer');
const selectionOverlay = document.getElementById('selectionOverlay');

// Playback controls
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');
const muteBtn = document.getElementById('muteBtn');
const resetZoomBtn = document.getElementById('resetZoomBtn');
const exportImageBtn = document.getElementById('exportBtn'); // Renamed for clarity
const fullscreenBtn = document.getElementById('fullscreenBtn');

// Apply Changes Button (for rendering processed audio)
const applyChangesBtn = document.getElementById('applyChangesBtn');

// Undo/Redo Buttons
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

// Seek Buttons
const seekBackwardBtn = document.getElementById('seekBackwardBtn');
const seekForwardBtn = document.getElementById('seekForwardBtn');

// Copy/Paste Buttons
const copyBtn = document.getElementById('copyBtn');
const pasteBtn = document.getElementById('pasteBtn');

// Save Version Button
const saveVersionBtn = document.getElementById('saveVersionBtn');

// Basic parameter controls
const playbackRateSlider = document.getElementById('playbackRate');
const playbackRateValue = document.getElementById('playbackRateValue');
const pitchSlider = document.getElementById('pitch');
const pitchValue = document.getElementById('pitchValue');
const volumeSlider = document.getElementById('volume');
const volumeValue = document.getElementById('volumeValue');
const filterSlider = document.getElementById('filter');
const filterValue = document.getElementById('filterValue');
const panningSlider = document.getElementById('panning');
const panValue = document.getElementById('panValue');

// Reverb controls
const reverbToggle = document.getElementById('reverbToggle');
const reverbMix = document.getElementById('reverbMix');
const reverbMixValue = document.getElementById('reverbMixValue');
const reverbDecay = document.getElementById('reverbDecay');
const reverbDecayValue = document.getElementById('reverbDecayValue');

// Delay controls
const delayTimeSlider = document.getElementById('delayTime');
const delayTimeValue = document.getElementById('delayTimeValue');
const delayFeedbackSlider = document.getElementById('delayFeedback');
const delayFeedbackValue = document.getElementById('delayFeedbackValue');
const delayMixSlider = document.getElementById('delayMix');
const delayMixValue = document.getElementById('delayMixValue');

// Chorus / Flanger controls
const chorusTypeSelect = document.getElementById('chorusType'); // Type select not used in current logic
const chorusRateSlider = document.getElementById('chorusRate');
const chorusRateValue = document.getElementById('chorusRateValue');
const chorusDepthSlider = document.getElementById('chorusDepth');
const chorusDepthValue = document.getElementById('chorusDepthValue');
const chorusMixSlider = document.getElementById('chorusMix');
const chorusMixValue = document.getElementById('chorusMixValue');

// Compressor controls
const compressorThresholdSlider = document.getElementById('compressorThreshold');
const compressorThresholdValue = document.getElementById('compressorThresholdValue');
const compressorRatioSlider = document.getElementById('compressorRatio');
const compressorRatioValue = document.getElementById('compressorRatioValue');
const compressorAttackSlider = document.getElementById('compressorAttack');
const compressorAttackValue = document.getElementById('compressorAttackValue');
const compressorReleaseSlider = document.getElementById('compressorRelease');
const compressorReleaseValue = document.getElementById('compressorReleaseValue');

// Stereo Widener controls
const stereoWidenerToggle = document.getElementById('stereoWidenerToggle');
const stereoWidenerSlider = document.getElementById('stereoWidener');
const stereoWidenerValue = document.getElementById('stereoWidenerValue');

// Automation (placeholder)
const automationToggle = document.getElementById('automationToggle');

// Looping / Slicing controls
const loopToggleBtn = document.getElementById('loopToggle');
const loopStatusSpan = document.getElementById('loopStatus');

// Region Selection / Trim controls
const toggleSelectBtn = document.getElementById('toggleSelectBtn');
const selectionInfo = document.getElementById('selectionInfo');
const trimBtn = document.getElementById('trimBtn');

// Notification System
const notification = document.createElement('div');
notification.className = 'notification';
document.body.appendChild(notification);

/**
 * Shows a notification message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('info', 'success', 'error')
 * @param {boolean} persist - Whether the notification should persist until manually cleared
 */
function showNotification(message, type = 'info', persist = false) {
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    if (!persist) {
        if (notification.timeoutId) {
            clearTimeout(notification.timeoutId);
        }
        notification.timeoutId = setTimeout(() => {
            notification.classList.remove('show');
            notification.timeoutId = null;
        }, 3000);
    } else {
        if (notification.timeoutId) {
            clearTimeout(notification.timeoutId);
            notification.timeoutId = null;
        }
    }
}

// AI Generation Prompt Area
const promptTextarea = document.getElementById('prompt-textarea'); // Assuming this ID exists
const composeBtn = document.querySelector('.compose'); // Assuming this class exists
const addAudioBtn = document.querySelector('.add-audio'); // Assuming this class exists

// Loading Overlay (for AI generation)
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay'; // Requires CSS for styling
loadingOverlay.innerHTML = `
    <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Generating your audio...</div>
    </div>`;
// Appended to body when needed

// File Input for manual uploads
const audioInput = document.getElementById('audioInput');

// Initialize upload button functionality
document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('audioInput').click();
});

/**
 * Handles audio buffer cleanup and state reset
 */
function cleanupAudioBuffer() {
    if (sourceNode) {
        try {
            sourceNode.onended = null;
            sourceNode.stop();
            sourceNode.disconnect();
        } catch(e) {
            console.warn('Error cleaning up source node:', e);
        }
        sourceNode = null;
    }
    if (isPlaying) {
        isPlaying = false;
        if (playPauseBtn) playPauseBtn.textContent = 'Play';
        pauseTime = 0;
    }
    updateProgress();
}

/**
 * Loads and decodes an audio file
 * @param {File} file - The audio file to load
 * @returns {Promise<AudioBuffer>} The decoded audio buffer
 */
async function loadAudioFile(file) {
    try {
        showNotification('Loading audio file...', 'info');
        
        const url = URL.createObjectURL(file);
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        const decodedData = await audioContext.decodeAudioData(arrayBuffer);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        return decodedData;
    } catch (error) {
        console.error('Error loading audio file:', error);
        showNotification('Error loading audio file: ' + error.message, 'error');
        throw error;
    }
}

// Update the audio input handler
document.getElementById('audioInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Clean up existing audio
        cleanupAudioBuffer();
        
        // Load new audio
        audioBuffer = await loadAudioFile(file);
        
        // Reset controls and visualizations
        resetAllControlsToDefault();
        await buildAudioGraph();
        enablePlaybackControls();
        renderWaveform();
        
        showNotification('Audio file loaded successfully!', 'success');
    } catch (error) {
        console.error('Error in audio input handler:', error);
        disableAllControls();
        audioBuffer = null;
        renderWaveform();
    }
});

// Initialize download button functionality
document.getElementById('downloadBtn').addEventListener('click', async () => {
    if (!audioBuffer) {
        showNotification('No audio loaded to download', 'error');
        return;
    }

    try {
        showNotification('Preparing download...', 'info');
        
        // Convert AudioBuffer to WAV Blob
        const wavBlob = audioBufferToWavBlob(audioBuffer);
        
        if (!wavBlob) {
            throw new Error('Failed to create WAV file');
        }
        
        // Create download link
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `audio-${timestamp}.wav`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('Download started!', 'success');
    } catch (error) {
        console.error('Error downloading audio:', error);
        showNotification('Error preparing download. Please try again.', 'error');
    }
});

// ====================================================
// Utility Functions
// ====================================================

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

// Get current Music Piece ID from URL
function getMusicPieceIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('piece_id');
}

// ====================================================
// WebGL & Waveform Rendering Setup
// ====================================================
/**
 * WebGL shader sources
 */
const SHADER_SOURCES = {
    vertex: `
        attribute vec2 aPosition;
        uniform vec2 uResolution;
        void main() {
            vec2 zeroToOne = aPosition / uResolution;
            vec2 clipSpace = zeroToOne * 2.0 - 1.0;
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        }
    `,
    fragment: `
        precision mediump float;
        uniform vec4 uColor;
        void main() { gl_FragColor = uColor; }
    `
};

/**
 * Initializes WebGL context and shaders
 * @returns {boolean} Whether initialization was successful
 */
function initWebGL() {
    if (!canvas) {
        console.error("Canvas element not found for WebGL init.");
        return false;
    }

    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        showNotification("WebGL not available in your browser.", "error");
        return false;
    }

    try {
        // Create and compile shaders
        const vertexShader = compileShader(gl, SHADER_SOURCES.vertex, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(gl, SHADER_SOURCES.fragment, gl.FRAGMENT_SHADER);
        
        if (!vertexShader || !fragmentShader) {
            return false;
        }

        // Create and link program
        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            throw new Error("Shader program failed to link: " + gl.getProgramInfoLog(shaderProgram));
        }

        // Clean up shaders after linking
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        // Set up program and buffer
        gl.useProgram(shaderProgram);
        vertexBuffer = gl.createBuffer();

        return true;
    } catch (error) {
        console.error("WebGL initialization error:", error);
        showNotification("Error initializing WebGL: " + error.message, "error");
        return false;
    }
}

/**
 * Compiles a WebGL shader
 * @param {WebGLRenderingContext} gl - The WebGL context
 * @param {string} source - The shader source code
 * @param {number} type - The shader type (VERTEX_SHADER or FRAGMENT_SHADER)
 * @returns {WebGLShader|null} The compiled shader or null if compilation failed
 */
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const shaderType = type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
        const error = gl.getShaderInfoLog(shader);
        console.error(`${shaderType} shader compile error:`, error);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function renderWaveform() {
    if (!gl || !canvas || canvas.width === 0 || canvas.height === 0) {
        // Clear canvas if no buffer or invalid state
        if (gl) {
            gl.clearColor(0.1, 0.1, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        // Clear time markers too
        if (timeMarkersDiv) timeMarkersDiv.innerHTML = '';
        return;
    }
    if (!audioBuffer) {
        // Clear canvas if buffer is null
        gl.clearColor(0.1, 0.1, 0.1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
         if (timeMarkersDiv) timeMarkersDiv.innerHTML = '';
        return
    }


    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const resolutionLocation = gl.getUniformLocation(shaderProgram, "uResolution");
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    const rgb = hexToRgb(waveformColor);
    const colorLocation = gl.getUniformLocation(shaderProgram, "uColor");
    gl.uniform4f(colorLocation, rgb.r / 255, rgb.g / 255, rgb.b / 255, 1.0);

    const posAttrib = gl.getAttribLocation(shaderProgram, "aPosition");
    gl.enableVertexAttribArray(posAttrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    let vertices = [];
    let enabledIndices = [];
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        // Default to enabled if array hasn't been initialized for this channel yet
        if (enabledChannels[ch] === undefined || enabledChannels[ch]) {
            enabledIndices.push(ch);
        }
    }

    // If all channels are disabled (or buffer just loaded), render all
    if (enabledIndices.length === 0 && audioBuffer.numberOfChannels > 0) {
         for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) enabledIndices.push(ch);
    }

    const numEnabled = enabledIndices.length;
    if (numEnabled === 0) return; // Nothing to render

    const channelHeight = canvas.height / numEnabled;
    const samplesPerPixel = zoomLevel; // Samples represented by one horizontal pixel

    enabledIndices.forEach((ch, idx) => {
        const data = audioBuffer.getChannelData(ch);
        const channelTopY = idx * channelHeight;
        const channelCenterY = channelTopY + channelHeight / 2;

        // Calculate visible sample range
        const viewStartSample = Math.max(0, Math.floor(panOffset));
        const viewEndSample = Math.min(data.length, Math.floor(panOffset + canvas.width * samplesPerPixel));

        for (let x = 0; x < canvas.width; x++) {
            const startSample = Math.floor(panOffset + x * samplesPerPixel);
            const endSample = Math.min(data.length, Math.floor(panOffset + (x + 1) * samplesPerPixel));

            // Skip if the range is invalid or outside the buffer
            if (endSample <= startSample || startSample >= data.length) continue;

            let min = 1.0, max = -1.0;
            // Optimize: Only iterate over samples relevant to this pixel column
            const firstSampleInCol = Math.max(0, startSample);
            const lastSampleInCol = Math.min(data.length, endSample);

            for (let i = firstSampleInCol; i < lastSampleInCol; i++) {
                const sample = data[i];
                if (sample < min) min = sample;
                if (sample > max) max = sample;
            }

            // Clamp min/max if no samples were found in range (can happen at edges)
            if (min > max) { min = 0; max = 0; }

            const yTop = channelCenterY - (max * (channelHeight / 2));
            const yBottom = channelCenterY - (min * (channelHeight / 2));

            vertices.push(x + 0.5, yTop); // Add 0.5 for sharper lines
            vertices.push(x + 0.5, yBottom);
        }
    });

    if (vertices.length > 0) {
        const vertexArray = new Float32Array(vertices);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

        const pointsPerChannel = vertices.length / numEnabled / 2; // 2 vertices per point (x,y)
        for (let i = 0; i < numEnabled; i++) {
            // Draw each channel's segment
             gl.drawArrays(gl.LINES, i * pointsPerChannel, pointsPerChannel);
        }
    }
     // Update time markers whenever waveform is re-rendered
    drawTimeMarkers();
}


function drawTimeMarkers() {
    if (!timeMarkersDiv || !canvas || canvas.width === 0) return;
    timeMarkersDiv.innerHTML = ''; // Clear previous markers
    if (!audioBuffer || audioBuffer.sampleRate <=0) return; // Exit if no buffer or invalid sample rate

    const visibleSamples = canvas.width * zoomLevel;
    const visibleDuration = visibleSamples / audioBuffer.sampleRate;
    const startTimeSec = panOffset / audioBuffer.sampleRate;
    const endTimeSec = startTimeSec + visibleDuration;

    // Determine a suitable time interval for markers (e.g., aiming for markers every 60-120 pixels)
    let interval = 0.01; // Start with small interval
    const minPxPerMarker = 60;
    const intervals = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600]; // Common intervals in seconds
    for(let i=0; i < intervals.length; i++){
        interval = intervals[i];
         if (visibleDuration <= 0) break; // Avoid division by zero
        const pxPerInterval = (interval / visibleDuration) * canvas.width;
        if(pxPerInterval > minPxPerMarker) break;
    }

    // Calculate the first marker time visible in the view
    let markerTime = interval > 0 ? Math.ceil(startTimeSec / interval) * interval : startTimeSec;

    // Limit number of markers drawn for performance
    let markersDrawn = 0;
    const maxMarkers = 200;

    while (markerTime < endTimeSec && markersDrawn < maxMarkers) {
        const timeOffset = markerTime - startTimeSec;
        // Only draw if within the visible duration
        if (timeOffset >= 0 && timeOffset <= visibleDuration) {
             const x = (timeOffset / visibleDuration) * canvas.width;

             // Don't draw if too close to the left edge
             if (x >= 0 && x < canvas.width) { // Ensure it's within canvas bounds
                let marker = document.createElement('div');
                marker.className = 'time-marker-line'; // Use class for styling
                marker.style.position = 'absolute';
                marker.style.left = x + 'px';
                marker.style.top = '0';
                marker.style.width = '1px';
                marker.style.height = '100%';
                marker.style.background = 'rgba(255,255,255,0.3)'; // Lighter color
                timeMarkersDiv.appendChild(marker);

                 // Only add label if there's enough space (avoid clutter)
                 if (interval / visibleDuration * canvas.width > 30) { // Label threshold
                    let label = document.createElement('div');
                    label.className = 'time-marker-label'; // Use class for styling
                    label.style.position = 'absolute';
                    label.style.left = (x + 3) + 'px'; // Offset label slightly
                    label.style.bottom = '2px';
                    label.style.color = 'rgba(255,255,255,0.7)';
                    label.style.fontSize = '10px';
                    // Format time nicely (e.g., M:SS.ms or S.ms)
                     const minutes = Math.floor(markerTime / 60);
                     const seconds = markerTime % 60;
                     if (minutes > 0) {
                         label.textContent = `${minutes}:${seconds.toFixed(0).padStart(2, '0')}`;
                     } else {
                         label.textContent = markerTime.toFixed(markerTime < 1 ? 2 : (markerTime < 10 ? 1 : 0)) + 's';
                     }

                    timeMarkersDiv.appendChild(label);
                 }
                markersDrawn++;
             }
        }
         // Ensure we always move forward, prevent infinite loops with tiny intervals
        if (interval <= 0) break; // Safety break for zero or negative interval
        markerTime += interval;
    }
}

function updateProgress() {
    if (!progressMarker) return; // Element check
    if (!isPlaying || !audioBuffer || !sourceNode || audioBuffer.duration <= 0) {
         progressMarker.style.display = 'none'; // Hide if not playing or no buffer
         return;
     }

    // Calculate current time considering looping
    let currentTime = (audioContext.currentTime - startTime);
    if (loopEnabled && audioBuffer.duration > 0) { // Check duration > 0 for modulo
        currentTime %= audioBuffer.duration;
    }

    // If paused, use pauseTime
    if (!isPlaying && pauseTime >= 0) { // Use pauseTime if explicitly paused
        currentTime = pauseTime;
    }

    // Ensure currentTime is within buffer bounds
    currentTime = Math.max(0, Math.min(currentTime, audioBuffer.duration));

    // Calculate position based on current view (pan and zoom)
    const currentSample = currentTime * audioBuffer.sampleRate;
    const visibleStartSample = panOffset;
    const visibleEndSample = panOffset + canvas.width * zoomLevel;

    if (currentSample >= visibleStartSample && currentSample <= visibleEndSample && canvas.width > 0 && zoomLevel > 0) {
         const x = ((currentSample - visibleStartSample) / (canvas.width * zoomLevel)) * canvas.width;
        progressMarker.style.left = x + 'px';
        progressMarker.style.display = 'block'; // Show marker
    } else {
        progressMarker.style.display = 'none'; // Hide if outside view
    }


    if (isPlaying) {
        requestAnimationFrame(updateProgress);
    }
}



function animateFFT() {
    if (!analyserNode || !fftCanvas || !fftCtx) return;
    // Only run if playing or explicitly requested while paused
    if(!isPlaying && pauseTime === 0) {
        // Clear the canvas when stopped
        fftCtx.fillStyle = '#1a1a1a';
        fftCtx.fillRect(0, 0, fftCanvas.width, fftCanvas.height);
        return;
    }

    // Store the animation frame ID
    fftAnimationFrame = requestAnimationFrame(animateFFT);

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    fftCtx.fillStyle = '#1a1a1a'; // Background
    fftCtx.fillRect(0, 0, fftCanvas.width, fftCanvas.height);

    const barWidth = (fftCanvas.width / bufferLength) * 2.5;
    let x = 0;
    const heightScale = fftCanvas.height;

    // Time-based color cycling
    const time = Date.now() * 0.001;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255.0) * heightScale;
        
        // Create dynamic rainbow effect
        const hue = (time * 50 + i * 360 / bufferLength) % 360;
        const saturation = 80 + Math.sin(time + i * 0.1) * 20;
        const lightness = 50 + (dataArray[i] / 255.0) * 20;
        
        // Create gradient for each bar
        const gradient = fftCtx.createLinearGradient(x, fftCanvas.height - barHeight, x, fftCanvas.height);
        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`);
        gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${Math.max(20, lightness - 30)}%, 0.9)`);
        
        // Add neon glow effect
        fftCtx.shadowBlur = 15;
        fftCtx.shadowColor = `hsla(${hue}, ${saturation}%, 50%, 0.5)`;
        
        fftCtx.fillStyle = gradient;
        fftCtx.fillRect(x, fftCanvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
    }
    
    fftCtx.shadowBlur = 0;
}

stopBtn?.addEventListener('click', function() {
    if (sourceNode) {
        try {
            sourceNode.onended = null;
            sourceNode.stop();
            sourceNode.disconnect();
        } catch(e) { /* Ignore */ }
        sourceNode = null;
    }
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.textContent = 'Play';
    pauseTime = 0;
    updateProgress();
});

function updateVolumeMeter() {
     if (!analyserNode || !volumeMeterDiv) return;
     // Only run if playing or explicitly requested while paused
    if(!isPlaying && pauseTime === 0) {
        volumeMeterDiv.textContent = "Input Level: --- dB";
        return; // Stop if fully stopped
    }

    requestAnimationFrame(updateVolumeMeter); // Keep updating

    const bufferLength = analyserNode.fftSize; // Use fftSize for time domain
    const timeDomainData = new Float32Array(bufferLength);
    analyserNode.getFloatTimeDomainData(timeDomainData);

    // Calculate RMS (Root Mean Square)
    let sumOfSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
        sumOfSquares += timeDomainData[i] * timeDomainData[i];
    }
    const rms = Math.sqrt(sumOfSquares / bufferLength);

    // Convert RMS to dBFS (decibels relative to full scale)
    // Clamp RMS to avoid log10(0) which is -Infinity
    const dB = 20 * Math.log10(Math.max(rms, 1e-9)); // Use a small epsilon (approx -180 dB)

    // Display the dB value, handle -Infinity case
    volumeMeterDiv.textContent = "Input Level: " + (dB <= -180 ? "-inf" : dB.toFixed(1)) + " dB";
}

// ====================================================
// Effects Initialization (Neutral Settings)
// ====================================================
/**
 * Audio effect node configurations
 */
const EFFECT_CONFIGS = {
    compressor: {
        threshold: -24,
        knee: 30,
        ratio: 12,
        attack: 0.003,
        release: 0.25
    },
    delay: {
        time: 0.3,
        feedback: 0.3,
        mix: 0.3
    },
    chorus: {
        rate: 1.5,
        depth: 0.002,
        mix: 0.5
    },
    gate: {
        threshold: -50,
        attack: 0.01,
        release: 0.1
    }
};

/**
 * Initializes all audio effect nodes
 * @returns {Promise<void>}
 */
async function initEffects() {
    try {
        // Create compressor
        compressorNode = audioContext.createDynamicsCompressor();
        Object.entries(EFFECT_CONFIGS.compressor).forEach(([param, value]) => {
            compressorNode[param].value = value;
        });

        // Create delay
        delayNode = audioContext.createDelay();
        delayFeedbackGain = audioContext.createGain();
        delayDryGain = audioContext.createGain();
        delayWetGain = audioContext.createGain();
        delayMixer = audioContext.createGain();

        Object.entries(EFFECT_CONFIGS.delay).forEach(([param, value]) => {
            if (param === 'time') delayNode.delayTime.value = value;
            if (param === 'feedback') delayFeedbackGain.gain.value = value;
            if (param === 'mix') {
                delayDryGain.gain.value = 1 - value;
                delayWetGain.gain.value = value;
            }
        });

        // Create chorus
        chorusDelayNode = audioContext.createDelay();
        chorusOscillator = audioContext.createOscillator();
        chorusDepthGain = audioContext.createGain();
        chorusDryGain = audioContext.createGain();
        chorusWetGain = audioContext.createGain();
        chorusMixer = audioContext.createGain();

        Object.entries(EFFECT_CONFIGS.chorus).forEach(([param, value]) => {
            if (param === 'rate') chorusOscillator.frequency.value = value;
            if (param === 'depth') chorusDepthGain.gain.value = value;
            if (param === 'mix') {
                chorusDryGain.gain.value = 1 - value;
                chorusWetGain.gain.value = value;
            }
        });

        // Create gate
        gateNode = audioContext.createDynamicsCompressor();
        Object.entries(EFFECT_CONFIGS.gate).forEach(([param, value]) => {
            if (param === 'threshold') gateNode.threshold.value = value;
            if (param === 'attack') gateNode.attack.value = value;
            if (param === 'release') gateNode.release.value = value;
        });

        // Initialize other effect nodes
        masterFilter = audioContext.createBiquadFilter();
        masterFilter.type = 'lowpass';
        masterFilter.frequency.value = 20000;

        // Start chorus oscillator
        chorusOscillator.start();

        showNotification('Audio effects initialized successfully', 'success');
    } catch (error) {
        console.error('Error initializing audio effects:', error);
        showNotification('Error initializing audio effects: ' + error.message, 'error');
        throw error;
    }
}

// ====================================================
// Build/Rebuild the Audio Graph
// ====================================================
function buildAudioGraph() {
    // Clean up old source node and connections if they exist
    if (sourceNode) {
        try {
            sourceNode.onended = null;
            sourceNode.stop();
            sourceNode.disconnect();
        } catch(e) { /* Ignore */ }
        sourceNode = null;
    }

    // Disconnect analyser node
    try {
        analyserNode.disconnect();
    } catch(e) { /* Ignore */ }
    
    // Only create new source node if isPlaying is true
    if (isPlaying && audioBuffer) {
        sourceNode = createSourceNode();
        if (!sourceNode) return;
        
        // Start playback from pauseTime
        startTime = audioContext.currentTime - pauseTime;
        sourceNode.start(0, pauseTime);
        
        // Connect to effects chain
        let lastNode = sourceNode;
        
        // Connect to gain node first
        lastNode.connect(gainNode);
        lastNode = gainNode;
        
        // Connect to analyser for visualization
        lastNode.connect(analyserNode);
        
        // Connect to compressor if enabled
        if (compressorNode) {
            lastNode.connect(compressorNode);
            lastNode = compressorNode;
        }
        
        // Connect to delay if enabled
        if (delayNode && delayToggle?.checked) {
            lastNode.connect(delayDryGain);
            lastNode.connect(delayNode);
            delayNode.connect(delayFeedbackGain);
            delayFeedbackGain.connect(delayNode);
            delayNode.connect(delayWetGain);
            delayDryGain.connect(delayMixer);
            delayWetGain.connect(delayMixer);
            lastNode = delayMixer;
        }
        
        // Connect to chorus if enabled
        if (chorusDelayNode && chorusToggle?.checked) {
            lastNode.connect(chorusDryGain);
            lastNode.connect(chorusDelayNode);
            chorusDelayNode.connect(chorusWetGain);
            chorusDryGain.connect(chorusMixer);
            chorusWetGain.connect(chorusMixer);
            lastNode = chorusMixer;
        }
        
        // Connect to master filter
        lastNode.connect(masterFilter);
        lastNode = masterFilter;
        
        // Connect to reverb if enabled
        if (reverbToggle?.checked && convolver?.buffer) {
            lastNode.connect(dryGain);
            lastNode.connect(convolver);
            convolver.connect(wetGain);
            dryGain.connect(audioContext.destination);
            wetGain.connect(audioContext.destination);
        } else {
            lastNode.connect(audioContext.destination);
        }
        
        // Start progress updates
        updateProgress();
        // Start FFT visualization
        animateFFT();
    }
}

// Add createSourceNode function
function createSourceNode() {
    if (!audioBuffer || !audioContext) return null;
    
    // Create new source node
    const newSourceNode = audioContext.createBufferSource();
    newSourceNode.buffer = audioBuffer;
    
    // Set playback rate and detune if needed
    if (playbackRateSlider) {
        newSourceNode.playbackRate.value = parseFloat(playbackRateSlider.value);
    }
    if (pitchSlider) {
        newSourceNode.detune.value = parseFloat(pitchSlider.value);
    }
    
    // Set loop state
    newSourceNode.loop = loopEnabled;
    
    // Set onended handler
    newSourceNode.onended = function() {
        if (!loopEnabled) {
            isPlaying = false;
            sourceNode = null;
            if (playPauseBtn) playPauseBtn.textContent = 'Play';
            pauseTime = 0;
            updateProgress();
        }
    };
    
    return newSourceNode;
}

// ====================================================
// Playback Control Handlers
// ====================================================
playPauseBtn?.addEventListener('click', function() {
    if (!audioBuffer) {
        showNotification("No audio loaded.", "error");
        return;
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (!isPlaying) {
        // Play
        isPlaying = true;
        buildAudioGraph();
        
        if (sourceNode) {
            playPauseBtn.textContent = 'Pause';
        } else {
            isPlaying = false;
            playPauseBtn.textContent = 'Play';
            showNotification("Error starting playback.", "error");
        }
    } else {
        // Pause
        isPlaying = false;
        
        if (sourceNode) {
            pauseTime = audioContext.currentTime - startTime;
            if (loopEnabled && audioBuffer.duration > 0) {
                pauseTime %= audioBuffer.duration;
            }
            pauseTime = Math.max(0, Math.min(pauseTime, audioBuffer.duration));
            
            try {
                sourceNode.onended = null;
                sourceNode.stop();
            } catch(e) { /* Ignore */ }
            sourceNode.disconnect();
            sourceNode = null;
        }
        
        playPauseBtn.textContent = 'Play';
        updateProgress();
    }
});

stopBtn?.addEventListener('click', function() {
    if (sourceNode) {
        try {
            sourceNode.onended = null;
            sourceNode.stop();
            sourceNode.disconnect();
        } catch(e) { /* Ignore */ }
        sourceNode = null;
    }
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.textContent = 'Play';
    pauseTime = 0;
    updateProgress();
});

muteBtn?.addEventListener('click', function () {
    if (!gainNode || !volumeSlider) return;
    const mutedValue = 0.0001;
    const currentVolumeSetting = parseFloat(volumeSlider.value);
    const isCurrentlyMuted = gainNode.gain.value <= mutedValue;

    if (!isCurrentlyMuted) {
        // Mute
        console.log("Muting...");
        gainNode.gain.linearRampToValueAtTime(mutedValue, audioContext.currentTime + 0.05); // Ramp down
        muteBtn.textContent = 'Unmute';
        volumeSlider.disabled = true; // Disable slider when muted
    } else {
        // Unmute
        console.log("Unmuting...");
        gainNode.gain.linearRampToValueAtTime(currentVolumeSetting, audioContext.currentTime + 0.05); // Ramp up to slider value
        muteBtn.textContent = 'Mute';
        volumeSlider.disabled = false; // Re-enable slider
    }
});

// ... (ResetZoomBtn, ExportImageBtn, FullscreenBtn remain the same) ...
resetZoomBtn?.addEventListener('click', function () {
    if (!audioBuffer || !canvas || canvas.width === 0) return;
    zoomLevel = audioBuffer.length > 0 ? audioBuffer.length / canvas.width : 1; // Fit whole waveform
    panOffset = 0;
    renderWaveform();
    // drawTimeMarkers(); // Called by renderWaveform
    updateProgress(); // Update progress marker position
});

exportImageBtn?.addEventListener('click', function () {
    if (!canvas) return;
    // Ensure waveform is up-to-date before exporting image
    renderWaveform();
    try {
        let dataURL = canvas.toDataURL("image/png");
        let link = document.createElement('a');
        link.href = dataURL;
        link.download = `waveform_export_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification("Waveform image exported.", "success");
    } catch (e) {
        console.error("Error exporting canvas image:", e);
        showNotification("Error exporting waveform image.", "error");
    }
});

// ====================================================
// UI Parameter Listeners (Basic & Effects) 
// ====================================================

playbackRateSlider?.addEventListener('input', function () {
    if (playbackRateValue) playbackRateValue.textContent = this.value;
    if (sourceNode) sourceNode.playbackRate.value = parseFloat(this.value);
});
pitchSlider?.addEventListener('input', function () {
    if (pitchValue) pitchValue.textContent = this.value;
    if (sourceNode) sourceNode.detune.value = parseFloat(this.value);
});
volumeSlider?.addEventListener('input', function () {
    const newVolume = parseFloat(this.value);
    if (volumeValue) volumeValue.textContent = Math.round(newVolume * 100);
    if (gainNode && muteBtn?.textContent === 'Mute') {
        gainNode.gain.setTargetAtTime(newVolume, audioContext.currentTime, 0.01);
    }
});
filterSlider?.addEventListener('input', function () {
    if (filterValue) filterValue.textContent = this.value;
    if (masterFilter) masterFilter.frequency.setTargetAtTime(parseFloat(this.value), audioContext.currentTime, 0.01);
});
panningSlider?.addEventListener('input', function () {
    if (panValue) panValue.textContent = this.value;
    if (pannerNode && pannerNode.pan !== undefined) {
        pannerNode.pan.setTargetAtTime(parseFloat(this.value), audioContext.currentTime, 0.01);
    }
});
// --- Visuals ---
document.getElementById('waveformColor')?.addEventListener('input', function () {
    waveformColor = this.value;
    renderWaveform();
});
document.getElementById('fftColor')?.addEventListener('input', function () {
    fftBarColor = this.value;
});
// --- Reverb ---
reverbMix?.addEventListener('input', function () {
    let mix = parseFloat(this.value);
    if (reverbMixValue) reverbMixValue.textContent = mix.toFixed(2);
    if (dryGain && wetGain && reverbToggle?.checked) {
        dryGain.gain.setTargetAtTime(1 - mix, audioContext.currentTime, 0.02);
        wetGain.gain.setTargetAtTime(mix, audioContext.currentTime, 0.02);
    }
});
reverbDecay?.addEventListener('input', function () {
    let decay = parseFloat(this.value);
    if (reverbDecayValue) reverbDecayValue.textContent = decay.toFixed(2);
    updateImpulseResponse();
});
reverbToggle?.addEventListener('change', function () {
    if (audioContext.state === 'suspended') { 
        audioContext.resume(); 
    }
    // If audio is playing, stop playback before rebuilding the graph
    if (isPlaying) {
        isPlaying = false;
        if (sourceNode) {
            try {
                sourceNode.onended = null;
                sourceNode.stop();
                sourceNode.disconnect();
            } catch(e) { /* Ignore */ }
            sourceNode = null;
        }
        if (playPauseBtn) playPauseBtn.textContent = 'Play';
        pauseTime = 0;
        updateProgress();
    }
    // Update reverb mix based on toggle state
    if (dryGain && wetGain) {
        const mix = this.checked ? (reverbMix ? parseFloat(reverbMix.value) : 0) : 0;
        dryGain.gain.setTargetAtTime(1 - mix, audioContext.currentTime, 0.02);
        wetGain.gain.setTargetAtTime(mix, audioContext.currentTime, 0.02);
    }
    // Rebuild the audio graph
    buildAudioGraph();
});
// --- Delay ---
delayTimeSlider?.addEventListener('input', function () {
    if (delayTimeValue) delayTimeValue.textContent = this.value;
    if (delayNode) delayNode.delayTime.setTargetAtTime(parseFloat(this.value), audioContext.currentTime, 0.02);
});
delayFeedbackSlider?.addEventListener('input', function () {
    if (delayFeedbackValue) delayFeedbackValue.textContent = this.value;
    if (delayFeedbackGain) delayFeedbackGain.gain.setTargetAtTime(parseFloat(this.value), audioContext.currentTime, 0.02);
});
delayMixSlider?.addEventListener('input', function () {
    let mix = parseFloat(this.value);
    if (delayMixValue) delayMixValue.textContent = mix.toFixed(2);
    if (delayDryGain && delayWetGain) {
        delayDryGain.gain.setTargetAtTime(1 - mix, audioContext.currentTime, 0.02);
        delayWetGain.gain.setTargetAtTime(mix, audioContext.currentTime, 0.02);
    }
});
// --- Chorus / Flanger ---
chorusRateSlider?.addEventListener('input', function () {
    if (chorusRateValue) chorusRateValue.textContent = this.value;
    if (chorusOscillator) chorusOscillator.frequency.setTargetAtTime(parseFloat(this.value), audioContext.currentTime, 0.02);
});
chorusDepthSlider?.addEventListener('input', function () {
    const value = parseFloat(this.value);
    if (chorusDepthValue) chorusDepthValue.textContent = value.toFixed(4);
    if (chorusDelayNode) chorusDelayNode.delayTime.setTargetAtTime(value, audioContext.currentTime, 0.02);
    if (chorusDepthGain) chorusDepthGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.02);
});
chorusMixSlider?.addEventListener('input', function () {
    let mix = parseFloat(this.value);
    if (chorusMixValue) chorusMixValue.textContent = mix.toFixed(2);
    if (chorusDryGain && chorusWetGain) {
        chorusDryGain.gain.setTargetAtTime(1 - mix, audioContext.currentTime, 0.02);
        chorusWetGain.gain.setTargetAtTime(mix, audioContext.currentTime, 0.02);
    }
});
// --- Compressor ---
compressorThresholdSlider?.addEventListener('input', function () {
    if (compressorThresholdValue) compressorThresholdValue.textContent = this.value;
    if (compressorNode) compressorNode.threshold.setTargetAtTime(parseFloat(this.value), audioContext.currentTime, 0.01);
});
compressorRatioSlider?.addEventListener('input', function () {
    if (compressorRatioValue) compressorRatioValue.textContent = this.value;
    if (compressorNode) compressorNode.ratio.setTargetAtTime(parseFloat(this.value), audioContext.currentTime, 0.01);
});
compressorAttackSlider?.addEventListener('input', function () {
    if (compressorAttackValue) compressorAttackValue.textContent = this.value;
    if (compressorNode) compressorNode.attack.setTargetAtTime(parseFloat(this.value), audioContext.currentTime, 0.01);
});
compressorReleaseSlider?.addEventListener('input', function () {
    if (compressorReleaseValue) compressorReleaseValue.textContent = this.value;
    if (compressorNode) compressorNode.release.setTargetAtTime(parseFloat(this.value), audioContext.currentTime, 0.01);
});
// --- Stereo Widener ---
stereoWidenerSlider?.addEventListener('input', function () {
    const value = parseFloat(this.value)
    if (stereoWidenerValue) stereoWidenerValue.textContent = value.toFixed(2);
    if (rightDelay) {
        const maxWidenerDelay = 0.025;
        const delayAmount = value * maxWidenerDelay;
        rightDelay.delayTime.setTargetAtTime(delayAmount, audioContext.currentTime, 0.01);
    }
});
stereoWidenerToggle?.addEventListener('change', function () {
    if (audioContext.state === 'suspended') { audioContext.resume(); }
    buildAudioGraph();
});
// --- Looping ---
loopToggleBtn?.addEventListener('click', function () {
    loopEnabled = !loopEnabled;
    if (loopStatusSpan) loopStatusSpan.textContent = loopEnabled ? "On" : "Off";
    if (sourceNode) sourceNode.loop = loopEnabled;
});


// ====================================================
// Apply Effects Permanently - No Changes Here
// ====================================================
// ... (Keep applyChangesBtn listener as is) ...
applyChangesBtn?.addEventListener('click', async () => {
    if (!audioBuffer) {
        showNotification('No audio loaded.', "error");
        return;
    }
    if (isPlaying) {
        // Stop playback first
        if (sourceNode) {
            try {
                sourceNode.onended = null;
                sourceNode.stop();
                sourceNode.disconnect();
            } catch(e) {
                console.warn("Error stopping source node:", e);
            }
            sourceNode = null;
        }
        isPlaying = false;
        if(playPauseBtn) playPauseBtn.textContent = 'Play';
    }

    showNotification('Applying effects, please wait...', "info", true);

    try {
        const offlineCtx = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        
        // Create and configure gain node
        const gain = offlineCtx.createGain();
        gain.gain.value = gainNode.gain.value;
        
        // Create and configure compressor
        const compressor = offlineCtx.createDynamicsCompressor();
        if (compressorNode) {
            compressor.threshold.value = compressorNode.threshold.value;
            compressor.ratio.value = compressorNode.ratio.value;
            compressor.attack.value = compressorNode.attack.value;
            compressor.release.value = compressorNode.release.value;
        }
        
        // Create and configure delay
        const delay = offlineCtx.createDelay(1.0);
        const delayFeedback = offlineCtx.createGain();
        const delayDry = offlineCtx.createGain();
        const delayWet = offlineCtx.createGain();
        const offlineDelayMixer = offlineCtx.createGain(); // Create the delay mixer
        const delayMixVal = delayMixSlider ? parseFloat(delayMixSlider.value) : 0;
        delay.delayTime.value = delayNode ? delayNode.delayTime.value : 0.3;
        delayFeedback.gain.value = delayFeedbackGain ? delayFeedbackGain.gain.value : 0;
        delayDry.gain.value = 1 - delayMixVal;
        delayWet.gain.value = delayMixVal;
        
        // Create and configure chorus
        const chorusDelay = offlineCtx.createDelay(0.1);
        const chorusDepth = offlineCtx.createGain();
        const chorusOsc = offlineCtx.createOscillator();
        const chorusDry = offlineCtx.createGain();
        const chorusWet = offlineCtx.createGain();
        const offlineChorusMixer = offlineCtx.createGain(); // Create the chorus mixer
        const chorusMixVal = chorusMixSlider ? parseFloat(chorusMixSlider.value) : 0;
        chorusDelay.delayTime.value = chorusDelayNode ? chorusDelayNode.delayTime.value : 0.005;
        chorusDepth.gain.value = chorusDepthGain ? chorusDepthGain.gain.value : 0.002;
        chorusOsc.frequency.value = chorusOscillator ? chorusOscillator.frequency.value : 4;
        chorusDry.gain.value = 1 - chorusMixVal;
        chorusWet.gain.value = chorusMixVal;
        
        // Create and configure master filter
        const masterFilter = offlineCtx.createBiquadFilter();
        masterFilter.type = "lowpass";
        masterFilter.frequency.value = filterSlider ? parseFloat(filterSlider.value) : offlineCtx.sampleRate / 2;
        masterFilter.Q.value = 1;
        
        // Create and configure reverb
        let offlineConvolver = null;
        let offlineDryGain = null;
        let offlineWetGain = null;
        if (reverbToggle?.checked && convolver?.buffer) {
            offlineConvolver = offlineCtx.createConvolver();
            offlineConvolver.buffer = convolver.buffer;
            offlineDryGain = offlineCtx.createGain();
            offlineWetGain = offlineCtx.createGain();
            const mix = reverbMix ? parseFloat(reverbMix.value) : 0;
            offlineDryGain.gain.value = 1 - mix;
            offlineWetGain.gain.value = mix;
        }
        
        // Connect the audio chain
        source.connect(gain);
        gain.connect(compressor);
        
        // Delay chain
        compressor.connect(delayDry);
        compressor.connect(delay);
        delay.connect(delayFeedback);
        delayFeedback.connect(delay);
        delay.connect(delayWet);
        delayDry.connect(offlineDelayMixer);
        delayWet.connect(offlineDelayMixer);
        
        // Chorus chain
        offlineDelayMixer.connect(chorusDry);
        offlineDelayMixer.connect(chorusDelay);
        chorusDelay.connect(chorusWet);
        chorusDry.connect(offlineChorusMixer);
        chorusWet.connect(offlineChorusMixer);
        
        // Connect to master filter
        offlineChorusMixer.connect(masterFilter);
        
        // Connect to reverb or destination
        if (offlineConvolver) {
            masterFilter.connect(offlineDryGain);
            masterFilter.connect(offlineConvolver);
            offlineConvolver.connect(offlineWetGain);
            offlineDryGain.connect(offlineCtx.destination);
            offlineWetGain.connect(offlineCtx.destination);
        } else {
            masterFilter.connect(offlineCtx.destination);
        }
        
        // Start processing
        source.start(0);
        const renderedBuffer = await offlineCtx.startRendering();
        
        // Update the audio buffer and UI
        saveStateForUndo("Apply Effects");
        audioBuffer = renderedBuffer;
        showNotification('Effects applied successfully!', "success");
        zoomLevel = audioBuffer.length > 0 ? audioBuffer.length / canvas.width : 1;
        panOffset = 0;
        renderWaveform();
        updateProgress();
        updateUndoRedoButtons();
    } catch (error) {
        console.error('Error applying effects:', error);
        showNotification('Failed to apply effects: ' + error.message, "error", true);
    }
});


// ====================================================
// Region Selection / Trim / Copy / Paste - No Changes Here
// ====================================================
// ... (Keep toggleSelectBtn listener, clearSelection, mousedown/move/up listeners, getSelectionTimes, trimBtn listener, trimAudioBuffer as is) ...
toggleSelectBtn?.addEventListener('click', function () {
    selectionMode = !selectionMode;
    if (selectionMode) {
        toggleSelectBtn.textContent = "Cancel Selection";
        if(canvas) canvas.style.cursor = 'crosshair';
        clearSelection();
    } else {
        toggleSelectBtn.textContent = "Select Region";
        if(canvas) canvas.style.cursor = 'grab';
        clearSelection();
    }
});
function clearSelection() {
    if (selectionOverlay) { selectionOverlay.style.display = 'none'; selectionOverlay.style.width = '0px'; }
    if (selectionInfo) selectionInfo.textContent = "";
    if (trimBtn) trimBtn.disabled = true;
    updateCopyPasteButtons();
}
waveformContainer?.addEventListener('mousedown', function (e) {
    if (selectionMode && e.button === 0) {
        isSelecting = true;
        let rect = waveformContainer.getBoundingClientRect(); selectionStartX = e.clientX - rect.left;
        if (selectionOverlay) { selectionOverlay.style.left = selectionStartX + 'px'; selectionOverlay.style.width = '0px'; selectionOverlay.style.display = 'block'; selectionOverlay.style.height = waveformContainer.clientHeight + 'px'; }
        e.preventDefault();
    }
});
waveformContainer?.addEventListener('mousemove', function (e) {
    if (!isSelecting || !selectionMode || !canvas) return;
    let rect = waveformContainer.getBoundingClientRect(); let currentX = e.clientX - rect.left; selectionEndX = currentX;
    selectionEndX = Math.max(0, Math.min(canvas.width, selectionEndX));
    let left = Math.min(selectionStartX, selectionEndX); let width = Math.abs(selectionEndX - selectionStartX);
    if (selectionOverlay) { selectionOverlay.style.left = left + 'px'; selectionOverlay.style.width = width + 'px'; }
});
waveformContainer?.addEventListener('mouseup', function (e) {
    if (!isSelecting || !selectionMode || !audioBuffer) return;
    isSelecting = false;
    let overlayWidth = selectionOverlay ? parseFloat(selectionOverlay.style.width) : 0;
    if (overlayWidth > 1) {
        const selectionTimes = getSelectionTimes();
        if (selectionTimes && selectionInfo) { selectionInfo.textContent = `Selected: ${selectionTimes.start.toFixed(3)}s - ${selectionTimes.end.toFixed(3)}s (${(selectionTimes.end - selectionTimes.start).toFixed(3)}s)`; }
        if (trimBtn) trimBtn.disabled = false;
    } else { clearSelection(); }
    updateCopyPasteButtons();
});
function getSelectionTimes() {
     if (!selectionMode || !audioBuffer || !canvas || !selectionOverlay || parseFloat(selectionOverlay.style.width) <= 1) { return null; }
     let rect = waveformContainer.getBoundingClientRect(); let overlayLeft = parseFloat(selectionOverlay.style.left); let overlayWidth = parseFloat(selectionOverlay.style.width);
     overlayLeft = Math.max(0, Math.min(overlayLeft, canvas.width)); overlayWidth = Math.max(0, overlayWidth); if (overlayLeft + overlayWidth > canvas.width) { overlayWidth = canvas.width - overlayLeft; }
     let visibleSamples = canvas.width * zoomLevel; let visibleDuration = (visibleSamples > 0 && audioBuffer.sampleRate > 0) ? visibleSamples / audioBuffer.sampleRate : 0; let viewStartTimeSec = (panOffset >= 0 && audioBuffer.sampleRate > 0) ? panOffset / audioBuffer.sampleRate : 0;
     let selStartPx = overlayLeft; let selEndPx = overlayLeft + overlayWidth; let selStartSec = viewStartTimeSec; let selEndSec = viewStartTimeSec;
     if (canvas.width > 0 && visibleDuration > 0) { selStartSec += (selStartPx / canvas.width) * visibleDuration; selEndSec += (selEndPx / canvas.width) * visibleDuration; }
     if (selStartSec > selEndSec) [selStartSec, selEndSec] = [selEndSec, selStartSec];
     selStartSec = Math.max(0, selStartSec); selEndSec = Math.min(audioBuffer.duration, selEndSec);
     if (selStartSec >= selEndSec) return null;
     return { start: selStartSec, end: selEndSec };
 }
trimBtn?.addEventListener('click', function () {
    const selection = getSelectionTimes(); if (!selection) { showNotification("No region selected to trim.", "info"); return; }
    trimAudioBuffer(selection.start, selection.end);
});
function trimAudioBuffer(startTime, endTime) {
    if (!audioBuffer || startTime >= endTime || endTime <= 0) { console.error("Invalid trim times:", startTime, endTime); return; }
    if (isPlaying) { showNotification("Stop playback before trimming.", "info"); return; }
    saveStateForUndo("Trim Audio");
    const sampleRate = audioBuffer.sampleRate; const startSample = Math.max(0, Math.floor(startTime * sampleRate)); const endSample = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate)); const newLength = endSample - startSample;
    if (newLength <= 0) { showNotification("Trim results in empty audio.", "error"); return; }
    try {
        const newBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, newLength, sampleRate);
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const oldData = audioBuffer.getChannelData(ch); const newData = newBuffer.getChannelData(ch);
            if (typeof oldData.subarray === 'function') { newData.set(oldData.subarray(startSample, endSample)); } else { for (let i = 0; i < newLength; i++) { if (startSample + i < oldData.length) { newData[i] = oldData[startSample + i]; } } }
        }
        audioBuffer = newBuffer;
        zoomLevel = audioBuffer.length > 0 ? audioBuffer.length / canvas.width : 1; panOffset = 0;
        clearSelection(); renderWaveform(); updateProgress(); updateUndoRedoButtons(); showNotification("Audio trimmed successfully.", "success");
    } catch (e) { console.error("Error during trim:", e); showNotification("Error trimming audio.", "error"); }
}


// ====================================================
// Copy/Paste Functionality - No Changes Here
// ====================================================
// ... (Keep copyBtn listener, pasteBtn listener, copySelectedRegion, pasteCopiedRegion, updateCopyPasteButtons as is) ...
copyBtn?.addEventListener('click', copySelectedRegion);
pasteBtn?.addEventListener('click', (event) => { pasteCopiedRegion(event); });
function copySelectedRegion() {
    const selection = getSelectionTimes(); if (!selection) { showNotification("No region selected to copy.", "info"); return; }
    const sampleRate = audioBuffer.sampleRate; const startSample = Math.floor(selection.start * sampleRate); const endSample = Math.floor(selection.end * sampleRate); const length = endSample - startSample;
    if (length <= 0) { showNotification("Selected region is empty.", "info"); return; }
    try {
        copiedRegion = audioContext.createBuffer(audioBuffer.numberOfChannels, length, sampleRate);
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const oldData = audioBuffer.getChannelData(ch); const newData = copiedRegion.getChannelData(ch);
            if (typeof oldData.subarray === 'function') { newData.set(oldData.subarray(startSample, endSample)); } else { for (let i = 0; i < length; i++) { if (startSample + i < oldData.length) { newData[i] = oldData[startSample + i]; } } }
        }
        showNotification("Region copied.", "success"); updateCopyPasteButtons();
    } catch (e) { console.error("Error copying region:", e); showNotification("Error copying region.", "error"); copiedRegion = null; updateCopyPasteButtons(); }
}
function pasteCopiedRegion(event) {
    if (!copiedRegion || !audioBuffer) { showNotification("Nothing to paste.", "info"); return; }
    if (isPlaying) { showNotification("Stop playback before pasting.", "info"); return; }
    saveStateForUndo("Paste Audio");
    let pasteTime = 0;
    if (waveformContainer && event && canvas) {
        let rect = waveformContainer.getBoundingClientRect(); let x = event.clientX - rect.left;
        let visibleSamples = canvas.width * zoomLevel; let visibleDuration = (visibleSamples > 0 && audioBuffer.sampleRate > 0) ? visibleSamples / audioBuffer.sampleRate : 0; let viewStartTimeSec = (panOffset >= 0 && audioBuffer.sampleRate > 0) ? panOffset / audioBuffer.sampleRate : 0;
        if (canvas.width > 0 && visibleDuration > 0) { pasteTime = viewStartTimeSec + (x / canvas.width) * visibleDuration; } else { pasteTime = viewStartTimeSec; }
        pasteTime = Math.max(0, Math.min(pasteTime, audioBuffer.duration));
    } else { pasteTime = pauseTime > 0 ? pauseTime : 0; }
    const sampleRate = audioBuffer.sampleRate; const pasteSample = Math.floor(pasteTime * sampleRate); const pasteLength = copiedRegion.length; const originalLength = audioBuffer.length; const newLength = originalLength + pasteLength;
    try {
        const newBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, newLength, sampleRate);
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const oldData = audioBuffer.getChannelData(ch); const newData = newBuffer.getChannelData(ch); const copiedData = copiedRegion.getChannelData(ch);
            if (typeof oldData.subarray === 'function' && typeof newData.set === 'function') { newData.set(oldData.subarray(0, pasteSample), 0); newData.set(copiedData, pasteSample); newData.set(oldData.subarray(pasteSample), pasteSample + pasteLength); } else { for(let i=0; i<pasteSample; i++) newData[i] = oldData[i]; for(let i=0; i<pasteLength; i++) newData[pasteSample + i] = copiedData[i]; for(let i=pasteSample; i<originalLength; i++) newData[pasteSample + pasteLength + (i - pasteSample)] = oldData[i]; }
        }
        audioBuffer = newBuffer;
        renderWaveform(); updateProgress(); updateUndoRedoButtons(); showNotification("Region pasted.", "success");
    } catch (e) { console.error("Error pasting region:", e); showNotification("Error pasting region.", "error"); }
}
function updateCopyPasteButtons() {
    const selection = getSelectionTimes(); if (copyBtn) copyBtn.disabled = !selection; if (pasteBtn) pasteBtn.disabled = !copiedRegion;
}


// ====================================================
// Undo/Redo Functionality - No Changes Here
// ====================================================
// ... (Keep saveStateForUndo, undo, redo, updateUndoRedoButtons listeners as is) ...
function saveStateForUndo(actionName = "Unknown Action") {
    console.log("Saving state for undo:", actionName);
    if (!audioBuffer) return;
    try {
         const bufferCopy = audioContext.createBuffer(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
         for (let i = 0; i < audioBuffer.numberOfChannels; i++) { const channelData = audioBuffer.getChannelData(i); bufferCopy.copyToChannel(channelData, i); }
        undoStack.push({ buffer: bufferCopy, action: actionName });
        if (undoStack.length > MAX_UNDO_STEPS) { undoStack.shift(); }
        redoStack = []; updateUndoRedoButtons();
    } catch (e) { console.error("Error saving state for undo:", e); showNotification("Error saving undo state.", "error"); }
}
function undo() {
    if (undoStack.length === 0) { showNotification("Nothing to undo.", "info"); return; }
    if (isPlaying) { showNotification("Stop playback before undo.", "info"); return; }
    try {
         const currentBufferCopy = audioContext.createBuffer(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
         for (let i = 0; i < audioBuffer.numberOfChannels; i++) { currentBufferCopy.copyToChannel(audioBuffer.getChannelData(i), i); }
         const currentStateAction = redoStack.length > 0 ? `Redo of "${redoStack[redoStack.length - 1].action}"` : "Current State Before Undo";
         redoStack.push({ buffer: currentBufferCopy, action: currentStateAction });
        const previousState = undoStack.pop(); audioBuffer = previousState.buffer;
        showNotification(`Undo: ${previousState.action}`, "success");
        zoomLevel = audioBuffer.length > 0 ? audioBuffer.length / canvas.width : 1; panOffset = 0;
        clearSelection(); renderWaveform(); updateProgress(); updateUndoRedoButtons();
    } catch (e) { console.error("Error during undo:", e); showNotification("Error performing undo.", "error"); if(redoStack.length > 0 && audioBuffer !== redoStack[redoStack.length-1].buffer){ redoStack.pop(); } updateUndoRedoButtons(); }
}
function redo() {
    if (redoStack.length === 0) { showNotification("Nothing to redo.", "info"); return; }
    if (isPlaying) { showNotification("Stop playback before redoing.", "info"); return; }
     try {
         const currentBufferCopy = audioContext.createBuffer(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
         for (let i = 0; i < audioBuffer.numberOfChannels; i++) { currentBufferCopy.copyToChannel(audioBuffer.getChannelData(i), i); }
         const actionName = undoStack.length > 0 ? `Undo of "${undoStack[undoStack.length - 1].action}"` : "State Before Redo";
         undoStack.push({ buffer: currentBufferCopy, action: actionName});
        const nextState = redoStack.pop(); audioBuffer = nextState.buffer;
        showNotification(`Redo: ${nextState.action}`, "success");
        zoomLevel = audioBuffer.length > 0 ? audioBuffer.length / canvas.width : 1; panOffset = 0;
        clearSelection(); renderWaveform(); updateProgress(); updateUndoRedoButtons();
     } catch (e) { console.error("Error during redo:", e); showNotification("Error performing redo.", "error"); if(undoStack.length > 0 && audioBuffer !== undoStack[undoStack.length-1].buffer){ undoStack.pop(); } updateUndoRedoButtons(); }
}
function updateUndoRedoButtons() { if (undoBtn) undoBtn.disabled = undoStack.length === 0; if (redoBtn) redoBtn.disabled = redoStack.length === 0; }
undoBtn?.addEventListener('click', undo);
redoBtn?.addEventListener('click', redo);


// ====================================================
// Zoom & Pan - No Changes Here
// ====================================================
// ... (Keep wheel, mousedown, mousemove, mouseup listeners as is) ...
canvas?.addEventListener('wheel', function (e) {
    if (!audioBuffer || !canvas) return; e.preventDefault();
    const zoomFactor = 1.15; const rect = canvas.getBoundingClientRect(); const mouseX = e.clientX - rect.left;
    const sampleUnderMouse = panOffset + mouseX * zoomLevel; const oldZoom = zoomLevel; const oldPan = panOffset;
    if (e.deltaY < 0) { zoomLevel /= zoomFactor; const minZoomPractical = 1; zoomLevel = Math.max(minZoomPractical, zoomLevel); } else { zoomLevel *= zoomFactor; const maxZoom = audioBuffer.length / canvas.width; zoomLevel = Math.min(maxZoom, zoomLevel); }
    panOffset = sampleUnderMouse - mouseX * zoomLevel; const maxPanOffset = Math.max(0, audioBuffer.length - canvas.width * zoomLevel); panOffset = Math.max(0, Math.min(panOffset, maxPanOffset));
    if (Math.abs(oldZoom - zoomLevel) > 1e-9 || Math.abs(oldPan - panOffset) > 1e-9) { renderWaveform(); updateProgress(); }
});
canvas?.addEventListener('mousedown', function (e) {
    if (!selectionMode && e.button === 0 && canvas) { isDragging = true; dragStartX = e.clientX; initialPanOffset = panOffset; canvas.style.cursor = 'grabbing'; canvas.classList.add('panning'); }
});
window.addEventListener('mousemove', function (e) {
    if (!isDragging || !audioBuffer || !canvas) return;
    const dx = e.clientX - dragStartX; const samplesPerPixel = zoomLevel; let newPanOffset = initialPanOffset - dx * samplesPerPixel;
    const maxPanOffset = Math.max(0, audioBuffer.length - canvas.width * zoomLevel); newPanOffset = Math.max(0, Math.min(newPanOffset, maxPanOffset));
    if (Math.abs(panOffset - newPanOffset) >= 1) { panOffset = newPanOffset; renderWaveform(); updateProgress(); }
});
window.addEventListener('mouseup', function (e) {
    if (isDragging && canvas) { isDragging = false; canvas.style.cursor = 'grab'; canvas.classList.remove('panning'); }
});


// ====================================================
// Canvas Resize Handling - No Changes Here
// ====================================================
function resizeCanvases() {
    let resized = false;
    if (canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0) { if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; resized = true; } }
    if (fftCanvas && fftCtx && fftCanvas.clientWidth > 0 && fftCanvas.clientHeight > 0) { if (fftCanvas.width !== fftCanvas.clientWidth || fftCanvas.height !== fftCanvas.clientHeight) { fftCanvas.width = fftCanvas.clientWidth; fftCanvas.height = fftCanvas.clientHeight; } }
    if (resized && audioBuffer) { renderWaveform(); updateProgress(); }
}
window.addEventListener('resize', resizeCanvases);


// ====================================================
// File Input & Audio Decoding (Manual Upload) - Includes Logging
// ====================================================
audioInput?.addEventListener('change', function (e) {
    let file = e.target.files[0];
    if (!file) return;

    // Clear existing state before loading new file
    if (isPlaying) stopBtn?.click(); // Stop playback using button click logic
    disableAllControls(); // Disable while loading
    audioBuffer = null;
    undoStack = []; redoStack = []; copiedRegion = null; uploadedFilePath = null; // Clear path
    updateUndoRedoButtons(); updateCopyPasteButtons();
    showNotification(`Loading file: ${file.name}...`, "info", true);
    renderWaveform(); // Clear waveform display

    let reader = new FileReader();
    reader.onload = function (ev) {
        audioContext.decodeAudioData(ev.target.result)
            .then(function (buffer) {
                audioBuffer = buffer;
                // <<< Logging Added >>>
                console.log("audioInput: AudioBuffer set successfully.", audioBuffer);
                showNotification(`Loaded: ${file.name}`, "success");
                zoomLevel = buffer.length > 0 ? buffer.length / canvas.width : 1; panOffset = 0;
                initEffects(); resetAllControlsToDefault(); renderWaveform(); initChannelControls(); updateProgress();
                enablePlaybackControls(); // Enable controls
                 // <<< Logging Added >>>
                console.log("audioInput: enablePlaybackControls called.");
            })
            .catch(function (error) {
                // <<< Logging Added >>>
                console.error('Audio loading/decoding error (audioInput):', error);
                showNotification(`Error decoding file: ${error.message}`, "error", true);
                disableAllControls();
                audioBuffer = null; // Ensure buffer is null on error
                renderWaveform(); // Update display to show no buffer
            });
    };
     reader.onerror = function(error) {
         console.error("Error reading file:", error);
         showNotification("Error reading file.", "error", true);
         disableAllControls();
         audioBuffer = null;
         renderWaveform();
     };
    reader.readAsArrayBuffer(file);
});

// ====================================================
// Control Enabling/Disabling Functions - No Changes Here
// ====================================================
function resetAllControlsToDefault() {
    // ... (function remains the same) ...
    if (playbackRateSlider) { playbackRateSlider.value = 1; if(playbackRateValue) playbackRateValue.textContent = 1; }
    if (pitchSlider) { pitchSlider.value = 0; if(pitchValue) pitchValue.textContent = 0; }
    if (volumeSlider) { volumeSlider.value = 1; if(volumeValue) volumeValue.textContent = 100; volumeSlider.disabled = false; }
    if (filterSlider) { filterSlider.value = 20000; if(filterValue) filterValue.textContent = 20000; }
    if (panningSlider) { panningSlider.value = 0; if(panValue) panValue.textContent = 0; }
    if (reverbToggle) { reverbToggle.checked = false; }
    if (reverbMix) { reverbMix.value = 0; if(reverbMixValue) reverbMixValue.textContent = '0.00'; }
    if (reverbDecay) { reverbDecay.value = 2; if(reverbDecayValue) reverbDecayValue.textContent = '2.00'; }
    if (delayTimeSlider) { delayTimeSlider.value = 0.3; if(delayTimeValue) delayTimeValue.textContent = '0.30'; }
    if (delayFeedbackSlider) { delayFeedbackSlider.value = 0; if(delayFeedbackValue) delayFeedbackValue.textContent = '0.00'; }
    if (delayMixSlider) { delayMixSlider.value = 0; if(delayMixValue) delayMixValue.textContent = '0.00'; }
    if (chorusRateSlider) { chorusRateSlider.value = 4; if(chorusRateValue) chorusRateValue.textContent = '4.00'; }
    if (chorusDepthSlider) { chorusDepthSlider.value = 0.005; if(chorusDepthValue) chorusDepthValue.textContent = '0.005'; }
    if (chorusMixSlider) { chorusMixSlider.value = 0; if(chorusMixValue) chorusMixValue.textContent = '0.00'; }
    if (compressorThresholdSlider) { compressorThresholdSlider.value = 0; if(compressorThresholdValue) compressorThresholdValue.textContent = 0; }
    if (compressorRatioSlider) { compressorRatioSlider.value = 1; if(compressorRatioValue) compressorRatioValue.textContent = 1; }
    if (compressorAttackSlider) { compressorAttackSlider.value = 0.003; if(compressorAttackValue) compressorAttackValue.textContent = '0.003'; }
    if (compressorReleaseSlider) { compressorReleaseSlider.value = 0.25; if(compressorReleaseValue) compressorReleaseValue.textContent = '0.25'; }
    if (stereoWidenerToggle) { stereoWidenerToggle.checked = false; }
    if (stereoWidenerSlider) { stereoWidenerSlider.value = 0; if(stereoWidenerValue) stereoWidenerValue.textContent = '0.00'; }
    if (loopToggleBtn) { loopEnabled = false; if(loopStatusSpan) loopStatusSpan.textContent = "Off"; }
    if (muteBtn) { muteBtn.textContent = 'Mute'; }
     if (selectionMode && toggleSelectBtn) { toggleSelectBtn.click(); }
     clearSelection();
}
function disableAllControls() {
    if (playPauseBtn) playPauseBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = true;
    if (muteBtn) muteBtn.disabled = true;
    if (resetZoomBtn) resetZoomBtn.disabled = true;
    if (exportImageBtn) exportImageBtn.disabled = true;
    if (applyChangesBtn) applyChangesBtn.disabled = true;
    if (saveVersionBtn) saveVersionBtn.disabled = true;
    if (trimBtn) trimBtn.disabled = true;
    if (copyBtn) copyBtn.disabled = true;
    if (pasteBtn) pasteBtn.disabled = true;
    if (undoBtn) undoBtn.disabled = true;
    if (redoBtn) redoBtn.disabled = true;
    if (toggleSelectBtn) toggleSelectBtn.disabled = true;
    // Download button state is managed separately based on audioBuffer availability
    if (document.getElementById('downloadBtn')) {
        document.getElementById('downloadBtn').disabled = !audioBuffer;
    }
    document.querySelectorAll('.controls-section input, .controls-section button, .controls-section select').forEach(el => { 
        if(el.id !== 'audioInput' && !el.closest('#file-upload-section') && el.id !== 'downloadBtn') { 
            el.disabled = true; 
        } 
    });
}
function enablePlaybackControls() {
    if (playPauseBtn) playPauseBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = false;
    if (muteBtn) muteBtn.disabled = false;
    if (resetZoomBtn) resetZoomBtn.disabled = false;
    if (exportImageBtn) exportImageBtn.disabled = false;
    if (applyChangesBtn) applyChangesBtn.disabled = false;
    if (saveVersionBtn) saveVersionBtn.disabled = false;
    if (toggleSelectBtn) toggleSelectBtn.disabled = false;
    if (seekBackwardBtn) seekBackwardBtn.disabled = false;
    if (seekForwardBtn) seekForwardBtn.disabled = false;
    // Download button state is managed separately based on audioBuffer availability
    if (document.getElementById('downloadBtn')) {
        document.getElementById('downloadBtn').disabled = !audioBuffer;
    }
    document.querySelectorAll('.controls-section input, .controls-section button, .controls-section select').forEach(el => { 
        if(el.id !== 'audioInput' && !el.closest('#file-upload-section') && el.id !== 'downloadBtn') { 
            el.disabled = false; 
        } 
    });
    updateUndoRedoButtons(); 
    updateCopyPasteButtons();
    if (seekBackwardBtn) seekBackwardBtn.disabled = false;
    if (seekForwardBtn) seekForwardBtn.disabled = false;
}
// Function moved to the end of file


// ====================================================
// Supabase & External AI Server Integration - Includes Fixed handleSupabaseAudio
// ====================================================

// --- Shared function to handle Supabase audio download ---
async function handleSupabaseAudio(pieceId) {
    if (!pieceId) throw new Error('Music Piece ID is required.');

    // <<< FIX: Declare audioPath here using let >>>
    let audioPath;

    try {
        // 1. Get audio metadata (URL) from musicpiecemaster
        showNotification(`Workspaceing audio metadata for piece ${pieceId}...`, "info", true);
        const { data: masterData, error: masterError } = await supabase
            .from('musicpiecemaster')
            .select('audio_oid') // Assuming 'audio_oid' stores the public URL
            .eq('music_piece_id', pieceId)
            .single(); // Expect only one master record per ID

        if (masterError) {
            // Add more specific error logging
            console.error("Supabase fetch error:", masterError);
            throw new Error(`Could not fetch metadata: ${masterError.message} (Code: ${masterError.code})`);
        }
        if (!masterData?.audio_oid) throw new Error('No audio URL found for this piece in database.');

        const fullUrl = masterData.audio_oid;
        showNotification(`Metadata found. Downloading audio from URL...`, "info", true);

        // 2. Extract storage path from the public URL (Robust approach)
        // Example URL: https://<project_ref>.supabase.co/storage/v1/object/public/music-files/some/path/audio.wav
        const urlParts = fullUrl.split('/music-files/'); // Split based on bucket name
        if (urlParts.length < 2) {
            // Fallback attempt (less ideal, added logging)
             console.warn(`Could not reliably extract path from URL: ${fullUrl}. Assuming it might be the path itself.`);
             // Try to get the last part of the path, assuming it's the filename/key
             const pathGuess = fullUrl.includes('/') ? fullUrl.substring(fullUrl.lastIndexOf('/') + 1) : fullUrl;
             if (!pathGuess) throw new Error('Cannot determine storage path from provided URL.');
             // <<< Assign to the declared variable >>>
             audioPath = pathGuess;
             console.log(`Using guessed path: ${audioPath}`);
        } else {
            // <<< Assign to the declared variable >>>
            audioPath = urlParts[1]; // The part after '/music-files/'
            console.log(`Extracted path: ${audioPath}`);
        }

        // 3. Download audio file from Supabase Storage
        showNotification(`Downloading from storage path: ${audioPath}...`, "info", true);
        const { data: audioBlob, error: downloadError } = await supabase.storage
            .from('music-files') // Bucket name
            .download(audioPath); // <<< Use the declared and assigned variable >>>

        if (downloadError) {
             console.error("Supabase download error:", downloadError);
             throw new Error(`Download failed: ${downloadError.message} (Path: ${audioPath})`);
        }
        if (!audioBlob) throw new Error('Audio download failed (empty blob).');

        showNotification(`Audio downloaded successfully (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB).`, "success");
        return { audioData: audioBlob, audioPath: audioPath }; // Return Blob and path

    } catch (error) {
        // Ensure error is logged clearly before re-throwing
        console.error('Supabase audio handling error in handleSupabaseAudio:', error);
        showNotification(`Error handling Supabase audio: ${error.message}`, "error", true);
        throw error; // Re-throw to be caught by the calling function (initializeAudio or addAudioBtn)
    }
}

// --- Function to upload file data to the AI processing server ---
// ... (Keep uploadFileToAIServer as is) ...
async function uploadFileToAIServer(fileData, fileName = 'audiofile') {
     if (!fileData) throw new Error("No file data provided for upload.");
    const aiServerUrl = 'https://8080-01jn12c923ggt7x62zr7n2zekz.cloudspaces.litng.ai/upload';
    showNotification(`Uploading audio to AI server...`, "info", true);
    try {
        const uploadFormData = new FormData();
        const file = (fileData instanceof File) ? fileData : new File([fileData], fileName, { type: fileData.type || 'audio/wav' });
        uploadFormData.append('file', file);
        const uploadResponse = await fetch(aiServerUrl, { method: 'POST', body: uploadFormData });
        if (!uploadResponse.ok) { let errorText = `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`; try { const serverError = await uploadResponse.json(); errorText += ` - ${serverError.detail || JSON.stringify(serverError)}`; } catch (e) { errorText += ` - ${await uploadResponse.text()}`; } throw new Error(errorText); }
        const result = await uploadResponse.json(); if (!result.file_path) { throw new Error('Upload response did not contain a file_path.'); }
        showNotification(`Audio successfully uploaded to AI server. Path: ${result.file_path}`, "success"); return result.file_path;
    } catch (error) { console.error('AI Server upload error:', error); showNotification(`Error uploading to AI server: ${error.message}`, "error", true); throw error; }
}


// --- Initial Load Logic (on DOMContentLoaded) - Includes Logging ---
// ***** CORRECTED VERSION (No Auto-Upload) *****
async function initializeAudio() {
    const pieceId = getMusicPieceIdFromUrl();

    if (pieceId) {
        try {
            // 1. Fetch and download audio from Supabase
            const { audioData /*, audioPath */ } = await handleSupabaseAudio(pieceId); // Get Blob only

            // 2. Decode for visualization and playback
            const arrayBuffer = await audioData.arrayBuffer();
            const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);

            audioBuffer = decodedBuffer; // Set the main audio buffer
             // <<< Logging Added >>>
             console.log("initializeAudio: AudioBuffer set successfully.", audioBuffer);

            // 3. Initialize UI and state
            zoomLevel = audioBuffer.length > 0 ? audioBuffer.length / canvas.width : 1; panOffset = 0;
            initEffects(); resetAllControlsToDefault(); renderWaveform(); initChannelControls(); updateProgress();
            enablePlaybackControls(); // Enable UI controls
             // <<< Logging Added >>>
            console.log("initializeAudio: enablePlaybackControls called.");

            // 4. *** NO AUTOMATIC UPLOAD ***
            uploadedFilePath = null; // Ensure path is null initially
            showNotification("Audio loaded from URL. Use 'Add Audio' to prepare for AI generation.", "info");

        } catch (error) {
            // <<< Logging Added >>>
            console.error('Initial audio load error (initializeAudio catch):', error);
            showNotification(`Error initializing audio: ${error.message}`, "error", true);
            disableAllControls();
            audioBuffer = null; // Ensure buffer is null
            renderWaveform(); // Clear display
        }
    } else {
        // No piece_id in URL
        showNotification("No specific audio piece ID in URL. Load a file manually or use 'Add Audio'.", "info");
        disableAllControls(); resetAllControlsToDefault();
    }
}

// --- "Add Audio" Button Handler - Includes Logging ---
addAudioBtn?.addEventListener('click', async () => {
    let currentPieceId = getMusicPieceIdFromUrl();
    if (!currentPieceId) {
        currentPieceId = prompt('Enter the Music Piece ID to load and add:');
    }
    if (!currentPieceId) { showNotification("No Music Piece ID provided.", "info"); return; }

    if (isPlaying) stopBtn?.click(); disableAllControls(); audioBuffer = null; renderWaveform();

    try {
        // 1. Fetch/download from Supabase
        const { audioData, audioPath } = await handleSupabaseAudio(currentPieceId);

        // 2. **Upload to AI server (triggered by this button click)**
        const fileName = audioPath.split('/').pop() || `audio_${currentPieceId}.wav`;
        uploadedFilePath = await uploadFileToAIServer(audioData, fileName); // Set the global path

        // 3. Decode and load into the editor *after* successful upload
         const arrayBuffer = await audioData.arrayBuffer();
         const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);

         undoStack = []; redoStack = []; updateUndoRedoButtons(); copiedRegion = null; updateCopyPasteButtons();
         audioBuffer = decodedBuffer; // Set the main audio buffer
          // <<< Logging Added >>>
         console.log("addAudioBtn: AudioBuffer set successfully.", audioBuffer);

         zoomLevel = audioBuffer.length > 0 ? audioBuffer.length / canvas.width : 1; panOffset = 0;
         initEffects(); resetAllControlsToDefault(); renderWaveform(); initChannelControls(); updateProgress();
         enablePlaybackControls(); // Enable controls
          // <<< Logging Added >>>
         console.log("addAudioBtn: enablePlaybackControls called.");

        showNotification(`Audio piece ${currentPieceId} loaded and ready for AI processing.`, "success");

    } catch (error) {
         // <<< Logging Added >>>
        console.error('Add audio error (addAudioBtn catch):', error);
        showNotification(`Error adding audio: ${error.message}`, "error", true); // Show specific error
        disableAllControls(); uploadedFilePath = null; audioBuffer = null; renderWaveform();
    }
});


// --- "Compose" (AI Interpolation) Button Handler - No Changes Here ---
// ... (Keep composeBtn listener as is) ...
composeBtn?.addEventListener('click', async () => {
    const prompt = promptTextarea?.value.trim();
    if (!prompt) { showNotification("Please enter a prompt description.", "error"); return; }
    if (!uploadedFilePath) { showNotification("Please use 'Add Audio' first to load and prepare audio for AI generation.", "error"); return; }
    if (isPlaying) { showNotification("Please stop playback before generating.", "info"); return; }
    if (!document.body.contains(loadingOverlay)) { document.body.appendChild(loadingOverlay); } disableAllControls();
    const aiServerUrl = 'https://8080-01jn12c923ggt7x62zr7n2zekz.cloudspaces.litng.ai/interpolation';
    try {
        const response = await fetch(aiServerUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, file_path: uploadedFilePath }) });
        if (!response.ok) { let errorText = `AI generation failed: ${response.status} ${response.statusText}`; try { const serverError = await response.json(); errorText += ` - ${serverError.detail || JSON.stringify(serverError)}`; } catch(e){ errorText += ` - ${await response.text()}`; } throw new Error(errorText); }
        const audioBlob = await response.blob(); if (!audioBlob || audioBlob.size === 0) { throw new Error("Received empty audio data from AI server."); }
        showNotification("AI generation complete. Loading new audio...", "success", true); saveStateForUndo("AI Generation");
        const arrayBuffer = await audioBlob.arrayBuffer(); const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffer = decodedBuffer;
        zoomLevel = audioBuffer.length > 0 ? audioBuffer.length / canvas.width : 1; panOffset = 0;
        renderWaveform(); initChannelControls(); updateProgress(); updateUndoRedoButtons(); enablePlaybackControls(); showNotification("New audio loaded successfully!", "success");
    } catch (error) { console.error('AI Generation error:', error); showNotification(`Generation failed: ${error.message}`, "error", true); enablePlaybackControls(); } finally { if (document.body.contains(loadingOverlay)) { document.body.removeChild(loadingOverlay); } }
});


// ====================================================
// Save Version to Supabase - No Changes Here
// ====================================================
// ... (Keep audioBufferToWavBlob, getMusicPieceVersionIDs, saveVersionBtn listener as is) ...
function audioBufferToWavBlob(buffer) { function encodeWAV(audioBuffer) { const numChannels = buffer.numberOfChannels; const sampleRate = buffer.sampleRate; const format = 1; const bitDepth = 16; let samples = []; if (numChannels === 0 || buffer.length === 0) return null; if (numChannels === 2) { const left = buffer.getChannelData(0); const right = buffer.getChannelData(1); samples = interleave(left, right); } else { samples = buffer.getChannelData(0); if(numChannels > 2) console.warn("WAV export defaulting to mono for >2 channels."); } const dataLength = samples.length * (bitDepth / 8); const bufferLength = 44 + dataLength; const arrayBuffer = new ArrayBuffer(bufferLength); const view = new DataView(arrayBuffer); writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + dataLength, true); writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, format, true); view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); view.setUint16(32, numChannels * (bitDepth / 8), true); view.setUint16(34, bitDepth, true); writeString(view, 36, 'data'); view.setUint32(40, dataLength, true); floatTo16BitPCM(view, 44, samples); return new Blob([arrayBuffer], { type: 'audio/wav' }); } function interleave(left, right) { const length = left.length + right.length; const result = new Float32Array(length); let inputIndex = 0; for (let index = 0; index < length;) { result[index++] = left[inputIndex]; result[index++] = right[inputIndex]; inputIndex++; } return result; } function writeString(view, offset, string) { for (let i = 0; i < string.length; i++) { view.setUint8(offset + i, string.charCodeAt(i)); } } function floatTo16BitPCM(output, offset, input) { for (let i = 0; i < input.length; i++, offset += 2) { let s = Math.max(-1, Math.min(1, input[i])); output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); } } return encodeWAV(buffer); }
async function getMusicPieceVersionIDs(musicPieceId) { if (!musicPieceId) throw new Error("Music Piece ID is required."); const { data: masterData, error: masterError } = await supabase .from('musicpiecemaster') .select('composer_id') .eq('music_piece_id', musicPieceId) .single(); if (masterError) throw new Error(`Could not fetch composer_id: ${masterError.message}`); if (!masterData) throw new Error('Music piece master record not found.'); let audioEngineerId = null; const { data: engineerAssignment, error: engineerError } = await supabase .from('audioengineer_musicpiece') .select('audio_engineer_id') .eq('music_piece_id', musicPieceId) .limit(1) .single(); if (engineerError && engineerError.code !== 'PGRST116') { console.warn(`Could not fetch assigned audio engineer: ${engineerError.message}`); } audioEngineerId = engineerAssignment?.audio_engineer_id || null; return { masterId: musicPieceId, composerId: masterData.composer_id, audioEngineerId: audioEngineerId }; }
saveVersionBtn?.addEventListener('click', async () => { if (!audioBuffer) { showNotification('No audio loaded to save.', "error"); return; } if (isPlaying) { showNotification('Stop playback before saving.', "info"); return; } const musicPieceId = getMusicPieceIdFromUrl(); if (!musicPieceId) { showNotification('Cannot identify the music piece to save. Is piece_id in the URL?', "error", true); return; } showNotification('Preparing to save version...', "info", true); if (saveVersionBtn) saveVersionBtn.disabled = true; try { const { masterId, composerId, audioEngineerId } = await getMusicPieceVersionIDs(musicPieceId); showNotification('Checking latest version number...', "info", true); let { data: latestVersion, error: versionError } = await supabase .from('musicpieceversion') .select('version_no') .eq('master_id', masterId) .order('version_no', { ascending: false }) .limit(1); if (versionError) throw versionError; let nextVersionNo = 1; if (latestVersion && latestVersion.length > 0 && latestVersion[0].version_no != null) { nextVersionNo = latestVersion[0].version_no + 1; } showNotification(`Saving as Version ${nextVersionNo}. Converting audio...`, "info", true); const wavBlob = audioBufferToWavBlob(audioBuffer); if (!wavBlob || wavBlob.size === 0) { throw new Error("Failed to convert audio to WAV format."); } const fileName = `piece_${masterId}_v${nextVersionNo}_${Date.now()}.wav`; const storagePath = `${fileName}`; showNotification(`Uploading WAV file (${(wavBlob.size / 1024 / 1024).toFixed(2)} MB) to storage...`, "info", true); const { error: uploadError } = await supabase.storage .from('music-files') .upload(storagePath, wavBlob, { upsert: false }); if (uploadError) throw uploadError; showNotification('Getting public URL...', "info", true); const { data: urlData } = supabase.storage .from('music-files') .getPublicUrl(storagePath); if (!urlData?.publicUrl) throw new Error("Failed to get public URL for the uploaded file."); const publicUrl = urlData.publicUrl; showNotification('Saving version metadata to database...', "info", true); const versionData = { master_id: masterId, composer_id: composerId, audio_engineer_id: audioEngineerId, audio_oid: publicUrl, duration: audioBuffer.duration, version_no: nextVersionNo, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; const { error: insertError } = await supabase .from('musicpieceversion') .insert([versionData]); if (insertError) throw insertError; showNotification(`Version ${nextVersionNo} saved successfully!`, "success"); } catch (error) { console.error('Error saving version:', error); showNotification(`Failed to save version: ${error.message || error}`, "error", true); } finally { if (saveVersionBtn) saveVersionBtn.disabled = false; } });


// ====================================================
// Initialization on DOMContentLoaded
// ====================================================
document.addEventListener('DOMContentLoaded', async function () {
    console.log("DOM Loaded. Initializing...");
    initWebGL();
    resizeCanvases(); // Initial size adjustment
    resetAllControlsToDefault(); // Start with clean UI state
    disableAllControls(); // Start with controls disabled until audio is loaded
    updateUndoRedoButtons(); // Initialize button states
    updateCopyPasteButtons();

    // Initialize main audio based on URL (NOW WITHOUT AUTO-UPLOAD) or wait for user action
    await initializeAudio();

    // Final check on controls state after initialization attempt
    if (audioBuffer) {
        // enablePlaybackControls() was called in initializeAudio if successful
        console.log("Initialization check: Audio buffer loaded, controls should be enabled.");
    } else {
        console.log("Initialization check: No audio buffer loaded, controls remain disabled.");
        // Notification already shown by initializeAudio if needed
    }

    // Initial render if buffer loaded
    if(audioBuffer) {
        renderWaveform();
    }
});

// Ensure initial resize is called after elements are potentially rendered and sized
window.addEventListener('load', () => {
    console.log("Window Loaded. Resizing canvases.");
    resizeCanvases();
});

// Update the AI server URL usage
async function uploadToAIServer(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(config.AI_SERVER_URL, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error uploading to AI server:', error);
        throw error;
    }
}

// Initialize download button functionality
document.getElementById('downloadBtn').addEventListener('click', async () => {
    if (!audioBuffer) {
        showNotification('No audio loaded to download', 'error');
        return;
    }

    try {
        showNotification('Preparing download...', 'info');
        
        // Convert AudioBuffer to WAV Blob
        const wavBlob = audioBufferToWavBlob(audioBuffer);
        
        if (!wavBlob) {
            throw new Error('Failed to create WAV file');
        }
        
        // Create download link
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `audio-${timestamp}.wav`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('Download started!', 'success');
    } catch (error) {
        console.error('Error downloading audio:', error);
        showNotification('Error preparing download. Please try again.', 'error');
    }
});

// Download button functionality is now included in the main enablePlaybackControls and disableAllControls functions

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get piece ID from URL
        const pieceId = getMusicPieceIdFromUrl();
        console.log('Piece ID from URL:', pieceId);

        if (pieceId) {
            try {
                showNotification('Loading audio from server...', 'info', true);
                const { audioData } = await handleSupabaseAudio(pieceId);
                console.log('Audio data loaded:', audioData);

                // Decode the audio data
                const arrayBuffer = await audioData.arrayBuffer();
                const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
                console.log('Audio decoded successfully:', decodedBuffer);

                // Set the audio buffer and initialize
                audioBuffer = decodedBuffer;
                
                // Initialize effects and controls
                await initEffects();
                resetAllControlsToDefault();
                
                // Set up visualizations
                renderWaveform();
                initChannelControls();
                updateProgress();
                
                // Enable controls
                enablePlaybackControls();
                
                showNotification('Audio loaded successfully!', 'success');
            } catch (error) {
                console.error('Error loading audio:', error);
                showNotification('Error loading audio: ' + error.message, 'error', true);
            }
        } else {
            console.log('No piece ID found in URL - waiting for user input');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Error initializing audio editor: ' + error.message, 'error', true);
    }
});

// ... existing code ...
document.addEventListener('DOMContentLoaded', function() {
    // ... existing event listeners ...

    // Bitcrusher Controls
    const bitcrusherToggle = document.getElementById('bitcrusherToggle');
    const bitDepthSlider = document.getElementById('bitDepth');
    const sampleRateSlider = document.getElementById('sampleRate');
    const bitcrusherMixSlider = document.getElementById('bitcrusherMix');
    const bitDepthValue = document.getElementById('bitDepthValue');
    const sampleRateValue = document.getElementById('sampleRateValue');
    const bitcrusherMixValue = document.getElementById('bitcrusherMixValue');

    bitcrusherToggle?.addEventListener('change', function() {
        bitcrusherGain.gain.value = this.checked ? parseFloat(bitcrusherMixSlider.value) : 0;
        buildAudioGraph();
    });

    bitDepthSlider?.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (bitDepthValue) bitDepthValue.textContent = value;
        bitDepth = value;
    });

    sampleRateSlider?.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (sampleRateValue) sampleRateValue.textContent = value;
        sampleRate = value;
    });

    bitcrusherMixSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (bitcrusherMixValue) bitcrusherMixValue.textContent = value.toFixed(2);
        if (bitcrusherToggle.checked) bitcrusherGain.gain.value = value;
    });

    // EQ Controls
    const eqLowSlider = document.getElementById('eqLow');
    const eqMidSlider = document.getElementById('eqMid');
    const eqHighSlider = document.getElementById('eqHigh');
    const eqLowValue = document.getElementById('eqLowValue');
    const eqMidValue = document.getElementById('eqMidValue');
    const eqHighValue = document.getElementById('eqHighValue');

    eqLowSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (eqLowValue) eqLowValue.textContent = value.toFixed(1);
        eqLowNode.gain.setTargetAtTime(value, audioContext.currentTime, 0.01);
    });

    eqMidSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (eqMidValue) eqMidValue.textContent = value.toFixed(1);
        eqMidNode.gain.setTargetAtTime(value, audioContext.currentTime, 0.01);
    });

    eqHighSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (eqHighValue) eqHighValue.textContent = value.toFixed(1);
        eqHighNode.gain.setTargetAtTime(value, audioContext.currentTime, 0.01);
    });

    // Tremolo Controls
    const tremoloToggle = document.getElementById('tremoloToggle');
    const tremoloRateSlider = document.getElementById('tremoloRate');
    const tremoloDepthSlider = document.getElementById('tremoloDepth');
    const tremoloRateValue = document.getElementById('tremoloRateValue');
    const tremoloDepthValue = document.getElementById('tremoloDepthValue');

    tremoloToggle?.addEventListener('change', function() {
        tremoloGain.gain.value = this.checked ? parseFloat(tremoloDepthSlider.value) : 0;
    });

    tremoloRateSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (tremoloRateValue) tremoloRateValue.textContent = value.toFixed(1);
        tremoloOsc.frequency.setTargetAtTime(value, audioContext.currentTime, 0.01);
    });

    tremoloDepthSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (tremoloDepthValue) tremoloDepthValue.textContent = value.toFixed(2);
        if (tremoloToggle.checked) tremoloGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.01);
    });

    // Phaser Controls
    const phaserToggle = document.getElementById('phaserToggle');
    const phaserRateSlider = document.getElementById('phaserRate');
    const phaserDepthSlider = document.getElementById('phaserDepth');
    const phaserFeedbackSlider = document.getElementById('phaserFeedback');
    const phaserRateValue = document.getElementById('phaserRateValue');
    const phaserDepthValue = document.getElementById('phaserDepthValue');
    const phaserFeedbackValue = document.getElementById('phaserFeedbackValue');

    phaserToggle?.addEventListener('change', function() {
        buildAudioGraph(); // Rebuild audio graph to enable/disable phaser
    });

    phaserRateSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (phaserRateValue) phaserRateValue.textContent = value.toFixed(1);
        phaserLFO.frequency.setTargetAtTime(value, audioContext.currentTime, 0.01);
    });

    phaserDepthSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (phaserDepthValue) phaserDepthValue.textContent = value.toFixed(2);
        phaserNodes.forEach(node => {
            node.frequency.setTargetAtTime(1000 + value * 2000, audioContext.currentTime, 0.01);
        });
    });

    phaserFeedbackSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (phaserFeedbackValue) phaserFeedbackValue.textContent = value.toFixed(2);
        phaserFeedback.gain.setTargetAtTime(value, audioContext.currentTime, 0.01);
    });

    // Gate Controls
    const gateToggle = document.getElementById('gateToggle');
    const gateThresholdSlider = document.getElementById('gateThreshold');
    const gateAttackSlider = document.getElementById('gateAttack');
    const gateReleaseSlider = document.getElementById('gateRelease');
    const gateThresholdValue = document.getElementById('gateThresholdValue');
    const gateAttackValue = document.getElementById('gateAttackValue');
    const gateReleaseValue = document.getElementById('gateReleaseValue');

    gateToggle?.addEventListener('change', function() {
        buildAudioGraph(); // Rebuild audio graph to enable/disable gate
    });

    gateThresholdSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (gateThresholdValue) gateThresholdValue.textContent = value;
        updateGate();
    });

    gateAttackSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (gateAttackValue) gateAttackValue.textContent = value.toFixed(3);
        updateGate();
    });

    gateReleaseSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (gateReleaseValue) gateReleaseValue.textContent = value.toFixed(3);
        updateGate();
    });
});

// Helper function for noise gate
function updateGate() {
    if (!gateNode || !gateToggle?.checked) return;
    
    // Ensure we have valid references to all required elements
    if (!gateThresholdSlider || !gateAttackSlider || !gateReleaseSlider) {
        console.warn('Gate controls not properly initialized');
        return;
    }
    
    const threshold = parseFloat(gateThresholdSlider.value);
    const attack = parseFloat(gateAttackSlider.value);
    const release = parseFloat(gateReleaseSlider.value);
    
    // Create or reuse analyzer
    if (!gateAnalyser) {
        gateAnalyser = audioContext.createAnalyser();
        gateAnalyser.fftSize = 2048;
    }
    
    const dataArray = new Float32Array(gateAnalyser.fftSize);
    
    function updateGateGain() {
        if (!gateToggle?.checked) {
            if (gateUpdateRAF) {
                cancelAnimationFrame(gateUpdateRAF);
                gateUpdateRAF = null;
            }
            return;
        }

        gateAnalyser.getFloatTimeDomainData(dataArray);
        
        // Calculate RMS value
        let rms = 0;
        for (let i = 0; i < dataArray.length; i++) {
            rms += dataArray[i] * dataArray[i];
        }
        rms = Math.sqrt(rms / dataArray.length);
        
        // Convert to dB
        const db = 20 * Math.log10(Math.max(rms, 1e-9));
        
        // Update gate gain with smoother transition
        const targetGain = db < threshold ? 0 : 1;
        const timeConstant = targetGain === 0 ? release : attack;
        
        if (gateNode) {
            gateNode.gain.setTargetAtTime(targetGain, audioContext.currentTime, timeConstant);
        }
        
        gateUpdateRAF = requestAnimationFrame(updateGateGain);
    }
    
    // Start the update loop
    if (gateUpdateRAF) {
        cancelAnimationFrame(gateUpdateRAF);
    }
    gateUpdateRAF = requestAnimationFrame(updateGateGain);
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize gate control references
    gateThresholdSlider = document.getElementById('gateThreshold');
    gateAttackSlider = document.getElementById('gateAttack');
    gateReleaseSlider = document.getElementById('gateRelease');
    gateThresholdValue = document.getElementById('gateThresholdValue');
    gateAttackValue = document.getElementById('gateAttackValue');
    gateReleaseValue = document.getElementById('gateReleaseValue');
    gateToggle = document.getElementById('gateToggle');
    
    // Initialize gate controls
    gateToggle = document.getElementById('gateToggle');
    gateThresholdSlider = document.getElementById('gateThreshold');
    gateAttackSlider = document.getElementById('gateAttack');
    gateReleaseSlider = document.getElementById('gateRelease');
    gateThresholdValue = document.getElementById('gateThresholdValue');
    gateAttackValue = document.getElementById('gateAttackValue');
    gateReleaseValue = document.getElementById('gateReleaseValue');

    // Gate Controls with auto-apply
    gateToggle?.addEventListener('change', function() {
        if (this.checked) {
            if (!gateAnalyser) {
                gateAnalyser = audioContext.createAnalyser();
                gateAnalyser.fftSize = 2048;
            }
            updateGate();
        } else {
            if (gateUpdateRAF) {
                cancelAnimationFrame(gateUpdateRAF);
                gateUpdateRAF = null;
            }
            if (gateNode) {
                gateNode.gain.setTargetAtTime(1, audioContext.currentTime, 0.01);
            }
        }
        buildAudioGraph();
    });

    // Auto-applying input handlers
    gateThresholdSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (gateThresholdValue) gateThresholdValue.textContent = value;
        updateGate();
    });

    gateAttackSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (gateAttackValue) gateAttackValue.textContent = value.toFixed(3);
        updateGate();
    });

    gateReleaseSlider?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (gateReleaseValue) gateReleaseValue.textContent = value.toFixed(3);
        updateGate();
    });
});

// Add this function to update all value displays
function updateAllValueDisplays() {
    // Update all value displays
    if (reverbMixValue) reverbMixValue.textContent = '0';
    if (reverbDecayValue) reverbDecayValue.textContent = '2.0';
    if (delayTimeValue) delayTimeValue.textContent = '0.3';
    if (delayFeedbackValue) delayFeedbackValue.textContent = '30';
    if (delayMixValue) delayMixValue.textContent = '50';
    if (chorusRateValue) chorusRateValue.textContent = '0.25';
    if (chorusDepthValue) chorusDepthValue.textContent = '0.003';
    if (chorusMixValue) chorusMixValue.textContent = '0';
    if (compressorThresholdValue) compressorThresholdValue.textContent = '0';
    if (compressorRatioValue) compressorRatioValue.textContent = '1';
    if (compressorAttackValue) compressorAttackValue.textContent = '0';
    if (compressorReleaseValue) compressorReleaseValue.textContent = '0';
    if (gateThresholdValue) gateThresholdValue.textContent = '-60';
    if (gateAttackValue) gateAttackValue.textContent = '0.01';
    if (gateReleaseValue) gateReleaseValue.textContent = '0.1';
    if (stereoWidenerValue) stereoWidenerValue.textContent = '0';
    if (phaserRateValue) phaserRateValue.textContent = '0.5';
    if (phaserDepthValue) phaserDepthValue.textContent = '0';
    if (phaserFeedbackValue) phaserFeedbackValue.textContent = '0';
}

// Remove the first initChannelControls function and keep only the one at the end
function initChannelControls() {
    if (!channelControlsDiv || !audioBuffer) return;
    
    channelControlsDiv.innerHTML = '';
    enabledChannels = [0]; // Always start with only Channel 1 enabled
    
    // Only create control for Channel 1
    const channelDiv = document.createElement('div');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'channel0';
    checkbox.checked = true; // Always checked by default
    
    const label = document.createElement('label');
    label.htmlFor = 'channel0';
    label.textContent = 'Channel 1';
    
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            if (!enabledChannels.includes(0)) {
                enabledChannels.push(0);
            }
        } else {
            const index = enabledChannels.indexOf(0);
            if (index > -1) {
                enabledChannels.splice(index, 1);
            }
        }
        renderWaveform();
    });
    
    channelDiv.appendChild(checkbox);
    channelDiv.appendChild(label);
    channelControlsDiv.appendChild(channelDiv);




}



// Inside the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Initialize bitcrusher controls
    bitDepthSlider = document.getElementById('bitDepth');
    bitDepthValue = document.getElementById('bitDepthValue');
    
    bitDepthSlider?.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (bitDepthValue) bitDepthValue.textContent = value;
        bitDepth = value;
        if (bitcrusherNode) {
            updateBitcrusher();
        }
    });
    

});

// Add or update the updateBitcrusher function
function updateBitcrusher() {
    if (!bitcrusherNode) return;
    
    const depth = bitDepth || 16;
    const step = Math.pow(0.5, depth);
    
    // Apply bit reduction
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const data = audioBuffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.round(data[i] / step) * step;
        }
    }
    
    // Rebuild audio graph to apply changes
    buildAudioGraph();
}


// Add touch event handlers to prevent seeking
waveformContainer?.addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevent default touch behavior
});

waveformContainer?.addEventListener('touchmove', function(e) {
    e.preventDefault(); // Prevent default touch behavior
});

waveformContainer?.addEventListener('touchend', function(e) {
    e.preventDefault(); // Prevent default touch behavior
});


// Function to seek audio by a given number of seconds
function seekAudio(seconds) {
    if (!audioBuffer) return;
    
    const currentTime = isPlaying ? audioContext.currentTime - startTime : pauseTime;
    const newTime = Math.max(0, Math.min(currentTime + seconds, audioBuffer.duration));
    
    if (isPlaying) {
        // Stop current playback
        if (sourceNode) {
            sourceNode.stop();
        }
        
        // Create new source node and start from new position
        startTime = audioContext.currentTime - newTime;
        createSourceNode();
        buildAudioGraph();
    } else {
        pauseTime = newTime;
    }
    
    updateProgress();
}


// Add event listeners for seek buttons
if (seekBackwardBtn) {
    seekBackwardBtn.addEventListener('click', () => seekAudio(-5));
}

if (seekForwardBtn) {
    seekForwardBtn.addEventListener('click', () => seekAudio(5));
}

// Add chorus toggle initialization in DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // ... existing initializations ...
    
    // Initialize chorus toggle
    chorusToggle = document.getElementById('chorusToggle');
    
    // Add chorus toggle event listener
    chorusToggle?.addEventListener('change', function() {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        buildAudioGraph();
    });
    
    // ... rest of the initialization code ...
});

delayToggle?.addEventListener('change', function () {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (isPlaying) {
        isPlaying = false;
        if (sourceNode) {
            try {
                sourceNode.onended = null;
                sourceNode.stop();
                sourceNode.disconnect();
            } catch(e) { /* Ignore */ }
            sourceNode = null;
        }
        if (playPauseBtn) playPauseBtn.textContent = 'Play';
        pauseTime = 0;
        updateProgress();
    }
    buildAudioGraph();
});

chorusToggle?.addEventListener('change', function () {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (isPlaying) {
        isPlaying = false;
        if (sourceNode) {
            try {
                sourceNode.onended = null;
                sourceNode.stop();
                sourceNode.disconnect();
            } catch(e) { /* Ignore */ }
            sourceNode = null;
        }
        if (playPauseBtn) playPauseBtn.textContent = 'Play';
        pauseTime = 0;
        updateProgress();
    }
    buildAudioGraph();
});

stereoWidenerToggle?.addEventListener('change', function () {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (isPlaying) {
        isPlaying = false;
        if (sourceNode) {
            try {
                sourceNode.onended = null;
                sourceNode.stop();
                sourceNode.disconnect();
            } catch(e) { /* Ignore */ }
            sourceNode = null;
        }
        if (playPauseBtn) playPauseBtn.textContent = 'Play';
        pauseTime = 0;
        updateProgress();
    }
    buildAudioGraph();
});

phaserToggle?.addEventListener('change', function () {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (isPlaying) {
        isPlaying = false;
        if (sourceNode) {
            try {
                sourceNode.onended = null;
                sourceNode.stop();
                sourceNode.disconnect();
            } catch(e) { /* Ignore */ }
            sourceNode = null;
        }
        if (playPauseBtn) playPauseBtn.textContent = 'Play';
        pauseTime = 0;
        updateProgress();
    }
    buildAudioGraph();
});

tremoloToggle?.addEventListener('change', function () {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (isPlaying) {
        isPlaying = false;
        if (sourceNode) {
            try {
                sourceNode.onended = null;
                sourceNode.stop();
                sourceNode.disconnect();
            } catch(e) { /* Ignore */ }
            sourceNode = null;
        }
        if (playPauseBtn) playPauseBtn.textContent = 'Play';
        pauseTime = 0;
        updateProgress();
    }
    buildAudioGraph();
});

gateToggle?.addEventListener('change', function () {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (isPlaying) {
        isPlaying = false;
        if (sourceNode) {
            try {
                sourceNode.onended = null;
                sourceNode.stop();
                sourceNode.disconnect();
            } catch(e) { /* Ignore */ }
            sourceNode = null;
        }
        if (playPauseBtn) playPauseBtn.textContent = 'Play';
        pauseTime = 0;
        updateProgress();
    }
    buildAudioGraph();
});

applyBtn?.addEventListener('click', async function() {
    if (!audioBuffer) return;
    
    // Ensure the source node is completely stopped and disconnected
    if (sourceNode) {
        try {
            sourceNode.onended = null;
            sourceNode.stop();
            sourceNode.disconnect();
        } catch(e) { /* Ignore */ }
        sourceNode = null;
    }
    
    // Reset playback state
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.textContent = 'Play';
    pauseTime = 0;
    updateProgress();
    
    // Rebuild the audio graph
    buildAudioGraph();
});

delaySlider?.addEventListener('input', function() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (isPlaying) {
        isPlaying = false;
        if (sourceNode) {
            try {
                sourceNode.onended = null;
                sourceNode.stop();
                sourceNode.disconnect();
            } catch(e) { /* Ignore */ }
            sourceNode = null;
        }
        if (playPauseBtn) playPauseBtn.textContent = 'Play';
        pauseTime = 0;
        updateProgress();
    }
    buildAudioGraph();
});

/**
 * State management for undo/redo
 */
const stateManager = {
    undoStack: [],
    redoStack: [],
    maxStackSize: 50,

    /**
     * Saves the current state for undo
     * @param {string} actionName - Name of the action being performed
     */
    saveState(actionName) {
        if (!audioBuffer) return;

        try {
            // Create a copy of the current buffer
            const bufferCopy = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );
            
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                bufferCopy.copyToChannel(audioBuffer.getChannelData(i), i);
            }

            // Add to undo stack
            this.undoStack.push({
                buffer: bufferCopy,
                action: actionName
            });

            // Clear redo stack when new action is performed
            this.redoStack = [];

            // Limit stack size
            if (this.undoStack.length > this.maxStackSize) {
                this.undoStack.shift();
            }

            updateUndoRedoButtons();
        } catch (error) {
            console.error('Error saving state:', error);
            showNotification('Error saving state: ' + error.message, 'error');
        }
    },

    /**
     * Performs an undo operation
     */
    undo() {
        if (this.undoStack.length === 0) {
            showNotification("Nothing to undo.", "info");
            return;
        }

        if (isPlaying) {
            showNotification("Stop playback before undo.", "info");
            return;
        }

        try {
            // Save current state to redo stack
            const currentBufferCopy = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );
            
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                currentBufferCopy.copyToChannel(audioBuffer.getChannelData(i), i);
            }

            const currentStateAction = this.redoStack.length > 0 
                ? `Redo of "${this.redoStack[this.redoStack.length - 1].action}"`
                : "Current State Before Undo";

            this.redoStack.push({
                buffer: currentBufferCopy,
                action: currentStateAction
            });

            // Restore previous state
            const previousState = this.undoStack.pop();
            audioBuffer = previousState.buffer;

            // Update UI
            showNotification(`Undo: ${previousState.action}`, "success");
            zoomLevel = audioBuffer.length > 0 ? audioBuffer.length / canvas.width : 1;
            panOffset = 0;
            clearSelection();
            renderWaveform();
            updateProgress();
            updateUndoRedoButtons();
        } catch (error) {
            console.error("Error during undo:", error);
            showNotification("Error performing undo.", "error");
            if (this.redoStack.length > 0 && audioBuffer !== this.redoStack[this.redoStack.length - 1].buffer) {
                this.redoStack.pop();
            }
            updateUndoRedoButtons();
        }
    },

    /**
     * Performs a redo operation
     */
    redo() {
        if (this.redoStack.length === 0) {
            showNotification("Nothing to redo.", "info");
            return;
        }

        if (isPlaying) {
            showNotification("Stop playback before redoing.", "info");
            return;
        }

        try {
            // Save current state to undo stack
            const currentBufferCopy = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );
            
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                currentBufferCopy.copyToChannel(audioBuffer.getChannelData(i), i);
            }

            const actionName = this.undoStack.length > 0 
                ? `Undo of "${this.undoStack[this.undoStack.length - 1].action}"`
                : "State Before Redo";

            this.undoStack.push({
                buffer: currentBufferCopy,
                action: actionName
            });

            // Restore next state
            const nextState = this.redoStack.pop();
            audioBuffer = nextState.buffer;

            // Update UI
            showNotification(`Redo: ${nextState.action}`, "success");
            zoomLevel = audioBuffer.length > 0 ? audioBuffer.length / canvas.width : 1;
            panOffset = 0;
            clearSelection();
            renderWaveform();
            updateProgress();
            updateUndoRedoButtons();
        } catch (error) {
            console.error("Error during redo:", error);
            showNotification("Error performing redo.", "error");
            if (this.undoStack.length > 0 && audioBuffer !== this.undoStack[this.undoStack.length - 1].buffer) {
                this.undoStack.pop();
            }
            updateUndoRedoButtons();
        }
    }
};

// Update the undo/redo button handlers
undoBtn?.addEventListener('click', () => stateManager.undo());
redoBtn?.addEventListener('click', () => stateManager.redo());

