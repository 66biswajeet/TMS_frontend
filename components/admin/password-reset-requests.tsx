// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   CheckCircle,
//   XCircle,
//   Clock,
//   User,
//   Mail,
//   Calendar,
//   Eye,
//   EyeOff,
// } from "lucide-react";
// import { api } from "@/lib/axios";

// interface PasswordResetRequest {
//   RequestId: string;
//   UserId: string;
//   UserEmail: string;
//   UserName: string;
//   UserRole: string;
//   RequestMessage?: string;
//   Status: "pending" | "approved" | "rejected";
//   RequestedAt: string;
//   ProcessedBy?: string;
//   ProcessedAt?: string;
//   ResolutionNotes?: string;
//   TemporaryPassword?: string;
// }

// export function PasswordResetRequests() {
//   const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState<string | null>(null);
//   const [selectedRequest, setSelectedRequest] =
//     useState<PasswordResetRequest | null>(null);
//   const [showDetailsDialog, setShowDetailsDialog] = useState(false);
//   const [showTempPasswordDialog, setShowTempPasswordDialog] = useState(false);
//   const [resolutionNotes, setResolutionNotes] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   useEffect(() => {
//     fetchRequests();
//   }, []);

//   const fetchRequests = async () => {
//     try {
//       const response = await api.get("/password-reset-requests/all");
//       setRequests(response.data.requests);
//     } catch (err: any) {
//       console.error("Error fetching requests:", err);
//       setError("Failed to fetch password reset requests");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleProcessRequest = async (
//     requestId: string,
//     action: "approve" | "reject"
//   ) => {
//     setProcessing(requestId);
//     setError("");
//     setSuccess("");

//     try {
//       const response = await api.post(
//         `/password-reset-requests/${requestId}/process`,
//         {
//           action,
//           resolutionNotes: resolutionNotes || undefined,
//         }
//       );

//       if (response.data.success) {
//         setSuccess(response.data.message);

//         if (action === "approve" && response.data.temporaryPassword) {
//           setSelectedRequest(
//             requests.find((r) => r.RequestId === requestId) || null
//           );
//           setShowTempPasswordDialog(true);
//         }

//         // Refresh the list
//         await fetchRequests();
//         setShowDetailsDialog(false);
//         setResolutionNotes("");
//       }
//     } catch (err: any) {
//       console.error("Error processing request:", err);
//       setError(err.response?.data?.message || "Failed to process request");
//     } finally {
//       setProcessing(null);
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "pending":
//         return (
//           <Badge
//             variant="outline"
//             className="text-yellow-600 border-yellow-600"
//           >
//             <Clock className="w-3 h-3 mr-1" />
//             Pending
//           </Badge>
//         );
//       case "approved":
//         return (
//           <Badge variant="outline" className="text-green-600 border-green-600">
//             <CheckCircle className="w-3 h-3 mr-1" />
//             Approved
//           </Badge>
//         );
//       case "rejected":
//         return (
//           <Badge variant="outline" className="text-red-600 border-red-600">
//             <XCircle className="w-3 h-3 mr-1" />
//             Rejected
//           </Badge>
//         );
//       default:
//         return <Badge variant="outline">{status}</Badge>;
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleString();
//   };

//   const getRoleDisplayName = (role: string) => {
//     const roleMap: Record<string, string> = {
//       admin: "Administrator",
//       management: "Management",
//       area_manager: "Area Manager",
//       branch_manager: "Branch Manager",
//       auditor: "Auditor",
//       staff: "Staff Member",
//     };
//     return roleMap[role] || role;
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center p-8">
//         <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">
//             Password Reset Requests
//           </h2>
//           <p className="text-gray-600">Manage user password reset requests</p>
//         </div>
//         <Button onClick={fetchRequests} variant="outline">
//           Refresh
//         </Button>
//       </div>

//       {error && (
//         <Alert className="border-red-200 bg-red-50">
//           <AlertDescription className="text-red-800">{error}</AlertDescription>
//         </Alert>
//       )}

//       {success && (
//         <Alert className="border-green-200 bg-green-50">
//           <AlertDescription className="text-green-800">
//             {success}
//           </AlertDescription>
//         </Alert>
//       )}

