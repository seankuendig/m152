const ASSET_URL = 'frag_bunny.mp4';
const CODEC = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
let BYTES_FETCHED = 0;
let SEGMENT_DURATION = 0;
let REQUESTED_SEGMENTS;
let AMOUNT_OF_SEGMENTS;
let VIDEO;
let MEDIA_SOURCE;
let SOURCE_BUFFER;
let SEGMENT_LENGTH

function loadVideo() {
    AMOUNT_OF_SEGMENTS = document.getElementById('segments').value;
    console.log(AMOUNT_OF_SEGMENTS);
    REQUESTED_SEGMENTS = [];
    for (let i = 0; i < AMOUNT_OF_SEGMENTS; i++) {
        REQUESTED_SEGMENTS[i] = false;
    }
    VIDEO = document.getElementById('video_player');
    MEDIA_SOURCE = new MediaSource();
    VIDEO.src = URL.createObjectURL(MEDIA_SOURCE);
    MEDIA_SOURCE.addEventListener("sourceopen", sourceOpen);
}

function sourceOpen() {
    MEDIA_SOURCE = this;
    console.log(AMOUNT_OF_SEGMENTS);
    SOURCE_BUFFER = MEDIA_SOURCE.addSourceBuffer(CODEC);
    if (AMOUNT_OF_SEGMENTS > 0) {
        getFileLength((file_length) => {
            SEGMENT_LENGTH = Math.round(file_length / AMOUNT_OF_SEGMENTS);
            fetchRange(0, SEGMENT_LENGTH, appendSegment, SOURCE_BUFFER);
            REQUESTED_SEGMENTS[0] = true;
            VIDEO.addEventListener('timeupdate', checkBuffer);
            VIDEO.addEventListener('canplay', () => {
                SEGMENT_DURATION = VIDEO.duration / AMOUNT_OF_SEGMENTS;
            });
            VIDEO.addEventListener('seeking', seek);
        });
     }  else {
        fetchVideo((buffer) => {
            SOURCE_BUFFER.addEventListener("updateend", () => {
                MEDIA_SOURCE.endOfStream();
            });
            SOURCE_BUFFER.appendBuffer(buffer);
        });
    }
}

function getFileLength(callback) {
    let request = new XMLHttpRequest();
    request.open('head', ASSET_URL);
    request.onload = () => {
        callback(request.getResponseHeader('content-length'));
    }
    request.send();
}

function fetchVideo(callback) {
    let request = new XMLHttpRequest();
    request.open('get', ASSET_URL);
    request.responseType = 'arraybuffer';
    request.onload = () => {
        callback(request.response);
    }
    request.send();
}

function fetchRange(start, end, callback, source_buffer) {
    let request = new XMLHttpRequest();
    request.open('get', ASSET_URL);
    request.responseType = 'arraybuffer';
    request.setRequestHeader('Range', 'bytes=' + start + '-' + end);
    request.onload = () => {
        BYTES_FETCHED += end - start + 1;
        callback(request.response, source_buffer);
    }
    request.send();
}

function nextSegmentShouldBeFetched(current_segment, video, requested_segments) {
    return video.currentTime > SEGMENT_DURATION * current_segment * 0.8 && !requested_segments[current_segment];
}

function appendSegment(chunk, source_buffer) {
    source_buffer.appendBuffer(chunk);
}

function checkBuffer() {
    const current_segment = getCurrentSegment(VIDEO);
    if (current_segment === AMOUNT_OF_SEGMENTS && hasAllSegments(REQUESTED_SEGMENTS)) {
        MEDIA_SOURCE.endOfStream();
        this.video.removeEventListener('timeupdate', checkBuffer);
    } else if (nextSegmentShouldBeFetched(current_segment, VIDEO, REQUESTED_SEGMENTS)) {
        REQUESTED_SEGMENTS[current_segment] = true;
        fetchRange(BYTES_FETCHED, BYTES_FETCHED + SEGMENT_LENGTH, appendSegment, SOURCE_BUFFER);
    }
}

function getCurrentSegment(video) {
    return ((video.currentTime / SEGMENT_DURATION) | 0) + 1;
}

function hasAllSegments(request_segments) {
    return request_segments.every((value) => {
        return !!value;
    })
}

function seek() {
    if (MEDIA_SOURCE.readyState === 'open') {
        SOURCE_BUFFER.abort();
    }
}