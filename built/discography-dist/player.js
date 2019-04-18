// Build list of available track row elements
let oldTrackRows = document.getElementsByTagName('tr');
let newTrackRows = [];
newTrackRows[0]=oldTrackRows[0];
for(let counter=1; counter<oldTrackRows.length; counter++) {
    //// // console.log(oldTrackRows[counter].parentElement);
    if (oldTrackRows[counter].parentElement.tagName === "THEAD") {
        continue;
    }
    newTrackRows.push(oldTrackRows[counter]);
}
let trackRows = newTrackRows;

function formatSecondsAsTime(secs, format) {
    /* based on https://stackoverflow.com/questions/4993097/html5-display-audio-currenttime */
    let hr = Math.floor(secs / 3600);
    let min = Math.floor((secs - (hr * 3600)) / 60);
    let sec = Math.floor(secs - (hr * 3600) - (min * 60));

    if (min < 10) {
        min = "0" + min;
    }
    if (sec < 10) {
        sec = "0" + sec;
    }

    return min + ':' + sec;
}

let currentTrack;

let audioTag = document.createElement('audio');

let audioContainer = document.createElement('div');
audioContainer.className = "audioContainer";
audioContainer.appendChild(audioTag);

let audioMainPlayButton = document.createElement('button');
audioMainPlayButton.className = "audioMainPlayButton";
audioMainPlayButton.innerHTML = "▶";

let audioTitle = document.createElement('span');
audioTitle.className = "audioTitle";
let audioDuration = document.createElement('span');
audioDuration.className = "audioDuration";
let audioPlayhead = document.createElement('div');
audioPlayhead.className = "audioPlayhead";
let audioCurrentTime = document.createElement('span');
audioCurrentTime.className = "audioCurrentTime";
let audioWaveform = document.createElement('img');
audioWaveform.className = "audioWaveform";
let audioScrubber = document.createElement('input');
audioScrubber.className = "audioScrubber";
let audioVolume = document.createElement('input');
audioVolume.className = "audioVolume";
audioScrubber.type = 'range';
audioVolume.type = 'range';
let audioPlayNextButton = document.createElement('button');
audioPlayNextButton.className = "audioPlayNextButton";
audioPlayNextButton.innerHTML = "⏭";

audioContainer.appendChild(audioWaveform);
audioContainer.appendChild(audioPlayhead);
audioContainer.appendChild(audioTitle);
audioContainer.appendChild(audioMainPlayButton);
audioContainer.appendChild(audioDuration);
audioContainer.appendChild(audioCurrentTime);
audioContainer.appendChild(audioScrubber);
audioContainer.appendChild(audioVolume);
audioContainer.appendChild(audioPlayNextButton);

function seekInAudio() {
    let newVal = Math.floor((audioScrubber.value / 100) * audioTag.duration);
    if (!isNaN(newVal)) {
        audioTag.currentTime = newVal;
    }
}
audioScrubber.onchange = seekInAudio;

function updateVolume() {
    audioTag.volume = audioVolume.value / 100;
}
audioVolume.onchange = updateVolume;