//       <Card>
//         <CardHeader>
//           <CardTitle>All Requests ({requests.length})</CardTitle>
//           <CardDescription>
//             Review and process password reset requests from users
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {requests.length === 0 ? (
//             <div className="text-center py-8 text-gray-500">
//               No password reset requests found
//             </div>
//           ) : (
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>User</TableHead>
//                   <TableHead>Email</TableHead>
//                   <TableHead>Role</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Requested</TableHead>
//                   <TableHead>Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {requests.map((request) => (
//                   <TableRow key={request.RequestId}>
//                     <TableCell className="font-medium">
//                       <div className="flex items-center gap-2">
//                         <User className="w-4 h-4 text-gray-400" />
//                         {request.UserName}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Mail className="w-4 h-4 text-gray-400" />
//                         {request.UserEmail}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant="secondary">
//                         {getRoleDisplayName(request.UserRole)}
//                       </Badge>
//                     </TableCell>
//                     <TableCell>{getStatusBadge(request.Status)}</TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Calendar className="w-4 h-4 text-gray-400" />
//                         {formatDate(request.RequestedAt)}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           setSelectedRequest(request);
//                           setShowDetailsDialog(true);
//                         }}
//                       >
//                         <Eye className="w-4 h-4 mr-1" />
//                         View Details
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           )}
//         </CardContent>
//       </Card>

//       {/* Details Dialog */}
//       <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Password Reset Request Details</DialogTitle>
//             <DialogDescription>
//               Review the request details and take appropriate action
//             </DialogDescription>
//           </DialogHeader>

//           {selectedRequest && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label className="text-sm font-medium text-gray-500">
//                     User Name
//                   </Label>
//                   <p className="text-sm">{selectedRequest.UserName}</p>
//                 </div>
//                 <div>
//                   <Label className="text-sm font-medium text-gray-500">
//                     Email
//                   </Label>
//                   <p className="text-sm">{selectedRequest.UserEmail}</p>
//                 </div>
//                 <div>
//                   <Label className="text-sm font-medium text-gray-500">
//                     Role
//                   </Label>
//                   <p className="text-sm">
//                     {getRoleDisplayName(selectedRequest.UserRole)}
//                   </p>
//                 </div>
//                 <div>
//                   <Label className="text-sm font-medium text-gray-500">
//                     Status
//                   </Label>
//                   <div className="mt-1">
//                     {getStatusBadge(selectedRequest.Status)}
//                   </div>
//                 </div>
//                 <div>
//                   <Label className="text-sm font-medium text-gray-500">
//                     Requested At
//                   </Label>
//                   <p className="text-sm">
//                     {formatDate(selectedRequest.RequestedAt)}
//                   </p>
//                 </div>
//                 {selectedRequest.ProcessedAt && (
//                   <div>
//                     <Label className="text-sm font-medium text-gray-500">
//                       Processed At
//                     </Label>
//                     <p className="text-sm">
//                       {formatDate(selectedRequest.ProcessedAt)}
//                     </p>
//                   </div>
//                 )}
//               </div>

//               {selectedRequest.RequestMessage && (
//                 <div>
//                   <Label className="text-sm font-medium text-gray-500">
//                     User Message
//                   </Label>
//                   <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">
//                     {selectedRequest.RequestMessage}
//                   </p>
//                 </div>
//               )}

//               {selectedRequest.ResolutionNotes && (
//                 <div>
//                   <Label className="text-sm font-medium text-gray-500">
//                     Resolution Notes
//                   </Label>
//                   <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">
//                     {selectedRequest.ResolutionNotes}
//                   </p>
//                 </div>
//               )}

//               {selectedRequest.Status === "pending" && (
//                 <div>
//                   <Label htmlFor="resolutionNotes">Resolution Notes</Label>
//                   <Textarea
//                     id="resolutionNotes"
//                     value={resolutionNotes}
//                     onChange={(e) => setResolutionNotes(e.target.value)}
//                     placeholder="Add notes about your decision..."
//                     className="mt-1"
//                     rows={3}
//                   />
//                 </div>
//               )}
//             </div>
//           )}

