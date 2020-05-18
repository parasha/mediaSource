<template>
  <div id="page">
    <img src="../assets/logo.png" />
    <div class="title">video-blob</div>
    <video controls ref="videoVNode"></video>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";

var assetURL = "../assets/frag_bunny.mp4";
// Need to be specific for Blink regarding codecs
// ./mp4info frag_bunny.mp4 | grep Codec
var mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
var totalSegments = 5;
var segmentLength = 0;
var segmentDuration = 0;
var bytesFetched = 0;
var requestedSegments = [];
var video = null;
var mediaSource = null;
var sourceBuffer = null;

function sourceOpen(_) {
  // 创建一个带有给定MIME类型的新的 SourceBuffer
  sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
  // 获取文件大小
  getFileLength(assetURL, function(fileLength) {
    console.log("video size:", (fileLength / 1024 / 1024).toFixed(2), "MB");
    // 每一片的大小
    segmentLength = Math.round(fileLength / totalSegments);
    console.log("part video size:", segmentLength);
    // 开始请求 video 内容
    fetchRange(assetURL, 0, segmentLength, appendSegment);
    // 这是一个缓存的表示，判断接下来的部分是否已经加载
    requestedSegments[0] = true;
    // 视频播放时随时监听播放进度
    video.addEventListener("timeupdate", checkBuffer);
    video.addEventListener("canplay", function() {
      console.log(mediaSource.readyState); // open
      // 每一段视频的时长
      segmentDuration = video.duration / totalSegments;
      console.log("一片视频的长度：", segmentDuration);
      // video.play();
    });
    // 视频进度条拖动
    video.addEventListener("seeking", seek);
  });
}
// 获取视频总大小
function getFileLength(url, cb) {
  var xhr = new XMLHttpRequest();
  xhr.open("head", url);
  xhr.onload = function() {
    cb(xhr.getResponseHeader("content-length"));
  };
  xhr.send();
}
// 请求部分视频数据
function fetchRange(url, start, end, cb) {
  console.log("开始请求 video 部分数据：", url, start, end);
  var xhr = new XMLHttpRequest();
  xhr.open("get", url);
  xhr.responseType = "arraybuffer";
  xhr.setRequestHeader("Range", "bytes=" + start + "-" + end);
  xhr.onload = function() {
    console.log("fetched bytes: ", start + "~" + end);
    bytesFetched += end - start + 1;
    console.log("bytesFetched:", bytesFetched);
    // 拼接数据
    cb(xhr.response);
  };
  xhr.send();
}
// 拼接 sourceBuffer
function appendSegment(chunk) {
  console.log("拼接 sourceBuffer：", chunk, sourceBuffer);
  sourceBuffer.appendBuffer(chunk);
}

// 检查播放进度
function checkBuffer(_) {
  // 当前播放岛第几部分
  var currentSegment = getCurrentSegment();
  // 是否是最后一部份
  if (currentSegment === totalSegments && haveAllSegments()) {
    console.log("视频即将结束：", mediaSource.readyState);
    mediaSource.endOfStream();
    video.removeEventListener("timeupdate", checkBuffer);
    // 检查是否应该加载下一部分视频
  } else if (shouldFetchNextSegment(currentSegment)) {
    // 加载下一部分
    console.log(
      "即将加载下一部分视频，当前播放进度：",
      video.currentTime,
      segmentDuration * currentSegment * 0.8
    );
    requestedSegments[currentSegment] = true;
    fetchRange(
      assetURL,
      bytesFetched,
      bytesFetched + segmentLength,
      appendSegment
    );
  }
  //console.log(video.currentTime, currentSegment, segmentDuration);
}

function seek(e) {
  console.log("video 拖动进度条：", e);
  if (mediaSource.readyState === "open") {
    // 如果视频正在播放，终端 sourceBUffer 的加载
    sourceBuffer.abort();
    console.log("视频当前状态：", mediaSource.readyState);
  } else {
    console.log("视频 end");
    console.log(mediaSource.readyState);
  }
}
// 获取当前播放进度（第几部分）
function getCurrentSegment() {
  // console.log('当前播放进度：', `第${((video.currentTime / segmentDuration) | 0) + 1}部分`, `总第${video.currentTime}秒`)
  return ((video.currentTime / segmentDuration) | 0) + 1;
}

function haveAllSegments() {
  return requestedSegments.every(function(val) {
    return !!val;
  });
}

// 判断是否需要加载下一部分视频
function shouldFetchNextSegment(currentSegment) {
  return (
    video.currentTime > segmentDuration * currentSegment * 0.8 &&
    !requestedSegments[currentSegment]
  );
}

export default {
  setup() {
    const videoVNode = ref(null);

    onMounted(() => {
      video = videoVNode.value;
      for (var i = 0; i < totalSegments; ++i) requestedSegments[i] = false;
      // 检查 mediaSource 的兼容性
      if ("MediaSource" in window && MediaSource.isTypeSupported(mimeCodec)) {
        // 创建 mediaSource 对象
        mediaSource = new MediaSource();
        // 获取当前文件的一个内存URL
        videoVNode.value.src = URL.createObjectURL(mediaSource);
        // 返回一个包含当前MediaSource状态的集合
        // 它当前没有附着到一个media元素(closed)
        // 或者已附着并准备接收SourceBuffer 对象 (open)
        // 亦或者已附着但这个流已被MediaSource.endOfStream()关闭(ended.)
        console.log(mediaSource.readyState); // closed
        mediaSource.addEventListener("sourceopen", sourceOpen);
      } else {
        console.error("Unsupported MIME type or codec: ", mimeCodec);
      }
    });

    return {
      videoVNode
    };
  }
};
</script>

<style lang="less" scoped>
#page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  img {
    width: 100px;
  }
  .title {
    margin-bottom: 10px;
  }
  video {
    width: 50%;
  }
}
</style>
