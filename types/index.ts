export interface Shop {
  id: number;
  name: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  distance: number;
  address: string;
  image: string;
  services: string[];
  hours: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}

export interface Service {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  shopId: number;
  shopName: string;
  shopImage: string;
  status: string;
  date: string;
  time: string;
  services: Service[];
  total: number;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'shop';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}