//           <DialogFooter>
//             {selectedRequest?.Status === "pending" && (
//               <>
//                 <Button
//                   variant="outline"
//                   onClick={() => setShowDetailsDialog(false)}
//                 >
//                   Cancel
//                 </Button>
//                 {/* <Button
//                   variant="outline"
//                   onClick={() =>
//                     handleProcessRequest(selectedRequest!.RequestId, "reject")
//                   }
//                   disabled={processing === selectedRequest?.RequestId}
//                   className="text-red-600 border-red-600 hover:bg-red-50"
//                 >
//                   {processing === selectedRequest?.RequestId ? (
//                     <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
//                   ) : (
//                     <XCircle className="w-4 h-4 mr-2" />
//                   )}
//                   Reject
//                 </Button>
//                 <Button
//                   onClick={() =>
//                     handleProcessRequest(selectedRequest!.RequestId, "approve")
//                   }
//                   disabled={processing === selectedRequest?.RequestId}
//                 >
//                   {processing === selectedRequest?.RequestId ? (
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
//                   ) : (
//                     <CheckCircle className="w-4 h-4 mr-2" />
//                   )}
//                   Approve
//                 </Button> */}
//               </>
//             )}
//             {selectedRequest?.Status !== "pending" && (
//               <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
//             )}
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Temporary Password Dialog */}
//       <Dialog
//         open={showTempPasswordDialog}
//         onOpenChange={setShowTempPasswordDialog}
//       >
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Password Reset Approved</DialogTitle>
//             <DialogDescription>
//               The user's password has been reset. Please provide them with this
//               temporary password.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-4">
//             <div>
//               <Label className="text-sm font-medium text-gray-500">User</Label>
//               <p className="text-sm font-medium">{selectedRequest?.UserName}</p>
//             </div>
//             <div>
//               <Label className="text-sm font-medium text-gray-500">Email</Label>
//               <p className="text-sm">{selectedRequest?.UserEmail}</p>
//             </div>
//             <div>
//               <Label className="text-sm font-medium text-gray-500">
//                 Temporary Password
//               </Label>
//               <div className="flex items-center gap-2 mt-1">
//                 <code className="flex-1 bg-gray-100 p-2 rounded font-mono text-sm">
//                   {selectedRequest?.TemporaryPassword}
//                 </code>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => {
//                     navigator.clipboard.writeText(
//                       selectedRequest?.TemporaryPassword || ""
//                     );
//                   }}
//                 >
//                   Copy
//                 </Button>
//               </div>
//             </div>
//             <Alert>
//               <AlertDescription>
//                 <strong>Important:</strong> The user must use this temporary
//                 password to log in and will be forced to change it immediately.
//               </AlertDescription>
//             </Alert>
//           </div>

//           <DialogFooter>
//             <Button onClick={() => setShowTempPasswordDialog(false)}>
//               Close
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  Eye,
} from "lucide-react";
import { api } from "@/lib/axios";

interface PasswordResetRequest {
  RequestId: string;
  UserId: string;
  UserEmail: string;
  UserName: string;
  UserRole: string;
  RequestMessage?: string;
  Status: "pending" | "approved" | "rejected";
  RequestedAt: string;
  ProcessedBy?: string;
  ProcessedAt?: string;
  ResolutionNotes?: string;
  TemporaryPassword?: string;
}

