"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  UserCheck,
  UserCog,
  LogIn,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

const baseApi = import.meta.env.VITE_BASE_API;

interface LoginFormProps {
  onLogin?: (userData: any) => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [userType, setUserType] = useState<"interviewer" | "candidate">(
    "interviewer"
  );
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${baseApi}/auth/login/`, {
        username,
        password,
        role: userType === "interviewer" ? "employee" : "candidate",
      });

      const { access, refresh } = response.data;

      // Store tokens in localStorage
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user_type", userType);
      localStorage.setItem("username", username);

      toast({
        title: "Login Successful",
        description: "Welcome back!",
        variant: "default",
      });

      // Navigate based on user type
      setShowUserDashboard(true);
      onLogin?.({ user_type: userType, access, refresh });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Authentication Failed",
        description:
          error.response?.data?.message ||
          "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please re-enter.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${baseApi}/auth/register/`, {
        username,
        email,
        password,
        role: userType === "interviewer" ? "employee" : "candidate",
      });

      toast({
        title: "Account Created Successfully",
        description: "You can now log in with your credentials.",
        variant: "default",
      });
      setTab("login");
      setEmail("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Sign Up Failed",
        description:
          error.response?.data?.message ||
          "Registration failed. Please check your details or try a different username.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showUserDashboard) {
    console.log("userType", userType);
    if (userType === "interviewer") {
      navigate("/interviewer-dashboard");
    } else {
      navigate("/candidate-dashboard");
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=2069&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/70 to-purple-900/80" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
              Internship
            </h1>
          </div>

          {/* Main Card */}
          <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8">
              {/* Tab Header */}
              <div className="text-center pb-6">
                <h2 className="text-2xl font-bold text-white drop-shadow-md mb-2">
                  {tab === "login" ? "Welcome Back!" : "Join Our Community"}
                </h2>
                <p className="text-white/80 text-sm">
                  {tab === "login"
                    ? "Sign in to access your personalized dashboard"
                    : "Create your account and start your journey"}
                </p>
              </div>

              {/* Login/Signup Toggle */}
              <div className="flex bg-white/10 rounded-xl p-1 mb-6 backdrop-blur-sm">
                <button
                  onClick={() => setTab("login")}
                  className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    tab === "login"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <LogIn size={16} />
                  Sign In
                </button>
                <button
                  onClick={() => setTab("signup")}
                  className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    tab === "signup"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <UserPlus size={16} />
                  Sign Up
                </button>
              </div>

              {/* User Type Selection */}
              <div className="mb-8">
                <label className="block text-white/90 font-semibold text-sm mb-3 flex items-center gap-2">
                  <User size={16} />I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType("interviewer")}
                    className={`p-4 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
                      userType === "interviewer"
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-white/30 shadow-xl transform scale-[1.02]"
                        : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:border-white/40"
                    }`}
                  >
                    <UserCog className="mx-auto mb-2" size={24} />
                    <div className="font-bold">Interviewer</div>
                    <div className="text-xs opacity-80 mt-1">
                      Conduct interviews
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("candidate")}
                    className={`p-4 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
                      userType === "candidate"
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-white/30 shadow-xl transform scale-[1.02]"
                        : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:border-white/40"
                    }`}
                  >
                    <UserCheck className="mx-auto mb-2" size={24} />
                    <div className="font-bold">Candidate</div>
                    <div className="text-xs opacity-80 mt-1">
                      Take interviews
                    </div>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={tab === "login" ? handleLogin : handleSignup}
                className="space-y-5"
              >
                {/* Email Field (Signup only) */}
                {tab === "signup" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-white/90 font-semibold text-sm flex items-center gap-2"
                    >
                      <Mail size={16} />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/15 border-white/30 text-white placeholder:text-white/50 h-12 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 backdrop-blur-sm transition-all duration-200 rounded-xl"
                    />
                  </div>
                )}

                {/* Username Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-white/90 font-semibold text-sm flex items-center gap-2"
                  >
                    <User size={16} />
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-white/15 border-white/30 text-white placeholder:text-white/50 h-12 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 backdrop-blur-sm transition-all duration-200 rounded-xl"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-white/90 font-semibold text-sm flex items-center gap-2"
                  >
                    <Lock size={16} />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/15 border-white/30 text-white placeholder:text-white/50 h-12 pr-12 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 backdrop-blur-sm transition-all duration-200 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-white/10"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field (Signup only) */}
                {tab === "signup" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirm-password"
                      className="text-white/90 font-semibold text-sm flex items-center gap-2"
                    >
                      <Lock size={16} />
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-white/15 border-white/30 text-white placeholder:text-white/50 h-12 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 backdrop-blur-sm transition-all duration-200 rounded-xl"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-8 rounded-xl transform hover:scale-[1.02] border border-white/20"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>
                        {tab === "login"
                          ? "Signing you in..."
                          : "Creating your account..."}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {tab === "login" ? (
                        <LogIn size={20} />
                      ) : (
                        <UserPlus size={20} />
                      )}
                      <span className="text-lg">
                        {tab === "login" ? "Sign In" : "Create Account"}
                      </span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Additional Info */}
              <div className="mt-6 text-center">
                <p className="text-white/60 text-xs">
                  {tab === "login"
                    ? "New to our platform? Switch to Sign Up above"
                    : "Already have an account? Switch to Sign In above"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
