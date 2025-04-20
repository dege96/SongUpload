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
    
    // Lagra betyg och kommentarer lokalt
    let songRatings = JSON.parse(localStorage.getItem('songRatings')) || {};
    let songComments = JSON.parse(localStorage.getItem('songComments')) || {};
    
    // Fetch songs list from the server
    async function fetchSongs() {
        try {
            const response = await fetch('/api/songs');
            const data = await response.json();
            songs = data;
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
    
    // Skapa stjärnor för rating
    function createRatingStars() {
        const rating = document.createElement('div');
        rating.className = 'rating';
        
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.innerHTML = '&#9733;'; // Stjärnsymbol
            star.dataset.value = i;
            rating.appendChild(star);
        }
        
        return rating;
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
            
            // Låttitel i egen div
            const songTitle = document.createElement('div');
            songTitle.className = 'song-title';
            songTitle.textContent = song.name;
            songTitle.addEventListener('click', () => {
                loadSong(index);
            });
            
            // Container för rating och kommentarsikon
            const songActions = document.createElement('div');
            songActions.className = 'song-actions';
            
            // Skapa rating stjärnor
            const ratingElement = createRatingStars();
            
            // Kommentarsikon
            const commentIcon = document.createElement('span');
            commentIcon.className = 'comment-icon';
            commentIcon.innerHTML = '<i class="fas fa-comment"></i>';
            
            // Lägg till event listeners
            commentIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                openCommentModal(index);
            });
            
            // Uppdatera aktiva stjärnor baserat på lagrat betyg
            const songId = getSongId(song);
            if (songRatings[songId]) {
                const stars = ratingElement.querySelectorAll('.star');
                stars.forEach((star, i) => {
                    if (i < songRatings[songId]) {
                        star.classList.add('active');
                    }
                });
            }
            
            // Event listener för stjärnor
            ratingElement.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.target.classList.contains('star')) {
                    const rating = parseInt(e.target.dataset.value);
                    setRating(index, rating);
                }
            });
            
            // Sätt aktiv class om det är nuvarande låt
            if (index === currentSongIndex && !audioPlayer.paused) {
                li.classList.add('active');
            }
            
            // Lägg till elementen i DOM:en
            songActions.appendChild(ratingElement);
            songActions.appendChild(commentIcon);
            
            li.appendChild(songTitle);
            li.appendChild(songActions);
            
            playlist.appendChild(li);
        });
    }
    
    // Generera en unik ID för en låt
    function getSongId(song) {
        return song.name; // Använd låtnamnet som unik identifierare
    }
    
    // Sätt betyg för en låt
    function setRating(index, rating) {
        const song = songs[index];
        const songId = getSongId(song);
        
        songRatings[songId] = rating;
        localStorage.setItem('songRatings', JSON.stringify(songRatings));
        
        // Uppdatera UI
        const stars = playlist.querySelectorAll('.playlist-item')[index].querySelectorAll('.star');
        stars.forEach((star, i) => {
            if (i < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
    
    // Öppna kommentarsmodal
    function openCommentModal(index) {
        const song = songs[index];
        const songId = getSongId(song);
        
        commentSongTitle.textContent = `Kommentarer för ${song.name}`;
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