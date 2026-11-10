<template>
  <div class="settings-panel">
    <header class="settings-header">
      <div>
        <span class="panel-eyebrow">GEO KNOWLEDGE</span>
        <h1>地质资料库</h1>
        <p>将报告、规范与文献转化为可检索、有来源的找矿知识。</p>
      </div>
      <button
        type="button"
        class="settings-refresh-btn"
        :disabled="documentStore.documentsLoading"
        @click="onRefresh"
      >
        <i class="fa-solid fa-rotate" :class="{ 'fa-spin': documentStore.documentsLoading }"></i>
        刷新数据
      </button>
    </header>

    <p
      v-if="documentStore.workspaceNotice"
      class="operation-notice"
      role="status"
      aria-live="polite"
    >
      {{ documentStore.workspaceNotice }}
    </p>

    <section class="kb-onboarding" aria-label="知识库使用说明">
      <i class="fa-solid fa-book-open-reader" aria-hidden="true"></i>
      <div>
        <h2>添加你的私有地质知识</h2>
        <p>① 上传文档 → ② 等待索引任务完成 → ③ 返回找矿问答并核对引用。</p>
        <p>
          原文件与索引保存在当前部署；生成回答时，必要的检索片段会发送给已配置的模型服务。当前资料库由本部署的授权账号共享。
        </p>
      </div>
    </section>
    <section class="settings-stats">
      <article>
        <span>文档总数</span>
        <strong>{{ documentStore.documents.length }}</strong>
        <small>当前部署的知识空间</small>
      </article>
      <article>
        <span>可检索片段</span>
        <strong>{{ totalChunks.toLocaleString() }}</strong>
        <small>已发布版本的检索片段</small>
      </article>
      <article>
        <span>索引状态</span>
        <strong>{{
          documentStore.documentsLoading
            ? '同步中'
            : documentStore.workspaceNotice
              ? '需检查'
              : '已同步'
        }}</strong>
        <small>{{ documentStore.isUploading ? '正在构建资料索引' : '以任务和文档状态为准' }}</small>
      </article>
      <article>
        <span>支持格式</span>
        <strong>4</strong>
        <small>PDF · DOCX · XLSX · HTML</small>
      </article>
    </section>

    <div class="settings-grid">
      <section class="documents-section">
        <div class="documents-section-head">
          <div>
            <h2>全部文档</h2>
            <p>{{ filteredDocuments.length }} 份已发布资料</p>
          </div>
          <label class="document-search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input v-model="searchQuery" type="search" placeholder="搜索文档名称…" />
          </label>
        </div>

        <div class="document-table-head">
          <span>名称</span>
          <span>片段</span>
          <span>状态</span>
          <span></span>
        </div>

        <div v-if="documentStore.documentsLoading" class="loading-indicator">
          <span class="loading-orb"><i class="fa-solid fa-spinner fa-spin"></i></span>
          <strong>正在同步知识库</strong>
          <p>正在读取 Document Catalog 与当前版本统计。</p>
        </div>

        <div v-else-if="filteredDocuments.length === 0" class="empty-documents">
          <img
            v-if="!searchQuery"
            :src="emptyKnowledge"
            class="empty-illustration empty-knowledge-illustration"
            alt=""
          />
          <span v-else class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
          <h3>{{ searchQuery ? '没有匹配的文档' : '知识库还是空的' }}</h3>
          <p>
            {{
              searchQuery
                ? '换一个关键词试试。'
                : '从入库区域上传第一份地质资料，等待任务完成后即可检索。'
            }}
          </p>
        </div>

        <div v-else class="documents-list">
          <DocumentItem v-for="doc in filteredDocuments" :key="doc.filename" :doc="doc" />
        </div>
      </section>

      <UploadSection />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import UploadSection from './UploadSection.vue';
import DocumentItem from './DocumentItem.vue';
import { useDocumentStore } from '@/stores/documents';
import emptyKnowledge from '@/assets/images/geology-contour.svg';

const documentStore = useDocumentStore();
const searchQuery = ref('');

const totalChunks = computed(() =>
  documentStore.documents.reduce((total, document) => total + Number(document.chunk_count || 0), 0)
);

const filteredDocuments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return documentStore.documents;
  return documentStore.documents.filter(
    (document) =>
      document.filename.toLowerCase().includes(query) ||
      document.file_type.toLowerCase().includes(query)
  );
});

const onRefresh = async () => {
  try {
    await documentStore.initializeDocumentWorkspace();
  } catch (error: any) {
    alert(error.message);
  }
};

onMounted(onRefresh);

onUnmounted(() => {
  documentStore.stopAllDeleteJobPolling();
});
</script>
