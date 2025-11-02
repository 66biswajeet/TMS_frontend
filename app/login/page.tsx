"use client";

import type React from "react";
// Add api functions for fetching branches
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { login } from "@/redux/modules/auth/actions";
// ... other imports

// <-- ADD THIS IMPORT
// You'll need a way to make authenticated API calls.
import { api } from "@/lib/axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/lib/toast";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@marinapharma.com");
  const [password, setPassword] = useState("MyStrongPass!");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showResetInfo, setShowResetInfo] = useState(false);

  const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  const router = useRouter();
  const dispatch = useDispatch();

  // NEW: State for branch selection modal
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [assignedBranches, setAssignedBranches] = useState<any[]>([]);
  const [tempUserData, setTempUserData] = useState<any>(null);

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReset(true);
    setError("");
    setResetSuccess("");

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050"
        }/password-reset-requests/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: resetEmail,
            message: resetMessage,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // setResetSuccess(data.message);
        showSuccess(data.message);
        setResetEmail("");
        setResetMessage("");
        setShowPasswordResetForm(false);
      } else {
        // setError(data.message);
        showError(data.message);
      }
    } catch (err: any) {
      console.error("Password reset request error:", err);
      setError("Failed to submit password reset request. Please try again.");
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting login with:", { email, password });
      const data = await dispatch(login(email, password) as any);
      console.log("Login successful, data:", data);

      // --- START: MODIFIED LOGIC FOR FLOATER ROLE ---

      // For staff, check for multiple branch assignments
      if (data.user.role === "staff") {
        // Use your API client to call the new backend endpoint
        const branchResponse = await api.get("/branches/me/assigned");
        const branches = branchResponse.data.items;

        if (branches && branches.length > 1) {
          // More than one branch: show the selection modal
          setAssignedBranches(branches);
          setTempUserData(data.user); // Temporarily store user data
          setShowBranchSelector(true);
          setIsLoading(false); // Stop loading animation
          return; // Stop here until user selects a branch
        } else if (branches && branches.length === 1) {
          // Exactly one branch: select it automatically and proceed
          handleBranchSelect(data.user, branches[0].BranchId);
        } else {
          // Zero branches: show an error and stop login
          setIsLoading(false);
          setError(
            "You are not assigned to any branches. Please contact an administrator."
          );
          return;
        }
      } else {
        // For all other roles, log in as normal
        finalizeLogin(data.user, null);
      }
      // --- END: MODIFIED LOGIC FOR FLOATER ROLE ---
    } catch (err: any) {
      setIsLoading(false);
      setError(
        err.response?.data?.error || "Invalid credentials. Please try again."
      );
      console.error("Login error:", err);
    }
  };

  // NEW: Handler for when a user clicks a branch in the modal
  const handleBranchSelect = (user: any, branchId: string) => {
    // Set the selected branch in local storage for other pages to use
    localStorage.setItem("selectedBranchId", branchId);
    finalizeLogin(user, branchId);
  };

  // NEW: Centralized function to set localStorage and redirect
  const finalizeLogin = (user: any, branchId: string | null) => {
    // Store user data
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userEmail", user.email);

    // If a branchId was selected, it's already stored by handleBranchSelect.

    setIsLoading(false);
    console.log("Finalizing login and redirecting for role:", user.role);

    // --- NEW: Check forcePasswordChange flag ---
    // Backend should send this as boolean (true/false)
    if (user.forcePasswordChange === true) {
      console.log("Redirecting to force password change page.");
      router.push("/force-change-password"); // Redirect to the dedicated page
      return; // Stop further redirection attempts
    }
    // --- END NEW CHECK ---

    // Redirect based on user role
    switch (user.role) {
      case "management":
        router.push("/dashboard/management");
        break;
      case "auditor":
        router.push("/dashboard/auditor");
        break;
      case "area_manager":
        router.push("/dashboard/area");
        break;
      case "branch_manager":
        router.push("/dashboard/branch");
        break;
      case "staff":
        router.push("/dashboard/staff"); // Staff now proceeds to their dashboard
        break;
      default:
        setError("Invalid user role. Please contact administrator.");
        return;
    }
  };

  return (
    <>
      {/* NEW: Branch Selector Modal */}
      {showBranchSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Select Your Branch
            </h2>
            <p className="text-gray-500 mb-6">
              Choose a branch to start your session.
            </p>
            <div className="flex flex-col space-y-3">
              {assignedBranches.map((branch) => (
                <Button
                  key={branch.BranchId}
                  onClick={() =>
                    handleBranchSelect(tempUserData, branch.BranchId)
                  }
                  className="w-full justify-center py-3 text-base"
                  variant="outline"
                >
                  {branch.BranchName}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Your existing login page JSX remains the same */}
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div className="hidden md:block">
              <div className="text-gray-900 font-semibold text-lg">
                Marina Pharmacy
              </div>
              <div className="text-gray-500 text-sm">
                Task Management System
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span>Need help?</span>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Sign in to your account
              </h1>
              <p className="text-gray-600 text-lg">
                Don't have an account?{" "}
                <span className="text-emerald-600 font-semibold cursor-pointer hover:text-emerald-700">
                  Get started
                </span>
              </p>
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-5 mb-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    Demo Credentials
                  </p>
                  <p className="text-sm text-gray-700">
                    Use{" "}
                    <span className="font-semibold text-gray-900">
                      demo@marinapharma.com
                    </span>{" "}
                    with password{" "}
                    <span className="font-semibold text-gray-900">
                      MyStrongPass!
                    </span>
                  </p>
                </div>
              </div>
            </div>
            {showResetInfo && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm flex items-start gap-3">
                {/* <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />{" "}
                Optional: Add AlertTriangle import */}
                <span>
                  Please contact your HR Administrator or Manager to request a
                  password reset.
                </span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-3"
                >
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                {/* <div className="flex items-center justify-between mb-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowResetInfo(!showResetInfo)} // Toggle info visibility
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div> */}

                <div className="flex items-center justify-between mb-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordResetForm(!showPasswordResetForm)
                    }
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-12 text-base transition-all"
                    placeholder="Enter your password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-semibold text-base transition-all shadow-sm hover:shadow-md"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {showPasswordResetForm && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Request Password Reset
                  </CardTitle>
                  <CardDescription>
                    Enter your email address and we'll send your request to
                    management for approval.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* {resetSuccess && (
                    <Alert className="mb-4 border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">
                        {resetSuccess}
                      </AlertDescription>
                    </Alert>
                  )} */}
                  {resetSuccess && (
                    <Alert className="mb-4 border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">
                        {resetSuccess}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form
                    onSubmit={handlePasswordResetRequest}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="resetEmail">Email Address</Label>
                      <Input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="resetMessage">
                        Additional Message (Optional)
                      </Label>
                      <Textarea
                        id="resetMessage"
                        value={resetMessage}
                        onChange={(e) => setResetMessage(e.target.value)}
                        placeholder="Any additional information for management..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPasswordResetForm(false);
                          setResetEmail("");
                          setResetMessage("");
                          setError("");
                          setResetSuccess("");
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmittingReset}
                        className="flex-1"
                      >
                        {isSubmittingReset ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          "Submit Request"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
