// Mock API for frontend development
// Replace with real API calls when backend is ready

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface FileRecord {
  id: string;
  original_name: string;
  storage_key: string;
  is_public: boolean;
  size: number;
  created_at: string;
  uploaded_by: string;
}

// Mock data store
let mockFiles: FileRecord[] = [
  {
    id: '1',
    original_name: 'document.pdf',
    storage_key: 'files/document.pdf',
    is_public: true,
    size: 2048576,
    created_at: new Date().toISOString(),
    uploaded_by: 'admin@example.com'
  },
  {
    id: '2',
    original_name: 'image.png',
    storage_key: 'files/image.png',
    is_public: false,
    size: 1024000,
    created_at: new Date().toISOString(),
    uploaded_by: 'admin@example.com'
  }
];

const MOCK_USER: User = {
  id: '1',
  email: 'admin@example.com',
  created_at: new Date().toISOString()
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  auth: {
    login: async (email: string, password: string) => {
      await delay(800);
      if (email === 'admin@example.com' && password === 'admin') {
        return {
          access_token: 'mock-jwt-token',
          token_type: 'bearer',
          user: MOCK_USER
        };
      }
      throw new Error('Invalid credentials');
    }
  },

  files: {
    upload: async (file: File, isPublic: boolean, onProgress?: (progress: number) => void) => {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await delay(100);
        onProgress?.(i);
      }

      const newFile: FileRecord = {
        id: String(Date.now()),
        original_name: file.name,
        storage_key: `files/${Date.now()}-${file.name}`,
        is_public: isPublic,
        size: file.size,
        created_at: new Date().toISOString(),
        uploaded_by: MOCK_USER.email
      };

      mockFiles = [newFile, ...mockFiles];
      return newFile;
    },

    list: async () => {
      await delay(500);
      return mockFiles;
    },

    getById: async (id: string) => {
      await delay(300);
      const file = mockFiles.find(f => f.id === id);
      if (!file) throw new Error('File not found');
      return file;
    },

    delete: async (id: string) => {
      await delay(500);
      mockFiles = mockFiles.filter(f => f.id !== id);
    },

    getPublicUrl: (storageKey: string) => {
      return `${window.location.origin}/api/public/${storageKey}`;
    }
  }
};
