
"use client";

import type { Screen } from "@/lib/types";
import { ScreenUpsertSchema, type ScreenUpsertData } from "@/lib/schemas"; // Updated import path
import { createScreenAction, updateScreenAction } from "@/lib/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";

interface ScreenFormProps {
  initialData?: Screen | null;
}

export function ScreenForm({ initialData }: ScreenFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ScreenUpsertData>({
    resolver: zodResolver(ScreenUpsertSchema),
    defaultValues: {
      name: initialData?.name || "",
      location: initialData?.location || "",
      specs: initialData?.specs || "",
      imageUrl: initialData?.imageUrl || "",
      dataAiHint: initialData?.dataAiHint || "",
    },
  });

  const onSubmit = (values: ScreenUpsertData) => {
    startTransition(async () => {
      const action = initialData
        ? updateScreenAction.bind(null, initialData.id)
        : createScreenAction;
      
      const result = await action(values);

      if (result.success) {
        toast({
          title: `Screen ${initialData ? 'Updated' : 'Created'}`,
          description: `Screen "${values.name}" has been successfully ${initialData ? 'updated' : 'created'}.`,
        });
        router.push("/admin/screens");
        router.refresh(); // Refresh the list page
      } else {
        toast({
          title: `Error ${initialData ? 'Updating' : 'Creating'} Screen`,
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        });
        if (result.issues) {
          result.issues.forEach(issue => {
            form.setError(issue.path.join(".") as keyof ScreenUpsertData, { message: issue.message });
          });
        }
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Screen Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Library Entrance Display" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Main Library, Ground Floor" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specifications</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g. 55\" LED, 4K Resolution, Touchscreen" {...field} rows={3} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://placehold.co/600x400.png" {...field} value={field.value ?? ""} disabled={isPending}/>
              </FormControl>
              <FormDescription>Direct link to the screen image. Leave blank for default.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="dataAiHint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Image Hint</FormLabel>
              <FormControl>
                <Input placeholder="e.g. library entrance" {...field} value={field.value ?? ""} disabled={isPending}/>
              </FormControl>
              <FormDescription>One or two keywords for placeholder image generation (e.g., "tech hub", "lounge display").</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
           <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            <RotateCcw className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {initialData ? 'Save Changes' : 'Create Screen'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
