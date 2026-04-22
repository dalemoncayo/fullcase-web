'use client';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  );
}
