// User types for authentication system

export interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string; // Optional for responses (never send password to client)
  role: "user" | "admin" | "moderator";
  isEmailVerified: boolean;
  avatar?: string;
  preferences?: UserPreferences;
  favorites: string[]; // Array of car IDs
  wishlist: string[]; // Array of car IDs
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface UserPreferences {
  priceRange?: [number, number];
  preferredBrands?: string[];
  preferredFuelTypes?: string[];
  preferredBodyTypes?: string[];
  preferredTransmissionTypes?: string[];
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  theme: "light" | "dark" | "system";
  language: string;
}

export interface AuthSession {
  _id?: string;
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  isValid: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, "password">;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

export interface AuthContextType {
  user: Omit<User, "password"> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: (logoutFromAllDevices?: boolean) => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
