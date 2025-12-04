/**
 * Authentication Session Management
 *
 * This module provides authentication and authorization utilities for server-side operations.
 * It consolidates session management, role checking, and resource ownership verification.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongodb/connection";
import { User } from "@/lib/mongodb/models";
import { USER_ROLES } from "@/lib/constants";

/**
 * Custom Authentication Error
 */
export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Get current authenticated user with full details from database
 * Excludes password field for security
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return null;
    }

    await connectDB();

    const user = await User.findById(session.user.id).select("-password").lean();

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || null,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl || null,
      apartmentId: user.apartmentId?.toString() || null,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get current authenticated user from session (lightweight version)
 * Throws error if not authenticated
 */
export async function getAuthUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new AuthError("Vui lòng đăng nhập", 401);
  }

  return session.user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError("Authentication required", 401);
  }

  return user;
}

/**
 * Require specific role(s) - throws if user doesn't have required role
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("Bạn không có quyền truy cập", 403);
  }

  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  return requireRole([USER_ROLES.ADMIN]);
}

/**
 * Require resident role (or admin)
 */
export async function requireResident() {
  return requireRole([USER_ROLES.ADMIN, USER_ROLES.RESIDENT]);
}

/**
 * Require staff role (or admin)
 */
export async function requireStaff() {
  return requireRole([USER_ROLES.ADMIN, USER_ROLES.STAFF]);
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === USER_ROLES.ADMIN;
  } catch {
    return false;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch {
    return false;
  }
}

/**
 * Check if user owns a resource
 * Admins automatically have access to all resources
 */
export async function checkResourceOwnership(
  resourceUserId: string
): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return false;
    }

    // Admin can access all resources
    if (user.role === USER_ROLES.ADMIN) {
      return true;
    }

    // Check if user owns the resource
    return user.id === resourceUserId;
  } catch {
    return false;
  }
}
