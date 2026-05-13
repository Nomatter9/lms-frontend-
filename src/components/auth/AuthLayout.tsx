import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060D1F] p-4">
      <div className="w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}