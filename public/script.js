document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const audioPlayer = document.getElementById('audio-player');
    const playlist = document.getElementById('playlist');
    const currentSongInfo = document.getElementById('current-song-info');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const refreshButton = document.getElementById('refresh-button');
    const lastUpdated = document.getElementById('last-updated');
    
    // Variables
    let songs = [];
    let currentSongIndex = 0;
    
    // Format current date and time
    function formatDateTime() {
        const now = new Date();
        return now.toLocaleString('sv-SE');
    }
    
    // Update last updated time
    function updateLastUpdatedTime() {
        lastUpdated.textContent = `Senast uppdaterad: ${formatDateTime()}`;
    }
    
    // Fetch songs list from the server
    async function fetchSongs() {
        try {
            const response = await fetch('/api/songs');
            const data = await response.json();
            songs = data;
            renderPlaylist();
            updateLastUpdatedTime();
            
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
        
        songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.className = 'playlist-item';
            li.textContent = song.name;
            
            if (index === currentSongIndex && !audioPlayer.paused) {
                li.classList.add('active');
            }
            
            li.addEventListener('click', () => {
                loadSong(index);
            });
            
            playlist.appendChild(li);
        });
    }
    
    // Load and play a song
    function loadSong(index) {
        if (songs.length === 0) return;
        
        currentSongIndex = index;
        const song = songs[currentSongIndex];
        
        audioPlayer.src = song.path;
        currentSongInfo.textContent = song.name;
        
        // Update active class in playlist
        document.querySelectorAll('.playlist-item').forEach((item, i) => {
            if (i === currentSongIndex) {
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
    
    // Manual refresh
    async function handleRefresh() {
        refreshButton.disabled = true;
        refreshButton.textContent = 'Uppdaterar...';
        
        const success = await fetchSongs();
        
        refreshButton.disabled = false;
        refreshButton.textContent = success ? 'Uppdatera' : 'Försök igen';
    }
    
    // Event: Audio ended - play next song
    audioPlayer.addEventListener('ended', playNext);
    
    // Event: Previous button click
    prevButton.addEventListener('click', playPrevious);
    
    // Event: Next button click
    nextButton.addEventListener('click', playNext);
    
    // Event: Refresh button click
    refreshButton.addEventListener('click', handleRefresh);
    
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
                
                const songIndex = songs.findIndex(song => 
                    song.name === decodedPath || 
                    song.path.includes(songPath)
                );
                
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