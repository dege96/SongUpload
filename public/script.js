document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const audioPlayer = document.getElementById('audio-player');
    const playlist = document.getElementById('playlist');
    const currentSongInfo = document.getElementById('current-song-info');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    
    // Kommentarsmodal element
    const commentModal = document.getElementById('comment-modal');
    const closeModal = document.querySelector('.close-modal');
    const commentSongTitle = document.getElementById('comment-song-title');
    const commentText = document.getElementById('comment-text');
    const saveCommentBtn = document.getElementById('save-comment');
    
    // Variables
    let songs = [];
    let currentSongIndex = 0;
    let currentCommentSongIndex = -1;
    let folders = {};
    let folderStates = JSON.parse(localStorage.getItem('folderStates')) || {}; // För att spara öppna/stängda mappar
    
    // Lagra favoriter och kommentarer lokalt
    let favorites = JSON.parse(localStorage.getItem('songFavorites')) || {};
    let songComments = JSON.parse(localStorage.getItem('songComments')) || {};
    
    // Fetch songs list from the server
    async function fetchSongs() {
        try {
            const response = await fetch('/api/songs');
            const data = await response.json();
            songs = data;
            
            // Organisera låtar efter mappar
            organizeFolders();
            renderPlaylist();
            
            // Load the first song if playlist is not empty and no song is currently playing
            if (songs.length > 0 && audioPlayer.paused && !audioPlayer.src) {
                loadSong(0);
            }
            
            return true;
        } catch (error) {
            console.error('Error fetching songs:', error);
            return false;
        }
    }
    
    // Organisera låtar efter mappar
    function organizeFolders() {
        folders = {};
        
        // Skapa Root-mappen först
        folders['Root'] = {
            name: 'Root',
            songs: []
        };
        
        // Gruppera låtar efter mapp
        songs.forEach(song => {
            if (!folders[song.folder]) {
                folders[song.folder] = {
                    name: song.folder,
                    songs: []
                };
                
                // Initiera mappstatus om den inte finns
                if (folderStates[song.folder] === undefined) {
                    folderStates[song.folder] = true; // Öppen som standard
                }
            }
            
            folders[song.folder].songs.push(song);
        });
        
        // Spara mappstatus
        localStorage.setItem('folderStates', JSON.stringify(folderStates));
    }
    
    // Skapa favorit-stjärna
    function createFavoriteStar() {
        const star = document.createElement('span');
        star.className = 'favorite-star';
        star.innerHTML = '&#9733;'; // Stjärnsymbol
        return star;
    }
    
    // Växla mappens status (öppen/stängd)
    function toggleFolder(folderName) {
        folderStates[folderName] = !folderStates[folderName];
        localStorage.setItem('folderStates', JSON.stringify(folderStates));
        
        // Uppdatera mappikonen och låtarna i DOM
        const folderHeader = document.querySelector(`.folder-header[data-folder="${folderName}"]`);
        const folderSongs = document.querySelectorAll(`.folder-songs[data-folder="${folderName}"]`);
        
        if (folderHeader) {
            // Uppdatera ikon
            const icon = folderHeader.querySelector('i');
            if (icon) {
                if (folderStates[folderName]) {
                    icon.className = 'fas fa-folder-open';
                } else {
                    icon.className = 'fas fa-folder';
                }
            }
            
            // Uppdatera expansionsikonen
            const expandIcon = folderHeader.querySelector('.expand-icon');
            if (expandIcon) {
                expandIcon.textContent = folderStates[folderName] ? '▼' : '►';
            }
        }
        
        // Visa/dölj låtar
        folderSongs.forEach(container => {
            container.style.display = folderStates[folderName] ? 'block' : 'none';
        });
    }
    
    // Render the playlist
    function renderPlaylist() {
        playlist.innerHTML = '';
        
        if (songs.length === 0) {
            const li = document.createElement('li');
            li.className = 'playlist-item';
            li.textContent = 'Inga låtar hittades';
            playlist.appendChild(li);
            return;
        }
        
        // Loopa genom varje mapp och visa dess låtar
        Object.keys(folders).sort().forEach(folderName => {
            const folder = folders[folderName];
            
            // Skapa mapp-section om den har låtar
            if (folder.songs.length > 0) {
                // Skapa mapp-header
                if (folderName !== 'Root') {
                    const folderHeader = document.createElement('div');
                    folderHeader.className = 'folder-header';
                    folderHeader.setAttribute('data-folder', folderName);
                    
                    // Skapa mapp-ikon baserat på mappstatus
                    const folderIcon = document.createElement('i');
                    folderIcon.className = folderStates[folderName] ? 'fas fa-folder-open' : 'fas fa-folder';
                    
                    // Lägg till expandera/kollapsa-ikon
                    const expandIcon = document.createElement('span');
                    expandIcon.className = 'expand-icon';
                    expandIcon.textContent = folderStates[folderName] ? '▼' : '►';
                    
                    // Sätt mappnamn
                    const folderNameSpan = document.createElement('span');
                    folderNameSpan.className = 'folder-name';
                    folderNameSpan.textContent = folderName;
                    
                    // Lägg till klick-hanterare för att expandera/kollapsa mappen
                    folderHeader.addEventListener('click', () => {
                        toggleFolder(folderName);
                    });
                    
                    // Lägg till elementen i DOM:en
                    folderHeader.appendChild(expandIcon);
                    folderHeader.appendChild(folderIcon);
                    folderHeader.appendChild(folderNameSpan);
                    playlist.appendChild(folderHeader);
                }
                
                // Container för mappens låtar
                const folderSongs = document.createElement('div');
                folderSongs.className = 'folder-songs';
                folderSongs.setAttribute('data-folder', folderName);
                // Sätt display baserat på om mappen är öppen eller stängd
                folderSongs.style.display = (folderName === 'Root' || folderStates[folderName]) ? 'block' : 'none';
                
                // Skapa låt-lista för mappen
                folder.songs.forEach(song => {
                    const index = songs.findIndex(s => s.fullPath === song.fullPath);
                    
                    const li = document.createElement('li');
                    li.className = 'playlist-item';
                    if (folderName !== 'Root') {
                        li.classList.add('subfolder-item');
                    }
                    
                    // Låttitel i egen div
                    const songTitle = document.createElement('div');
                    songTitle.className = 'song-title';
                    songTitle.textContent = song.name;
                    songTitle.addEventListener('click', () => {
                        loadSong(index);
                    });
                    
                    // Container för favorit och kommentarsikon
                    const songActions = document.createElement('div');
                    songActions.className = 'song-actions';
                    
                    // Skapa favorit-stjärna
                    const favoriteElement = createFavoriteStar();
                    
                    // Kommentarsikon
                    const commentIcon = document.createElement('span');
                    commentIcon.className = 'comment-icon';
                    commentIcon.innerHTML = '<i class="fas fa-comment"></i>';
                    
                    // Lägg till event listeners
                    commentIcon.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openCommentModal(index);
                    });
                    
                    // Uppdatera favorit-stjärna baserat på lagrat värde
                    const songId = getSongId(song);
                    if (favorites[songId]) {
                        favoriteElement.classList.add('active');
                    }
                    
                    // Event listener för favorit-stjärna
                    favoriteElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        toggleFavorite(index);
                    });
                    
                    // Sätt aktiv class om det är nuvarande låt
                    if (index === currentSongIndex && !audioPlayer.paused) {
                        li.classList.add('active');
                    }
                    
                    // Lägg till elementen i DOM:en
                    songActions.appendChild(favoriteElement);
                    songActions.appendChild(commentIcon);
                    
                    li.appendChild(songTitle);
                    li.appendChild(songActions);
                    
                    folderSongs.appendChild(li);
                });
                
                playlist.appendChild(folderSongs);
            }
        });
    }
    
    // Generera en unik ID för en låt
    function getSongId(song) {
        return song.displayPath || song.name; // Använd displayPath som unik identifierare
    }
    
    // Växla favorit-status för en låt
    function toggleFavorite(index) {
        const song = songs[index];
        const songId = getSongId(song);
        
        // Växla favorit-status
        favorites[songId] = !favorites[songId];
        
        // Om favorit är falsk, ta bort egenskapen helt
        if (!favorites[songId]) {
            delete favorites[songId];
        }
        
        localStorage.setItem('songFavorites', JSON.stringify(favorites));
        
        // Uppdatera stjärna i UI
        const items = playlist.querySelectorAll('.playlist-item');
        // Hitta rätt item för denna låt (kan vara flera items med samma klass)
        items.forEach(item => {
            if (item.querySelector('.song-title').textContent === song.name) {
                const star = item.querySelector('.favorite-star');
                if (favorites[songId]) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            }
        });
    }
    
    // Öppna kommentarsmodal
    function openCommentModal(index) {
        const song = songs[index];
        const songId = getSongId(song);
        
        commentSongTitle.textContent = `Kommentarer för ${song.displayPath || song.name}`;
        commentText.value = songComments[songId] || '';
        currentCommentSongIndex = index;
        
        commentModal.style.display = 'block';
    }
    
    // Stäng kommentarsmodal
    function closeCommentModal() {
        commentModal.style.display = 'none';
        currentCommentSongIndex = -1;
    }
    
    // Spara kommentar
    function saveComment() {
        if (currentCommentSongIndex === -1) return;
        
        const song = songs[currentCommentSongIndex];
        const songId = getSongId(song);
        
        songComments[songId] = commentText.value;
        localStorage.setItem('songComments', JSON.stringify(songComments));
        
        closeCommentModal();
    }
    
    // Load and play a song
    function loadSong(index) {
        if (songs.length === 0) return;
        
        currentSongIndex = index;
        const song = songs[currentSongIndex];
        
        // Se till att mappen för den aktuella låten är öppen
        if (song.folder && song.folder !== 'Root' && !folderStates[song.folder]) {
            toggleFolder(song.folder);
        }
        
        audioPlayer.src = song.path;
        currentSongInfo.textContent = song.displayPath || song.name;
        
        // Update active class in playlist
        document.querySelectorAll('.playlist-item').forEach((item, i) => {
            const songTitle = item.querySelector('.song-title').textContent;
            if (songTitle === song.name) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        audioPlayer.play();
    }
    
    // Play next song
    function playNext() {
        if (songs.length === 0) return;
        
        let nextIndex = currentSongIndex + 1;
        if (nextIndex >= songs.length) {
            nextIndex = 0;
        }
        
        loadSong(nextIndex);
    }
    
    // Play previous song
    function playPrevious() {
        if (songs.length === 0) return;
        
        let prevIndex = currentSongIndex - 1;
        if (prevIndex < 0) {
            prevIndex = songs.length - 1;
        }
        
        loadSong(prevIndex);
    }
    
    // Event: Audio ended - play next song
    audioPlayer.addEventListener('ended', playNext);
    
    // Event: Previous button click
    prevButton.addEventListener('click', playPrevious);
    
    // Event: Next button click
    nextButton.addEventListener('click', playNext);
    
    // Event: Stäng kommentarsmodal
    closeModal.addEventListener('click', closeCommentModal);
    
    // Event: Klick utanför modalen stänger den
    window.addEventListener('click', (e) => {
        if (e.target === commentModal) {
            closeCommentModal();
        }
    });
    
    // Event: Spara kommentar
    saveCommentBtn.addEventListener('click', saveComment);
    
    // Check for new songs every minute
    function scheduleSongRefresh() {
        const currentlyPlayingSrc = audioPlayer.src;
        const isPlaying = !audioPlayer.paused;
        const currentTime = audioPlayer.currentTime;
        
        fetchSongs().then(() => {
            // If a song was playing, find and continue it
            if (isPlaying && currentlyPlayingSrc) {
                const songPath = currentlyPlayingSrc.split('/').pop();
                const decodedPath = decodeURIComponent(songPath);
                
                // Hitta låten baserat på URL-sökväg
                const songIndex = songs.findIndex(song => {
                    return song.path.includes(songPath);
                });
                
                if (songIndex !== -1) {
                    currentSongIndex = songIndex;
                    renderPlaylist();
                }
            }
        });
    }
    
    // Initial songs fetch
    fetchSongs();
    
    // Refresh song list every 60 seconds
    setInterval(scheduleSongRefresh, 60000);
}); 