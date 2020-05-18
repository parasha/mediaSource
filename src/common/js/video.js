class Video {
  // 视频播放器
  el = null;
  // MediaSource 对象
  #mediaSource = null;
  // SourceBuffrt 对象
  #sourceBuffer = null;
  // 视频地址
  #video_url = null;
  // 视频分片个数
  part_number = 5;
  // 视频每一片的大小
  #part_size = 0;

  // 构造函数
  constructor(dom_video) {
    this.el = dom_video;
  }
  // meidaSource 初始化
  /**
   * 
   * @param {String} url 视频地址 
   */
  async init(url) {
    this.#video_url = url;
    this.#mediaSource = new MediaSource();
    this.el.src = URL.createObjectURL(this.#mediaSource);
    this.#mediaSource.addEventListener('sourceopen', async () => {
      const a = await this.#getVideoSize() ;
      this.#part_size = await this.#getVideoSize() / this.part_number;
      console.log('视频每一片的大小：', this.#part_size)
    })
  }
  // 获取视频基本信息: 视频大小
  async #getVideoSize() {
    const xhr = new XMLHttpRequest();
    console.log('发起请求', this.#video_url);
    xhr.open("head", this.#video_url);
    // TODO 这里的 await 有问题
    xhr.onload = async function () {
      await xhr.getResponseHeader("content-length");
    };
    xhr.send();
  }
}

export default Video;