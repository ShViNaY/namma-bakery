import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { getCustomCakePublicViewAction } from "@/lib/custom-cake/actions";
import { CustomCakeConfirmation } from "@/components/custom-cake/custom-cake-confirmation";

export const instant = false;

export const metadata: Metadata = {
  title: "Custom Cake Enquiry Confirmation",
  description: "Your custom celebration cake enquiry confirmation and details.",
  robots: {
    index: false,
    follow: false,
  },
};

interface ConfirmationPageProps {
  params: Promise<{ token: string }>;
}

export default async function CustomCakeConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const { token } = await params;

  const result = await getCustomCakePublicViewAction(token);

  if (!result.success || !result.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Enquiry Not Found
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {result.error ||
            "We could not find a custom cake enquiry matching this confirmation link. Please verify the URL."}
        </p>
        <div className="pt-2">
          <Link
            href="/custom-cake"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm bg-caramel px-4 text-xs font-semibold text-white hover:bg-caramel/90"
          >
            <ArrowLeft className="size-3.5" />
            <span>Submit a New Enquiry</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <CustomCakeConfirmation request={result.data} />
    </div>
  );
}
