
// src/app/admin/screens/new/page.tsx
import { ScreenForm } from "@/components/admin/screen-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewScreenPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Add New Screen</CardTitle>
          <CardDescription>Fill in the details for the new video screen.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScreenForm />
        </CardContent>
      </Card>
    </div>
  );
}
