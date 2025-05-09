 
export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
};

export type LocationError = {
  code: string;
  message: string;
};

class LocationService {
  private static instance: LocationService;
  private watchId: Location.LocationSubscription | null = null;
  private lastKnownLocation: LocationData | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.lastKnownLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
        heading: location.coords.heading,
      };

      return this.lastKnownLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startLocationUpdates(
    callback: (location: LocationData) => void,
    options: {
      accuracy?: Location.Accuracy;
      timeInterval?: number;
      distanceInterval?: number;
    } = {}
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: options.accuracy || Location.Accuracy.Balanced,
          timeInterval: options.timeInterval || 5000,
          distanceInterval: options.distanceInterval || 10,
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            speed: location.coords.speed,
            heading: location.coords.heading,
          };
          this.lastKnownLocation = locationData;
          callback(locationData);
        }
      );
    } catch (error) {
      console.error('Error starting location updates:', error);
    }
  }

  stopLocationUpdates(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        return [
          address.street,
          address.city,
          address.region,
          address.postalCode,
          address.country,
        ]
          .filter(Boolean)
          .join(', ');
      }
      return null;
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return null;
    }
  }

  async getCoordinatesFromAddress(address: string): Promise<LocationData | null> {
    try {
      const locations = await Location.geocodeAsync(address);
      if (locations.length > 0) {
        return {
          latitude: locations[0].latitude,
          longitude: locations[0].longitude,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates from address:', error);
      return null;
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

export const locationService = LocationService.getInstance(); 
import * as Location from 'expo-location';
 