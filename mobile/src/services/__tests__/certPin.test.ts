/**
 * Certificate-pin configuration guard.
 *
 * The pin map is keyed by the configured API host, and the production
 * fail-closed behaviour is tied to EXPO_PUBLIC_CERT_PIN_ENFORCE rather than to
 * NODE_ENV, because without the native pinning layer the pins are inert and a
 * throw would only make every request fail.
 */
const ORIGINAL_ENV = { ...process.env };

function loadApiWith(env: Record<string, string | undefined>) {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...env };
  return require('../api') as typeof import('../api');
}

function okJson(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe('certificate pin guard', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  it('lets requests through when enforcement is off and no pins are configured', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okJson({ data: { risks: [] } }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const { api } = loadApiWith({
      EXPO_PUBLIC_API_URL: 'https://www.complyeasyai.com',
      EXPO_PUBLIC_CERT_PIN_ENFORCE: undefined,
      EXPO_PUBLIC_CERT_PIN_PRIMARY: undefined,
      EXPO_PUBLIC_CERT_PIN_BACKUP: undefined,
    });
    await expect(api.risks.list()).resolves.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('https://www.complyeasyai.com/api/v2/');
  });

  it('fails closed when enforcement is on but no valid pins exist', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okJson({ data: { risks: [] } }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const { api } = loadApiWith({
      EXPO_PUBLIC_API_URL: 'https://www.complyeasyai.com',
      EXPO_PUBLIC_CERT_PIN_ENFORCE: 'true',
      EXPO_PUBLIC_CERT_PIN_PRIMARY: 'not-a-valid-pin',
      EXPO_PUBLIC_CERT_PIN_BACKUP: undefined,
    });
    await expect(api.risks.list()).rejects.toThrow(/enforcement is on/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts well-formed pins when enforcement is on', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okJson({ data: { risks: [] } }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const { api } = loadApiWith({
      EXPO_PUBLIC_API_URL: 'https://www.complyeasyai.com',
      EXPO_PUBLIC_CERT_PIN_ENFORCE: 'true',
      EXPO_PUBLIC_CERT_PIN_PRIMARY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      EXPO_PUBLIC_CERT_PIN_BACKUP: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
    });
    await expect(api.risks.list()).resolves.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
