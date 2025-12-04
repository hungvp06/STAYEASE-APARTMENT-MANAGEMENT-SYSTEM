/**
 * User Authentication Actions
 *
 * Server actions for user registration, sign in, and sign out operations.
 */

"use server";

import { signIn } from "next-auth/react";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb/connection";
import { User } from "@/lib/mongodb/models";

/**
 * Register a new user
 */
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!email || !password || !fullName) {
    return { error: "Vui lòng điền đầy đủ thông tin" };
  }

  if (password.length < 6) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự" };
  }

  try {
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "Email đã được sử dụng" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      fullName,
      role: "resident",
      status: "active",
    });

    await user.save();

    return { success: true, message: "Đăng ký thành công" };
  } catch (error) {
    console.error("Sign up error:", error);
    return { error: "Có lỗi xảy ra khi đăng ký" };
  }
}

/**
 * Sign in user with credentials
 */
export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Vui lòng điền đầy đủ thông tin" };
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Email hoặc mật khẩu không đúng" };
    }

    return { success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    return { error: "Có lỗi xảy ra khi đăng nhập" };
  }
}

/**
 * Sign out user
 */
export async function signOutAction() {
  // Server action can't directly sign out, must be done on client
  // This just redirects to login
  redirect("/api/auth/signout");
}
