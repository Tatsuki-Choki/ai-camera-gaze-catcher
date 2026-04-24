import React from 'react';

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ sidebar, children }) => (
  <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef4ff_45%,#f8fafc_100%)] text-slate-950">
    <div className="flex min-h-screen flex-col lg:flex-row">
      {sidebar}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  </div>
);
