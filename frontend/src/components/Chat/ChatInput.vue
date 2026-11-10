<template>
  <div class="input-area-wrapper">
    <div v-if="chatStore.currentPendingHitl" class="hitl-panel">
      <div class="hitl-panel-header">
        <span class="hitl-icon"><i class="fa-solid fa-circle-question"></i></span
        ><span><strong>补充一条地质线索</strong><small>沿用当前问题与检索证据继续研究</small></span>
      </div>
      <div class="hitl-panel-prompt">{{ chatStore.currentPendingHitl.prompt }}</div>
      <div v-if="chatStore.currentPendingHitl.options?.length" class="hitl-options">
        <button
          v-for="option in chatStore.currentPendingHitl.options"
          :key="option"
          type="button"
          class="hitl-option"
          @click="selectHitlOption(option)"
        >
          {{ option }}
        </button>
      </div>
    </div>
    <div v-else class="mineral-composer-heading">
      <span class="knowledge-mode-pill"><i class="fa-solid fa-book-open"></i> 地质知识库问答</span>
      <button
        v-if="authStore.isAdmin"
        type="button"
        class="composer-library-link"
        @click="openLibrary"
      >
        <i class="fa-solid fa-folder-open"></i> 管理资料
      </button>
      <span v-else class="composer-source-hint">基于当前部署的资料检索</span>
    </div>
    <div
      v-if="capabilityStore.loading || capabilityStore.error || !knowledgeAvailable"
      class="mineral-mode-status"
      :class="{ 'is-error': capabilityStore.error }"
      role="status"
    >
      <span>{{
        capabilityStore.loading
          ? '正在连接资料检索能力…'
          : capabilityStore.error || '知识库检索能力尚未就绪，请联系管理员。'
      }}</span>
      <button v-if="!capabilityStore.loading" type="button" @click="retryCapabilities">
        重新连接
      </button>
    </div>
    <div :class="['input-area', { 'hitl-active': chatStore.currentPendingHitl }]">
      <textarea
        ref="textareaRef"
        v-model="chatStore.userInput"
        class="chat-input-textarea"
        :placeholder="chatStore.inputPlaceholder"
        :disabled="chatStore.isInputLocked"
        rows="1"
        @keydown="handleKeyDown"
        @compositionstart="isComposing = true"
        @compositionend="isComposing = false"
        @input="autoResize"
      ></textarea>
      <button
        v-if="chatStore.isViewingStreamingThread"
        type="button"
        class="send-btn stop-btn"
        title="终止回答"
        aria-label="终止回答"
        :disabled="chatStore.currentRunStatus === 'cancelling'"
        @click="chatStore.handleStop"
      >
        <i class="fa-solid fa-stop"></i>
      </button>
      <button
        v-else
        type="button"
        class="send-btn"
        :disabled="
          chatStore.isInputLocked || (!knowledgeAvailable && !chatStore.currentPendingHitl)
        "
        title="发送问题"
        aria-label="发送消息"
        @click="onSend"
      >
        <i class="fa-solid fa-arrow-up"></i>
      </button>
    </div>
    <div class="input-footer">
      <span><i class="fa-regular fa-compass"></i> 结论请结合原文与实地资料复核</span
      ><span><kbd>Enter</kbd> 发送 · <kbd>Shift</kbd> + <kbd>Enter</kbd> 换行</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useCapabilityStore } from '@/stores/capabilities';
import { useAuthStore } from '@/stores/auth';
import { useThreadStore } from '@/stores/threads';
const chatStore = useChatStore();
const capabilityStore = useCapabilityStore();
const authStore = useAuthStore();
const threadStore = useThreadStore();
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const isComposing = ref(false);
const knowledgeAvailable = computed(
  () =>
    capabilityStore.catalog?.skills.some(
      (skill) => skill.name === 'knowledge-base' && skill.available
    ) ?? false
);
const autoResize = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 140) + 'px';
  }
};
const focusTextarea = async () => {
  await nextTick();
  textareaRef.value?.focus();
  autoResize();
};
const selectHitlOption = async (option: string) => {
  chatStore.selectHitlOption(option);
  await focusTextarea();
};
const retryCapabilities = () => void capabilityStore.retryCatalog().catch(() => undefined);
const openLibrary = () => {
  chatStore.activeNav = 'settings';
  threadStore.showHistorySidebar = false;
};
const onSend = async () => {
  if (!chatStore.userInput.trim() || chatStore.isInputLocked || isComposing.value) return;
  if (!chatStore.currentPendingHitl) {
    if (!knowledgeAvailable.value) return;
    capabilityStore.selectSkill('knowledge-base');
  }
  await chatStore.handleSend();
  await nextTick();
  if (textareaRef.value) textareaRef.value.style.height = 'auto';
};
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey && !isComposing.value && !event.isComposing) {
    event.preventDefault();
    void onSend();
  }
};
onMounted(() => window.addEventListener('mineral-prompt-selected', focusTextarea));
onUnmounted(() => window.removeEventListener('mineral-prompt-selected', focusTextarea));
</script>
