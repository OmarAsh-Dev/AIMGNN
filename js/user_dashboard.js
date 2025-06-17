document.addEventListener('DOMContentLoaded', function () {
    // Sidebar hover effect
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (sidebar && mainContent) {
        mainContent.style.transition = 'margin-left 0.3s ease';
        sidebar.addEventListener('mouseenter', () => {
            mainContent.style.marginLeft = '250px';
        });

        sidebar.addEventListener('mouseleave', () => {
            mainContent.style.marginLeft = '95px';
        });
    }

    // View toggle functionality
    const gridViewBtn = document.querySelector('.fa-th-large')?.parentElement;
    const listViewBtn = document.querySelector('.fa-bars')?.parentElement;
    const compositionTable = document.querySelector('.composition-table');

    if (compositionTable && gridViewBtn && listViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            compositionTable.classList.add('grid-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            localStorage.setItem('viewMode', 'grid');
        });

        listViewBtn.addEventListener('click', () => {
            compositionTable.classList.remove('grid-view');
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            localStorage.setItem('viewMode', 'list');
        });

        // Restore last view mode
        const lastViewMode = localStorage.getItem('viewMode');
        if (lastViewMode === 'grid') {
            gridViewBtn.click();
        } else {
            listViewBtn.click();
        }
    }

    // Audio player functionality
    const audioPlayer = document.getElementById('audio-player');
    const playButton = document.getElementById('play-button');

    if (playButton && audioPlayer) {
        // Get the duration cell in the table
        const durationCell = document.querySelector('.composition-table tbody tr td[data-label="DURATION"]');

        // Update the duration cell when metadata is loaded
        audioPlayer.addEventListener('loadedmetadata', () => {
            if (durationCell) {
                durationCell.textContent = formatTime(audioPlayer.duration);
            }
        });

        playButton.addEventListener('click', function () {
            const isPlaying = !audioPlayer.paused;

            if (isPlaying) {
                audioPlayer.pause();
                playButton.innerHTML = '<i class="fas fa-play"></i>';
            } else {
                audioPlayer.play();
                playButton.innerHTML = '<i class="fas fa-pause"></i>';
            }
        });

        // Update progress bar and time display (optional)
        const progressBar = document.getElementById('progress-bar');
        const currentTime = document.getElementById('current-time');
        const duration = document.getElementById('duration');

        if (progressBar && currentTime && duration) {
            audioPlayer.addEventListener('timeupdate', () => {
                const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressBar.value = percent;
                currentTime.textContent = formatTime(audioPlayer.currentTime);
            });

            audioPlayer.addEventListener('loadedmetadata', () => {
                duration.textContent = formatTime(audioPlayer.duration);
            });

            progressBar.addEventListener('input', () => {
                const time = (progressBar.value / 100) * audioPlayer.duration;
                audioPlayer.currentTime = time;
            });
        }
    }

    // Options menu functionality
    const optionsButtons = document.querySelectorAll('.action-button .fa-ellipsis-h');

    if (optionsButtons.length > 0) {
        optionsButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.stopPropagation();
    
                // Remove any existing menus
                document.querySelectorAll('.options-menu').forEach(menu => menu.remove());
    
                const menu = createOptionsMenu();
                const buttonRect = this.getBoundingClientRect();
                const tableRow = this.closest('tr');
    
                menu.style.position = 'absolute';
                menu.style.top = `${buttonRect.bottom}px`;
                menu.style.left = `${buttonRect.left - 10}px`; // Adjusted left position
                menu.style.zIndex = '1000';
                menu.style.width = '150px'; // Fixed width for consistency
    
                document.body.appendChild(menu);
    
                // Close menu when clicking outside
                document.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target)) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                });
            });
        });
    }

    // Create options menu
    function createOptionsMenu() {
        const menu = document.createElement('div');
        menu.className = 'options-menu';

        const options = [
            { text: 'Edit', icon: 'fa-edit' },
            { text: 'Download', icon: 'fa-download' },
            { text: 'Share', icon: 'fa-share-alt' },
            { text: 'Delete', icon: 'fa-trash-alt' }
        ];

        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'option-item';
            item.innerHTML = `
                <i class="fas ${option.icon}"></i>
                <span>${option.text}</span>
            `;
            item.addEventListener('click', () => handleOptionClick(option.text.toLowerCase()));
            menu.appendChild(item);
        });

        return menu;
    }

    // Handle option clicks
    function handleOptionClick(action) {
        switch (action) {
            case 'edit':
                console.log('Edit clicked');
                try {
                    window.location.href = 'editor.html';
                } catch (error) {
                    console.error('Navigation failed:', error);
                }
                break;
            case 'download':
                console.log('Download clicked');
                break;
            case 'share':
                console.log('Share clicked');
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this composition?')) {
                    console.log('Delete confirmed');
                }
                break;
        }
    }

    // Add table row hover effect
    const tableRows = document.querySelectorAll('.composition-table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.transform = 'translateY(-2px)';
            row.style.transition = 'transform 0.3s ease';
        });

        row.addEventListener('mouseleave', () => {
            row.style.transform = 'translateY(0)';
        });
    });

            

    
    // Function to add new composition to table
    async function addNewComposition(name) {
        try {
            const currentDate = new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>
                    <div class="title-cell">
                        <i class="fas fa-music"></i>
                        ${name}
                    </div>
                </td>
                <td data-label="CREATED">${currentDate}</td>
                <td data-label="MODIFIED">${currentDate}</td>
                <td data-label="DURATION"></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-button" id="play-button">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="action-button">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                    </div>
                </td>
            `;
        
            // Add playback button functionality
            const playbackButton = newRow.querySelector('.playback-button');
            if (playbackButton) {
                playbackButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const icon = this.querySelector('i');
                    if (icon.classList.contains('fa-play')) {
                        icon.classList.remove('fa-play');
                        icon.classList.add('fa-pause');
                        // Add your playback logic here
                    } else {
                        icon.classList.remove('fa-pause');
                        icon.classList.add('fa-play');
                        // Add your pause logic here
                    }
                });
            }
            
            // Add hover effects to new row
            newRow.addEventListener('mouseenter', () => {
                newRow.style.transform = 'translateY(-2px)';
                newRow.style.transition = 'transform 0.3s ease';
            });
            newRow.addEventListener('mouseleave', () => {
                newRow.style.transform = 'translateY(0)';
            });
            
            // Reattach options menu functionality to new action button
            const newOptionsButton = newRow.querySelector('.fa-ellipsis-h');
            if (newOptionsButton) {
                newOptionsButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    // Remove any existing menus
                    document.querySelectorAll('.options-menu').forEach(menu => menu.remove());
                    
                    const menu = createOptionsMenu();
                    const buttonRect = this.getBoundingClientRect();
                    const tableRow = this.closest('tr');
            
                    menu.style.position = 'absolute';
                    menu.style.top = `${buttonRect.bottom}px`;
                    menu.style.left = `${buttonRect.left - 10}px`;
                    menu.style.zIndex = '1000';
                    menu.style.width = '150px';
                    
                    document.body.appendChild(menu);
                    
                    // Close menu when clicking outside
                    document.addEventListener('click', function closeMenu(e) {
                        if (!menu.contains(e.target)) {
                            menu.remove();
                            document.removeEventListener('click', closeMenu);
                        }
                    });
                });
            }
            
            const tableBody = document.querySelector('.composition-table tbody');
            if (tableBody) {
                tableBody.appendChild(newRow);
            }
            
        } catch (error) {
            console.error('Error adding composition:', error);
            alert('Failed to create composition. Please try again.');
        }
    }

    // Helper function to format time
    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    
});