import { format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call';
  description: string;
  location?: string;
  attendees?: string;
  contactPhone?: string;
  contactEmail?: string;
  propertyDetails?: string;
  notes?: string;
  enableReminder?: boolean;
}

export interface Property {
  id: string;
  propertyName: string;
  propertyType: 'house' | 'apartment' | 'condo' | 'land' | 'commercial';
  address: string;
  price: string;
  squareFootage: string;
  bedrooms: string;
  bathrooms: string;
  yearBuilt: string;
  description: string;
  features: string;
  status: 'available' | 'pending' | 'sold';
  mainImage?: string;
  images: string[];
  image360: string[];
  isFavorite?: boolean;
}

export interface SearchResult {
  type: "property" | "event" | "favorite";
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

export class DataService {
  private static instance: DataService;
  private initialized: boolean = false;
  private subscribers: { [key: string]: Function[] } = {};

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeDefaultData();
    }
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private initializeDefaultData(): void {
    if (this.initialized) return;
    
    try {
      if (typeof window === 'undefined') return;

      try {
        const events = this.getEvents();
        if (!events || events.length === 0) {
          this.setEvents([]);
        }
      } catch (error) {
        console.error('Error initializing events:', error);
      }

      try {
        const properties = this.getProperties();
        if (!properties || properties.length === 0) {
          this.setProperties([]);
        }
      } catch (error) {
        console.error('Error initializing properties:', error);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error in initializeDefaultData:', error);
    }
  }

  // Event Methods
  public getEvents(): any[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('events') || '[]');
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  public setEvents(events: any[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('events', JSON.stringify(events));
      this.notifySubscribers('events');
    } catch (error) {
      console.error('Error setting events:', error);
    }
  }

  public addEvent(event: CalendarEvent) {
    const events = this.getEvents();
    events.push(event);
    this.setEvents(events);
  }

  // Property Methods
  public getProperties(): any[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('properties') || '[]');
    } catch (error) {
      console.error('Error getting properties:', error);
      return [];
    }
  }

  public setProperties(properties: any[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('properties', JSON.stringify(properties));
      this.notifySubscribers('properties');
    } catch (error) {
      console.error('Error setting properties:', error);
    }
  }

  public addProperty(property: Property) {
    const properties = this.getProperties();
    properties.push(property);
    this.setProperties(properties);
  }

  public getProperty(id: string): Property | undefined {
    const properties = this.getProperties();
    return properties.find(p => p.id === id);
  }

  public updateProperty(id: string, updatedProperty: Property) {
    const properties = this.getProperties();
    const index = properties.findIndex(p => p.id === id);
    if (index !== -1) {
      properties[index] = updatedProperty;
      this.setProperties(properties);
    }
  }

  public deleteProperty(id: string) {
    const properties = this.getProperties();
    this.setProperties(properties.filter(p => p.id !== id));
  }

  // Favorite Methods
  public getFavorites(): Property[] {
    try {
      const favorites = localStorage.getItem('favorites');
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  public setFavorites(favorites: Property[]) {
    try {
      localStorage.setItem('favorites', JSON.stringify(favorites));
      this.notifySubscribers('favorites');
    } catch (error) {
      console.error('Error setting favorites:', error);
    }
  }

  public addFavorite(property: Property) {
    const favorites = this.getFavorites();
    if (!favorites.find(f => f.id === property.id)) {
      favorites.push(property);
      this.setFavorites(favorites);
    }
  }

  public removeFavorite(propertyId: string) {
    const favorites = this.getFavorites();
    this.setFavorites(favorites.filter(f => f.id !== propertyId));
  }

  // Search Methods
  public search(query: string): SearchResult[] {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    // Search events
    const events = this.getEvents();
    events.forEach(event => {
      if (
        event.title?.toLowerCase().includes(queryLower) ||
        event.description?.toLowerCase().includes(queryLower)
      ) {
        results.push({
          type: 'event',
          id: event.id,
          title: event.title,
          subtitle: `${event.type} - ${format(event.date, 'MMM d, yyyy')} ${event.time}`,
          link: `/calendar`,
        });
      }
    });

    // Search properties
    const properties = this.getProperties();
    properties.forEach(property => {
      if (
        property.propertyName?.toLowerCase().includes(queryLower) ||
        property.address?.toLowerCase().includes(queryLower) ||
        property.description?.toLowerCase().includes(queryLower)
      ) {
        results.push({
          type: 'property',
          id: property.id,
          title: property.propertyName || property.address,
          subtitle: `${property.propertyType} - ${property.price}`,
          link: `/inventory/${property.id}`,
        });
      }
    });

    // Search favorites
    const favorites = this.getFavorites();
    favorites.forEach(favorite => {
      if (
        favorite.propertyName?.toLowerCase().includes(queryLower) ||
        favorite.address?.toLowerCase().includes(queryLower)
      ) {
        results.push({
          type: 'favorite',
          id: favorite.id,
          title: favorite.propertyName || favorite.address,
          subtitle: `${favorite.propertyType} - ${favorite.price}`,
          link: `/inventory/${favorite.id}`,
        });
      }
    });

    return results;
  }

  // Subscribe to data changes
  public subscribe(dataType: 'events' | 'properties' | 'favorites', callback: Function) {
    if (!this.subscribers[dataType]) {
      this.subscribers[dataType] = [];
    }
    this.subscribers[dataType].push(callback);
  }

  public unsubscribe(dataType: 'events' | 'properties' | 'favorites', callback: Function) {
    if (this.subscribers[dataType]) {
      this.subscribers[dataType] = this.subscribers[dataType].filter(cb => cb !== callback);
    }
  }

  private notifySubscribers(dataType: string) {
    if (this.subscribers[dataType]) {
      this.subscribers[dataType].forEach(callback => callback());
    }
  }
}

export const dataService = DataService.getInstance(); 