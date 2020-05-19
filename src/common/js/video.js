class video {
  video = null;
  assetURL = "";
  mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  totalSegments = 5;
  segmentLength = 0;
  segmentDuration = 0;
  bytesFetched = 0;
  requestedSegments = [];
  mediaSource = null;
  sourceBuffer = null;

  constructor(video, url) {
    this.video = video;
    this.assetURL = url
    for (var i = 0; i < this.totalSegments; ++i) this.requestedSegments[i] = false;
    // 检查 this.mediaSource 的兼容性
    if ("MediaSource" in window && MediaSource.isTypeSupported(this.mimeCodec)) {
      // 创建 this.mediaSource 对象
      this.mediaSource = new MediaSource();
      // 获取当前文件的一个内存URL
      this.video.src = URL.createObjectURL(this.mediaSource);
      // 返回一个包含当前this.mediaSource状态的集合
      // 它当前没有附着到一个media元素(closed)
      // 或者已附着并准备接收this.sourceBuffer 对象 (open)
      // 亦或者已附着但这个流已被this.mediaSource.endOfStream()关闭(ended.)
      console.log(this.mediaSource.readyState); // closed
      this.mediaSource.addEventListener("sourceopen", this.sourceOpen.bind(this));
    } else {
      console.error("Unsupported MIME type or codec: ", this.mimeCodec);
    }
  }

  sourceOpen() {
    // 创建一个带有给定MIME类型的新的 this.sourceBuffer
    this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mimeCodec);
    // 获取文件大小
    this.getFileLength(this.assetURL, (fileLength)=>{
      console.log("this.video size:", (fileLength / 1024 / 1024).toFixed(2), "MB");
      // 每一片的大小
      console.log('totalSegments:', this.totalSegments)
      this.segmentLength = Math.round(fileLength / this.totalSegments);
      console.log("part this.video size:", this.segmentLength);
      // 开始请求 this.video 内容
      this.fetchRange(this.assetURL, 0, this.segmentLength, this.appendSegment.bind(this));
      // 这是一个缓存的表示，判断接下来的部分是否已经加载
      this.requestedSegments[0] = true;
      // 视频播放时随时监听播放进度
      this.video.addEventListener("timeupdate", this.checkBuffer.bind(this));
      this.video.addEventListener("canplay",  ()=>{
        console.log(this.mediaSource.readyState); // open
        // 每一段视频的时长
        this.segmentDuration = this.video.duration / this.totalSegments;
        console.log("一片视频的长度：", this.segmentDuration);
        // this.video.play();
      });
      // // 视频进度条拖动
      this.video.addEventListener("seeking", this.seek.bind(this));
    });
  }
  // 获取视频总大小
  getFileLength(url, cb) {
    const xhr = new XMLHttpRequest();
    xhr.open("head", url);
    xhr.onload = function () {
      cb(xhr.getResponseHeader("content-length"));
    };
    xhr.send();
  }
  // 请求部分视频数据
  fetchRange(url, start, end, cb) {
    console.log("开始请求 this.video 部分数据：", url, start, end);
    const xhr = new XMLHttpRequest();
    xhr.open("get", url);
    xhr.responseType = "arraybuffer";
    xhr.setRequestHeader("Range", "bytes=" + start + "-" + end);
    xhr.onload = ()=>{
      console.log("fetched bytes: ", start + "~" + end);
      this.bytesFetched += end - start + 1;
      console.log("this.bytesFetched:", this.bytesFetched);
      // 拼接数据
      cb(xhr.response);
    };
    xhr.send();
  }
  // 拼接 this.sourceBuffer
  appendSegment(chunk) {
    console.log("拼接 this.sourceBuffer：", chunk, this.sourceBuffer);
    this.sourceBuffer.appendBuffer(chunk);
  }

  // 检查播放进度
  checkBuffer(_) {
    // 当前播放岛第几部分
    const currentSegment = this.getCurrentSegment();
    // 是否是最后一部份
    if (currentSegment === this.totalSegments && this.haveAllSegments()) {
      console.log("视频即将结束：", this.mediaSource.readyState);
      this.mediaSource.endOfStream();
      this.video.removeEventListener("timeupdate", this.checkBuffer.bind(this));
      // 检查是否应该加载下一部分视频
    } else if (this.shouldFetchNextSegment(currentSegment)) {
      // 加载下一部分
      console.log(
        "即将加载下一部分视频，当前播放进度：",
        this.video.currentTime,
        this.segmentDuration * currentSegment * 0.8
      );
      this.requestedSegments[currentSegment] = true;
      this.fetchRange(
        this.assetURL,
        this.bytesFetched,
        this.bytesFetched + this.segmentLength,
        this.appendSegment.bind(this)
      );
    }else{
      console.log(this.video.currentTime, currentSegment, this.segmentDuration);
    }
  }

  seek(e) {
    console.log("this.video 拖动进度条：", e);
    if (this.mediaSource.readyState === "open") {
      // 如果视频正在播放，终端 this.sourceBuffer 的加载
      this.sourceBuffer.abort();
      console.log("视频当前状态：", this.mediaSource.readyState);
    } else {
      console.log("视频 end");
      console.log(this.mediaSource.readyState);
    }
  }
  // 获取当前播放进度（第几部分）
  getCurrentSegment() {
    // console.log('当前播放进度：', `第${((this.video.currentTime / this.segmentDuration) | 0) + 1}部分`, `总第${this.video.currentTime}秒`)
    return ((this.video.currentTime / this.segmentDuration) | 0) + 1;
  }

  haveAllSegments() {
    return this.requestedSegments.every(function (val) {
      return !!val;
    });
  }

  // 判断是否需要加载下一部分视频
  shouldFetchNextSegment(currentSegment) {
    return (
      this.video.currentTime > this.segmentDuration * currentSegment * 0.8 &&
      !this.requestedSegments[currentSegment]
    );
  }
}

export default video;