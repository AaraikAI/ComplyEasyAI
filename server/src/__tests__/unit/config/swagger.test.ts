import { describe, it, expect, jest } from '@jest/globals';

jest.mock('swagger-jsdoc', () => ({
  __esModule: true,
  default: jest.fn((options: any) => ({
    openapi: options.definition.openapi,
    info: options.definition.info,
    servers: options.definition.servers,
    components: options.definition.components,
    paths: {},
  })),
}));

describe('swagger config', () => {
  it('should export a valid OpenAPI document', async () => {
    const { default: swaggerDocument } = await import('../../../config/swagger');
    expect(swaggerDocument).toBeDefined();
  });

  it('should have OpenAPI 3.0.3 version', async () => {
    const { default: swaggerDocument } = await import('../../../config/swagger');
    expect(swaggerDocument.openapi).toBe('3.0.3');
  });

  it('should have info section with title', async () => {
    const { default: swaggerDocument } = await import('../../../config/swagger');
    expect(swaggerDocument.info).toBeDefined();
    expect(swaggerDocument.info.title).toContain('ComplyEasy');
  });

  it('should have servers defined', async () => {
    const { default: swaggerDocument } = await import('../../../config/swagger');
    expect(swaggerDocument.servers).toBeDefined();
  });

  it('should have security components', async () => {
    const { default: swaggerDocument } = await import('../../../config/swagger');
    expect(swaggerDocument.components).toBeDefined();
  });
});
