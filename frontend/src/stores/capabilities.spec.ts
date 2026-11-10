import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCapabilityCatalog } from '@/capabilities/capabilityClient';
import type { CapabilityCatalogResponse, CapabilitySkill } from '@/types/capabilities';
import { useCapabilityStore } from './capabilities';
vi.mock('@/capabilities/capabilityClient', () => ({ getCapabilityCatalog: vi.fn() }));
const skill = (name: string, available = true): CapabilitySkill => ({
  name,
  version: '1.0.0',
  description: name,
  activation: `/${name}`,
  available,
  availability_reason: available ? null : 'not_configured',
  required_roles: [],
  tool_names: ['search_knowledge_base'],
  approval_tools: [],
  network_policies: ['restricted'],
  resource_scopes: ['knowledge-read'],
});
const catalog = (): CapabilityCatalogResponse => ({
  schema_version: 1,
  catalog_hash: 'a'.repeat(64),
  skills: [
    skill('knowledge-base'),
    skill('web-research'),
    skill('sql-assistant'),
    skill('sandbox'),
  ],
  tools: [],
});
function expectRejection(action: () => void, code: string) {
  let failure: unknown;
  try {
    action();
  } catch (error) {
    failure = error;
  }
  expect(failure).toMatchObject({ code });
}
describe('mineral knowledge capability profile', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });
  it('projects only the knowledge skill even if the server enables other modules', async () => {
    vi.mocked(getCapabilityCatalog).mockResolvedValue(catalog());
    const store = useCapabilityStore();
    await store.fetchCatalog();
    expect(store.skills.map((s) => s.name)).toEqual(['knowledge-base']);
  });
  it('does not turn a server-unavailable knowledge skill into an available one', async () => {
    const value = catalog();
    value.skills[0] = skill('knowledge-base', false);
    vi.mocked(getCapabilityCatalog).mockResolvedValue(value);
    const store = useCapabilityStore();
    await store.fetchCatalog();
    expectRejection(() => store.selectSkill('knowledge-base'), 'TOOL_UNAVAILABLE');
  });
  it('rejects removed modes rather than silently routing them to another tool', async () => {
    vi.mocked(getCapabilityCatalog).mockResolvedValue(catalog());
    const store = useCapabilityStore();
    await store.fetchCatalog();
    for (const name of ['sandbox', 'web-research', 'sql-assistant'])
      expectRejection(() => store.selectSkill(name), 'TOOL_UNAVAILABLE');
  });
  it('composes a knowledge request without any approval grants', async () => {
    vi.mocked(getCapabilityCatalog).mockResolvedValue(catalog());
    const store = useCapabilityStore();
    await store.fetchCatalog();
    store.selectSkill('knowledge-base');
    expect(store.composeExecutionMessage('  蚀变分带  ')).toEqual({
      message: '/knowledge-base\n蚀变分带',
      approvedTools: [],
    });
  });
  it('keeps selections bound to their Thread and blocks unsupported restored modes', async () => {
    vi.mocked(getCapabilityCatalog).mockResolvedValue(catalog());
    const store = useCapabilityStore();
    await store.fetchCatalog();
    store.setActiveThread('thread-a');
    store.selectSkill('knowledge-base');
    store.setActiveThread('thread-b');
    expect(store.selectedSkillName).toBeNull();
    store.setActiveThread('thread-a');
    expect(store.selectedSkillName).toBe('knowledge-base');
    store.restoreThreadSkill('sandbox', 'thread-a');
    expectRejection(() => store.composeExecutionMessage('old task'), 'TOOL_UNAVAILABLE');
  });
  it('does not apply an in-flight old-account catalog after reset', async () => {
    let resolve!: (value: CapabilityCatalogResponse) => void;
    vi.mocked(getCapabilityCatalog).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    const store = useCapabilityStore();
    const request = store.fetchCatalog();
    store.reset();
    resolve(catalog());
    await request;
    expect(store.catalog).toBeNull();
    expect(store.loading).toBe(false);
  });
  it('preserves a retryable public catalog error and clears loading', async () => {
    vi.mocked(getCapabilityCatalog).mockRejectedValue({
      code: 'SERVICE_UNAVAILABLE',
      message: '目录暂不可用',
      retryable: true,
      category: 'capability',
    });
    const store = useCapabilityStore();
    await expect(store.fetchCatalog()).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    expect(store.error).toBe('目录暂不可用');
    expect(store.loading).toBe(false);
  });
});
