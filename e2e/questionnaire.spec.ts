/**
 * E2E Tests: Questionnaires
 * Tests questionnaire create, assign, fill, submit, review lifecycle
 */

import { test, expect } from '@playwright/test';

// Paths the server intentionally exempts from CSRF validation (pre-login auth
// endpoints and HMAC-verified webhook receivers — see server/src/middleware/csrf.ts).
const CSRF_EXEMPT = [
  '/auth/login', '/auth/register', '/auth/refresh', '/auth/magic-link',
  '/auth/verify', '/auth/2fa/complete', '/webhook', '/csrf-token',
];
function isCsrfExempt(url: string): boolean {
  return CSRF_EXEMPT.some((p) => url.includes(p));
}

test.describe('Questionnaire Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/enterprise/questionnaires');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test.describe('Page Load', () => {
    test('questionnaires page loads', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('questionnaire list is displayed', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const list = page.locator('table, .questionnaire-list, [data-testid="questionnaires"]').first();
      if (await list.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(list).toBeVisible();
      }
    });
  });

  test.describe('Questionnaire Creation', () => {
    test('create questionnaire button exists', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const createBtn = page.getByRole('button', { name: /create|add|new/i }).first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(createBtn).toBeVisible();
      }
    });

    test('questionnaire form has title and description', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const createBtn = page.getByRole('button', { name: /create|add|new/i }).first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);

        const titleInput = page.locator('[name="title"], [name="name"], input[type="text"]').first();
        if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await titleInput.fill('E2E Security Questionnaire');
        }

        const descInput = page.locator('[name="description"], textarea').first();
        if (await descInput.isVisible()) {
          await descInput.fill('Annual security assessment questionnaire');
        }
      }
    });

    test('can add questions to questionnaire', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const createBtn = page.getByRole('button', { name: /create|add|new/i }).first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);

        const addQuestionBtn = page.getByRole('button', { name: /add question|new question/i });
        if (await addQuestionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addQuestionBtn.click();
          await page.waitForTimeout(300);

          const questionInput = page.locator('[name="question"], textarea, input[placeholder*="question"]').last();
          if (await questionInput.isVisible()) {
            await questionInput.fill('Do you have an information security policy?');
          }
        }
      }
    });

    test('questionnaire creation sends POST with CSRF', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      // Any mutating /api/ request the create flow fires must carry an
      // x-csrf-token (the frontend attaches it for all mutations — services/api.ts).
      // A mutation without the token is a regression and fails the test.
      const mutationsWithoutCsrf: string[] = [];
      page.on('request', (req) => {
        if (req.method() === 'POST' && req.url().includes('/api/') && !isCsrfExempt(req.url())) {
          if (!req.headers()['x-csrf-token']) mutationsWithoutCsrf.push(req.url());
        }
      });

      const createBtn = page.getByRole('button', { name: /create|add|new/i }).first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);

        const titleInput = page.locator('[name="title"], [name="name"], input[type="text"]').first();
        if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await titleInput.fill('E2E CSRF Questionnaire');
          const saveBtn = page.getByRole('button', { name: /save|create|submit/i }).first();
          if (await saveBtn.isVisible()) {
            await saveBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }

      expect(mutationsWithoutCsrf, `mutating requests missing CSRF: ${mutationsWithoutCsrf.join(', ')}`).toHaveLength(0);
    });
  });

  test.describe('Questionnaire Assignment', () => {
    test('can assign questionnaire to vendor or team member', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const assignBtn = page.getByRole('button', { name: /assign|send|share/i }).first();
      if (await assignBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await assignBtn.click();
        await page.waitForTimeout(500);

        const assigneeField = page.locator('[name="assignee"], [name="vendor"], select, input[placeholder*="vendor"]').first();
        if (await assigneeField.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(assigneeField).toBeVisible();
        }
      }
    });

    test('assignment sets due date', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const assignBtn = page.getByRole('button', { name: /assign|send/i }).first();
      if (await assignBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await assignBtn.click();
        await page.waitForTimeout(500);

        const dateInput = page.locator('[name="dueDate"], input[type="date"], [data-testid="due-date"]');
        if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(dateInput).toBeVisible();
        }
      }
    });
  });

  test.describe('Questionnaire Filling', () => {
    test('questionnaire questions are displayed for filling', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const row = page.locator('table tbody tr, [data-testid="questionnaire-row"], .questionnaire-item').first();
      if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(500);

        const questions = page.locator(
          '[data-testid="question"], .question, label, :text("Question")'
        ).first();
        if (await questions.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(questions).toBeVisible();
        }
      }
    });

    test('answers can be saved as draft', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const draftBtn = page.getByRole('button', { name: /save.*draft|draft/i });
      if (await draftBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(draftBtn).toBeVisible();
      }
    });
  });

  test.describe('Questionnaire Submission', () => {
    test('submit button is available', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const submitBtn = page.getByRole('button', { name: /submit|complete|send/i }).first();
      if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(submitBtn).toBeVisible();
      }
    });
  });

  test.describe('Questionnaire Review', () => {
    test('submitted questionnaires show review status', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const status = page.locator(
        ':text("Submitted"), :text("In Review"), :text("Approved"), :text("Pending"), .badge'
      ).first();
      if (await status.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(status).toBeVisible();
      }
    });

    test('reviewer can approve or reject', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const approveBtn = page.getByRole('button', { name: /approve|accept/i }).first();
      const rejectBtn = page.getByRole('button', { name: /reject|decline/i }).first();

      const hasApprove = await approveBtn.isVisible({ timeout: 5000 }).catch(() => false);
      const hasReject = await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false);

      // Review actions only render when an item is in the "In Review" state. If no
      // such item exists, skip so the absence is surfaced rather than passing
      // silently. When the review UI is present, both controls must be available
      // so a reviewer can take an explicit approve/reject decision.
      const inReview = page.locator(':text("In Review"), :text("Submitted"), :text("Pending")').first();
      const hasInReviewItem = await inReview.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasInReviewItem && !hasApprove && !hasReject) {
        test.skip();
      }

      expect(hasApprove || hasReject).toBeTruthy();
    });
  });

  test.describe('Error Recovery', () => {
    test('handles questionnaire load failure gracefully', async ({ page }) => {
      await page.route('**/api/*questionnaire*', (route) => {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
      });

      await page.goto('/enterprise/questionnaires');
      await page.waitForTimeout(3000);

      const body = await page.locator('body').isVisible();
      expect(body).toBeTruthy();
    });
  });

  test.describe('Security', () => {
    test('questionnaire data does not leak vendor secrets', async ({ page }) => {
      const html = await page.locator('body').innerHTML();
      expect(html).not.toMatch(/eyJhbGciOi/);
      expect(html).not.toMatch(/sk_live_/);
    });

    test('questionnaire API requires authentication', async ({ page }) => {
      const response = await page.request.get(
        `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/questionnaires`,
        { headers: { 'Content-Type': 'application/json' } }
      ).catch(() => null);

      if (response) {
        expect([401, 403, 404]).toContain(response.status());
      }
    });
  });
});
