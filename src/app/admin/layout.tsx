
import { verifyAdminSession, adminLogout } from "@/lib/actions";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard, LogOut, Tv2 } from "lucide-react"; // Added Tv2 icon
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware handles auth, but this can be a server-side check too.
  // const isAdmin = await verifyAdminSession();
  // if (!isAdmin) {
  //   redirect("/admin/login");
  // }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4">
            <Link href="/admin" className="flex items-center gap-2 font-bold text-lg font-headline">
              <LayoutDashboard className="w-6 h-6 text-primary" />
              <span className="group-data-[collapsible=icon]:hidden">Admin Panel</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={true} tooltip="Bookings"> 
                  <Link href="/admin">
                    <LayoutDashboard />
                    <span className="group-data-[collapsible=icon]:hidden">Bookings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Manage Screens">
                  <Link href="/admin/screens">
                    <Tv2 />
                    <span className="group-data-[collapsible=icon]:hidden">Manage Screens</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2">
             <form action={adminLogout} className="w-full">
                <SidebarMenuButton type="submit" className="w-full" tooltip="Logout">
                  <LogOut />
                  <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                </SidebarMenuButton>
              </form>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1">
           <header className="p-4 border-b flex items-center justify-between md:justify-end">
            <SidebarTrigger className="md:hidden" />
            <div className="text-sm text-muted-foreground">ScreenTime Booking Admin</div>
          </header>
          <main className="p-4 md:p-6 lg:p-8 bg-background flex-1">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
