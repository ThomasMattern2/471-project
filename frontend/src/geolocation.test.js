import { getMapCoordinates } from './geolocation';

describe('getMapCoordinates utility', () => {
  const originalGeolocation = global.navigator.geolocation;

  afterEach(() => {
    global.navigator.geolocation = originalGeolocation;
  });

  it('should return coordinates successfully when geolocation API succeeds', async () => {
    const mockPosition = {
      coords: { latitude: 51.0447, longitude: -114.0719 }
    };

    global.navigator.geolocation = {
      getCurrentPosition: jest.fn().mockImplementationOnce((success) => 
        Promise.resolve(success(mockPosition))
      )
    };

    const coordinates = await getMapCoordinates();
    
    expect(coordinates).toEqual({ lat: 51.0447, lng: -114.0719 });
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when the user denies location permissions', async () => {
    const mockError = new Error('User denied Geolocation');

    global.navigator.geolocation = {
      getCurrentPosition: jest.fn().mockImplementationOnce((success, error) => 
        Promise.resolve(error(mockError))
      )
    };

    await expect(getMapCoordinates()).rejects.toThrow('User denied Geolocation');
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});