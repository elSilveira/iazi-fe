import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Consistent keys for storing tokens and user data
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

// Create Axios instance with API base URL
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api",
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("API URL Base:", apiClient.defaults.baseURL);

// --- Request Interceptor ---
// Add JWT token to Authorization header and prevent caching
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Prevent browser/disk caching
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// Handle refresh token and global errors

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if error is 401 and not a refresh attempt that failed
    if (error.response?.status === 401 && originalRequest.url !== "/auth/refresh" && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, add request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers["Authorization"] = "Bearer " + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;

      if (!refreshToken) {
        console.error("Refresh token not found, logging out.");
        isRefreshing = false;
        if (typeof window !== "undefined") {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }

      try {
        console.log("Attempting to refresh token");
        console.log("Refresh token value:", refreshToken);
        const refreshResponse = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`, 
          { token: refreshToken },  // Backend expects 'token' not 'refreshToken'
          { headers: { "Content-Type": "application/json" } }
        );
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        console.log("Token refreshed successfully");
        if (typeof window !== "undefined") {
          localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
          }
        }

        // Update headers
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Process queued requests
        processQueue(null, newAccessToken);

        // Retry original request
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        processQueue(refreshError as AxiosError, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract error message
    const errorMessage = (error.response?.data as { message?: string })?.message || error.message || "An unexpected error occurred.";
    console.error("API Error:", errorMessage, error.response?.status, originalRequest.url);
    error.message = errorMessage;

    return Promise.reject(error);
  }
);

// --- User Profile API Functions ---
export const fetchUserProfile = async () => {
  const response = await apiClient.get("/users/me");
  return response.data;
};

export const updateUserProfile = async (data: Record<string, unknown>) => {
  const response = await apiClient.put("/users/me", data);
  return response.data;
};

// --- User Addresses API Functions ---
export const fetchUserAddresses = async () => {
  const response = await apiClient.get("/users/me/addresses");
  return response.data;
};

export const createUserAddress = async (addressData: Record<string, unknown>) => {
  const response = await apiClient.post("/users/me/addresses", addressData);
  return response.data;
};

export const updateUserAddress = async (addressId: string, addressData: Record<string, unknown>) => {
  const response = await apiClient.put(`/users/me/addresses/${addressId}`, addressData);
  return response.data;
};

export const deleteUserAddress = async (addressId: string) => {
  const response = await apiClient.delete(`/users/me/addresses/${addressId}`);
  return response.data;
};

// --- Notifications API Functions ---
export const fetchNotifications = async (params?: Record<string, unknown>) => {
  // Filter out React Query context properties if passed directly as queryFn
  const validParams = params && typeof params === 'object' && !('queryKey' in params) ? params : undefined;
  const response = await apiClient.get("/notifications", validParams ? { params: validParams } : {});
  return response.data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const response = await apiClient.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.patch("/notifications/read-all");
  return response.data;
};

// --- Categories API Functions ---
export const fetchCategories = async (params?: Record<string, unknown>) => {
  // Filter out React Query context properties if passed directly as queryFn
  const validParams = params && typeof params === 'object' && !('queryKey' in params) ? params : undefined;
  const response = await apiClient.get("/categories", validParams ? { params: validParams } : {});
  return response.data;
};

// --- Services API Functions ---
export const fetchServices = async (params?: Record<string, unknown>) => {
  // Filter out React Query context properties if passed directly as queryFn
  const validParams = params && typeof params === 'object' && !('queryKey' in params) ? params : undefined;
  const response = await apiClient.get("/services", validParams ? { params: validParams } : {});
  return response.data;
};

export const fetchServiceDetails = async (serviceId: string) => {
  const response = await apiClient.get(`/services/${serviceId}`);
  return response.data;
};

// --- Professionals API Functions ---
export const fetchProfessionals = async (params?: Record<string, unknown>) => {
  // Filter out React Query context properties if passed directly as queryFn
  const validParams = params && typeof params === 'object' && !('queryKey' in params) ? params : undefined;
  const response = await apiClient.get("/professionals", validParams ? { params: validParams } : {});
  return response.data;
};

export const fetchProfessionalDetails = async (professionalId: string) => {
  const response = await apiClient.get(`/professionals/${professionalId}`);
  return response.data;
};

export const fetchProfessionalMe = async () => {
  const response = await apiClient.get("/professionals/me");
  return response.data;
};

export const createProfessionalProfile = async (data: Record<string, unknown>) => {
  const response = await apiClient.post("/professionals", data);
  return response.data;
};

export const updateProfessionalProfile = async (data: Record<string, unknown>) => {
  const response = await apiClient.put("/professionals/me", data);
  return response.data;
};

// Fetch services for a specific professional (public)
export const fetchProfessionalServices = async (professionalId: string) => {
  const response = await apiClient.get(`/professionals/${professionalId}/services`);
  return response.data;
};

// Fetch the current professional's own services (authenticated)
// Uses /professionals/services endpoint per API docs
export const fetchMyServices = async () => {
  const response = await apiClient.get("/professionals/services");
  return response.data;
};

// Link a service to a professional
// Uses POST /professionals/{professionalId}/services per API docs
export const linkMyService = async (
  professionalId: string,
  serviceId: string,
  data?: {
    price?: number;
    description?: string;
    duration?: string;
    schedule?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  }
) => {
  const response = await apiClient.post(`/professionals/${professionalId}/services`, { serviceId, ...data });
  return response.data;
};

// Update a linked service with custom settings
export const updateMyService = async (
  professionalId: string,
  serviceId: string,
  data: {
    price?: number;
    description?: string;
    duration?: string;
    schedule?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  }
) => {
  const response = await apiClient.put(`/professionals/${professionalId}/services/${serviceId}`, data);
  return response.data;
};

// Unlink a service from a professional
// Uses DELETE /professionals/{professionalId}/services/{serviceId} per API docs
export const unlinkMyService = async (professionalId: string, serviceId: string) => {
  const response = await apiClient.delete(`/professionals/${professionalId}/services/${serviceId}`);
  return response.data;
};

// Create a new service (for professionals to add custom services)
export const createService = async (data: {
  name: string;
  description?: string;
  price: number;
  duration: number;
  categoryId: number;
  image?: string;
}) => {
  const response = await apiClient.post("/services", data);
  return response.data;
};

// Note: fetchProfessionalAvailability is defined below in the Booking section with optional serviceId

// Fetch dashboard stats - requires professionalId from /professionals/me first
export const fetchProfessionalDashboardStats = async (professionalId: string) => {
  const response = await apiClient.get(`/professionals/${professionalId}/dashboard-stats`);
  return response.data;
};

// Fetch popular services - requires professionalId from /professionals/me first
export const fetchProfessionalPopularServices = async (professionalId: string) => {
  const response = await apiClient.get(`/professionals/${professionalId}/popular-services`);
  return response.data;
};

// Fetch dates with appointments for calendar highlighting (lightweight endpoint)
// Returns array of dates in "YYYY-MM-DD" format that have at least one appointment
export const fetchProfessionalAppointmentDates = async (
  professionalId: string,
  dateFrom: string,
  dateTo: string
): Promise<string[]> => {
  try {
    const response = await apiClient.get(`/professionals/${professionalId}/appointment-dates`, {
      params: {
        dateFrom,
        dateTo,
      },
    });
    // Expected response: { dates: ["2025-11-28", "2025-11-29", ...] }
    if (response.data?.dates && Array.isArray(response.data.dates)) {
      return response.data.dates;
    }
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    // Silently fail - this is just for UI enhancement
    return [];
  }
};

// Fetch upcoming appointments using the appointments endpoint with filters
export const fetchUpcomingAppointments = async (professionalId: string, limit = 5) => {
  const today = new Date().toISOString().split("T")[0];
  const response = await apiClient.get("/appointments", {
    params: {
      professionalId,
      dateFrom: today,
      status: "PENDING,CONFIRMED",
      include: "user,service",
      limit,
      sortBy: "startTime",
      sortOrder: "asc",
    },
  });
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : [];
};

// Fetch appointments for a professional (uses appointments endpoint with professionalId filter)
export const fetchProfessionalAppointments = async (
  professionalId: string,
  dateFrom?: string,
  dateTo?: string,
  status?: string,
  skipAutoComplete = true // Skip auto-complete to show pending appointments from past dates
) => {
  const response = await apiClient.get("/appointments", {
    params: {
      professionalId,
      dateFrom,
      dateTo,
      status,
      include: "user,service",
      skipAutoComplete,
    },
  });
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : [];
};

export const updateAppointmentStatus = async (appointmentId: string, status: string) => {
  const response = await apiClient.patch(`/appointments/${appointmentId}/status`, { status });
  return response.data;
};

export const rescheduleAppointment = async (
  appointmentId: string,
  data: { startTime: string; endTime: string }
) => {
  const response = await apiClient.patch(`/appointments/${appointmentId}`, data);
  return response.data;
};

// --- Booking/Appointment API Functions ---
// Fetch availability for a professional on a specific date
export const fetchProfessionalAvailability = async (
  professionalId: string,
  date: string,
  serviceId?: string
) => {
  const response = await apiClient.get(`/professionals/${professionalId}/availability`, {
    params: { date, serviceId },
  });
  return response.data;
};

// Fetch availability using main endpoint (alternative)
export const fetchAvailability = async (params: {
  professionalId: string;
  date: string;
  serviceId?: string;
}) => {
  const response = await apiClient.get("/appointments/availability", { params });
  return response.data;
};

// Create a new appointment/booking
export const createAppointment = async (data: {
  serviceId: string;
  professionalId: string;
  date: string;      // YYYY-MM-DD format
  time: string;      // HH:MM format
  notes?: string;
}) => {
  const response = await apiClient.post("/appointments", data);
  return response.data;
};

// Fetch user's own appointments (client bookings)
export const fetchMyAppointments = async (params: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
} = {}) => {
  const response = await apiClient.get("/appointments", { params });
  return response.data;
};

// Get single appointment details
export const fetchAppointmentDetails = async (appointmentId: string) => {
  const response = await apiClient.get(`/appointments/${appointmentId}`);
  return response.data;
};

// Cancel an appointment
export const cancelAppointment = async (appointmentId: string) => {
  const response = await apiClient.patch(`/appointments/${appointmentId}/cancel`);
  return response.data;
};

// Reschedule an appointment to a new date/time
export const rescheduleAppointmentById = async (
  appointmentId: string,
  data: { date: string; time: string; notes?: string }
) => {
  const response = await apiClient.patch(`/appointments/${appointmentId}/reschedule`, data);
  return response.data;
};

// --- Reviews API Functions ---
export const fetchReviews = async (params?: Record<string, unknown>) => {
  // Filter out React Query context properties if passed directly as queryFn
  const validParams = params && typeof params === 'object' && !('queryKey' in params) ? params : undefined;
  const response = await apiClient.get("/reviews", validParams ? { params: validParams } : {});
  return response.data;
};

// Fetch reviews for a specific professional
export const fetchProfessionalReviews = async (professionalId: string) => {
  const response = await apiClient.get("/reviews", { 
    params: { professionalId } 
  });
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : [];
};

export const createReview = async (reviewData: {
  rating: number;
  comment?: string;
  serviceId?: string;
  professionalId?: string;
  companyId?: string;
  appointmentId?: string;
}) => {
  const response = await apiClient.post("/reviews", reviewData);
  return response.data;
};

// Fetch reviews with stats for a professional
export const fetchProfessionalReviewsWithStats = async (professionalId: string) => {
  const response = await apiClient.get(`/professionals/${professionalId}/reviews`);
  return response.data;
};

// Update a review
export const updateReview = async (reviewId: string, data: { rating?: number; comment?: string }) => {
  const response = await apiClient.patch(`/reviews/${reviewId}`, data);
  return response.data;
};

// Delete a review
export const deleteReview = async (reviewId: string) => {
  const response = await apiClient.delete(`/reviews/${reviewId}`);
  return response.data;
};

// --- Client Review API Functions (Professional reviews Client) ---

export interface ClientReview {
  id: string;
  rating: number;
  comment: string | null;
  wasNoShow: boolean;
  appointmentId: string;
  professionalId: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  professional?: {
    id: string;
    name?: string;
    image?: string | null;
    user?: {
      id: string;
      name: string;
      avatar?: string | null;
    };
  };
  appointment?: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    notes?: string | null;
    services?: Array<{
      appointmentId: string;
      serviceId: string;
      service: {
        id: string;
        name: string;
      };
    }>;
  };
}

export interface ClientStats {
  averageRating: number;
  totalReviews: number;
  noShowCount: number;
  noShowRate: number;
}

export interface CanReviewClientResponse {
  canReview: boolean;
  reason?: string;
}

// Check if client review exists for an appointment
export const checkClientReviewExists = async (appointmentId: string): Promise<boolean> => {
  const response = await apiClient.get(`/appointments/${appointmentId}/client-review/exists`);
  return response.data?.exists ?? false;
};

// Check if professional can review the client
export const canReviewClient = async (appointmentId: string): Promise<CanReviewClientResponse> => {
  const response = await apiClient.get(`/appointments/${appointmentId}/can-review-client`);
  return response.data;
};

// Get client review for an appointment
export const getClientReview = async (appointmentId: string): Promise<ClientReview> => {
  const response = await apiClient.get(`/appointments/${appointmentId}/client-review`);
  return response.data;
};

// Create client review
export const createClientReview = async (
  appointmentId: string,
  data: { rating: number; comment?: string; wasNoShow?: boolean }
): Promise<ClientReview> => {
  const response = await apiClient.post(`/appointments/${appointmentId}/client-review`, data);
  return response.data;
};

// Update client review
export const updateClientReview = async (
  appointmentId: string,
  data: { rating?: number; comment?: string; wasNoShow?: boolean }
): Promise<ClientReview> => {
  const response = await apiClient.put(`/appointments/${appointmentId}/client-review`, data);
  return response.data;
};

// Delete client review
export const deleteClientReview = async (appointmentId: string): Promise<void> => {
  await apiClient.delete(`/appointments/${appointmentId}/client-review`);
};

// Mark client as no-show
export const markClientNoShow = async (
  appointmentId: string,
  comment?: string
): Promise<{ message: string; review: ClientReview }> => {
  const response = await apiClient.post(`/appointments/${appointmentId}/no-show`, { comment });
  return response.data;
};

// Get client stats (average rating, no-show rate, etc.)
export const getClientStats = async (userId: string): Promise<ClientStats> => {
  const response = await apiClient.get(`/users/${userId}/client-stats`);
  return response.data;
};

// Fetch client reviews received (reviews made by professionals about the client)
// Accepts userId or 'me' for authenticated user
export const fetchClientReviews = async (userId: string = 'me'): Promise<ClientReview[]> => {
  const response = await apiClient.get(`/users/${userId}/client-reviews`);
  // API returns { reviews: [...], total, page, limit, totalPages }
  if (response.data?.reviews && Array.isArray(response.data.reviews)) {
    return response.data.reviews;
  }
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : [];
};

// Fetch current user's client reviews (wrapper to avoid React Query context issues)
export const fetchMyClientReviews = async (): Promise<ClientReview[]> => {
  return fetchClientReviews('me');
};

// Fetch client reviews made by a professional
export const fetchProfessionalClientReviews = async (professionalId: string): Promise<ClientReview[]> => {
  const response = await apiClient.get(`/professionals/${professionalId}/client-reviews`);
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : [];
};

// Fetch pending reviews (completed appointments without reviews)
export const fetchPendingReviews = async () => {
  const response = await apiClient.get("/appointments", {
    params: {
      status: "COMPLETED",
      hasReview: false,
      minimal: true,
    },
  });
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : [];
};

// Fetch user's own reviews
export const fetchMyReviews = async () => {
  const response = await apiClient.get("/reviews", {
    params: { mine: true },
  });
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : [];
};

// --- Companies API Functions ---
export const fetchCompanies = async (params?: Record<string, unknown>) => {
  // Filter out React Query context properties if passed directly as queryFn
  const validParams = params && typeof params === 'object' && !('queryKey' in params) ? params : undefined;
  const response = await apiClient.get("/companies", validParams ? { params: validParams } : {});
  return response.data;
};

export const fetchCompanyDetails = async (companyId: string) => {
  const response = await apiClient.get(`/companies/${companyId}`);
  return response.data;
};

// Fetch the current user's company (if they own one)
export const fetchMyCompany = async (userId?: string) => {
  try {
    // Try to fetch companies and filter by current user
    // The API returns companies with ownerId, so we can filter client-side
    const response = await apiClient.get("/companies", { params: { limit: 100 } });
    const companies = response.data?.data || response.data || [];
    
    // Use provided userId or get from localStorage
    let ownerId = userId;
    if (!ownerId) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        ownerId = user.id;
      }
    }
    
    if (ownerId) {
      const userCompany = companies.find((c: { ownerId: string }) => c.ownerId === ownerId);
      if (userCompany) {
        return userCompany;
      }
    }
    
    return null;
  } catch (error) {
    console.log("Error fetching company:", error);
    return null;
  }
};

export const registerCompany = async (companyData: Record<string, unknown>) => {
  const response = await apiClient.post("/companies", companyData);
  return response.data;
};

export const updateCompanyDetails = async (companyId: string, companyData: Record<string, unknown>) => {
  const response = await apiClient.put(`/companies/${companyId}`, companyData);
  return response.data;
};

export const deleteCompany = async (companyId: string) => {
  const response = await apiClient.delete(`/companies/${companyId}`);
  return response.data;
};

// --- Company Address API Functions ---
export const fetchCompanyAddress = async (companyId: string) => {
  const response = await apiClient.get(`/company-address/${companyId}`);
  return response.data;
};

export const upsertCompanyAddress = async (companyId: string, addressData: Record<string, unknown>) => {
  const response = await apiClient.put(`/company-address/${companyId}`, addressData);
  return response.data;
};

// --- Company Services (uses main services endpoint with companyId filter) ---
export const fetchCompanyServices = async (companyId: string, params: Record<string, unknown> = {}) => {
  const response = await apiClient.get("/services", { 
    params: { ...params, companyId } 
  });
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : [];
};

export const createCompanyService = async (serviceData: Record<string, unknown>) => {
  const response = await apiClient.post("/services", serviceData);
  return response.data;
};

export const updateCompanyService = async (serviceId: string, serviceData: Record<string, unknown>) => {
  const response = await apiClient.put(`/services/${serviceId}`, serviceData);
  return response.data;
};

export const deleteCompanyService = async (serviceId: string) => {
  const response = await apiClient.delete(`/services/${serviceId}`);
  return response.data;
};

// --- Company Appointments (uses main appointments endpoint with companyId filter) ---
export const fetchCompanyAppointments = async (companyId: string, params: Record<string, unknown> = {}) => {
  const response = await apiClient.get("/appointments", { 
    params: { ...params, companyId } 
  });
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : [];
};

// --- Company Staff (uses professionals endpoint with companyId filter) ---
export const fetchCompanyStaff = async (companyId: string) => {
  const response = await apiClient.get("/professionals", { 
    params: { companyId } 
  });
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : [];
};

export const addCompanyStaff = async (companyId: string, staffData: Record<string, unknown>) => {
  // Invite a professional to the company
  const response = await apiClient.post("/invites", { 
    ...staffData, 
    companyId,
    type: "COMPANY_INVITE" 
  });
  return response.data;
};

export const removeCompanyStaff = async (companyId: string, professionalId: string) => {
  // Update the professional to remove from company
  const response = await apiClient.put(`/professionals/${professionalId}`, { 
    companyId: null 
  });
  return response.data;
};

// --- Company Reviews (uses main reviews endpoint with companyId filter) ---
export const fetchCompanyReviews = async (companyId: string) => {
  const response = await apiClient.get("/reviews", { 
    params: { companyId } 
  });
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : [];
};

// --- Company Dashboard Stats (calculated from appointments) ---
export const fetchCompanyDashboardStats = async (companyId: string) => {
  // Fetch today's appointments
  const today = new Date().toISOString().split("T")[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  
  const [appointmentsToday, appointmentsMonth, reviews] = await Promise.all([
    fetchCompanyAppointments(companyId, { dateFrom: today, dateTo: today }),
    fetchCompanyAppointments(companyId, { dateFrom: startOfMonth }),
    fetchCompanyReviews(companyId),
  ]);
  
  // Calculate stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / totalReviews 
    : 0;
  
  const completedAppointments = appointmentsMonth.filter((a: { status: string }) => a.status === "COMPLETED");
  const revenue = completedAppointments.reduce((acc: number, a: { price?: number }) => acc + (a.price || 0), 0);
  
  return {
    appointmentsToday: appointmentsToday.length,
    monthlyRevenue: revenue,
    totalClients: new Set(appointmentsMonth.map((a: { userId: string }) => a.userId)).size,
    averageRating,
    totalReviews,
  };
};

// --- Appointments API Functions ---
export const fetchAppointments = async (params: Record<string, unknown> = {}) => {
  const response = await apiClient.get("/appointments", { params });
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

// Note: createAppointment is already defined in the Booking API Functions section above

// --- Search API Functions ---
export const fetchSearchResults = async (params?: Record<string, unknown>) => {
  // Filter out React Query context properties if passed directly as queryFn
  const validParams = params && typeof params === 'object' && !('queryKey' in params) ? params : undefined;
  const response = await apiClient.get("/search", validParams ? { params: validParams } : {});
  return response.data;
};

// --- Invite API Functions ---
export const generateInviteCode = async () => {
  const response = await apiClient.post("/auth/invites");
  return response.data;
};

export const fetchMyInvites = async () => {
  const response = await apiClient.get("/auth/invites");
  return response.data;
};

export default apiClient;
