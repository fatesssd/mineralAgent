import { expect, test, type Page } from '@playwright/test';

async function mineralShell(page: Page, role: 'user' | 'admin' = 'admin') {
  await page.route('**/auth/refresh', (route) =>
    route.fulfill({ json: { access_token: 'mineral-demo-token', username: '地质研究员', role } })
  );
  await page.route('**/v1/threads', (route) => route.fulfill({ json: { threads: [] } }));
  await page.route('**/v1/capabilities', (route) =>
    route.fulfill({
      json: {
        schema_version: 1,
        catalog_hash: 'a'.repeat(64),
        tools: [],
        skills: ['knowledge-base', 'web-research', 'sql-assistant', 'sandbox'].map((name) => ({
          name,
          version: '1.0.0',
          description: name,
          activation: `/${name}`,
          available: true,
          availability_reason: null,
          required_roles: [],
          tool_names: [],
          approval_tools: [],
          network_policies: ['restricted'],
          resource_scopes: [],
        })),
      },
    })
  );
}

test('keeps the approved mineral navigation and does not request removed control-plane modules', async ({
  page,
}) => {
  const unexpected: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/v1/capabilities/control-plane')) unexpected.push(request.url());
  });
  await mineralShell(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /让每一次找矿判断/ })).toBeVisible();
  for (const name of ['找矿问答', '历史对话', '地质资料库', '模型中心', 'RAG 评估'])
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  for (const name of ['能力中心', 'Skill 与 Tool 管理', '网页调研', '数据分析', '代码沙盒'])
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  await expect(page.getByText('地质知识库问答', { exact: true })).toBeVisible();
  expect(unexpected).toEqual([]);
});

test('fills a geological starter without silently submitting a model request', async ({ page }) => {
  let requests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/runs/stream')) requests++;
  });
  await mineralShell(page, 'user');
  await page.goto('/');
  await page.getByRole('button', { name: /梳理斑岩铜矿的蚀变分带/ }).click();
  await expect(page.getByPlaceholder(/输入矿床、蚀变或勘查问题/)).toHaveValue(/斑岩型铜矿/);
  expect(requests).toBe(0);
  await expect(page.getByRole('button', { name: '地质资料库', exact: true })).toHaveCount(0);
});

test('uploads a private document through a durable job and explains the sharing boundary', async ({
  page,
}) => {
  await mineralShell(page);
  let uploaded = false;
  await page.route('**/documents', (route) =>
    route.fulfill({
      json: {
        documents: uploaded
          ? [
              {
                filename: '地质学习样本.pdf',
                file_type: 'PDF',
                chunk_count: 12,
                status: 'published',
                version_number: 1,
              },
            ]
          : [],
      },
    })
  );
  await page.route('**/documents/upload/jobs', (route) => route.fulfill({ json: [] }));
  await page.route('**/documents/delete/jobs', (route) => route.fulfill({ json: [] }));
  await page.route('**/documents/upload/async', async (route) => {
    expect(route.request().headers()['content-type']).toContain('multipart/form-data');
    expect(route.request().headers().authorization).toBe('Bearer mineral-demo-token');
    uploaded = true;
    await route.fulfill({
      status: 202,
      json: { job_id: 'job-private-demo', message: '已提交索引任务' },
    });
  });
  await page.route('**/documents/upload/jobs/job-private-demo', (route) =>
    route.fulfill({
      json: {
        job_id: 'job-private-demo',
        filename: '地质学习样本.pdf',
        status: 'completed',
        message: '索引构建完成',
        steps: [
          {
            key: 'parse',
            label: '解析与版本化分块',
            status: 'completed',
            percent: 100,
            message: '完成',
          },
        ],
      },
    })
  );
  await page.goto('/');
  await page.getByRole('button', { name: '地质资料库', exact: true }).click();
  await expect(page.getByRole('heading', { name: '添加你的私有地质知识' })).toBeVisible();
  await expect(page.getByText(/当前资料库由本部署的授权账号共享/)).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({
    name: '地质学习样本.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 mock document for browser UI test'),
  });
  await page.getByRole('button', { name: '开始上传' }).click();
  await expect(page.getByText('索引构建完成', { exact: true })).toBeVisible();
  await expect(page.locator('.document-name', { hasText: '地质学习样本.pdf' })).toBeVisible();
});

test('renders the mineral workspace on desktop and mobile without horizontal overflow', async ({
  page,
}) => {
  await mineralShell(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /让每一次找矿判断/ })).toBeVisible();
  await page.screenshot({
    path: 'test-results/mineral-desktop.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole('heading', { name: /让每一次找矿判断/ })).toBeVisible();
  await expect(page.getByPlaceholder(/输入矿床、蚀变或勘查问题/)).toBeVisible();
  for (const name of ['找矿问答', '历史对话', '地质资料库', '模型中心', 'RAG 评估'])
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  expect(
    await page.locator('textarea').evaluate((el) => el.getBoundingClientRect().width)
  ).toBeGreaterThan(180);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.screenshot({
    path: 'test-results/mineral-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
});
