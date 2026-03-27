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

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewResetPassword, setConfirmNewResetPassword] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${baseApi}/auth/login/`, {
        username,
        password,
        role: userType === "interviewer" ? "employee" : "candidate",
      });

      const responseData = response.data;

      console.log("Login response:", responseData);

      localStorage.setItem("access_token", responseData.access);

      if (responseData.refresh) {
        localStorage.setItem("refresh_token", responseData.refresh);
      }

      localStorage.setItem(
        "auth_user",
        JSON.stringify({
          username: responseData.username,
          role: responseData.role,
          access: responseData.access,
        })
      );

      localStorage.setItem("access", responseData.access);
      localStorage.setItem("role", responseData.role);
      localStorage.setItem("username", responseData.username);
      localStorage.setItem("user_type", userType);

      toast({
        title: "Login Successful",
        description: "Welcome back!",
        variant: "default",
      });

      if (responseData.role === "candidate") {
        navigate("/candidate-dashboard");
      } else {
        navigate("/interviewer-dashboard");
      }

      setShowUserDashboard(true);
      onLogin?.({
        user_type: responseData.role,
        access: responseData.access,
        refresh: responseData.refresh,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Authentication Failed",
        description:
          error.response?.data?.message ||
          error.response?.data?.error ||
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
      await axios.post(`${baseApi}/auth/register/`, {
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
          error.response?.data?.error ||
          "Registration failed. Please check your details or try a different username.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetCode = async () => {
    if (!resetEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your registered email.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${baseApi}/auth/request-password-reset/`,
        {
          email: resetEmail,
        }
      );

      toast({
        title: "Code Sent",
        description: response.data.message || "Reset code sent to your email.",
        variant: "default",
      });

      setForgotStep(2);
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description:
          error.response?.data?.error || "Unable to send reset code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetCode = async () => {
    if (!resetCode) {
      toast({
        title: "Code Required",
        description: "Please enter the code sent to your email.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${baseApi}/auth/verify-reset-code/`, {
        email: resetEmail,
        code: resetCode,
      });

      toast({
        title: "Code Verified",
        description: response.data.message || "Code verified successfully.",
        variant: "default",
      });

      setForgotStep(3);
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description:
          error.response?.data?.error || "Invalid or expired code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewResetPassword) {
      toast({
        title: "Password Required",
        description: "Please fill all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewResetPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${baseApi}/auth/reset-password/`, {
        email: resetEmail,
        code: resetCode,
        new_password: newPassword,
      });

      toast({
        title: "Password Updated",
        description: response.data.message || "Password reset successful.",
        variant: "default",
      });

      setShowForgotPassword(false);
      setForgotStep(1);
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmNewResetPassword("");
      setTab("login");
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description:
          error.response?.data?.error || "Unable to reset password.",
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

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-6" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-400 rounded-full animate-spin mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Loading Portal...
          </h2>
          <p className="text-blue-200">Preparing your experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full animate-bounce"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-8 text-white">
           <div className="space-y-6">
  

  <h1 className="text-6xl xl:text-7xl font-black leading-tight">
    Skyro
  </h1>

  <p className="text-xl text-blue-100/80 leading-relaxed max-w-lg">
    Welcome to the Skyro Internship Management System, a platform designed for
    interviewers and candidates to connect, participate in assessments, and
    experience a smooth and structured recruitment process.
  </p>
</div>

<div className="grid grid-cols-2 gap-4 max-w-md">
  <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
    <div className="text-lg font-bold text-cyan-400">Interviewers</div>
    <div className="text-sm text-blue-100/70">
      Conduct hiring and evaluate candidates
    </div>
  </div>
  <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
    <div className="text-lg font-bold text-purple-400">Candidates</div>
    <div className="text-sm text-blue-100/70">
      Apply, attend tests, and track progress
    </div>
  </div>
</div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="relative">
              {/* Glassmorphism Card */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-3xl" />

              <div className="relative p-8 lg:p-10">
                {/* Mobile Branding */}
                <div className="lg:hidden text-center mb-8">
                  <h1 className="text-4xl font-black text-white mb-2">
                    Secure Portal
                  </h1>
                  <p className="text-blue-100/80">Welcome back</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex mb-8 p-1 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                  <button
                    onClick={() => setTab("login")}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      tab === "login"
                        ? "bg-white text-slate-900 shadow-lg transform scale-[1.02]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <LogIn size={18} />
                      Sign In
                    </div>
                  </button>
                  <button
                    onClick={() => setTab("signup")}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      tab === "signup"
                        ? "bg-white text-slate-900 shadow-lg transform scale-[1.02]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <UserPlus size={18} />
                      Sign Up
                    </div>
                  </button>
                </div>

                <form
                  onSubmit={tab === "login" ? handleLogin : handleSignup}
                  className="space-y-6"
                >
                  {/* User Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-white/90 font-semibold text-sm">
                      Account Type
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserType("interviewer")}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                          userType === "interviewer"
                            ? "border-blue-400 bg-blue-500/20 text-white shadow-lg shadow-blue-500/25"
                            : "border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
                        }`}
                      >
                        <UserCog className="w-6 h-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Interviewer</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType("candidate")}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                          userType === "candidate"
                            ? "border-blue-400 bg-blue-500/20 text-white shadow-lg shadow-blue-500/25"
                            : "border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
                        }`}
                      >
                        <UserCheck className="w-6 h-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Candidate</div>
                      </button>
                    </div>
                  </div>

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
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white/15 border-white/30 text-white placeholder:text-white/50 h-12 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 backdrop-blur-sm transition-all duration-200 rounded-xl"
                      />
                    </div>
                  )}

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

                  {/* Forgot Password Button */}
                  {tab === "login" && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotStep(1);
                        }}
                        className="text-sm text-white/80 hover:text-white underline underline-offset-4"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

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

                {/* Forgot Password UI */}
                {showForgotPassword && (
                  <div className="mt-6 p-5 bg-white/10 rounded-xl border border-white/20 space-y-4">
                    <h3 className="text-white font-bold text-lg">
                      Reset Password
                    </h3>

                    {forgotStep === 1 && (
                      <>
                        <Label className="text-white/90">
                          Registered Email
                        </Label>
                        <Input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="Enter your registered email"
                          className="bg-white/15 border-white/30 text-white placeholder:text-white/50 h-12"
                        />
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            onClick={handleSendResetCode}
                            disabled={isLoading}
                          >
                            Send Code
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowForgotPassword(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}

                    {forgotStep === 2 && (
                      <>
                        <Label className="text-white/90">
                          Verification Code
                        </Label>
                        <Input
                          type="text"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="bg-white/15 border-white/30 text-white placeholder:text-white/50 h-12"
                        />
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            onClick={handleVerifyResetCode}
                            disabled={isLoading}
                          >
                            Verify Code
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setForgotStep(1)}
                          >
                            Back
                          </Button>
                        </div>
                      </>
                    )}

                    {forgotStep === 3 && (
                      <>
                        <Label className="text-white/90">New Password</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="bg-white/15 border-white/30 text-white placeholder:text-white/50 h-12"
                        />

                        <Label className="text-white/90">
                          Confirm New Password
                        </Label>
                        <Input
                          type="password"
                          value={confirmNewResetPassword}
                          onChange={(e) =>
                            setConfirmNewResetPassword(e.target.value)
                          }
                          placeholder="Re-enter new password"
                          className="bg-white/15 border-white/30 text-white placeholder:text-white/50 h-12"
                        />

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            onClick={handleResetPassword}
                            disabled={isLoading}
                          >
                            Update Password
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setForgotStep(2)}
                          >
                            Back
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

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
    </div>
  );
};

export default LoginForm;