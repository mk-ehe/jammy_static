const container = document.getElementById("container");
const bgVideo = document.getElementById("bg-video");
const bgAudio = document.getElementById("bg-audio");
const hideBtn = document.getElementById('hide-btn');
const player = document.getElementById("player");
const warningContainer = document.getElementById("warning-container");
const warningHeader = document.getElementById("warning-header");
const warningDesc = document.getElementById("warning-desc");
const continueBtn = document.getElementById("continue-btn");
const volumeSlider = document.getElementById("volume-slider");
const volumeBtn = document.getElementById("volume-btn");
const playerPlayBtn = document.getElementById("player-play-btn");
const durationElement = document.getElementById("duration-player");
const progressBar = document.querySelector(".progress-bar");

let lastVolume = volumeSlider.value;
let activeBtn = null;
let currentSongData = null;
let hasPreloadedNext = false;
let activeSongElement = null;
let isDragging = false;
let songsData = [];

const initialVolume = parseFloat(volumeSlider.value);
bgVideo.volume = initialVolume;
bgAudio.volume = initialVolume;
lastVolume = initialVolume;

const preloader = document.createElement('video');
const audioPreloader = document.createElement('audio');
preloader.preload = "auto";
audioPreloader.preload = "auto";
preloader.volume = 0;
audioPreloader.volume = 0;

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function preloadNextSong(currentSong) {
    const currentIndex = songsData.indexOf(currentSong);

    let nextIndex = currentIndex + 1;
    if (nextIndex >= songsData.length) {
        nextIndex = 0;
    }

    const nextSong = songsData[nextIndex];
    if (nextSong) {
        preloader.src = nextSong.video_file;
        audioPreloader.src = nextSong.music_file;
        preloader.load();
        audioPreloader.load();
    }
}


function updateProgressBarColor(current, total) {
    const percent = (current / total) * 100;
    const activeColor = getComputedStyle(player).getPropertyValue('--active-color').trim() || '#ffffff';
    progressBar.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percent}%, rgba(255, 255, 255, 0.2) ${percent}%, rgba(255, 255, 255, 0.2) 100%)`;
}


function progressLoop() {
    if ((!bgVideo.paused || !bgAudio.paused) && !isDragging) {
        const currentTime = !bgVideo.paused ? bgVideo.currentTime : bgAudio.currentTime;
        const duration = !bgVideo.paused ? bgVideo.duration : bgAudio.duration;

        if (!isNaN(duration)) {
            progressBar.max = duration;
            progressBar.value = currentTime;

            updateProgressBarColor(currentTime, duration);
        }
        requestAnimationFrame(progressLoop);
    }
}


function playSong(song, playBtn, songElement) {
    const isNewSong = !bgVideo.src.includes(song.video_file);

    if (isNewSong) {
        if (activeBtn) {
            activeBtn.textContent = "▶";
            activeSongElement.classList.remove("active-card");
        }

        currentSongData = song; 
        hasPreloadedNext = false;

        const switchInput = document.querySelector('.switch input');
        const isAudioMode = switchInput && switchInput.checked;

        if (isAudioMode) {
            bgAudio.src = song.music_file;
            bgVideo.style.display = "none";
            
            var audioPromise = bgAudio.play();
            if (audioPromise !== undefined) {
                audioPromise.catch(error => {});
            }
        } else {
            bgVideo.src = song.video_file;
            bgVideo.style.display = "block";
            bgAudio.pause();
            bgAudio.src = "";
            
            var playPromise = bgVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {});
            }
        }
        
        playBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="padding-top: 2px">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        `;
        playerPlayBtn.innerHTML = playBtn.innerHTML;

        activeBtn = playBtn;
        activeSongElement = songElement;
        activeSongElement.classList.add("active-card");

        playBtn.focus();

        if (song.main_color) {
            container.style.setProperty("--main-color", song.main_color+"af");
            container.style.setProperty("--main-color-hover", song.main_color);
            hideBtn.style.setProperty("--main-color", song.main_color)
            hideBtn.style.setProperty("--main-color-hover", song.main_color+"30")
            player.style.setProperty("--active-color", song.main_color+"a4")
            player.style.setProperty("--active-color-hover", song.main_color)
            document.body.style.setProperty("--active-color-hover", song.main_color);
            
            const switchSlider = document.querySelector('.slider');
            const switchInput = document.querySelector('.switch input');
            if (switchSlider && switchInput) {
                if (switchInput.checked) {
                    switchSlider.classList.add('slider-active');
                } else {
                    switchSlider.classList.remove('slider-active');
                }
            }
        }
        
        progressBar.value = 0;
        progressBar.max = 100;
        bgVideo.currentTime = 0;
        bgAudio.currentTime = 0;
        updateProgressBarColor(0, 100);
        
        bgVideo.addEventListener('loadedmetadata', () => {
            progressBar.max = bgVideo.duration;
            updateProgressBarColor(0, bgVideo.duration);
        }, { once: true });

        bgAudio.addEventListener('loadedmetadata', () => {
            progressBar.max = bgAudio.duration;
            updateProgressBarColor(0, bgAudio.duration);
        }, { once: true });
        
    } else {
        const isVideoMode = !bgVideo.paused || (bgVideo.paused && bgAudio.paused && !switchInput.checked);
        
        if (isVideoMode && bgVideo.paused) {
            var playPromise = bgVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {});
            }
            playBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="padding-top: 2px">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
            `;
            playerPlayBtn.innerHTML = playBtn.innerHTML;
        } else if (!isVideoMode && bgAudio.paused) {
            var playPromise = bgAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {});
            }
            playBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="padding-top: 2px">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
            `;
            playerPlayBtn.innerHTML = playBtn.innerHTML;
        } else {
            bgVideo.pause();
            bgAudio.pause();
            playBtn.textContent = "▶";
            playerPlayBtn.textContent = "▶";
        }   
        activeBtn = playBtn;
    }
}

