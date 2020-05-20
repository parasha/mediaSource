<template>
  <div id="page">
    <video ref="videoVNode" controls></video>
    <!-- <video controls src='http://vm2.dashif.org/livesim-dev/segtimeline_1/testpic_6s/Manifest.mpd'></video> -->
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import './common/js/flv.min.js'; 
// import Video from './common/js/video';
import Video from "./common/js/asyncVideo";
// import it ES6 style:
// import RxPlayer from "rx-player";
// import 'flv'

var assetURL = "./assets/frag_bunny.mp4";

export default {
  setup() {
    const videoVNode = ref(null);

    let video = null;
    onMounted(() => {
      video = videoVNode.value;

      if (flvjs.isSupported()) {
        var videoElement = video;
        var flvPlayer = flvjs.createPlayer({
          type: "flv",
          url: 'http://fed.dev.hzmantu.com/oa-project/bce0c613e364122715270faef1874251.flv'
        });
        flvPlayer.attachMediaElement(videoElement);
        flvPlayer.load();
        flvPlayer.play();
      }
    });

    const play = () => {
      if (video.player.paused) {
        video.play();
      } else {
        video.pause();
      }
    };

    return {
      videoVNode,
      play
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
    width: 80%;
  }
}
</style>
