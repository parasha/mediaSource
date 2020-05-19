class Video {
  // 视频播放器
  el = null;
  // 视频格式
  mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  // MediaSource 对象
  #mediaSource = null;
  // SourceBuffrt 对象
  #sourceBuffer = null;
  // 视频地址
  #video_url = null;
  // 视频分段个数
  part_number = 10;
  // 视频每一段的大小
  #part_size = 0;
  // 每一段视频的长度
  #part_duration = 0;
  // 当前播放的视频 index
  #part_index = 0;
  // 视频加载状态
  #sourceBuffer_load_status = [];

  // 构造函数
  constructor(dom_video, url) {
    this.el = dom_video;
    this.init(url);
  }
  // meidaSource 初始化
  /**
   * 
   * @param {String} url 视频地址 
   */
  async init(url) {
    this.#video_url = url;
    // 创建一个 mediaSource 对象
    this.#mediaSource = new MediaSource();
    // 给 video 标签添加一个 blob
    this.el.src = URL.createObjectURL(this.#mediaSource);
    this.#mediaSource.addEventListener('sourceopen', async () => {
      // 创建一个带有给定MIME类型的新的 SourceBuffer
      // addSourceBuffer 需要 mediaSource 处于 open 状态
      this.#sourceBuffer = this.#mediaSource.addSourceBuffer(this.mimeCodec);
      this.#part_size = Math.round(await this.#getVideoSize() / this.part_number);
      console.log('视频每一段的大小：', this.#part_size);
      await this.#loadMediaData(0);
      // 监听播放
      this.el.addEventListener('timeupdate', this.#playListener.bind(this))
      this.el.addEventListener('canplay', ()=>{
        this.#part_duration = this.el.duration / this.part_number
      })
      console.log(this);
    })
  }
  // 获取视频基本信息: 视频大小
  async #getVideoSize() {
    const xhr = new XMLHttpRequest();
    xhr.open("head", this.#video_url);
    return new Promise(res => {
      xhr.onload = async function () {
        res(xhr.getResponseHeader("content-length"));
      };
      xhr.send();
    })
  }
  async #loadMediaData(index) {
    const chunk = await this.#fetchMediaData(index)
    console.log(chunk)
    // 加载第一段视频
    this.#sourceBuffer.appendBuffer(chunk);
    console.log('appendBuffer', this);
    // 保存一个加载状态，进度条拖动时使用
    this.#sourceBuffer_load_status[index] = true;
  }
  // 请求视频数据
  /**
   * 
   * @param {Number} index 视频分段的 index
   */
  async #fetchMediaData(index) {
    const start = index * this.#part_size;
    const end = (index + 1) * this.#part_size;
    const xhr = new XMLHttpRequest();
    xhr.open("get", this.#video_url);
    xhr.responseType = "arraybuffer";
    xhr.setRequestHeader("Range", "bytes=" + start + "-" + end);
    return new Promise(res => {
      xhr.onload = function () {
        res(xhr.response);
      };
      xhr.send();
    })
  }
  // 播放事件监听 
  async #playListener() {
    // 是否已经完全加载完成
    if (this.#haveAllLoad()) {
      console.log('全部加载')
      this.el.removeEventListener("timeupdate", this.#playListener);
      this.#mediaSource.endOfStream();
    } else {
      if (this.#needLoadNext(this.#part_index)) {
        console.log('加载下一段视频')
        await this.#loadMediaData(this.#part_index + 1);
      }
    }
  }
  // 是否需要加载下一段视频
  #needLoadNext(index) {
    // if (index == (this.part_number - 1) || this.#sourceBuffer_load_status[index + 1]) {
    //   return false;
    // } else {
      const loaded_duration = 0.5 * (index + 1) * this.#part_duration;
      return this.el.currentTime > loaded_duration;
    // }
  }
  // 是否已经全部加载
  #haveAllLoad() {
    for (let index = 0; index < this.part_number; index++) {
      const element = this.#sourceBuffer_load_status[index];
      if (element) {
        continue
      } else {
        return false;
      }
    }
    return true;
  }
}

export default Video;