<template>
  <section class="welcome-screen mineral-welcome">
    <div class="welcome-field-label">
      <span class="field-marker"></span> GEOLOGICAL KNOWLEDGE · 找矿知识
    </div>
    <div class="welcome-hero">
      <div class="welcome-hero-copy">
        <span class="welcome-eyebrow">从地质线索，到可追溯的证据</span>
        <h2>让每一次找矿判断，<br /><em>都有据可循。</em></h2>
        <p>围绕矿床类型、蚀变特征与勘查线索，检索你的地质资料，整理有来源的研究思路。</p>
      </div>
      <img :src="contourArt" class="welcome-geology-art" alt="" aria-hidden="true" />
    </div>
    <div class="welcome-section-label">
      <span>从一个问题开始</span><small>选择示例可填入输入框</small>
    </div>
    <div class="mineral-starters">
      <button
        v-for="(item, index) in GEO_STARTERS"
        :key="item.category"
        type="button"
        @click="applyPrompt(item.prompt)"
      >
        <span class="starter-topline"
          ><i :class="item.icon"></i><small>0{{ index + 1 }}</small></span
        >
        <span class="starter-category">{{ item.category }}</span>
        <strong>{{ item.title }}</strong>
        <span class="starter-arrow" aria-hidden="true"
          ><i class="fa-solid fa-arrow-up-right-from-square"></i
        ></span>
      </button>
    </div>
    <div class="welcome-knowledge-note">
      <span class="knowledge-note-icon"><i class="fa-solid fa-book-open"></i></span>
      <div>
        <strong>从你的地质资料建立知识库</strong>
        <p>先上传报告、规范与文献，等待索引完成，再围绕原文提问与核验引用。</p>
      </div>
      <button v-if="authStore.isAdmin" type="button" @click="openKnowledge">
        管理资料 <i class="fa-solid fa-arrow-right"></i>
      </button>
      <span v-else class="knowledge-note-hint">资料由管理员维护</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { GEO_STARTERS } from '@/config/product';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { useThreadStore } from '@/stores/threads';
import contourArt from '@/assets/images/geology-contour.svg';
const chatStore = useChatStore();
const authStore = useAuthStore();
const threadStore = useThreadStore();
const applyPrompt = (prompt: string) => {
  chatStore.userInput = prompt;
  window.dispatchEvent(new CustomEvent('mineral-prompt-selected'));
};
const openKnowledge = () => {
  chatStore.activeNav = 'settings';
  threadStore.showHistorySidebar = false;
};
</script>
