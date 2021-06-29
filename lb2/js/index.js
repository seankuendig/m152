function playVideo() {
    console.log('asdfasdf')
    const videoTag = document.getElementById("video_tag");

    const mediaSource = new MediaSource();
    const url = URL.createObjectURL(mediaSource);

    videoTag.src = url;

    const videoSourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.4d400d,mp4a.40.2"');

    // the same for the video SourceBuffer
    fetch("../sample-mp4-file.mp4").then(function (response) {
        // The data has to be a JavaScript ArrayBuffer
        return response.arrayBuffer();
    }).then(function (videoData) {
        videoSourceBuffer.appendBuffer(videoData);
    });
}