import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project settings</CardTitle>
        <CardDescription>Coming in Phase 5 (TASK-505).</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Edit name, brand color, greeting, fallback message, and generate the embed snippet here.
          For now you can rename projects via SQL, or delete them from the project header.
        </p>
      </CardContent>
    </Card>
  );
}
