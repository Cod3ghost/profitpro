import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Mobile header with menu trigger */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 lg:hidden sticky top-0 z-50">
          <SidebarTrigger className="flex items-center">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
          <Separator orientation="vertical" className="h-6" />
          <span className="font-semibold text-lg font-headline">ProfitPro</span>
        </header>

        {/* Main content */}
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t bg-background py-6 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-muted-foreground">
              <p>Developed by <span className="font-semibold text-foreground">NEXDATA CONSULTING LTD</span></p>
              <p className="mt-1">© {new Date().getFullYear()} ProfitPro. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
