"use client";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = window.location.origin + "/landing";
  },[])
  return (
    <main className="w-full h-screen flex items-center justify-center">
      <span className="text-xl font-semibold">Loading...</span>
    </main>
  );
}
