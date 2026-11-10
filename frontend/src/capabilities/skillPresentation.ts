import type { CapabilitySkill } from '@/types/capabilities';

interface SkillPresentation {
  label: string;
  compactLabel: string;
  summary: string;
  icon: string;
}

const presentations: Record<string, SkillPresentation> = {
  'knowledge-base': {
    label: '知识库问答',
    compactLabel: '知识库',
    summary: '根据已上传文档和引用证据回答',
    icon: 'fa-regular fa-bookmark',
  },
};

const firstChineseIndex = (value: string) => value.search(/[\u3400-\u9fff]/u);

const shorten = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;

const chineseSummary = (description: string) => {
  const normalized = description.replace(/\s+/g, ' ').trim();
  const start = firstChineseIndex(normalized);
  if (start < 0) return '';
  const chinesePart = normalized.slice(start).replace(/^[，,、\s]+/u, '');
  return chinesePart.split(/[；;。.!?\n]/u)[0]?.trim() || '';
};

export const skillDisplayName = (name: string, description = '') => {
  const presentation = presentations[name];
  if (presentation) return presentation.label;
  const summary = chineseSummary(description);
  if (!summary) return '自定义能力';
  const firstClause = summary.split(/[，,、：:]/u)[0]?.trim() || summary;
  return shorten(firstClause, 10);
};

export const skillCompactName = (name: string, description = '') =>
  presentations[name]?.compactLabel || skillDisplayName(name, description);

export const skillDisplaySummary = (skill: Pick<CapabilitySkill, 'name' | 'description'>) =>
  presentations[skill.name]?.summary ||
  shorten(chineseSummary(skill.description), 32) ||
  '专用能力';

export const skillDisplayIcon = (name: string) =>
  presentations[name]?.icon || 'fa-solid fa-wand-magic-sparkles';
