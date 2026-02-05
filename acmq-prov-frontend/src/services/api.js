// API service for Artemis MQ Provisioning Portal
// Uses mock data for development, real API calls in production

const USE_MOCK = false; // Set to false to use real backend API

// Mock data for development
const mockUsers = [
  {
    id: 'user-1',
    name: 'order-service',
    description: 'Order processing microservice',
    team: 'Team Commerce',
    createdAt: '2024-01-15',
    roles: {
      producer: [
        { type: 'queue', name: 'order.created.queue', environment: 'prod' },
        { type: 'queue', name: 'order.updated.queue', environment: 'prod' },
        { type: 'topic', name: 'order.events', environment: 'prod' }
      ],
      consumer: [
        { type: 'queue', name: 'payment.completed.queue', environment: 'prod' }
      ],
      subscriber: [
        { type: 'topic', name: 'inventory.updates', environment: 'prod' }
      ]
    }
  },
  {
    id: 'user-2',
    name: 'payment-service',
    description: 'Payment processing service',
    team: 'Team Payments',
    createdAt: '2024-01-10',
    roles: {
      producer: [
        { type: 'queue', name: 'payment.completed.queue', environment: 'prod' },
        { type: 'topic', name: 'payment.events', environment: 'prod' }
      ],
      consumer: [
        { type: 'queue', name: 'order.created.queue', environment: 'prod' }
      ],
      subscriber: []
    }
  },
  {
    id: 'user-3',
    name: 'inventory-service',
    description: 'Inventory management service',
    team: 'Team Logistics',
    createdAt: '2024-02-01',
    roles: {
      producer: [
        { type: 'topic', name: 'inventory.updates', environment: 'prod' }
      ],
      consumer: [],
      subscriber: [
        { type: 'topic', name: 'order.events', environment: 'prod' }
      ]
    }
  },
  {
    id: 'user-4',
    name: 'notification-service',
    description: 'Email and push notification service',
    team: 'Team Platform',
    createdAt: '2024-02-15',
    roles: {
      producer: [],
      consumer: [],
      subscriber: [
        { type: 'topic', name: 'order.events', environment: 'prod' },
        { type: 'topic', name: 'payment.events', environment: 'prod' }
      ]
    }
  },
  {
    id: 'user-5',
    name: 'analytics-service',
    description: 'Business analytics and reporting',
    team: 'Team BI',
    createdAt: '2024-03-01',
    roles: {
      producer: [],
      consumer: [
        { type: 'queue', name: 'analytics.events.queue', environment: 'prod' }
      ],
      subscriber: [
        { type: 'topic', name: 'order.events', environment: 'prod' },
        { type: 'topic', name: 'payment.events', environment: 'prod' },
        { type: 'topic', name: 'inventory.updates', environment: 'prod' }
      ]
    }
  }
];

const mockQueues = [
  {
    id: 'queue-1',
    name: 'order.created.queue',
    environment: 'prod',
    description: 'Queue for new order events',
    team: 'Team Commerce',
    createdAt: '2024-01-15',
    consumers: ['payment-service'],
    producers: ['order-service']
  },
  {
    id: 'queue-2',
    name: 'order.updated.queue',
    environment: 'prod',
    description: 'Queue for order update events',
    team: 'Team Commerce',
    createdAt: '2024-01-15',
    consumers: [],
    producers: ['order-service']
  },
  {
    id: 'queue-3',
    name: 'payment.completed.queue',
    environment: 'prod',
    description: 'Queue for completed payment notifications',
    team: 'Team Payments',
    createdAt: '2024-01-10',
    consumers: ['order-service'],
    producers: ['payment-service']
  },
  {
    id: 'queue-4',
    name: 'analytics.events.queue',
    environment: 'prod',
    description: 'Queue for analytics event processing',
    team: 'Team BI',
    createdAt: '2024-03-01',
    consumers: ['analytics-service'],
    producers: []
  }
];

const mockTopics = [
  {
    id: 'topic-1',
    name: 'order.events',
    environment: 'prod',
    description: 'Topic for all order-related events',
    team: 'Team Commerce',
    createdAt: '2024-01-15',
    subscribers: ['inventory-service', 'notification-service', 'analytics-service'],
    producers: ['order-service']
  },
  {
    id: 'topic-2',
    name: 'payment.events',
    environment: 'prod',
    description: 'Topic for payment event broadcasting',
    team: 'Team Payments',
    createdAt: '2024-01-10',
    subscribers: ['notification-service', 'analytics-service'],
    producers: ['payment-service']
  },
  {
    id: 'topic-3',
    name: 'inventory.updates',
    environment: 'prod',
    description: 'Topic for inventory level changes',
    team: 'Team Logistics',
    createdAt: '2024-02-01',
    subscribers: ['order-service', 'analytics-service'],
    producers: ['inventory-service']
  }
];

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API Functions
export const api = {
  // Users
  async getUsers() {
    if (USE_MOCK) {
      await delay(300);
      return mockUsers.map(u => ({ id: u.id, name: u.name, team: u.team, description: u.description }));
    }
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async getUserById(userId) {
    if (USE_MOCK) {
      await delay(200);
      const user = mockUsers.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      return user;
    }
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  // Queues
  async getQueues() {
    if (USE_MOCK) {
      await delay(300);
      return mockQueues.map(q => ({
        id: q.id,
        name: q.name,
        environment: q.environment,
        team: q.team,
        description: q.description
      }));
    }
    const response = await fetch('/api/queues');
    if (!response.ok) throw new Error('Failed to fetch queues');
    return response.json();
  },

  async getQueueById(queueId) {
    if (USE_MOCK) {
      await delay(200);
      const queue = mockQueues.find(q => q.id === queueId);
      if (!queue) throw new Error('Queue not found');
      return queue;
    }
    const response = await fetch(`/api/queues/${queueId}`);
    if (!response.ok) throw new Error('Failed to fetch queue');
    return response.json();
  },

  // Topics
  async getTopics() {
    if (USE_MOCK) {
      await delay(300);
      return mockTopics.map(t => ({
        id: t.id,
        name: t.name,
        environment: t.environment,
        team: t.team,
        description: t.description
      }));
    }
    const response = await fetch('/api/topics');
    if (!response.ok) throw new Error('Failed to fetch topics');
    return response.json();
  },

  async getTopicById(topicId) {
    if (USE_MOCK) {
      await delay(200);
      const topic = mockTopics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');
      return topic;
    }
    const response = await fetch(`/api/topics/${topicId}`);
    if (!response.ok) throw new Error('Failed to fetch topic');
    return response.json();
  },

  // Provisioning / Orders
  async createProvisioningOrder(orderData) {
    if (USE_MOCK) {
      await delay(500);
      // Simulate successful order creation
      return {
        ok: true,
        requestId: `REQ-${Date.now()}`,
        pullRequests: ['https://github.com/example/mq-config/pull/123'],
        message: 'Order created successfully'
      };
    }
    const response = await fetch('/api/mq/provision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    const result = await response.json();
    return { ok: response.ok, ...result };
  },

  async createUserOrder(userData) {
    if (USE_MOCK) {
      await delay(500);
      return {
        ok: true,
        requestId: `USER-${Date.now()}`,
        pullRequests: ['https://github.com/example/mq-config/pull/124'],
        message: 'User creation order submitted successfully'
      };
    }
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    const result = await response.json();
    return { ok: response.ok, ...result };
  }
};

export default api;
