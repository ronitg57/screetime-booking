
// src/app/admin/screens/page.tsx
import { getScreens, deleteScreenAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { ScreenDeleteButton } from "@/components/admin/screen-delete-button"; // We'll create this

export default async function ManageScreensPage() {
  const screens = await getScreens();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Screens</h1>
          <p className="text-muted-foreground">Add, edit, or remove video screens.</p>
        </div>
        <Button asChild>
          <Link href="/admin/screens/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Screen
          </Link>
        </Button>
      </div>

      {screens.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Screens Found</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first screen.</p>
            <Button asChild>
              <Link href="/admin/screens/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Screen
              </Link>
            </Button>
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
                    <Button variant="ghost" size="icon" asChild className="mr-2">
                      <Link href={`/admin/screens/${screen.id}/edit`} aria-label="Edit screen">
                        <Edit3 className="h-4 w-4" />
                      </Link>
                    </Button>
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
