import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Sign in — Helpforge",
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your Helpforge account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p className="text-muted-foreground text-center text-sm">
          New here?{" "}
          <Link href="/signup" className="text-foreground font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
