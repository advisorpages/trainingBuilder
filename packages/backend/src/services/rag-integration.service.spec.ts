import { ConfigService } from '@nestjs/config';
import { RagIntegrationService } from './rag-integration.service';

const createConfigService = (overrides: Record<string, any> = {}) => {
  const defaults = {
    RAG_API_URL: 'http://rag.example.com',
    RAG_TIMEOUT_MS: 100,
    RAG_RETRY_ATTEMPTS: 1,
    RAG_SIMILARITY_WEIGHT: 0.6,
    RAG_RECENCY_WEIGHT: 0.2,
    RAG_CATEGORY_WEIGHT: 0.2,
    RAG_SIMILARITY_THRESHOLD: 0.1,
  };

  const values = { ...defaults, ...overrides };

  return {
    get: (key: string, fallback?: any) => {
      const value = values[key];
      return value !== undefined ? value : fallback;
    },
  } as unknown as ConfigService;
};

describe('RagIntegrationService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ hits: [] }),
    } as Response);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('returns weighted results when RAG responds successfully', async () => {
    const config = createConfigService();
    const service = new RagIntegrationService(config);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        hits: [
          {
            doc_id: 'doc-1',
            snippet: 'Recent leadership insights',
            score: 0.8,
            created_at: new Date().toISOString(),
          },
          {
            doc_id: 'doc-2',
            snippet: 'Older content',
            score: 0.6,
            created_at: '2020-01-01T00:00:00.000Z',
          },
        ],
      }),
    } as Response);

    const results = await service.queryRAG({
      category: 'Leadership',
      desiredOutcome: 'Improve coaching',
    });

    expect(results).toHaveLength(2);
    expect(results[0].metadata.filename).toEqual('doc-1');
    expect(results[0].finalScore).toBeGreaterThan(results[1].finalScore);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/search'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('returns empty array when RAG is disabled', async () => {
    const config = createConfigService({ RAG_API_URL: '' });
    const service = new RagIntegrationService(config);

    const results = await service.queryRAG({
      category: 'Leadership',
      desiredOutcome: 'Improve coaching',
    });

    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('retries when configured and succeeds on second attempt', async () => {
    const config = createConfigService({ RAG_RETRY_ATTEMPTS: 1 });
    const service = new RagIntegrationService(config);

    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ hits: [] }),
      } as Response);

    const results = await service.queryRAGWithRetry({
      category: 'Leadership',
      desiredOutcome: 'Improve coaching',
    });

    expect(results).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns empty array when all retries fail', async () => {
    const config = createConfigService({ RAG_RETRY_ATTEMPTS: 2 });
    const service = new RagIntegrationService(config);

    (global.fetch as jest.Mock).mockRejectedValue(new Error('network failure'));

    const results = await service.queryRAGWithRetry({
      category: 'Leadership',
      desiredOutcome: 'Improve coaching',
    });

    expect(results).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('aborts request when timeout is reached', async () => {
    const config = createConfigService({ RAG_TIMEOUT_MS: 50, RAG_RETRY_ATTEMPTS: 0 });
    const service = new RagIntegrationService(config);

    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';

    (global.fetch as jest.Mock).mockImplementationOnce((_url: string, options: any) => {
      return new Promise((_, reject) => {
        options.signal.addEventListener('abort', () => reject(abortError));
      });
    });

    const resultsPromise = service.queryRAG({
      category: 'Leadership',
      desiredOutcome: 'Improve coaching',
    });

    jest.advanceTimersByTime(100);

    const results = await resultsPromise;
    expect(results).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