fetch("songs.json")
    .then(response => response.json())
    .then(data => {
        songsData = data;
        data.forEach(song => {
            const songElement = document.createElement("div");
            songElement.classList.add("song-card");

            songElement.innerHTML = `
                <img class="cover" src="${song.cover_img}">
                <div class="song-info">
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                </div>
                <span class="duration">${formatTime(song.duration)}</span>
            `;

            const playBtn = document.createElement("button");
            playBtn.tabIndex = -1;
            playBtn.classList.add("play-btn");
            playBtn.textContent = "▶";
            
            if (song.main_color) {
                songElement.style.setProperty("--active-color", song.main_color+"30");
                songElement.style.setProperty("--active-color-hover", song.main_color+"4c");
                songElement.style.setProperty("--main-color-border", song.main_color);
            }

            playBtn.addEventListener("click", () => {
                playSong(song, playBtn, songElement);
            });

            playBtn.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                playBtn.click();
            })

            songElement.addEventListener("dblclick", () => {
                if (activeSongElement === songElement) {
                    const switchInput = document.querySelector('.switch input');
                    const isAudioMode = switchInput && switchInput.checked;

                    if (isAudioMode) {
                        bgAudio.currentTime = 0;
                        bgAudio.play();
                    } else {
                        bgVideo.currentTime = 0;
                        bgVideo.play();
                    }

                    playBtn.innerHTML = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="padding-top: 2px">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    `;
                    playerPlayBtn.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="padding-top: 2px">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    `
                } else {
                    playBtn.click();
                }
            })
            songElement.appendChild(playBtn); 
            container.appendChild(songElement);
            })

            const allButtons = document.querySelectorAll('.song-card .play-btn');
            if (allButtons.length > 0) {
                const randomIndex = Math.floor((Math.random() * allButtons.length));
                const randomBtn = allButtons[randomIndex];
                const randomSongData = data[randomIndex];
            

                if (randomSongData) {
                    preloader.src = randomSongData.video_file; 
                    preloader.load();
                }

                continueBtn.addEventListener('click', () => {
                    warningContainer.classList.add("warning-container-hidden");

                    randomBtn.click();
                    randomBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    playerPlayBtn.innerHTML = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="padding-top: 2px">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    `;
                    container.style.pointerEvents = "none";
                    player.style.pointerEvents = "none";
                    setTimeout(() => { 
                        warningContainer.remove();
                        container.style.pointerEvents = "auto";
                        player.style.pointerEvents = "auto";
                        }, 500);
                });
            }
        })

const iconEyeOpen = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
</svg>`;

const iconEyeClosed = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.15C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.27,4.75 8.07,5.27L10.08,7.29C10.65,7.11 11.29,7 12,7Z" />
</svg>`;

hideBtn.addEventListener("click", () => {
    container.classList.toggle("hidden");
    bgVideo.classList.toggle("video-bg-undimmed")
    if (container.classList.contains("hidden")) {
        hideBtn.innerHTML = iconEyeClosed;
    } else {
        hideBtn.innerHTML = iconEyeOpen;
    }   
});

setTimeout(() => {warningHeader.classList.add("showing-up-trasition");}, 500)
setTimeout(() => {warningDesc.classList.add("showing-up-trasition");}, 1500)
setTimeout(() => {continueBtn.classList.add("showing-up-trasition");}, 3500)


const iconMute = `
<svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L4.27,3M12,4L9.91,6.09L12,8.18V4M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.48,12.43 16.5,12.22 16.5,12M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12Z" />
</svg>`;

const iconSound = `
<svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
</svg>`;


volumeSlider.addEventListener("input", (event) => {
    const volumeValue = parseFloat(event.target.value);
    bgVideo.volume = volumeValue;
    bgAudio.volume = volumeValue;

    if (volumeValue > 0) {
        lastVolume = volumeValue;
        volumeBtn.innerHTML = iconSound;
    } else {
        volumeBtn.innerHTML = iconMute;
    }
})

volumeBtn.addEventListener("click", () => {
    const currentVol = parseFloat(volumeSlider.value);

    if (currentVol > 0){
        lastVolume = currentVol;
        volumeBtn.innerHTML = iconMute;
        bgVideo.volume = 0;
        bgAudio.volume = 0;
        volumeSlider.value = 0;

    } else {
        const restoreAmount = lastVolume > 0 ? lastVolume : 0.28;
        volumeBtn.innerHTML = iconSound;
        bgVideo.volume = restoreAmount;
        bgAudio.volume = restoreAmount;
        volumeSlider.value = restoreAmount;
    }
})

playerPlayBtn.addEventListener("click", () => {
    const isVideoPlaying = !bgVideo.paused;
    const isAudioPlaying = !bgAudio.paused;

    if (isVideoPlaying || isAudioPlaying) {
        bgVideo.pause();
        bgAudio.pause();
        playerPlayBtn.textContent = "▶";
    } else {
        if (activeBtn) {
            activeBtn.click();
        }
    }
});

bgVideo.addEventListener('pause', () => {
    document.body.classList.remove("idle-mode");
    clearTimeout(idleTimer);
});

bgVideo.addEventListener('play', () => {
    requestAnimationFrame(progressLoop);
    resetIdleTimer;
});

bgAudio.addEventListener('pause', () => {
    document.body.classList.remove("idle-mode");
    clearTimeout(idleTimer);
});

bgAudio.addEventListener('play', () => {
    requestAnimationFrame(progressLoop);
    resetIdleTimer;
});

bgVideo.addEventListener('ended', () => {
    const activeCard = document.querySelector('.active-card');
    if (!activeCard) return;

    const allCards = Array.from(document.querySelectorAll('.song-card'));
    const currentIndex = allCards.indexOf(activeCard);
    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= allCards.length) {
        nextIndex = 0;
    }

    const nextCard = allCards[nextIndex];
    const nextBtn = nextCard.querySelector('.play-btn');
    if (nextBtn) {
        nextBtn.click();
        nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    resetIdleTimer();
});

bgAudio.addEventListener('ended', () => {
    const activeCard = document.querySelector('.active-card');
    if (!activeCard) return;

    const allCards = Array.from(document.querySelectorAll('.song-card'));
    const currentIndex = allCards.indexOf(activeCard);
    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= allCards.length) {
        nextIndex = 0;
    }

    const nextCard = allCards[nextIndex];
    const nextBtn = nextCard.querySelector('.play-btn');
    if (nextBtn) {
        nextBtn.click();
        nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    resetIdleTimer();
});


bgVideo.addEventListener('timeupdate', () => {
    const currentTime = bgVideo.currentTime;
    const duration = bgVideo.duration;
    if (!isDragging && !isNaN(bgVideo.duration)) {
        durationElement.textContent = formatTime(currentTime);

        if (!hasPreloadedNext && (duration - currentTime <= 10)) {
            hasPreloadedNext = true;
            if (currentSongData) {
                preloadNextSong(currentSongData);
            }
        }
    }
});

bgAudio.addEventListener('timeupdate', () => {
    const currentTime = bgAudio.currentTime;
    const duration = bgAudio.duration;
    if (!isDragging && !isNaN(bgAudio.duration)) {
        durationElement.textContent = formatTime(currentTime);

        if (!hasPreloadedNext && (duration - currentTime <= 10)) {
            hasPreloadedNext = true;
            if (currentSongData) {
                preloadNextSong(currentSongData);
            }
        }
    }
});

progressBar.addEventListener('mousedown', () => { isDragging = true; });
progressBar.addEventListener('touchstart', () => { isDragging = true; });

progressBar.addEventListener('input', (e) => {
    const seekTime = parseFloat(e.target.value);
    updateProgressBarColor(seekTime, progressBar.max);
    durationElement.textContent = formatTime(seekTime);
});

progressBar.addEventListener('change', (e) => {
    isDragging = false;
    const seekTime = parseFloat(e.target.value);
    
    if (!bgVideo.paused) {
        bgVideo.currentTime = seekTime;
        updateProgressBarColor(bgVideo.currentTime, bgVideo.duration);
    } else {
        bgAudio.currentTime = seekTime;
        updateProgressBarColor(bgAudio.currentTime, bgAudio.duration);
    }
    requestAnimationFrame(progressLoop);
});

let idleTimer;
function resetIdleTimer() {
    document.body.classList.remove("idle-mode");
    clearTimeout(idleTimer);

    if (!bgVideo.paused) {
        idleTimer = setTimeout(() => {
            document.body.classList.add("idle-mode");
        }, 10000);
    }
}

['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer);
});

const switchInput = document.querySelector('.switch input');
const switchSlider = document.querySelector('.slider');
if (switchInput) {
    switchInput.addEventListener('change', () => {
        if (switchSlider) {
            if (switchInput.checked) {
                switchSlider.classList.add('slider-active');
            } else {
                switchSlider.classList.remove('slider-active');
            }
        }

        if (currentSongData) {
            const currentTime = bgVideo.paused ? bgAudio.currentTime : bgVideo.currentTime;
            const isPlaying = !bgVideo.paused || !bgAudio.paused;

            bgVideo.style.opacity = '0';

            setTimeout(() => {
                if (switchInput.checked) {
                    bgVideo.pause();
                    bgVideo.currentTime = 0;
                    bgVideo.style.display = "none";
                    bgAudio.src = currentSongData.music_file;
                    bgAudio.currentTime = currentTime;
                    
                    if (isPlaying) {
                        bgAudio.play().catch(error => {});
                    }
                } else {
                    bgAudio.pause();
                    bgAudio.currentTime = 0;
                    bgVideo.src = currentSongData.video_file;
                    bgVideo.style.display = "block";
                    bgVideo.currentTime = currentTime;
                    
                    if (isPlaying) {
                        bgVideo.play().catch(error => {});
                    }
                }
                
                bgVideo.style.opacity = '1';
            }, 300);
        }
    });
    if (switchInput.checked) {
        switchSlider.classList.add('slider-active');
    }
}
