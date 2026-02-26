import type { ReactNode } from "react";
import Navbar from "./Navbar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Navbar />
      <main
        className="pt-50 sm:px-6 max-w-6xl mx-auto"
        style={{ paddingTop: "80px" }} // 👈 esto fuerza el espacio
      >
        {children}
      </main>
      <footer className="mt-12 text-center text-sm text-gray-500 py-6">
        © {new Date().getFullYear()} IAM Paraná — Ventas del area de comunicación.
      </footer>
    </div>
  );
}