export function PasswordResetRequests() {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<PasswordResetRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showTempPasswordDialog, setShowTempPasswordDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get("/password-reset-requests/all");
      setRequests(response.data.requests);
    } catch (err: any) {
      console.error("Error fetching requests:", err);
      setError("Failed to fetch password reset requests");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Directly call the existing admin-reset endpoint
  const handleAdminReset = async (
    userId: string,
    request?: PasswordResetRequest
  ) => {
    setProcessing(userId);
    setError("");
    setSuccess("");

    try {
      const response = await api.post(`/users/${userId}/admin-reset-password`);
      // Expecting: { ok: true, message: string, temporaryPassword: string }
      if (response?.data?.ok && response?.data?.temporaryPassword) {
        const tempPass = response.data.temporaryPassword;

        // Attach temp pass to selected request (for dialog display)
        const reqForModal = request ||
          requests.find((r) => r.UserId === userId) || {
            RequestId: "",
            UserId: userId,
            UserEmail: "",
            UserName: "",
            UserRole: "staff",
            Status: "approved",
            RequestedAt: new Date().toISOString(),
          };

        const enriched: PasswordResetRequest = {
          ...reqForModal,
          TemporaryPassword: tempPass,
          Status: "approved",
        };

        setSelectedRequest(enriched);
        setShowTempPasswordDialog(true);
        setSuccess("Temporary password generated successfully.");

        // Optional: refresh the list so status columns look up-to-date if backend updates them elsewhere
        await fetchRequests();
      } else {
        throw new Error(response?.data?.message || "Failed to reset password.");
      }
    } catch (err: any) {
      console.error("Admin reset failed:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to reset password."
      );
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: "Administrator",
      management: "Management",
      area_manager: "Area Manager",
      branch_manager: "Branch Manager",
      auditor: "Auditor",
      staff: "Staff Member",
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Password Reset Requests
          </h2>
          <p className="text-gray-600">Manage user password reset requests</p>
        </div>
        <Button onClick={fetchRequests} variant="outline">
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Requests ({requests.length})</CardTitle>
          <CardDescription>
            Review and process password reset requests from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No password reset requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.RequestId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {request.UserName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {request.UserEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getRoleDisplayName(request.UserRole)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.Status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(request.RequestedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>

                      <Button
                        size="sm"
                        disabled={processing === request.UserId}
                        onClick={() =>
                          handleAdminReset(request.UserId, request)
                        }
                      >
                        {processing === request.UserId ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        Generate Temp Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Password Reset Request Details</DialogTitle>
            <DialogDescription>
              Review the request and generate a temporary password if needed
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    User Name
                  </Label>
                  <p className="text-sm">{selectedRequest.UserName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Email
                  </Label>
                  <p className="text-sm">{selectedRequest.UserEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Role
                  </Label>
                  <p className="text-sm">
                    {getRoleDisplayName(selectedRequest.UserRole)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Status
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRequest.Status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Requested At
                  </Label>
                  <p className="text-sm">
                    {formatDate(selectedRequest.RequestedAt)}
                  </p>
                </div>
                {selectedRequest.ProcessedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Processed At
                    </Label>
                    <p className="text-sm">
                      {formatDate(selectedRequest.ProcessedAt)}
                    </p>
                  </div>
                )}
              </div>

              {selectedRequest.RequestMessage && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    User Message
                  </Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">
                    {selectedRequest.RequestMessage}
                  </p>
                </div>
              )}

              {selectedRequest.ResolutionNotes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Resolution Notes
                  </Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">
                    {selectedRequest.ResolutionNotes}
                  </p>
                </div>
              )}

              {/* Optional notes field to record remarks before generating */}
              <div>
                <Label htmlFor="resolutionNotes">Notes (optional)</Label>
                <Textarea
                  id="resolutionNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add a note before generating a temporary password..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
            {selectedRequest && (
              <Button
                disabled={processing === selectedRequest.UserId}
                onClick={() =>
                  handleAdminReset(selectedRequest.UserId, selectedRequest)
                }
              >
                {processing === selectedRequest.UserId ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Generate Temp Password
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Temporary Password Dialog */}
      <Dialog
        open={showTempPasswordDialog}
        onOpenChange={setShowTempPasswordDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Confirmation</DialogTitle>
            <DialogDescription>
              Password has been reset. Please securely communicate the following
              temporary password to the user:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">
                For User
              </Label>
              <p className="text-sm font-medium">{selectedRequest?.UserName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Temporary Password
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-gray-100 p-2 rounded font-mono text-sm">
                  {selectedRequest?.TemporaryPassword}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      selectedRequest?.TemporaryPassword || ""
                    );
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <Alert>
              <AlertDescription className="text-red-600">
                IMPORTANT: Instruct the user to change this password immediately
                after logging in.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowTempPasswordDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
