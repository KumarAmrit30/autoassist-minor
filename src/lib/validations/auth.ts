// Authentication validation schemas using Zod

import { z } from "zod";

// Password validation with modern security requirements
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  );

// Email validation with comprehensive checking
const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(1, "Email is required")
  .max(254, "Email must be less than 254 characters")
  .transform((email) => email.toLowerCase().trim());

// Name validation
const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Name can only contain letters, spaces, hyphens, and apostrophes"
  )
  .transform((name) => name.trim());

// Login validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

// Signup validation schema
export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Profile update validation schema
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  avatar: z.string().url("Please provide a valid avatar URL").optional(),
  preferences: z
    .object({
      priceRange: z.tuple([z.number().min(0), z.number().min(0)]).optional(),
      preferredBrands: z.array(z.string()).optional(),
      preferredFuelTypes: z.array(z.string()).optional(),
      preferredBodyTypes: z.array(z.string()).optional(),
      preferredTransmissionTypes: z.array(z.string()).optional(),
      notifications: z
        .object({
          email: z.boolean(),
          push: z.boolean(),
          sms: z.boolean(),
        })
        .optional(),
      theme: z.enum(["light", "dark", "system"]).optional(),
      language: z.string().optional(),
    })
    .optional(),
});

// Password change validation schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// Email verification validation schema
export const emailVerificationSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

// Password reset request validation schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

// Password reset validation schema
export const passwordResetSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Refresh token validation schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// User role validation
export const userRoleSchema = z.enum(["user", "admin", "moderator"]);

// Export types from schemas
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type EmailVerificationData = z.infer<typeof emailVerificationSchema>;
export type PasswordResetRequestData = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type RefreshTokenData = z.infer<typeof refreshTokenSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
