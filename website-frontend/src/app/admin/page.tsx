"use client";

import { useEffect } from "react";
import { useWebsite } from "@/context/WebsiteContext";
import HomePage from "@/app/page";

export default function AdminEntryPage() {
  const { setAdminOpen } = useWebsite();
  useEffect(() => {
    setAdminOpen(true);
  }, [setAdminOpen]);
  return <HomePage />;
}
