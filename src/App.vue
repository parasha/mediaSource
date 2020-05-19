<template>
  <div id="page">
    <video ref="videoVNode" controls></video>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";

// import Video from './common/js/video';
import Video from "./common/js/asyncVideo";
// import it ES6 style:
import RxPlayer from "rx-player";

var assetURL = "./assets/frag_bunny.mp4";

export default {
  setup() {
    const videoVNode = ref(null);

    let video = null;
    onMounted(() => {
      // video = new Video(videoVNode.value, assetURL);
      // instantiate it
      const player = new RxPlayer({
        videoElement: videoVNode.value,
      });

      // play a video
      player.loadVideo({
        url:
          "http://vm2.dashif.org/livesim-dev/segtimeline_1/testpic_6s/Manifest.mpd",
        transport: "dash",
        autoPlay: true
      });
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
