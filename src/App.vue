<template>
  <div id="page">
    <video controls ref="videoVNode"></video>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
// import Video from './common/js/video';
import Video from './common/js/asyncVideo';


var assetURL = "./assets/frag_bunny.mp4";

export default {
  setup() {
    const videoVNode = ref(null);

    onMounted(() => {
      const video = new Video(videoVNode.value, assetURL);
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
    width: 80%;
  }
}
</style>