function convertRemToPixels(rem) {
    /* from https://stackoverflow.com/questions/36532307/rem-px-in-javascript */
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function updateCurrentTime() {
    /* based on https://stackoverflow.com/questions/4993097/html5-display-audio-currenttime */
    let currTime = Math.floor(audioTag.currentTime).toString();
    let duration = Math.floor(audioTag.duration).toString();
    let remaining = duration - currTime;
    let percentage = currTime / duration;

    audioCurrentTime.innerHTML = formatSecondsAsTime(currTime) + '; ' + '-' + formatSecondsAsTime(remaining) + ' (' + (percentage * 100).toFixed(3) + '%)';

    let progressPercentage = (currTime / duration);
    audioScrubber.value = parseInt(((currTime / duration) * 100), 10);
    let timelineWidth = audioScrubber.offsetWidth;
    audioPlayhead.style.left = ((timelineWidth * progressPercentage) + convertRemToPixels(4)) + 'px';
    let desiredRightPosition = ((timelineWidth * (1 - progressPercentage)) - convertRemToPixels(10));
    let maximumRightPosition = convertRemToPixels(10);
    if (desiredRightPosition < maximumRightPosition) {
        desiredRightPosition = maximumRightPosition;
    }
    audioCurrentTime.style.right = desiredRightPosition + 'px';
    audioCurrentTime.style.display = 'block';

    if (isNaN(duration)) {
        audioDuration.innerHTML = '??:??';
    } else {
        audioDuration.innerHTML = formatSecondsAsTime(duration);
    }
}

addEventListener("resize", updateCurrentTime);
audioTag.addEventListener("timeupdate", updateCurrentTime);
audioTag.addEventListener("durationchange", updateCurrentTime);

function loadTrack(trackNumber) {
    // // console.log('loadTrack requested for ' + trackNumber);
    currentTrack = trackNumber;
    let trackRowToPlay = trackRows[trackNumber];
    let trackPlayButton = trackRowToPlay.getElementsByTagName('td')[1].getElementsByTagName('button')[0];
    if (trackPlayButton.classList.contains('playing')) {
        trackPlayButton.className = 'playButton playing currentTrack';
    }
    else {
        trackPlayButton.className = 'playButton currentTrack';
    }
    /* Figure out what the relative file name is of the waveform file */
    if (document.getElementById('musiccontents')) {
        /* This is a featured releases page, so get the info from the DOM */
        /*         tr             tbody         table         div */
        let name = trackRowToPlay.parentElement.parentElement.parentElement.id;
        let rowIndex = 0;
        while (rowIndex < trackRowToPlay.parentElement.children.length) {
            if(trackRowToPlay.parentElement.children[rowIndex] === trackRowToPlay) {
                break;
            }
            rowIndex++;
        }
        rowIndex++;
        audioWaveform.src = 'releases/' + name + '/' + rowIndex + 'w.png';
    }
    else {
        /* This is a release page, so get the info from the filename */
        // based on https://stackoverflow.com/questions/16611497/how-can-i-get-the-name-of-an-html-page-in-javascript
        let path = window.location.pathname;
        let file = path.split("/").pop();
        let name = file.split(".").shift();

        audioWaveform.src = name + '/' + trackNumber + 'w.png'
    }
    let childNodesCounter = 0;
    while (audioTag.childNodes.length > 0) {
        let nodes = audioTag.childNodes;
        audioTag.removeChild(nodes[0]);
        childNodesCounter = childNodesCounter + 1;
    }
    let tagsToCopy = trackRowToPlay.getElementsByTagName('source');
    for (let i = 0; i < tagsToCopy.length; i++) {
        audioTag.appendChild(tagsToCopy[i].cloneNode(true));
    }
    audioTag.load();
    audioTitle.innerHTML = trackRows[trackNumber].getElementsByTagName('td')[2].innerHTML;
}

function clearTrackStatuses() {
    for (let i = 1; i < trackRows.length; i++) {
        /* skip first row: it is header */
        let trackPlayButton = trackRows[i].getElementsByTagName('td')[1].getElementsByTagName('button')[0];
        trackPlayButton.innerHTML = "▶";
        if (trackPlayButton.classList.contains('currentTrack')) {
            trackPlayButton.className = 'playButton currentTrack';
        }
        else {
            trackPlayButton.className = 'playButton';
        }
    }
    audioMainPlayButton.innerHTML = "▶";
}

function playLabelSetPlaying() {
    clearTrackStatuses();
    let trackPlayButton = trackRows[currentTrack].getElementsByTagName('td')[1].getElementsByTagName('button')[0];
    trackPlayButton.innerHTML = "⏸";
    trackPlayButton.className = 'playButton playing currentTrack';
    trackPlayButton.onclick = function() {
        pauseTrackFromTrackButton(this);
    };
    audioMainPlayButton.innerHTML = "⏸";
}

function playLabelSetLoading() {
    // // console.log('Loading label requested');
    clearTrackStatuses();
    let trackPlayButton = trackRows[currentTrack].getElementsByTagName('td')[1].getElementsByTagName('button')[0];
    trackPlayButton.innerHTML = "⏳";
    trackPlayButton.className = 'playButton playing currentTrack';
    trackPlayButton.onclick = function() {
        pauseTrackFromTrackButton(this);
    };
    audioMainPlayButton.innerHTML = "⏳";
}

function playLabelSetPaused() {
    clearTrackStatuses();
    let trackPlayButton = trackRows[currentTrack].getElementsByTagName('td')[1].getElementsByTagName('button')[0];
    trackPlayButton.innerHTML = "▶";
    trackPlayButton.className = 'playButton currentTrack';
    trackPlayButton.onclick = function() {
        playTrackFromTrackButton(this);
    };
    audioMainPlayButton.innerHTML = "▶";
}

function playTrack(trackNumber) {
    // console.log('playTrack requested for ' + trackNumber);
    loadTrack(trackNumber);
    playLabelSetLoading();
    let canPlayEventListenerFunction = function() {
            audioTag.play();
            playLabelSetPlaying();
            audioTag.removeEventListener("canplay", canPlayEventListenerFunction);
        };
    audioTag.addEventListener("canplay", canPlayEventListenerFunction);
}

function pauseTrack() {
    // console.log('pauseTrack requested');
    audioTag.pause();
    clearTrackStatuses();
    playLabelSetPaused();
    trackRows[currentTrack].getElementsByTagName('td')[1].getElementsByTagName('button')[0].onclick = function() {
        playTrackFromTrackButton(this);
    };
}

function playTrackFromTrackButton(trackClickedElement) {
    // console.log('playTrack requested from track button');
    for (let i = 1; i < trackRows.length; i++) {
        /* skip first row: it is header */
        if (trackRows[i].getElementsByTagName('td')[1].getElementsByTagName('button')[0] === trackClickedElement) {
            // console.log('playTrack gotten');
            if(i === currentTrack) {
                togglePlayPause();
            }
            else {
                playTrack(i);
            }
        }
    }
    return false;
}

function pauseTrackFromTrackButton(trackClickedElement) {
    // console.log('pauseTrack requested from track button');
    pauseTrack();
    return false;
}

function reachedEndOfTrack(eventParameter) {
    // // console.log('Reached end of track ' + currentTrack);
    let trackPlayButton = trackRows[currentTrack].getElementsByTagName('td')[1].getElementsByTagName('button')[0];
    // // console.log(trackPlayButton);
    let nextTrack = currentTrack + 1;
    numberOfTracks = trackRows.length - 1;
    if (nextTrack > numberOfTracks) {
        nextTrack = 1;
    }
    trackPlayButton.classList.remove('currentTrack');
    audioTag.currentTime = 0;
    // console.log(trackPlayButton.classList);
    if (trackPlayButton.classList.contains('playing')) {
        // console.log('Requesting playing for ' + nextTrack);
        playTrack(nextTrack);
    }
    else {
        // console.log('Requesting load for ' + nextTrack);
        loadTrack(nextTrack);
    }
}

audioTag.addEventListener('ended', reachedEndOfTrack, false);

audioPlayNextButton.onclick = function() {
    reachedEndOfTrack(true);
};

function togglePlayPause() {
    // console.log('togglePlayPause requested');
    if (audioTag.paused) {
        audioTag.play();
        playLabelSetPlaying();
    } else {
        pauseTrack();
    }
}
audioMainPlayButton.onclick = function() {
    togglePlayPause();
};

for (let i = 1; i < trackRows.length; i++) {
    /* skip first row: it is header */
    trackAudioCell = trackRows[i].getElementsByTagName('td')[1];
    trackAudioCellAudioElement = trackAudioCell.getElementsByTagName('audio')[0];
    trackAudioCellAudioElement.style.display = "none";
    trackAudioCellAudioElement.pause();
    trackPlayButton = document.createElement('button');
    trackPlayButton.className = 'playButton';
    trackPlayButton.innerHTML = "▶";
    trackPlayButton.onclick = function() {
        playTrackFromTrackButton(this);
    };
    trackAudioCell.insertBefore(trackPlayButton, trackAudioCell.firstChild);
}

document.body.insertBefore(audioContainer, document.body.firstChild);

loadTrack(1);
