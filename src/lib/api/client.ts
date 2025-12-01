// API client for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  email: string;
  created_at: string;
}

// ============ Folder Types ============

export interface FolderRecord {
  id: string;
  name: string;
  parent_id: string | null;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  file_count: number;
  subfolder_count: number;
}

export interface FolderWithContents {
  id: string;
  name: string;
  parent_id: string | null;
  created_by: number;
  created_at: string | null;
  updated_at: string | null;
  file_count: number;
  subfolder_count: number;
  subfolders: FolderRecord[];
  files: FileRecord[];
}

export interface FolderBreadcrumb {
  id: string;
  name: string;
}

export interface FolderTreeNode {
  id: string;
  name: string;
  children: FolderTreeNode[];
}

export interface FolderCreate {
  name: string;
  parent_id?: string | null;
}

export interface FolderUpdate {
  name?: string;
  parent_id?: string | null;
}

// ============ File Types ============

export interface FileRecord {
  id: string;
  original_name: string;
  slug: string | null;
  storage_key: string;
  is_public: boolean;
  size: number;
  content_type: string | null;
  description: string | null;
  file_type: string | null;
  tags: string | null;
  folder_id: string | null;
  created_at: string;
  uploaded_by: number;
  public_url: string | null;
  download_url: string | null;
}

export interface FileFilters {
  file_type?: string;
  is_public?: boolean;
  search?: string;
  tags?: string;
}

export interface FileUploadOptions {
  file: File;
  isPublic: boolean;
  customName?: string;
  description?: string;
  fileType?: string;
  tags?: string;
  folderId?: string;
  onProgress?: (progress: number) => void;
}

export interface FileListResponse {
  files: FileRecord[];
  total: number;
  page: number;
  per_page: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth-storage");
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.state?.token) {
        return {
          Authorization: `Bearer ${parsed.state.token}`,
        };
      }
    } catch {
      // Invalid token format
    }
  }
  return {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "An error occurred" }));
    throw new ApiError(response.status, error.detail || "An error occurred");
  }
  return response.json();
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<LoginResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse<LoginResponse>(response);
    },

    register: async (email: string, password: string): Promise<User> => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse<User>(response);
    },

    me: async (): Promise<User> => {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return handleResponse<User>(response);
    },
  },

  files: {
    upload: async (options: FileUploadOptions): Promise<FileRecord> => {
      const {
        file,
        isPublic,
        customName,
        description,
        fileType,
        tags,
        folderId,
        onProgress,
      } = options;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("is_public", String(isPublic));
      if (customName) {
        formData.append("custom_name", customName);
      }
      if (description) {
        formData.append("description", description);
      }
      if (fileType) {
        formData.append("file_type", fileType);
      }
      if (tags) {
        formData.append("tags", tags);
      }
      if (folderId) {
        formData.append("folder_id", folderId);
      }

      // For progress tracking with fetch, we need XMLHttpRequest
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new ApiError(xhr.status, error.detail || "Upload failed"));
            } catch {
              reject(new ApiError(xhr.status, "Upload failed"));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new ApiError(0, "Network error"));
        });

        xhr.open("POST", `${API_BASE_URL}/api/files/upload`);

        // Add auth header
        const token = localStorage.getItem("auth-storage");
        if (token) {
          try {
            const parsed = JSON.parse(token);
            if (parsed.state?.token) {
              xhr.setRequestHeader(
                "Authorization",
                `Bearer ${parsed.state.token}`
              );
            }
          } catch {
            // Invalid token format
          }
        }

        xhr.send(formData);
      });
    },

    list: async (
      page: number = 1,
      perPage: number = 20,
      filters?: FileFilters
    ): Promise<FileListResponse> => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("per_page", String(perPage));

      if (filters?.file_type) {
        params.append("file_type", filters.file_type);
      }
      if (filters?.is_public !== undefined) {
        params.append("is_public", String(filters.is_public));
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }
      if (filters?.tags) {
        params.append("tags", filters.tags);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/files?${params.toString()}`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );
      return handleResponse<FileListResponse>(response);
    },

    getById: async (id: string): Promise<FileRecord> => {
      const response = await fetch(`${API_BASE_URL}/api/files/${id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return handleResponse<FileRecord>(response);
    },

    move: async (
      fileId: string,
      folderId: string | null
    ): Promise<FileRecord> => {
      const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/move`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ folder_id: folderId }),
      });
      return handleResponse<FileRecord>(response);
    },

    update: async (
      fileId: string,
      data: {
        is_public?: boolean;
        description?: string;
        file_type?: string;
        tags?: string;
        custom_name?: string;
      }
    ): Promise<FileRecord> => {
      const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      return handleResponse<FileRecord>(response);
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/api/files/${id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ detail: "Delete failed" }));
        throw new ApiError(response.status, error.detail || "Delete failed");
      }
    },

    getPublicUrl: (slug: string): string => {
      return `${API_BASE_URL}/api/public/${slug}`;
    },

    getDownloadUrl: (fileId: string): string => {
      return `${API_BASE_URL}/api/files/download/${fileId}`;
    },

    getViewUrl: (fileId: string): string => {
      return `${API_BASE_URL}/api/files/view/${fileId}`;
    },

    // Helper to get auth token for download links
    getAuthToken: (): string | null => {
      const token = localStorage.getItem("auth-storage");
      if (token) {
        try {
          const parsed = JSON.parse(token);
          return parsed.state?.token || null;
        } catch {
          return null;
        }
      }
      return null;
    },
  },

  folders: {
    create: async (data: FolderCreate): Promise<FolderRecord> => {
      const response = await fetch(`${API_BASE_URL}/api/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      return handleResponse<FolderRecord>(response);
    },

    getContents: async (folderId?: string): Promise<FolderWithContents> => {
      const params = new URLSearchParams();
      if (folderId) {
        params.append("folder_id", folderId);
      }
      const response = await fetch(
        `${API_BASE_URL}/api/folders/contents?${params.toString()}`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );
      return handleResponse<FolderWithContents>(response);
    },

    getById: async (id: string): Promise<FolderRecord> => {
      const response = await fetch(`${API_BASE_URL}/api/folders/${id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return handleResponse<FolderRecord>(response);
    },

    getBreadcrumbs: async (folderId: string): Promise<FolderBreadcrumb[]> => {
      const response = await fetch(
        `${API_BASE_URL}/api/folders/${folderId}/breadcrumbs`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );
      return handleResponse<FolderBreadcrumb[]>(response);
    },

    getTree: async (): Promise<FolderTreeNode[]> => {
      const response = await fetch(`${API_BASE_URL}/api/folders/tree`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return handleResponse<FolderTreeNode[]>(response);
    },

    update: async (id: string, data: FolderUpdate): Promise<FolderRecord> => {
      const response = await fetch(`${API_BASE_URL}/api/folders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      return handleResponse<FolderRecord>(response);
    },

    delete: async (id: string, recursive: boolean = true): Promise<void> => {
      const params = new URLSearchParams();
      params.append("recursive", String(recursive));
      const response = await fetch(
        `${API_BASE_URL}/api/folders/${id}?${params.toString()}`,
        {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(),
          },
        }
      );
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ detail: "Delete failed" }));
        throw new ApiError(response.status, error.detail || "Delete failed");
      }
    },
  },
};
