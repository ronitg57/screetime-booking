
// src/app/admin/screens/[screenId]/edit/page.tsx
import { getScreenById } from "@/lib/actions";
import { ScreenForm } from "@/components/admin/screen-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

interface EditScreenPageProps {
  params: {
    screenId: string;
  };
}

export default async function EditScreenPage({ params }: EditScreenPageProps) {
  const screen = await getScreenById(params.screenId);

  if (!screen) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Edit Screen: {screen.name}</CardTitle>
          <CardDescription>Update the details for this video screen.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScreenForm initialData={screen} />
        </CardContent>
      </Card>
    </div>
  );
}

export const dynamic = 'force-dynamic';
