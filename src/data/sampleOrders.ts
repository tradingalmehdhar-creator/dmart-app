import { Order } from '../types';
import { products } from './products';

// Helper to look up product by ID safely
const getProduct = (id: string) => {
  return products.find((p) => p.id === id) || products[0];
};

export const INITIAL_PAST_ORDERS: Order[] = [
  {
    id: 'ord-hist-1',
    orderNumber: 'DMART-782419',
    createdAt: '2026-09-12T14:22:00.000Z',
    items: [
      { product: getProduct('fp-veg-1'), quantity: 2 },
      { product: getProduct('fp-frt-1'), quantity: 1 },
      { product: getProduct('meat-1'), quantity: 1 },
    ],
    subtotal: 29.70,
    discount: 5.00,
    deliveryFee: 0,
    tip: 2.00,
    total: 26.70,
    deliveryAddress: {
      recipientName: 'Ahmad Faiz',
      phone: '012-3456789',
      street: 'Jalan Telawi 3, Bangsar Baru',
      buildingUnit: 'No. 28',
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan Kuala Lumpur',
      postcode: '59100',
      formattedAddress: 'No. 28, Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur',
      notes: 'Leave on porch shoe cabinet',
      coordinates: { lat: 3.1319, lng: 101.6705 }
    },
    deliverySlot: 'Super Express (Within 2 Hours)',
    deliverySlotMs: 'Super Ekspres (Dalam 2 Jam)',
    paymentMethod: 'TNG',
    paymentDetails: {
      tngRef: 'TNG-89240182'
    },
    status: 'delivered',
    estimatedDeliveryTime: 'Delivered at 3:15 PM',
    customerFeedback: [
      {
        id: 'fb-sample-1',
        rating: 5,
        comment: 'Super fast delivery and the vegetables were so crisp and fresh! Great rider too.',
        createdAt: '2026-09-12T15:30:00.000Z'
      }
    ],
    review: {
      rating: 5,
      comment: 'Super fast delivery and the vegetables were so crisp and fresh! Great rider too.',
      tags: ['⚡ Super Fast Delivery', '🥦 Fresh & Good Quality', '😊 Friendly Rider'],
      submittedAt: '2026-09-12T15:30:00.000Z'
    }
  },
  {
    id: 'ord-hist-2',
    orderNumber: 'DMART-563198',
    createdAt: '2026-09-08T10:15:00.000Z',
    items: [
      { product: getProduct('fp-frt-5'), quantity: 1 },
      { product: getProduct('fp-veg-2'), quantity: 3 },
      { product: getProduct('fp-veg-3'), quantity: 2 },
    ],
    subtotal: 30.70,
    discount: 0,
    deliveryFee: 4.00,
    total: 34.70,
    deliveryAddress: {
      recipientName: 'Ahmad Faiz',
      phone: '012-3456789',
      street: 'Jalan Telawi 3, Bangsar Baru',
      buildingUnit: 'No. 28',
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan Kuala Lumpur',
      postcode: '59100',
      formattedAddress: 'No. 28, Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur',
      notes: 'Ring bell upon arrival',
      coordinates: { lat: 3.1319, lng: 101.6705 }
    },
    deliverySlot: 'Today Evening (5:00 PM - 8:00 PM)',
    deliverySlotMs: 'Petang Ini (5:00 PM - 8:00 PM)',
    paymentMethod: 'FPX',
    paymentDetails: {
      bankName: 'Maybank2u'
    },
    status: 'delivered',
    estimatedDeliveryTime: 'Delivered at 6:40 PM',
    customerFeedback: [
      {
        id: 'fb-sample-2',
        rating: 5,
        comment: 'Watermelon was very sweet and perfectly cold. Will reorder again.',
        createdAt: '2026-09-08T19:00:00.000Z'
      }
    ],
    review: {
      rating: 5,
      comment: 'Watermelon was very sweet and perfectly cold. Will reorder again.',
      tags: ['🥦 Fresh & Good Quality', '📦 Neat & Careful Packaging'],
      submittedAt: '2026-09-08T19:00:00.000Z'
    }
  }
];
