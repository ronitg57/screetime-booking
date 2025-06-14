
// src/app/admin/screens/page.tsx
import { getScreens } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Trash2 } from "lucide-react";
import Image from "next/image";
import { ScreenDeleteButton } from "@/components/admin/screen-delete-button";

export default async function ManageScreensPage() {
  const screens = await getScreens();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Screens</h1>
          <p className="text-muted-foreground">View or remove video screens. Add or edit screens directly in the database.</p>
        </div>
        {/* Add New Screen Button Removed */}
      </div>

      {screens.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Screens Found</h3>
            <p className="text-muted-foreground mb-4">Screens are managed directly in the database.</p>
            {/* Link to add screen removed */}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Specs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {screens.map((screen) => (
                <TableRow key={screen.id}>
                  <TableCell>
                    <Image
                      src={screen.imageUrl || "https://placehold.co/100x75.png"}
                      alt={screen.name}
                      width={64}
                      height={48}
                      className="rounded object-cover aspect-[4/3]"
                      data-ai-hint={screen.dataAiHint || "screen"}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{screen.name}</TableCell>
                  <TableCell>{screen.location}</TableCell>
                  <TableCell className="text-xs max-w-xs truncate">{screen.specs}</TableCell>
                  <TableCell className="text-right">
                    {/* Edit Button Removed */}
                    <ScreenDeleteButton screenId={screen.id} screenName={screen.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
