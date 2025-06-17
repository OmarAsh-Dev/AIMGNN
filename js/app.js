// Import the Supabase client as an ES module
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  .custom-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 8px;
    background: linear-gradient(180deg, var(--color-bg1), var(--color-bg2));
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    transform: translateX(120%);
    transition: transform 0.3s ease-in-out;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .custom-notification.show {
    transform: translateX(0);
  }

  .custom-notification.success {
    border-left: 4px solid #4CAF50;
  }

  .custom-notification.error {
    border-left: 4px solid #f44336;
  }

  .custom-notification .notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .custom-notification i {
    font-size: 1.2em;
  }

  .custom-notification.success i {
    color: #4CAF50;
  }

  .custom-notification.error i {
    color: #f44336;
  }
`;
document.head.appendChild(notificationStyles);

// Supabase configuration
const SUPABASE_URL = 'https://pcaiuorgyybjupibnqxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWl1b3JneXlianVwaWJucXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMjc2MTUsImV4cCI6MjA1OTgwMzYxNX0.7sPShr6J4oa7nQ-MFjXmVUghB-ORNW5n97l3rHWMAls';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Audio Player Variables
let currentAudio = null;
let currentPlayButton = null;

// ID Caches
let composerIdCache = null;
let audioEngineerIdCache = null;
let programmerIdCache = null;

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

// Role-Based Functions
async function getComposerId() {
  if (composerIdCache) return composerIdCache;
  const userId = sessionStorage.getItem("userId");
  const { data } = await supabase
    .from('composer')
    .select('composer_id')
    .eq('user_id', userId)
    .single();
  composerIdCache = data?.composer_id;
  return composerIdCache;
}

async function getAudioEngineerId() {
  if (audioEngineerIdCache) return audioEngineerIdCache;
  const userId = sessionStorage.getItem("userId");
  const { data } = await supabase
    .from('audioengineer')
    .select('audio_engineer_id')
    .eq('user_id', userId)
    .single();
  audioEngineerIdCache = data?.audio_engineer_id;
  return audioEngineerIdCache;
}

async function getProgrammerId() {
  if (programmerIdCache) return programmerIdCache;
  const userId = sessionStorage.getItem("userId");
  const { data } = await supabase
    .from('programmer')
    .select('programmer_id')
    .eq('user_id', userId)
    .single();
  programmerIdCache = data?.programmer_id;
  return programmerIdCache;
}



// Update the fetchEditors and fetchProgrammers functions
async function fetchEditors() {
  const { data, error } = await supabase
    .from('audioengineer')
    .select(`
      audio_engineer_id,
      users!inner(username)
    `);

  if (error) throw error;
  return data.map(e => e.users.username);
}


function createAssignMenu(pieceId) {
  const modal = document.createElement('div');
  modal.className = 'share-modal';
  modal.style.opacity = '0';
  modal.style.transform = 'scale(0.95)';
  modal.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  
  modal.innerHTML = `
    <div class="share-content">
      <div class="share-header">
        <h3>Collab with an Audio Editor</h3>
        <button class="close-button">&times;</button>
      </div>
      <div class="tab-content">
        <div id="editors-tab" class="tab-pane active">
          <div class="user-list"></div>
        </div>
      </div>
    </div>
  `;

  // Only fetch audio engineers
  fetchEditors().then(editors => {
    const editorsList = modal.querySelector('#editors-tab .user-list');
    editors.forEach(username => {
      editorsList.appendChild(createUserListItem(username, 'editor', pieceId));
    });
  });

  modal.querySelector('.close-button').addEventListener('click', () => {
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.95)';
    setTimeout(() => modal.remove(), 300);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.opacity = '0';
      modal.style.transform = 'scale(0.95)';
      setTimeout(() => modal.remove(), 300);
    }
  });

  document.body.appendChild(modal);
  
  // Trigger animation after a small delay
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
    modal.style.transform = 'scale(1)';
  });
}

async function createShareMenu(itemId) {
  // Determine if this is a version or master piece
  const isVersion = itemId.toString().startsWith('v');
  const actualId = isVersion ? itemId.substring(1) : itemId;
  const tableName = isVersion ? "musicpieceversion" : "musicpiecemaster";
  const idField = isVersion ? "version_id" : "music_piece_id";

  // Fetch the raw audio URL and title
  const { data: composition, error } = await supabase
    .from(tableName)
    .select("audio_oid, title")
    .eq(idField, actualId)
    .single();

  if (error || !composition) {
    alert("Failed to fetch audio for sharing.");
    console.error("Supabase query error:", error);
    return;
  }

  // Use the audio_oid AS-IS (it's already a full URL)
  const audioUrl = composition.audio_oid;
  // Validate URL format (optional but recommended)
  if (!audioUrl.startsWith("https://"))  {
    alert("Invalid audio URL.");
    console.error("Invalid audio_oid:", audioUrl);
    return;
  }

  // Web Share API (modern browsers)
  if (navigator.share) {
    try {
      await navigator.share({
        title: composition.title,
        text: `Check out "${composition.title}"`,
        url: audioUrl
      });
      console.log("Shared successfully");
    } catch (err) {
      alert(`Share failed: ${err.message}`);
    }
  } 
  // Fallback: Copy to clipboard
  else {
    try {
      await navigator.clipboard.writeText(audioUrl);
      alert("Audio link copied to clipboard!");
    } catch (err) {
      alert("Failed to copy link. Please try manually.");
      console.error("Clipboard error:", err);
    }
  }
}

// Update the createUserListItem function
function createUserListItem(username, role, pieceId) {
  const item = document.createElement('div');
  item.className = 'user-item';
  item.innerHTML = `
    <span>${username}</span>
    <button class="assign-button">Assign</button>
  `;

  item.querySelector('.assign-button').addEventListener('click', async () => {
    try {
      const { data, error } = await supabase
        .from('audioengineer')
        .select(`
          audio_engineer_id,
          users!inner(username)
        `)
        .eq('users.username', username)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Audio engineer not found");

      // First check if the assignment already exists
      const { data: existingAssignment, error: checkError } = await supabase
        .from('audioengineer_musicpiece')
        .select('*')
        .eq('audio_engineer_id', data.audio_engineer_id)
        .eq('music_piece_id', pieceId)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingAssignment) {
        showNotification(`${username} is already assigned to this piece`, "error");
        return;
      }

      const { error: insertError } = await supabase
        .from('audioengineer_musicpiece')
        .insert({
          audio_engineer_id: data.audio_engineer_id,
          music_piece_id: pieceId
        });

      if (insertError) {
        if (insertError.code === '23505') { // PostgreSQL unique violation code
          showNotification(`${username} is already assigned to this piece`, "error");
        } else {
          throw insertError;
        }
        return;
      }

      showNotification(`Successfully assigned to ${username}`, "success");
    } catch (error) {
      console.error('Assignment error:', error);
      showNotification(`Failed to assign to ${username}: ${error.message}`, "error");
    }
  });
  return item;
}
  

/**
 * Role-based page mapping function
 */
function getAccessiblePages(currentUser) {
  const pageMapping = {
    admin: ["Dashboard", "generate", "editor", "Reports", "AiSettings"],
    manager: ["Dashboard", "generate", "editor", "Reports", "AiSettings"],
    composer: ["Dashboard", "generate", "Composer_Report"],
    audio_engineer: ["Dashboard", "editor", "Audio_Engineer_Report"],
    programmer: ["AiSettings", "generate"]  // Removed Reports for programmer
  };
  
  // Different common pages for admin/manager and other roles
  const isAdminRole = ['admin', 'manager'].includes(currentUser.role);
  const commonPages = isAdminRole
    ? ["Home", "account", "Login"]  // Admin/Manager common pages
    : ["Home", "Gallery", "Tutorial", "account", "Login"]  // Other roles common pages
  
  return {
    pages: pageMapping[currentUser.role] || [],
    commonPages: commonPages
  };
}

/**
 * Update the sidebar navigation links
 */     
function updateSidebar() {
  const userRole = sessionStorage.getItem("userRole") || "guest";
  const username = sessionStorage.getItem("username") || "Guest";
  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  const currentUser = { username, role: userRole };
  const mapping = getAccessiblePages(currentUser);

  const pageToUrl = {
    Home: "index.html",
    Composer_Report: "composer_report.html",
    Gallery: "gallery.html",
    Tutorial: "tutorial.html",
    AiSettings: "AiSettings.html",
    Reports:"systemreports.html",
    Dashboard: "user_dashboard.html",
    Composer_Report: "composer_report.html",
    Audio_Engineer_Report: "audioengineer.html",
    Programmer_Report: "programmer_report.html"
  };

  const navLinksContainer = document.querySelector(".sidebar .nav-links");
  if (!navLinksContainer) return;
  navLinksContainer.innerHTML = "";

  const getIconForPage = (pageId) => ({
    Home: "fa-home",
    Dashboard: "images/layout-Photoroom (Custom).png",
    Composer_Report: "fa-file",
    Audio_Engineer_Report: "fa-file",
    Programmer_Report: "fa-file",
    Gallery: "fa-images",
    Tutorial: "fa-video",
    AiSettings: "fa-cog",
    account: "fa-user",
    Reports: "fa-file",
  }[pageId] || "fa-circle");

  const getLabelForPage = (pageId) => ({
    Home: "Home",
    Composer_Report: "Report",
    Audio_Engineer_Report: "Report",
    Programmer_Report: "Report",
    Reports: "Reports",
    Gallery: "Gallery",
    Tutorial: "Tutorial",
    AiSettings: "Ai Settings",
  }[pageId] || pageId);

  // First add Home
  if (pageToUrl["Home"]) {
    const homeIcon = getIconForPage("Home");
    const homeIconHtml = `<i class="fa-solid ${homeIcon}"></i>`;
    const homeLink = document.createElement("a");
    homeLink.href = pageToUrl["Home"];
    homeLink.innerHTML = `${homeIconHtml} <span>${getLabelForPage("Home")}</span>`;
    navLinksContainer.appendChild(homeLink);
  }

  // Then add role-specific pages
  mapping.pages.forEach(pageId => {
    if (pageToUrl[pageId]) {
      const icon = getIconForPage(pageId);
      let iconHtml;
      if (icon.endsWith('.png') || icon.endsWith('.jpg') || icon.endsWith('.jpeg') || icon.endsWith('.svg')) {
        iconHtml = `<img src="${icon}" alt="${pageId} icon";">`;
      } else {
        iconHtml = `<i class="fa-solid ${icon}"></i>`;
      }
      const a = document.createElement("a");
      a.href = pageToUrl[pageId];
      a.innerHTML = `${iconHtml} <span>${getLabelForPage(pageId)}</span>`;
      navLinksContainer.appendChild(a);
    }
  });

  // Finally add remaining common pages (excluding Home since it's already added)
  mapping.commonPages.filter(pageId => pageId !== "Home").forEach(pageId => {
    if (pageToUrl[pageId]) {
      const icon = getIconForPage(pageId);
      let iconHtml;
      if (icon.endsWith('.png') || icon.endsWith('.jpg') || icon.endsWith('.jpeg') || icon.endsWith('.svg')) {
        iconHtml = `<img src="${icon}" alt="${pageId} icon";">`;
      } else {
        iconHtml = `<i class="fa-solid ${icon}"></i>`;
      }
      const a = document.createElement("a");
      a.href = pageToUrl[pageId];
      a.innerHTML = `${iconHtml} <span>${getLabelForPage(pageId)}</span>`;
      navLinksContainer.appendChild(a);
    }
  });

  // Add the logout button only if user is logged in
  if (isLoggedIn) {
    const logoutDiv = document.createElement("div");
    logoutDiv.className = "logout";
    logoutDiv.innerHTML = `<button id="logout-button"><i class="fas fa-sign-out-alt"></i> <span>Logout</span></button>`;
    navLinksContainer.appendChild(logoutDiv);

    // Add the event listener for logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
      });
    }
  }
}

