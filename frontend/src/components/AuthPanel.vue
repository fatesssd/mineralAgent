<template>
  <section class="auth-page">
    <div class="auth-showcase">
      <div class="auth-showcase-badge">
        <i class="fa-solid fa-sparkles"></i>
        <span>MINERAL AGENT · 地质知识工作台</span>
      </div>
      <h2>读懂地质线索，<br />找到证据的方向。</h2>
      <p>汇集地质报告、成矿研究与勘查文献，用可追溯的知识检索辅助每一次找矿思考。</p>
      <div class="auth-feature-list">
        <div>
          <i class="fa-solid fa-magnifying-glass-chart"></i>
          <span><strong>地质资料检索</strong><small>语义与关键词联合召回</small></span>
        </div>
        <div>
          <i class="fa-solid fa-diagram-project"></i>
          <span><strong>找矿线索梳理</strong><small>围绕问题查找与对比证据</small></span>
        </div>
        <div>
          <i class="fa-regular fa-file-lines"></i>
          <span><strong>原文溯源</strong><small>从回答回到资料和页码</small></span>
        </div>
      </div>
    </div>

    <div class="auth-panel">
      <div class="auth-panel-heading">
        <span class="auth-mini-logo" aria-hidden="true">
          <img :src="mineralMark" class="brand-mark-image" alt="" />
        </span>
        <div>
          <span class="auth-eyebrow">{{
            authStore.authMode === 'login' ? 'Welcome back' : 'Create account'
          }}</span>
          <h1>{{ authStore.authMode === 'login' ? '登录智能找矿助手' : '注册智能找矿助手' }}</h1>
        </div>
      </div>
      <p class="auth-description">
        {{
          authStore.authMode === 'login'
            ? '登录找矿工作台，继续你的资料研究。'
            : '创建账号后即可开始对话和保存历史记录。'
        }}
      </p>

      <p v-if="authStore.authNotice" class="operation-notice" role="status" aria-live="polite">
        {{ authStore.authNotice }}
      </p>

      <form class="auth-form" @submit.prevent="onSubmit">
        <label class="form-field">
          <span>用户名</span>
          <span class="field-input">
            <i class="fa-regular fa-user"></i>
            <input
              v-model="authStore.authForm.username"
              type="text"
              autocomplete="username"
              placeholder="请输入用户名"
            />
          </span>
        </label>

        <label class="form-field">
          <span>密码</span>
          <span class="field-input">
            <i class="fa-solid fa-lock"></i>
            <input
              v-model="authStore.authForm.password"
              type="password"
              :autocomplete="authStore.authMode === 'login' ? 'current-password' : 'new-password'"
              placeholder="请输入密码"
            />
          </span>
        </label>

        <label v-if="authStore.authMode === 'register'" class="form-field">
          <span>账号角色</span>
          <span class="field-input">
            <i class="fa-regular fa-id-badge"></i>
            <select v-model="authStore.authForm.role">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </span>
        </label>

        <label
          v-if="authStore.authMode === 'register' && authStore.authForm.role === 'admin'"
          class="form-field"
        >
          <span>管理员邀请码</span>
          <span class="field-input">
            <i class="fa-solid fa-key"></i>
            <input
              v-model="authStore.authForm.admin_code"
              type="password"
              autocomplete="off"
              placeholder="请输入管理员邀请码"
            />
          </span>
        </label>

        <button class="auth-submit" type="submit" :disabled="authStore.authLoading">
          <span>{{
            authStore.authLoading
              ? '正在连接...'
              : authStore.authMode === 'login'
                ? '进入工作台'
                : '创建账号'
          }}</span>
          <i
            :class="
              authStore.authLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-right'
            "
          ></i>
        </button>
      </form>

      <div class="auth-divider"><span>或者</span></div>
      <button class="auth-switch" type="button" @click="toggleAuthMode">
        {{ authStore.authMode === 'login' ? '还没有账号？创建一个' : '已有账号？返回登录' }}
      </button>
      <p class="auth-footnote">登录即表示你理解 AI 输出需要经过必要的人工复核。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import mineralMark from '@/assets/images/mineral-mark.svg';

const authStore = useAuthStore();

const toggleAuthMode = () => {
  authStore.authMode = authStore.authMode === 'login' ? 'register' : 'login';
};

const onSubmit = async () => {
  try {
    await authStore.handleAuthSubmit();
  } catch (error: any) {
    alert(error.message);
  }
};
</script>
