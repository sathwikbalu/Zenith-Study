const API_BASE_URL = "http://localhost:5000/api";

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  const user = localStorage.getItem("zenith_user");
  if (user) {
    const parsedUser = JSON.parse(user);
    return parsedUser.token;
  }
  return null;
};

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  console.log(`Making API request to: ${API_BASE_URL}${endpoint}`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  console.log(`API response status: ${response.status} for ${endpoint}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`API error for ${endpoint}:`, errorData);
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
};

// Auth API
export const authAPI = {
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials: { email: string; password: string }) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
};

// User API
export const userAPI = {
  getProfile: () => apiRequest("/users/profile"),

  updateProfile: (userData: { name?: string; email?: string; role?: string }) =>
    apiRequest("/users/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    }),
};

// Notes API
export const notesAPI = {
  getAll: () => apiRequest("/notes"),

  getById: (id: string) => apiRequest(`/notes/${id}`),

  create: (noteData: {
    title: string;
    subject: string;
    content: string;
    starred?: boolean;
  }) =>
    apiRequest("/notes", {
      method: "POST",
      body: JSON.stringify(noteData),
    }),

  update: (
    id: string,
    noteData: {
      title?: string;
      subject?: string;
      content?: string;
      starred?: boolean;
    }
  ) =>
    apiRequest(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(noteData),
    }),

  delete: (id: string) =>
    apiRequest(`/notes/${id}`, {
      method: "DELETE",
    }),

  toggleStar: (id: string) =>
    apiRequest(`/notes/${id}/star`, {
      method: "PUT",
    }),
};

// Sessions API
export const sessionsAPI = {
  getAll: () => apiRequest("/sessions"),

  getById: (id: string) => apiRequest(`/sessions/${id}`),

  create: (sessionData: {
    title: string;
    subject: string;
    description: string;
    startTime: string;
    endTime: string;
    maxParticipants?: number;
  }) =>
    apiRequest("/sessions", {
      method: "POST",
      body: JSON.stringify(sessionData),
    }),

  update: (
    id: string,
    sessionData: {
      title?: string;
      subject?: string;
      description?: string;
      startTime?: string;
      endTime?: string;
      status?: string;
      maxParticipants?: number;
    }
  ) =>
    apiRequest(`/sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(sessionData),
    }),

  delete: (id: string) =>
    apiRequest(`/sessions/${id}`, {
      method: "DELETE",
    }),

  join: (id: string) =>
    apiRequest(`/sessions/${id}/join`, {
      method: "POST",
    }),

  leave: (id: string) =>
    apiRequest(`/sessions/${id}/leave`, {
      method: "POST",
    }),
};

// Activities API
export const activitiesAPI = {
  getAll: () => apiRequest("/activities"),

  add: () =>
    apiRequest("/activities", {
      method: "POST",
    }),

  getStreaks: () => apiRequest("/activities/streaks"),
};

// Chat API
export const chatAPI = {
  getSessionMessages: (sessionId: string, limit = 100) =>
    apiRequest(`/chat/session/${sessionId}?limit=${limit}`),

  saveMessage: (messageData: {
    sessionId: string;
    message: string;
    messageType?: string;
  }) =>
    apiRequest("/chat", {
      method: "POST",
      body: JSON.stringify(messageData),
    }),
};

// Assessments API
export const assessmentsAPI = {
  generate: (sessionId: string) =>
    apiRequest(`/assessments/generate/${sessionId}`, {
      method: "POST",
    }),

  getBySession: async (sessionId: string) => {
    try {
      const result = await apiRequest(`/assessments/session/${sessionId}`);
      console.log(`Assessment fetched successfully for session ${sessionId}`);
      return result;
    } catch (error) {
      console.error(
        `Error fetching assessment for session ${sessionId}:`,
        error
      );
      throw error;
    }
  },

  submit: (submissionData: {
    assessmentId: string;
    answers: Array<{
      questionId: string;
      selectedOption: string;
    }>;
  }) =>
    apiRequest("/assessments/submit", {
      method: "POST",
      body: JSON.stringify(submissionData),
    }),

  getSubmissions: (sessionId: string) =>
    apiRequest(`/assessments/submissions/${sessionId}`),

  getUserSubmission: (assessmentId: string) =>
    apiRequest(`/assessments/submission/${assessmentId}`),
};

// Learning Paths API
export const learningPathsAPI = {
  getAll: () => apiRequest("/learning-paths"),

  getById: (id: string) => apiRequest(`/learning-paths/${id}`),

  create: (pathData: {
    topic: string;
    skillLevel: string;
    duration: string;
    goal: string;
    content: string;
  }) =>
    apiRequest("/learning-paths", {
      method: "POST",
      body: JSON.stringify(pathData),
    }),

  delete: (id: string) =>
    apiRequest(`/learning-paths/${id}`, {
      method: "DELETE",
    }),
};

// Forums API
export const forumsAPI = {
  create: (forumData: { topic: string; description: string }) =>
    apiRequest("/forums", {
      method: "POST",
      body: JSON.stringify(forumData),
    }),

  getAll: () => apiRequest("/forums"),

  join: (forumId: string) =>
    apiRequest(`/forums/${forumId}/join`, {
      method: "POST",
    }),

  getMessages: (forumId: string) => apiRequest(`/forums/${forumId}/messages`),

  sendMessage: (forumId: string, messageData: { text: string }) =>
    apiRequest(`/forums/${forumId}/messages`, {
      method: "POST",
      body: JSON.stringify(messageData),
    }),

  getUnreadCount: (forumId: string, userId: string) =>
    apiRequest(`/forums/${forumId}/unread/${userId}`),
};

// Notifications API
export const notificationsAPI = {
  getUnreadCount: () => apiRequest("/notifications/unread-count"),
  
  getAll: () => apiRequest("/notifications"),
  
  markAsRead: (id: string) =>
    apiRequest(`/notifications/${id}/read`, {
      method: "PUT",
    }),
  
  markAllAsRead: () =>
    apiRequest("/notifications/read-all", {
      method: "PUT",
    }),
};