/**
 * Audio playback functionality
 */
async function playAudioDirect(fullUrl, button) {
  try {
    if (currentPlayButton === button && currentAudio) {
      if (!currentAudio.paused) {
        currentAudio.pause();
        button.innerHTML = '<i class="fas fa-play"></i>';
        stopNoteAnimation();
      } else {
        await currentAudio.play();
        button.innerHTML = '<i class="fas fa-pause"></i>';
        startNoteAnimation(button);
      }
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      stopNoteAnimation();
      if (currentPlayButton) {
        currentPlayButton.innerHTML = '<i class="fas fa-play"></i>';
      }
    }

    if (!isValidUrl(fullUrl)) {
      throw new Error('Invalid audio URL format');
    }

    const testResponse = await fetch(fullUrl, { method: 'HEAD' });
    if (!testResponse.ok) {
      throw new Error('Audio file not found');
    }

    currentAudio = new Audio(fullUrl);
    
    currentAudio.addEventListener('error', (err) => {
      console.error('Audio error:', err);
      button.innerHTML = '<i class="fas fa-play"></i>';
      stopNoteAnimation();
    });

    currentAudio.addEventListener('ended', () => {
      button.innerHTML = '<i class="fas fa-play"></i>';
      stopNoteAnimation();
    });

    await currentAudio.play();
    button.innerHTML = '<i class="fas fa-pause"></i>';
    currentPlayButton = button;
    startNoteAnimation(button);

  } catch (error) {
    console.error('Playback failed:', error);
    button.innerHTML = '<i class="fas fa-play"></i>';
    stopNoteAnimation();
    alert(error.message);
  }
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Composer-specific functionality
 */
async function fetchCompositions() {
  try {
    const composerId = await getComposerId();
    if (!composerId) {
      alert("Composer profile not found");
      return;
    }

    const { data: masterCompositions, error: masterError } = await supabase
    .from("musicpiecemaster")
    .select(`
      music_piece_id,
      title,
      created_at,
      updated_at,
      duration,
      audio_oid
    `)
    .eq('composer_id', composerId)
    .order('created_at', { ascending: false });

  // Fetch from musicpieceversion
  const { data: versionCompositions, error: versionError } = await supabase
    .from("musicpieceversion")
    .select(`
      version_id,
      master_id,
      version_no,
      title,
      created_at,
      updated_at,
      duration,
      audio_oid
    `)
    .eq('composer_id', composerId)
    .order('created_at', { ascending: false });

  if (masterError || versionError) throw masterError || versionError;

  // Filter versionCompositions to only include those where master_id matches a music_piece_id in masterCompositions
  const masterIds = new Set((masterCompositions || []).map(mc => mc.music_piece_id));
  const filteredVersionCompositions = (versionCompositions || []).filter(vc => masterIds.has(vc.master_id));

  // Combine both arrays
  const compositions = [
    ...(masterCompositions || []),
    ...filteredVersionCompositions
  ];

    // Build a map: master_id -> [versions]
    const versionMap = {};
    (versionCompositions || []).forEach(vc => {
      if (!versionMap[vc.master_id]) versionMap[vc.master_id] = [];
      versionMap[vc.master_id].push(vc);
    });

    // Optionally sort versions by version_no if you have that field
    Object.values(versionMap).forEach(arr => arr.sort((a, b) => (a.version_no || 0) - (b.version_no || 0)));

    const tableBody = document.querySelector('.composition-table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    (masterCompositions || []).forEach(master => {
      // Render master row
      const masterRow = document.createElement('tr');
      masterRow.setAttribute('data-composition-id', master.music_piece_id);
      masterRow.innerHTML = `
        <td><div class="title-cell"><i class="fas fa-music"></i>${master.title}</div></td>
        <td data-label="CREATED">${new Date(master.created_at).toLocaleDateString()}</td>
        <td data-label="UPDATED">${new Date(master.updated_at).toLocaleDateString()}</td>
        <td data-label="DURATION">${master.duration ? formatTime(master.duration) : '--:--'}</td>
        <td>
          <div class="action-buttons">
            <button class="action-button play-button" data-audio-url="${master.audio_oid}">
              <i class="fas fa-play"></i>
            </button>
            <button class="action-button edit-button" data-piece-id="${master.music_piece_id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-button options-button" data-comp-id="${master.music_piece_id}">
              <i class="fas fa-ellipsis-h"></i>
            </button>
          </div>
        </td>
      `;
      masterRow.classList.add('master-row');
      tableBody.appendChild(masterRow);

      masterRow.querySelector('.play-button').addEventListener('click', function() {
        playAudioDirect(this.dataset.audioUrl, this);
      });
      masterRow.querySelector('.edit-button').addEventListener('click', function() {
        createAssignMenu(this.dataset.pieceId);
      });
      const optionsButton = masterRow.querySelector('.options-button');
      optionsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const existingMenu = document.querySelector('.options-menu');
        if (existingMenu) {
          existingMenu.remove();
          return;
        }
        const menu = createOptionsMenu(master.music_piece_id, 'composer');
        const rect = optionsButton.getBoundingClientRect();
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.left = `${rect.left + window.scrollX}px`;
        document.body.appendChild(menu);
        setTimeout(() => {
          document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
      });

      // Render version rows under this master
      (versionMap[master.music_piece_id] || []).forEach(version => {
        const versionRow = document.createElement('tr');
        versionRow.setAttribute('data-composition-id', `v${version.version_id}`);
        versionRow.classList.add('version-row');
        versionRow.innerHTML = `
          <td style="padding-left:2em;"><i class="fas fa-code-branch"></i> Version: ${version.version_no}</td>
          <td data-label="CREATED"></td>
          <td data-label="UPDATED">${new Date(version.updated_at).toLocaleDateString()}</td>
          <td data-label="DURATION">${version.duration ? formatTime(version.duration) : '--:--'}</td>
          <td>
            <div class="action-buttons">
              <button class="action-button play-button" data-audio-url="${version.audio_oid}">
                <i class="fas fa-play"></i>
              </button>
              <button class="action-button edit-button" data-piece-id="${version.version_id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-button options-button" data-comp-id="v${version.version_id}">
                <i class="fas fa-ellipsis-h"></i>
              </button>
            </div>
          </td>
        `;
        tableBody.appendChild(versionRow);

        versionRow.querySelector('.play-button').addEventListener('click', function() {
          playAudioDirect(this.dataset.audioUrl, this);
        });
        versionRow.querySelector('.edit-button').addEventListener('click', function() {
          createAssignMenu(this.dataset.pieceId);
        });
        const vOptionsButton = versionRow.querySelector('.options-button');
        vOptionsButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const existingMenu = document.querySelector('.options-menu');
          if (existingMenu) {
            existingMenu.remove();
            return;
          }
          const menu = createOptionsMenu(`v${version.version_id}`, 'composer');
          const rect = vOptionsButton.getBoundingClientRect();
          menu.style.top = `${rect.bottom + window.scrollY}px`;
          menu.style.left = `${rect.left + window.scrollX}px`;
          document.body.appendChild(menu);
          setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
          }, 0);
        });
      });
    });

  } catch (error) {
    console.error("Error fetching compositions:", error.message);
  }
}

