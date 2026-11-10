import { defineStore } from 'pinia';
import { getCapabilityCatalog } from '@/capabilities/capabilityClient';
import { isProductSkill } from '@/config/product';
import type {
  CapabilityAvailabilityReason,
  CapabilityCatalogResponse,
  CapabilityExecutionMessage,
  CapabilitySkill,
  CapabilityTool,
} from '@/types/capabilities';
import { getPublicError } from '@/utils/api';

function capabilityError(
  code:
    | 'CONFLICT'
    | 'INVALID_REQUEST'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'POLICY_DENIED'
    | 'TOOL_UNAVAILABLE',
  message: string
) {
  return getPublicError({ code, message, retryable: false, category: 'capability' });
}
function normalizedThreadId(value: string | null | undefined): string | null {
  return value?.trim() || null;
}
export const useCapabilityStore = defineStore('capabilities', {
  state: () => ({
    catalog: null as CapabilityCatalogResponse | null,
    loading: false,
    error: '',
    selectedSkillName: null as string | null,
    activeThreadId: null as string | null,
    selectedSkillByThread: {} as Record<string, string | null>,
    requestVersion: 0,
  }),
  getters: {
    skills: (state): CapabilitySkill[] => state.catalog?.skills || [],
    tools: (state): CapabilityTool[] => state.catalog?.tools || [],
    selectedSkill(state): CapabilitySkill | null {
      return state.catalog?.skills.find((skill) => skill.name === state.selectedSkillName) || null;
    },
    selectedModeUnavailableReason(state): CapabilityAvailabilityReason {
      if (!state.selectedSkillName) return null;
      const selected = state.catalog?.skills.find(
        (skill) => skill.name === state.selectedSkillName
      );
      return !selected
        ? 'not_configured'
        : selected.available
          ? null
          : selected.availability_reason || 'not_configured';
    },
  },
  actions: {
    async fetchCatalog() {
      const version = ++this.requestVersion;
      this.loading = true;
      this.error = '';
      try {
        const server = await getCapabilityCatalog();
        const skills = server.skills.filter((skill) => isProductSkill(skill.name));
        const toolNames = new Set(skills.flatMap((skill) => skill.tool_names));
        const catalog = {
          ...server,
          skills,
          tools: server.tools.filter((tool) => toolNames.has(tool.name)),
        };
        if (version === this.requestVersion) this.catalog = catalog;
        return catalog;
      } catch (error) {
        const result = getPublicError(error);
        if (version === this.requestVersion) this.error = result.message;
        throw result;
      } finally {
        if (version === this.requestVersion) this.loading = false;
      }
    },
    retryCatalog() {
      return this.fetchCatalog();
    },
    setActiveThread(threadId: string | null) {
      this.activeThreadId = normalizedThreadId(threadId);
      this.selectedSkillName = this.activeThreadId
        ? (this.selectedSkillByThread[this.activeThreadId] ?? null)
        : null;
    },
    selectSkill(skillName: string | null, threadId?: string | null) {
      const name = skillName?.trim() || null;
      if (name) {
        if (!isProductSkill(name))
          throw capabilityError('TOOL_UNAVAILABLE', '此版本仅提供地质知识库问答。');
        if (!this.catalog) throw capabilityError('CONFLICT', '资料检索能力尚未加载，请稍后重试。');
        const skill = this.catalog.skills.find((item) => item.name === name);
        if (!skill) throw capabilityError('NOT_FOUND', '知识库能力尚未配置。');
        if (!skill.available)
          throw capabilityError(
            skill.availability_reason === 'permission_required'
              ? 'PERMISSION_DENIED'
              : 'TOOL_UNAVAILABLE',
            '当前账号无法使用知识库能力。'
          );
        if (skill.approval_tools.length)
          throw capabilityError('POLICY_DENIED', '此版本不提供高风险工具审批。');
      }
      this.selectedSkillName = name;
      const id = normalizedThreadId(threadId === undefined ? this.activeThreadId : threadId);
      if (id) this.selectedSkillByThread = { ...this.selectedSkillByThread, [id]: name };
    },
    restoreThreadSkill(skillName: string | null | undefined, threadId: string) {
      const id = normalizedThreadId(threadId);
      if (!id) return;
      const name = skillName?.trim() || null;
      this.selectedSkillByThread = { ...this.selectedSkillByThread, [id]: name };
      if (this.activeThreadId === id) this.selectedSkillName = name;
    },
    clearThreadSelection(threadId: string) {
      const id = normalizedThreadId(threadId);
      if (!id) return;
      const remaining = { ...this.selectedSkillByThread };
      delete remaining[id];
      this.selectedSkillByThread = remaining;
      if (this.activeThreadId === id) this.selectedSkillName = null;
    },
    composeExecutionMessage(userText: string): CapabilityExecutionMessage {
      const source = userText.trim();
      if (!source) throw capabilityError('INVALID_REQUEST', '请输入找矿研究问题。');
      if (!this.selectedSkillName) return { message: source, approvedTools: [] };
      if (!isProductSkill(this.selectedSkillName) || this.selectedModeUnavailableReason)
        throw capabilityError('TOOL_UNAVAILABLE', '当前版本不支持所选历史模式，请选择知识库问答。');
      return { message: `/knowledge-base\n${source}`, approvedTools: [] };
    },
    reset() {
      const version = this.requestVersion + 1;
      this.$reset();
      this.requestVersion = version;
    },
  },
});
