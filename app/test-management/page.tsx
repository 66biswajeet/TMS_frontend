"use client";

import { BranchWiseUsers } from "@/components/admin/branch-wise-users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestManagementPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Management Hierarchy Test</CardTitle>
          <CardDescription>
            Testing the branch-wise user management component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BranchWiseUsers />
        </CardContent>
      </Card>
    </div>
  );
}