/**
 * Audio Engineer-specific functionality
 */
async function fetchAssignedPieces() {
  try {
    const audioEngineerId = await getAudioEngineerId();
    if (!audioEngineerId) {
      alert("Audio Engineer profile not found");
      return;
    }

    const { data: pieces, error } = await supabase
      .from("audioengineer_musicpiece")
      .select(`
        music_piece_id,
        musicpiecemaster:music_piece_id (
          music_piece_id,
          title,
          created_at,
          updated_at,
          duration,
          audio_oid,
          composer:composer_id (
            user:user_id (username)
          )
        )
          
      `)
      .eq('audio_engineer_id', audioEngineerId);
    if (error) throw error;

    const tableBody = document.querySelector('.assigned-pieces tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    pieces.forEach(({ musicpiecemaster }) => {
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td><div class="title-cell"><i class="fas fa-music"></i>${musicpiecemaster.title}</div></td>
        <td data-label="CREATED">${new Date(musicpiecemaster.created_at).toLocaleDateString()}</td>
        <td data-label="MODIFIED">${new Date(musicpiecemaster.updated_at).toLocaleDateString()}</td>
        <td data-label="COMPOSER">${musicpiecemaster.composer.user.username}</td>
        <td data-label="DURATION">${musicpiecemaster.duration ? formatTime(musicpiecemaster.duration) : '--:--'}</td>
        <td data-label="ACTIONS">
          <div class="action-buttons">
            <button class="action-button play-button" 
                    data-audio-url="${musicpiecemaster.audio_oid}">
              <i class="fas fa-play"></i>
            </button>
            <button class="action-button edit-button" data-piece-id="${musicpiecemaster.music_piece_id}">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </td>
      `;

      newRow.querySelector('.play-button').addEventListener('click', function() {
        playAudioDirect(this.dataset.audioUrl, this);
      });

      newRow.querySelector('.edit-button').addEventListener('click', () => {
        window.location.href = `editor.html?piece_id=${musicpiecemaster.music_piece_id}`;
      });

      tableBody.appendChild(newRow);
    });
  } catch (error) {
    console.error("Error fetching assigned pieces:", error);
  }
}

async function fetchProgrammerPieces() {
  try {
    const userId = sessionStorage.getItem("userId");
    if (!userId) return;

    const { data: programmer, error } = await supabase
      .from('programmer')
      .select('programmer_id')
      .eq('user_id', userId)
      .single();

    if (error || !programmer) throw new Error("Programmer profile not found");

    // Get all music pieces assigned to programmer
    const { data: pieces } = await supabase
    .from("musicpiece_programmer")
    .select(`
      musicpiecemaster:music_piece_id (
        music_piece_id,
        title,
        created_at,
        updated_at,
        duration,
        audio_oid,
        composer:composer_id (user:user_id (username)),
        audio_engineers:audioengineer_musicpiece (
          audioengineer:audio_engineer_id (user:user_id (username))
        )
      )
    `)
    .eq('programmer_id', programmer.programmer_id);
    const tableBody = document.querySelector('.programmer-pieces tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    pieces.forEach(({ musicpiecemaster }) => {
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td><div class="title-cell"><i class="fas fa-music"></i>${musicpiecemaster.title}</div></td>
        <td data-label="CREATED">${new Date(musicpiecemaster.created_at).toLocaleDateString()}</td>
        <td data-label="MODIFIED">${new Date(musicpiecemaster.updated_at).toLocaleDateString()}</td>
        <td data-label="COMPOSER">${musicpiecemaster.composer.user.username}</td>
        <td data-label="ENGINEERS">${musicpiecemaster.audio_engineers?.map(ae => ae.audioengineer.user.username).join(', ') || 'None'}</td>
        <td data-label="DURATION">${musicpiecemaster.duration ? formatTime(musicpiecemaster.duration) : '--:--'}</td>
        <td data-label="ACTIONS">
          <div class="action-buttons">
            <button class="action-button play-button" 
                    data-audio-url="${musicpiecemaster.audio_oid}">
              <i class="fas fa-play"></i>
            </button>
            <button class="action-button edit-button" data-piece-id="${musicpiecemaster.music_piece_id}">
              <i class="fas fa-code"></i>
            </button>
          </div>
        </td>
      `;

      newRow.querySelector('.play-button').addEventListener('click', function() {
        playAudioDirect(this.dataset.audioUrl, this);
      });

      newRow.querySelector('.edit-button').addEventListener('click', () => {
        window.location.href = `editor.html?piece_id=${musicpiecemaster.music_piece_id}`;
      });

      tableBody.appendChild(newRow);
    });
  } catch (error) {
    console.error("Programmer access error:", error);
  }
} 

