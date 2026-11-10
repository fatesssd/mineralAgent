import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/utils/api';
import { getCapabilityCatalog } from './capabilityClient';
vi.mock('@/utils/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/api')>();
  return { ...actual, default: { get: vi.fn() } };
});
describe('knowledge capability catalog client', () => {
  beforeEach(() => vi.resetAllMocks());
  it('reads the canonical capability catalog', async () => {
    const value = { schema_version: 1, catalog_hash: 'a'.repeat(64), skills: [], tools: [] };
    vi.mocked(api.get).mockResolvedValue({ data: value });
    expect(await getCapabilityCatalog()).toEqual(value);
    expect(api.get).toHaveBeenCalledWith('/v1/capabilities');
  });
  it('preserves a safe typed error', async () => {
    vi.mocked(api.get).mockRejectedValue({
      code: 'SERVICE_UNAVAILABLE',
      message: '目录暂不可用',
      retryable: true,
      category: 'capability',
    });
    await expect(getCapabilityCatalog()).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      message: '目录暂不可用',
    });
  });
});
