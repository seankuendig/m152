const videoTag = document.getElementById("video_tag");

const mediaSource = new MediaSource();
const url = URL.createObjectURL(mediaSource);

videoTag.src = url;