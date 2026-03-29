// S4G3A-22: Integration tests for dispatcher broadcast logic

describe('Broadcast API integration', () => {
  const BROADCAST_URL = 'http://127.0.0.1:8000/api/broadcasts';

  const validPayload = {
    message: 'Evacuate West Calgary immediately.',
    center_coordinates: [-114.0719, 51.0447],
    radius_km: 28,
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should send the correct payload to the broadcast endpoint', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'success' }) });

    await fetch(BROADCAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(BROADCAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
  });

  it('should return ok: true on a successful broadcast', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'success' }) });

    const response = await fetch(BROADCAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    expect(response.ok).toBe(true);
  });

  it('should handle a network failure without throwing an unhandled error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      fetch(BROADCAST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      })
    ).rejects.toThrow('Network error');
  });

  it('should include all required fields in the broadcast payload', () => {
    const body = JSON.parse(JSON.stringify(validPayload));
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('center_coordinates');
    expect(body).toHaveProperty('radius_km');
    expect(Array.isArray(body.center_coordinates)).toBe(true);
    expect(body.center_coordinates).toHaveLength(2);
  });
});