/**
 * Common utility functions
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Shared UI Components
function createOptionsMenu(itemId, roleType) {
  const menu = document.createElement('div');
  menu.className = 'options-menu';
  
  const options = roleType === 'audio_engineer' 
    ? ['Download', 'Edit'] 
    : ['Download', 'Rename', 'Share', 'Trash'];

  options.forEach(option => {
    const item = document.createElement('div');
    item.className = 'option-item'; 
    let iconHtml = '';
    if (option === 'Rename') {
      iconHtml = '<i class="fa-regular fa-pen-to-square"></i>';
    } else {
      iconHtml = `<i class="fas fa-${option.toLowerCase()}"></i>`;
    }
    item.innerHTML = `
      ${iconHtml}
      <span>${option}</span>
    `;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      handleOptionClick(option.toLowerCase(), itemId, roleType);
      menu.remove();
    });
    menu.appendChild(item);
  });
  return menu;
}

async function handleOptionClick(action, itemId, roleType) {
  try {
    let userId;
    if (roleType === 'composer') {
      userId = await getComposerId();
    } else if (roleType === 'audio_engineer'){
      userId = await getAudioEngineerId();
    } else {
      userId = await getProgrammerId();
    }
    if (!userId) {
      alert("Profile not found");
      return;
    }

    // Determine if this is a version or master piece
    const isVersion = itemId.toString().startsWith('v');
    const actualId = isVersion ? itemId.substring(1) : itemId;
    const tableName = isVersion ? "musicpieceversion" : "musicpiecemaster";
    const idField = isVersion ? "version_id" : "music_piece_id";

    switch (action) {
      case 'download':
        const { data: composition, error: downloadError } = await supabase
          .from(tableName)
          .select("audio_oid, title")
          .eq(idField, actualId)
          .single();

        if (downloadError) throw downloadError;
        if (!composition || !composition.audio_oid) {
          throw new Error("Audio file not found");
        }

        const link = document.createElement('a');
        link.href = composition.audio_oid;
        // Use a default name if title is missing
        const fileName = composition.title ? 
          `${composition.title.replace(/\s+/g, '_')}.mp3` : 
          `music_piece_${actualId}.mp3`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;

      case 'rename':
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'rename-overlay';
        overlay.innerHTML = `
          <style>
            .rename-overlay {
              position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
              background: rgba(0,0,0,0.35); z-index: 9999; display: flex; align-items: center; justify-content: center;
            }
            .rename-modal {
              background: #fff; border-radius: 10px; padding: 2em 2em 1.5em 2em; box-shadow: 0 2px 24px rgba(0,0,0,0.18);
              min-width: 320px; max-width: 90vw; display: flex; flex-direction: column; align-items: stretch;
            }
            .rename-modal h3 { margin: 0 0 1em 0; font-size: 1.2em; text-align: center; }
            .rename-input {
              padding: 0.7em 1em; font-size: 1em; border: 1px solid #bbb; border-radius: 6px; margin-bottom: 1.2em;
              outline: none; transition: border 0.2s;
            }
            .rename-input:focus { border: 1.5px solid #007bff; }
            .rename-actions { display: flex; gap: 1em; justify-content: flex-end; }
            .rename-confirm, .rename-cancel {
              padding: 0.5em 1.3em; border: none; border-radius: 5px; font-size: 1em; cursor: pointer;
            }
            .rename-confirm { background: #007bff; color: #fff; }
            .rename-cancel { background: #eee; color: #333; }
            .rename-confirm:active { background: #0056b3; }
            .rename-cancel:active { background: #ccc; }
          </style>
          <div class="rename-modal">
            <h3>Rename Track</h3>
            <input type="text" class="rename-input" placeholder="Enter new title..." />
            <div class="rename-actions">
              <button class="rename-confirm">Save</button>
              <button class="rename-cancel">Cancel</button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
        const input = overlay.querySelector('.rename-input');
        input.focus();
        overlay.querySelector('.rename-cancel').onclick = () => overlay.remove();
        overlay.querySelector('.rename-confirm').onclick = async () => {
          const newTitle = input.value.trim();
          if (newTitle) {
            const { error: renameError } = await supabase
              .from(tableName)
              .update({ title: newTitle })
              .eq(idField, actualId)
              .eq('composer_id', userId);
            if (renameError) {
              alert('Rename failed: ' + renameError.message);
            } else {
              const row = document.querySelector(`[data-comp-id="${itemId}"]`)?.closest('tr');
              if (row) {
                const titleCell = row.querySelector('.title-cell');
                if (titleCell) {
                  if (isVersion) {
                    titleCell.innerHTML = `<i class="fas fa-code-branch"></i> Version: ${newTitle}`;
                  } else {
                    titleCell.innerHTML = `<i class="fas fa-music"></i>${newTitle}`;
                  }
                }
              }
              alert('Title updated successfully!');
              overlay.remove();
            }
          }
        };
        break;

      case 'trash':
        if (confirm('Are you sure you want to delete this composition?')) {
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq(idField, actualId)
            .eq('composer_id', userId);
              
          if (deleteError) throw deleteError;
          document.querySelector(`[data-comp-id="${itemId}"]`)?.closest('tr')?.remove();
        }
        break;

      case 'edit':
        window.location.href = `editor.html?piece_id=${actualId}${isVersion ? '&version=true' : ''}`;
        break;

      case 'share':
        createShareMenu(itemId); // Pass the original itemId to preserve the version prefix
        break;
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}  

/**
 * Main initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Authentication check
  const protectedPages = [
    "user_dashboard.html", "generate.html", "composer_report.html",
    "editor.html", "audio_engineer_report.html", "AiSettings.html",
    "dashboard.html"
  ];
  
  const currentPage = window.location.pathname.split('/').pop().toLowerCase();
  if (protectedPages.includes(currentPage)) {
    if (!sessionStorage.getItem("isLoggedIn")) {
      window.location.href = "login.html";
      return;
    }
    
    const adminRoles = ["admin", "manager"];
    const userRole = sessionStorage.getItem("userRole");
    
    // Redirect non-admin/non-manager users away from dashboard.html
    if (currentPage === "dashboard.html" && !adminRoles.includes(userRole)) {
      window.location.href = "user_dashboard.html";
      return;
    }
    
    // Redirect admin/manager users away from user_dashboard.html
    if (currentPage === "user_dashboard.html" && adminRoles.includes(userRole)) {
      window.location.href = "dashboard.html";
      return;
    }
  }

  // Initialize UI
  updateSidebar();
  
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  if (sidebar && mainContent) {
    sidebar.addEventListener('mouseenter', () => 
      mainContent.style.marginLeft = '250px');
    sidebar.addEventListener('mouseleave', () => 
      mainContent.style.marginLeft = '95px');
  }

  // Show the create button only for composer and programmer roles
  const userRole = sessionStorage.getItem("userRole");
  const createButton = document.querySelector('.create-button');
  if (createButton) {
    if (userRole === 'composer' || userRole === 'programmer') {
      createButton.style.display = '';
    } else {
      createButton.style.display = 'none';
    }
    createButton.onclick = function (e) {
      e.stopPropagation();
      // Show loading spinner inside the button
      createButton.innerHTML = '<span class="spinner" style="display:inline-block;width:18px;height:18px;border:2px solid #ccc;border-top:2px solid #333;border-radius:50%;animation:spin 1s linear infinite;vertical-align:middle;"></span>';
      createButton.disabled = true;
      setTimeout(() => {
        window.location.href = 'generate.html';
      }, 400);
    };
  }
  // Add spinner animation CSS if not present
  if (!document.getElementById('spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg);}
        100% { transform: rotate(360deg);}
      }
    `;
    document.head.appendChild(style);
  }

  // View toggle functionality
  const viewToggle = () => {
    const tables = [
      document.querySelector('.composition-table'),
      document.querySelector('.assigned-pieces'),
      document.querySelector('.programmer-pieces')
    ];
    const gridViewBtn = document.querySelector('.fa-th-large')?.parentElement;
    const listViewBtn = document.querySelector('.fa-bars')?.parentElement;
  
    if (!gridViewBtn || !listViewBtn) return;
  
    function getVisibleTable() {
      return tables.find(tbl => tbl && tbl.style.display !== 'none');
    }
  
    const toggleView = (view) => {
      // Get the visible table first
      const visibleTable = getVisibleTable();
      if (!visibleTable) return;

      // Prepare the table for the switch
      visibleTable.style.opacity = '0';
      
      // Use requestAnimationFrame for smoother transition
      requestAnimationFrame(() => {
        // Remove grid view class first
        visibleTable.classList.remove('grid-view');
        
        // Force a reflow
        visibleTable.offsetHeight;
        
        // Add grid view class if needed
        if (view === 'grid') {
          visibleTable.classList.add('grid-view');
        }
        
        // Update button states
        gridViewBtn.classList.toggle('active', view === 'grid');
        listViewBtn.classList.toggle('active', view === 'list');
        
        // Save the view preference
        localStorage.setItem('viewMode', view);
        
        // Fade back in
        requestAnimationFrame(() => {
          visibleTable.style.opacity = '1';
        });
      });
    };
  
    gridViewBtn.addEventListener('click', () => toggleView('grid'));
    listViewBtn.addEventListener('click', () => toggleView('list'));
  
    const lastView = localStorage.getItem('viewMode') || 'list';
    toggleView(lastView);
  };
  viewToggle();

  // Role-specific content loading

  if (currentPage === 'user_dashboard.html') {
    // Hide all tables first
    document.querySelector('.composition-table').style.display = 'none';
    document.querySelector('.assigned-pieces').style.display = 'none';
    document.querySelector('.programmer-pieces').style.display = 'none';

    // Show and populate only the relevant table
    if (userRole === 'composer') {
      document.querySelector('.composition-table').style.display = '';
      await fetchCompositions();
    } else if (userRole === 'audio_engineer') {
      document.querySelector('.assigned-pieces').style.display = '';
      await fetchAssignedPieces();
    } else if (userRole === 'programmer') {
      document.querySelector('.programmer-pieces').style.display = '';
      await fetchProgrammerPieces();
    }
  }

  // Create button functionality
  document.querySelector('.create-button')?.addEventListener('click', (e) => {
    if (userRole !== 'composer') return;
    
    e.preventDefault();
  
    
    menu.querySelector('.confirm-create').addEventListener('click', async () => {
      const composerId = await getComposerId();
      if (!composerId) {
        alert("Composer profile not found");
        return;
      }

      const input = menu.querySelector('.composition-input');
      const loadingState = menu.querySelector('.loading-state');
      const confirmButton = menu.querySelector('.confirm-create');
    
      if (input.value.trim()) {
        input.style.display = 'none';
        confirmButton.style.display = 'none';
        loadingState.style.display = 'flex';
    
        try {
          const { data } = await supabase.from("musicpiecemaster")
            .insert([{ 
              title: input.value.trim(),
              composer_id: composerId 
            }])
            .select()
            .single();

          if (data?.music_piece_id) {
            window.location.href = `generate.html?composition_id=${data.music_piece_id}`;
          }
        } catch (error) {
          console.error('Creation error:', error);
          input.style.display = 'block';
          confirmButton.style.display = 'block';
          loadingState.style.display = 'none';
          alert('Failed to create composition');
        }
      }
    });

    document.body.appendChild(menu);
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== document.querySelector('.create-button')) {
        menu.remove();
      }
    });
  });



  if (currentPage === 'user_dashboard.html') {
    const userRole = sessionStorage.getItem("userRole");
    if (userRole === 'programmer') {
      await fetchProgrammerPieces();
    }
  }

  // Show/hide tables based on role


});

// Login/Signup Code
const container = document.getElementById("container");
const card = document.getElementById("card");
const loginSide = document.getElementById("loginSide");
const signUpSide = document.getElementById("signUpSide");
let currentForm = "Login";
let selectedRole = null;

window.addEventListener("load", () => {
  if (loginSide && signUpSide && container) {
    loginSide.style.display = "block";
    signUpSide.style.display = "block";
    container.style.height = loginSide.scrollHeight + "px";
    loginSide.style.display = "";
    signUpSide.style.display = "";
  }
});

window.flipTo = (type) => {
  if (currentForm === type) return;
  card.classList[type === "SignUp" ? "add" : "remove"]("flipped");
  container.style.height = `${type === "SignUp" ? signUpSide.scrollHeight : loginSide.scrollHeight}px`;
  currentForm = type;
};

window.selectRole = (button, role) => {
  selectedRole = role;
  document.querySelectorAll(".column button").forEach(btn => 
    btn.classList.remove("selected"));
  button.classList.add("selected");
};

function showError(errorId, message) {
  const errorMsg = document.getElementById(errorId);
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.classList.add("visible");
    setTimeout(() => errorMsg.classList.remove("visible"), 4000);
  }
}

const validate = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  username: (username) => /^[a-zA-Z0-9_]+$/.test(username),
  password: (password) => {
    if (password.length < 8) return "Must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Requires uppercase letter";
    if (!/[a-z]/.test(password)) return "Requires lowercase letter";
    if (!/[0-9]/.test(password)) return "Requires number";
    if (!/[!@#$%^&*()_+[\]{};':"\\|,.<>/?~-]/.test(password)) 
      return "Requires special character";
    return "";
  }
};

// Password hashing function using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

window.handleSignUp = async () => {
  const [username, email, password, confirmPassword] = [
    "signUpUsername", "signUpEmail", 
    "signUpPassword", "signUpConfirmPassword"
  ].map(id => document.getElementById(id)?.value.trim());

  let isValid = true;
  if (!username) { showError("signUpUsernameError", "Username required"); isValid = false; }
  if (!validate.username(username)) { showError("signUpUsernameError", "Invalid username"); isValid = false; }
  if (!email) { showError("signUpEmailError", "Email required"); isValid = false; }
  if (!validate.email(email)) { showError("signUpEmailError", "Invalid email"); isValid = false; }
  if (!password) { showError("signUpPasswordError", "Password required"); isValid = false; }
  const passwordError = validate.password(password);
  if (passwordError) { showError("signUpPasswordError", passwordError); isValid = false; }
  if (password !== confirmPassword) { showError("signUpConfirmPasswordError", "Passwords don't match"); isValid = false; }
  if (!selectedRole) { 
    showNotification("Please select a role", "error");
    isValid = false; 
  }
  if (!isValid) return;

  try {
    // Hash the password before sending to server
    const hashedPassword = await hashPassword(password);

    // Create user record
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{
        username,
        email,
        password_hash: hashedPassword,
        role: selectedRole,
        join_date: new Date().toISOString()
      }])
      .select()
      .single();
    if (userError) throw userError;

    // Create role-specific record
    const roleLower = selectedRole.toLowerCase();
    switch(roleLower) {
      case 'composer':
        await supabase
          .from('composer')
          .insert([{ user_id: userData.user_id }]);
        break;
      
      case 'audio_engineer':
        await supabase
          .from('audioengineer')
          .insert([{ user_id: userData.user_id }]);
        break;
      
      case 'programmer':
        await supabase
          .from('programmer')
          .insert([{ 
            user_id: userData.user_id,
            // Add programmer-specific fields if needed
          }]);
        break;
    }

    // Set session storage
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("userId", userData.user_id);
    sessionStorage.setItem("userRole", userData.role);
    sessionStorage.setItem("username", userData.username);

    // Show success notification and redirect
    showNotification("Account created successfully! Redirecting to dashboard...", "success");
    
    // Redirect after a short delay to show the notification
    setTimeout(() => {
      window.location.href = "user_dashboard.html";
    }, 1500);

  } catch (error) {
    console.error("Signup error:", error);
    // Show error notification with specific message
    if (error.message.includes('duplicate key')) {
      if (error.message.includes('username')) {
        showNotification("Username already exists. Please choose another.", "error");
      } else if (error.message.includes('email')) {
        showNotification("Email already registered. Please use another email.", "error");
      } else {
        showNotification("Account already exists with these details.", "error");
      }
    } else {
      showNotification(`Signup failed: ${error.message}`, "error");
    }
  }
};

// Add notification system
function showNotification(message, type = 'success') {
  // Remove any existing notifications
  const existingNotification = document.querySelector('.custom-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `custom-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 100);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Update handleLogin function to use the new notification system
window.handleLogin = async () => {
  const usernameOrEmail = document.getElementById("loginUsername")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  if (!usernameOrEmail) return showError("loginUsernameError", "Username/Email required");
  if (!password) return showError("loginPasswordError", "Password required");

  try {
    // Hash the password before comparing
    const hashedPassword = await hashPassword(password);

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
      .single();
    if (error || !user) throw new Error("Invalid credentials");
    if (hashedPassword !== user.password_hash) throw new Error("Incorrect password");
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("user_id", user.user_id);
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("userId", user.user_id);
    sessionStorage.setItem("userRole", user.role);
    sessionStorage.setItem("username", user.username);
    
    // Show success notification instead of alert
    showNotification("Login successful! Redirecting...");
    
    // Redirect after a short delay to show the notification
    setTimeout(() => {
      if (user.role === 'admin' || user.role === 'manager') {
        window.location.href = "dashboard.html";
      } else if (user.role === 'programmer') {
        window.location.href = "AiSettings.html";
      } else {
        window.location.href = "user_dashboard.html";
      }
    }, 1500);
    

  } catch (error) {
    console.error("Login error:", error);
    showNotification(error.message || "Login failed", 'error');
  }
};

window.flipTo = flipTo;
window.selectRole = selectRole;
window.handleSignUp = handleSignUp;




// Change Password Handler for account.html
const changePasswordForm = document.querySelector('.Change-Password');
if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPassword = changePasswordForm.querySelector('input[name="old_password"]').value;
    const newPassword = changePasswordForm.querySelector('input[name="new_password"]').value;
    const repeatPassword = changePasswordForm.querySelector('input[name="repeat_password"]').value;

    if (newPassword !== repeatPassword) {
      alert('New passwords do not match.');
      return;
    }

    // Get current user ID from session
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      alert('You must be logged in to change your password.');
      return;
    }

    try {
      // Hash both old and new passwords
      const hashedOldPassword = await hashPassword(oldPassword);
      const hashedNewPassword = await hashPassword(newPassword);

      // Fetch current password from DB
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('user_id', userId)
        .single();

      if (fetchError || !user) {
        alert('Failed to fetch user data.');
        return;
      }

      if (user.password_hash !== hashedOldPassword) {
        alert('Old password is incorrect.');
        return;
      }

      // Update password with new hash
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: hashedNewPassword })
        .eq('user_id', userId);

      if (updateError) {
        alert('Failed to update password: ' + updateError.message);
      } else {
        alert('Password updated successfully!');
        changePasswordForm.reset();
      }
    } catch (error) {
      console.error('Password change error:', error);
      alert('Failed to change password. Please try again.');
    }
  });
}

// --- Fetch and populate account info logic ---
async function populateAccountInfo() {
  const userId = sessionStorage.getItem("userId");
  if (!userId) return;

  // Fetch user info from Supabase
  const { data, error } = await supabase
    .from('users')
    .select('username, email')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error("Failed to fetch user info:", error);
    return;
  }

  // Populate the fields
  const usernameInput = document.getElementById('account-username');
  const emailInput = document.getElementById('account-email');
  if (usernameInput) usernameInput.value = data.username;
  if (emailInput) emailInput.value = data.email;
}

// Run on page load if on account.html
if (window.location.pathname.endsWith("account.html")) {
  document.addEventListener("DOMContentLoaded", populateAccountInfo);
}
// --- End fetch and populate account info logic ---


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
window.selectRole = selectRole;
window.handleSignUp = handleSignUp;

function createFloatingNote(button) {
    const note = document.createElement('div');
    note.className = `music-note ${patterns[currentPattern]}`;
    
    // Random note symbol
    note.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
    
    // Random horizontal position across the screen width
    const screenWidth = window.innerWidth;
    const startX = Math.random() * (screenWidth - 50); // 50px buffer from edges
    
    // Random color
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Set initial position at bottom of screen
    note.style.left = startX + 'px';
    
    // Calculate movement
    const moveY = -(window.innerHeight + 200) + 'px'; // Move up beyond screen height
    const moveX = (Math.random() - 0.5) * 200 + 'px'; // Smaller horizontal movement
    const rotation = (Math.random() - 0.5) * 720 + 'deg';
    
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

function startNoteAnimation(button) {
    if (!noteInterval) {
        // Create initial batch of notes
        for(let i = 0; i < 5; i++) {
            setTimeout(() => createFloatingNote(button), i * 200);
        }
        
        // Continue creating notes
        noteInterval = setInterval(() => createFloatingNote(button), 200);
        
        // Start pattern cycling with longer interval
        patternChangeInterval = setInterval(() => {
            currentPattern = (currentPattern + 1) % patterns.length;
        }, 5000); // Change pattern every 5 seconds
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

// Admin Dashboard Functions
async function initializeAdminDashboard() {
  const adminRoles = ["admin", "manager"];
  if (!adminRoles.includes(sessionStorage.getItem("userRole"))) return;

  // Load required Chart.js library
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  document.head.appendChild(script);

  script.onload = async () => {
    try {
      // Fetch basic stats
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: genCount, error: genError } = await supabase
        .from('musicpiecemaster')
        .select('*', { count: 'exact', head: true });

      if (userError || genError) throw userError || genError;

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's active users (users who logged in today)
      const { count: activeCount, error: activeError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', today.toISOString());

      // Fetch today's generations
      const { count: todayGenCount, error: todayGenError } = await supabase
        .from('musicpiecemaster')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Update main stats
      document.getElementById('totalUsers').textContent = userCount || 0;
      document.getElementById('totalGenerations').textContent = genCount || 0;
      document.getElementById('activeUsers').textContent = activeCount || 0;
      document.getElementById('todayGenerations').textContent = todayGenCount || 0;

      // Fetch user role distribution
      const { data: roleData, error: roleError } = await supabase
        .from('users')
        .select('role');

      if (roleError) throw roleError;

      // Filter out programmer role and create role counts
      const roleCounts = roleData.reduce((acc, user) => {
        if (user.role !== 'programmer') {
          acc[user.role] = (acc[user.role] || 0) + 1;
        }
        return acc;
      }, {});

      // Create role distribution chart
      new Chart(document.getElementById('roleDistributionChart'), {
        type: 'pie',
        data: {
          labels: Object.keys(roleCounts),
          datasets: [{
            data: Object.values(roleCounts),
            backgroundColor: [
              '#4158D0',
              '#ff4f7e',
              '#ff9500'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right'
            },
            title: {
              display: true,
              text: 'User Distribution by Role'
            }
          }
        }
      });

      // Fetch monthly data for user growth and generations
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: monthlyUsers } = await supabase
        .from('users')
        .select('join_date')
        .gte('join_date', sixMonthsAgo.toISOString());

      const { data: monthlyGen } = await supabase
        .from('musicpiecemaster')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      // Process monthly data
      const monthLabels = [];
      const userCounts = new Array(6).fill(0);
      const genCounts = new Array(6).fill(0);

      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthLabels.unshift(date.toLocaleString('default', { month: 'short' }));
      }

      monthlyUsers?.forEach(user => {
        const monthIndex = 5 - Math.floor((new Date() - new Date(user.join_date)) / (1000 * 60 * 60 * 24 * 30));
        if (monthIndex >= 0 && monthIndex < 6) userCounts[monthIndex]++;
      });

      monthlyGen?.forEach(gen => {
        const monthIndex = 5 - Math.floor((new Date() - new Date(gen.created_at)) / (1000 * 60 * 60 * 24 * 30));
        if (monthIndex >= 0 && monthIndex < 6) genCounts[monthIndex]++;
      });

      // Create user growth chart
      new Chart(document.getElementById('usersChart'), {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'New Users',
            data: userCounts,
            borderColor: '#4158D0',
            tension: 0.4,
            fill: false
          }]
        },
        options: {
          responsive: true
        }
      });

      // Create music generations chart
      new Chart(document.getElementById('musicChart'), {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'Music Generations',
            data: genCounts,
            backgroundColor: '#ff4f7e'
          }]
        },
        options: {
          responsive: true
        }
      });

      // Create activity timeline
      const hourLabels = Array.from({length: 24}, (_, i) => `${i}:00`);
      const activityData = new Array(24).fill(0);

      // Combine user logins and generations for activity
      const today24h = new Date();
      today24h.setHours(today24h.getHours() - 24);

      const { data: recentLogins } = await supabase
        .from('users')
        .select('last_login')
        .gte('last_login', today24h.toISOString());

      const { data: recentGens } = await supabase
        .from('musicpiecemaster')
        .select('created_at')
        .gte('created_at', today24h.toISOString());

      [...(recentLogins || []), ...(recentGens || [])].forEach(activity => {
        const hour = new Date(activity.last_login || activity.created_at).getHours();
        activityData[hour]++;
      });

      new Chart(document.getElementById('activityTimelineChart'), {
        type: 'line',
        data: {
          labels: hourLabels,
          datasets: [{
            label: 'System Activity',
            data: activityData,
            borderColor: '#4158D0',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(65, 88, 208, 0.1)',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              titleColor: '#333',
              bodyColor: '#666',
              borderColor: '#ddd',
              borderWidth: 1,
              padding: 10,
              displayColors: false
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false
              },
              ticks: {
                font: {
                  size: 12
                },
                padding: 10
              }
            }
          }
        }
      });


    } catch (error) {
      console.error('Dashboard error:', error);
      alert('Failed to load dashboard data');
    }
  };
}

// Add dashboard initialization to the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', async () => {

  // Initialize admin dashboard if on dashboard page
  if (window.location.pathname.endsWith('dashboard.html')) {
    await initializeAdminDashboard();
  }
});



