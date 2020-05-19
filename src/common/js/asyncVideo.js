class Video {
  //  vide 标签
  player = null;
  // 视频地址
  url = null;
  // 视频格式
  mimeCodec = null;
  // 视频分成几段加载
  part = 5;
  // private
  #mediasource = null;
  #sourceBuffer = null;
  // 视频基本信息
  #media_info = {
    size: 0,
    duration: 0,
  }
  // 播放器信息
  #player_info = {
    part_size: 0,
    start_bytes: 0,
    part_duration: 0, // 每一段的时长
    index: 0, // 当前播放的 index
  }
  // 视频加载状态
  #media_load_status = []

  constructor(video, url, mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"') {
    this.mimeCodec = mimeCodec;
    if ('MediaSource' in window && MediaSource.isTypeSupported(this.mimeCodec)) {
      this.player = video;
      this.url = url;
      // 创建 mediaSource 实例
      this.#mediasource = new MediaSource();
      this.player.src = URL.createObjectURL(this.#mediasource);
      this.#mediasource.addEventListener('sourceopen', async () => {
        // 添加 sourceBuffer 需要 mediaSource 处于 open 状态
        this.#sourceBuffer = this.#mediasource.addSourceBuffer(this.mimeCodec);
        // 视频信息
        this.#media_info.size = await this.#getMediaBaaseInfo();
        this.#player_info.part_size = this.#media_info.size / this.part;
        this.player.addEventListener('canplay', () => {
          this.#media_info.duration = this.player.duration;
          this.#player_info.part_duration = this.#media_info.duration / this.part;
        })
        // 状态初始化
        for (let index = 0; index < this.part; index++) {
          this.#media_load_status[index] = false;
        }
        // 加载第一段视频
        await this.#loadMediaData(0);
        // 监听播放事件
        this.player.addEventListener('timeupdate', this.#playListener.bind(this));
      })
    } else {
      throw new Error('不受支持的 视频格式');
    }
  }

  // 获取基本信息: 视频大小，时长
  #getMediaBaaseInfo() {
    // 视频大小
    const xhr = new XMLHttpRequest();
    xhr.open("head", this.url);
    return new Promise(res => {
      xhr.onload = function () {
        res(xhr.getResponseHeader("content-length"));
      };
      xhr.send();
    })
  }

  #playListener() {
    const loaded_duration = this.#player_info.index * this.#player_info.part_duration;
    if (this.player.currentTime > 0.7 * loaded_duration) {
      // 即将播放完，需要加载下一段
      if (this.#havaAllLoad()) {
        // 视频全部加载
        if (this.#mediasource.readyState == 'open') {
          console.log('stream end')
          this.#mediasource.endOfStream();
        }
      } else {
        this.#loadMediaData(this.#player_info.index);
      }
    }
  }

  // 加载视频
  async #loadMediaData(index) {
    if (this.#player_info.index >= this.part || this.#havaAllLoad()) {
      return;
    }
    console.log('加载下一段视频')
    const chunk = await this.#fetchMediaData(index);
    this.#sourceBuffer.appendBuffer(chunk);
    this.#media_load_status[index] = true;
    this.#player_info.index = index + 1;
  }

  #fetchMediaData(index) {
    // start 和 end 的计算很重要，有误差的话，视频的播放会接不上
    const start = this.#player_info.start_bytes;
    const end = start + this.#player_info.part_size;
    const xhr = new XMLHttpRequest();
    xhr.open("get", this.url);
    xhr.responseType = "arraybuffer";
    xhr.setRequestHeader("Range", "bytes=" + start + "-" + end);
    return new Promise(res => {
      xhr.onload = () => {
        this.#player_info.start_bytes += end - start + 1;
        // 拼接数据
        res(xhr.response);
      };
      xhr.send();
    })
  }

  // 是否已经全部加载
  #havaAllLoad() {
    return this.#media_load_status.every(item => {
      return !!item;
    })
  }
}


export default Video