export const PRODUCT = {
  name: '智能找矿助手',
  englishName: 'MineralAgent',
  workspace: '找矿知识工作台',
  tagline: '让每一次找矿判断，都有据可循。',
  description: '连接地质资料、检索原始证据，辅助整理找矿思路。',
} as const;

export const GEO_STARTERS = [
  {
    icon: 'fa-solid fa-mountain',
    category: '矿床与成矿',
    title: '梳理斑岩铜矿的蚀变分带',
    prompt: '请根据资料库，梳理斑岩型铜矿的常见蚀变分带、矿化特征及对应找矿标志，并引用原文。',
  },
  {
    icon: 'fa-solid fa-satellite',
    category: '遥感解译知识',
    title: '理解蚀变异常的核查线索',
    prompt:
      '根据已上传资料，遥感蚀变异常可以提供哪些找矿线索？有哪些干扰因素需要地面核查？请标明证据。',
  },
  {
    icon: 'fa-solid fa-layer-group',
    category: '资料对比',
    title: '比较不同矿床的找矿标志',
    prompt:
      '根据资料库，对比矽卡岩型和斑岩型铜矿的地质背景、蚀变特征与找矿标志；资料不足的部分请明确说明。',
  },
] as const;

export function isProductSkill(name: string): boolean {
  return name === 'knowledge-base';
}
