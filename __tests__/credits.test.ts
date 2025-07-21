import { NextRequest } from 'next/server';

// Mock the modules first
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../src/lib/database', () => ({
  getUserByEmail: jest.fn(),
  getUserCredits: jest.fn(),
  executeQuerySimple: jest.fn(),
}));

// Import after mocking
import { getServerSession } from 'next-auth';
import { getUserByEmail, getUserCredits, executeQuerySimple } from '../src/lib/database';
import { GET, POST } from '../src/app/api/credits/route';

// Get the mocked functions
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
const mockGetUserCredits = getUserCredits as jest.MockedFunction<typeof getUserCredits>;
const mockExecuteQuerySimple = executeQuerySimple as jest.MockedFunction<typeof executeQuerySimple>;

describe('Credits API Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Tests', () => {
    test('GET - should reject null session', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/credits');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    test('POST - should reject null session', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/credits', { method: 'POST' });
      const response = await POST(request);
      
      expect(response.status).toBe(401);
    });

    test('should reject session without email', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {}
      });
      
      const request = new NextRequest('http://localhost/api/credits');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });
  });

  describe('User Validation Tests', () => {
    test('should return 404 for non-existent user', async () => {
      mockGetServerSession.mockResolvedValue({ 
        user: { email: 'test@example.com' } 
      });
      mockGetUserByEmail.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/credits');
      const response = await GET(request);
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });
  });

  describe('Valid User Tests', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ 
        user: { email: 'test@example.com' } 
      });
      mockGetUserByEmail.mockResolvedValue({
        id: 123,
        email: 'test@example.com',
        username: 'testuser',
        credits: 100,
        last_credit_earn: new Date(),
        total_packs_opened: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
      mockGetUserCredits.mockResolvedValue({ credits: 100, last_credit_earn: new Date() });
    });

    test('GET - should return credits', async () => {
      mockExecuteQuerySimple.mockResolvedValue([[{ last_daily_claim: null }], []]);
      
      const request = new NextRequest('http://localhost/api/credits');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.credits).toBe(100);
      expect(data.canClaim).toBe(true);
    });

    test('POST - should allow claiming when eligible', async () => {
      mockExecuteQuerySimple
        .mockResolvedValueOnce([[{ last_daily_claim: null }], []])
        .mockResolvedValueOnce([[], []]);
      
      const request = new NextRequest('http://localhost/api/credits', { method: 'POST' });
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.credits).toBe(340);
      expect(data.claimedCredits).toBe(240);
    });

    test('POST - should reject double claiming', async () => {
      // Use yesterday's date since today's check considers UTC reset hour
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      
      mockExecuteQuerySimple.mockResolvedValue([[{ last_daily_claim: yesterdayStr }], []]);
      
      const request = new NextRequest('http://localhost/api/credits', { method: 'POST' });
      const response = await POST(request);
      
      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe('Already claimed today');
    });
  });

  describe('Security Tests', () => {
    test('should handle malicious email', async () => {
      const maliciousEmail = "'; DROP TABLE users; --";
      mockGetServerSession.mockResolvedValue({ 
        user: { email: maliciousEmail } 
      });
      mockGetUserByEmail.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/credits');
      const response = await GET(request);
      
      expect(response.status).toBe(404);
      expect(mockGetUserByEmail).toHaveBeenCalledWith(maliciousEmail);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle database errors', async () => {
      mockGetServerSession.mockResolvedValue({ 
        user: { email: 'test@example.com' } 
      });
      mockGetUserByEmail.mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost/api/credits');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });

    test('should handle missing column gracefully', async () => {
      mockGetServerSession.mockResolvedValue({ 
        user: { email: 'test@example.com' } 
      });
      mockGetUserByEmail.mockResolvedValue({
        id: 123,
        email: 'test@example.com',
        username: 'testuser',
        credits: 100,
        last_credit_earn: new Date(),
        total_packs_opened: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
      mockGetUserCredits.mockResolvedValue({ credits: 100, last_credit_earn: new Date() });
      mockExecuteQuerySimple.mockRejectedValue(new Error('Column not found'));
      
      const request = new NextRequest('http://localhost/api/credits');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.canClaim).toBe(true);
    });
  });

  describe('Rate Limiting Tests', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ 
        user: { email: 'test@example.com' } 
      });
      mockGetUserByEmail.mockResolvedValue({
        id: 123,
        email: 'test@example.com',
        username: 'testuser',
        credits: 100,
        last_credit_earn: new Date(),
        total_packs_opened: 0,
        created_at: new Date(),
        updated_at: new Date()
      });      mockGetUserCredits.mockResolvedValue({ credits: 100, last_credit_earn: new Date() });
    });

    test('should allow claim after 24 hours', async () => {
      // Use day before yesterday to ensure it's eligible
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10);
      
      mockExecuteQuerySimple
        .mockResolvedValueOnce([[{ last_daily_claim: twoDaysAgoStr }], []])
        .mockResolvedValueOnce([[], []]);
      
      const request = new NextRequest('http://localhost/api/credits', { method: 'POST' });
      const response = await POST(request);
      
      expect(response.status).toBe(200);
    });
  });
});