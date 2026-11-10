import { describe, expect, it } from 'vitest';
import {
  skillCompactName,
  skillDisplayIcon,
  skillDisplayName,
  skillDisplaySummary,
} from './skillPresentation';

describe('skill presentation', () => {
  it('uses concise Chinese copy for registered skills', () => {
    expect(skillDisplayName('knowledge-base')).toBe('知识库问答');
    expect(skillCompactName('knowledge-base')).toBe('知识库');
    expect(skillDisplaySummary({ name: 'knowledge-base', description: 'Search documents.' })).toBe(
      '根据已上传文档和引用证据回答'
    );
    expect(skillDisplayIcon('knowledge-base')).toBe('fa-regular fa-bookmark');
  });

  it('extracts the Chinese portion of custom skill metadata', () => {
    const skill = {
      name: 'city-guide',
      description: 'Find useful city information，查询城市交通、景点与开放时间；不确定时说明。',
    };

    expect(skillDisplayName(skill.name, skill.description)).toBe('查询城市交通');
    expect(skillDisplaySummary(skill)).toBe('查询城市交通、景点与开放时间');
  });

  it('does not expose an English-only custom description to users', () => {
    const skill = { name: 'internal-helper', description: 'Run an internal workflow.' };

    expect(skillDisplayName(skill.name, skill.description)).toBe('自定义能力');
    expect(skillDisplaySummary(skill)).toBe('专用能力');
  });
});
