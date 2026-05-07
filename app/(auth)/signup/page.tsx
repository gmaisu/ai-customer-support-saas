import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Sign up — Helpforge",
};

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Forge your first bot</CardTitle>
        <CardDescription>Create a free account. No credit card required.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignupForm />
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
