import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Track Order",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackPage() {
  redirect("/orders");
}
