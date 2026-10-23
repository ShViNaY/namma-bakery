import Link from "next/link";
import { ArrowRight, Sparkles, MessageSquare, CheckCircle2, Send } from "lucide-react";

export function CustomCakeFeature() {
  const steps = [
    {
      number: "1",
      title: "Send Your Request",
      title_kn: "ವಿನಂತಿ ಕಳುಹಿಸಿ",
      description:
        "Select your flavour, weight, egg preference, design theme, and optionally attach a reference photo.",
      icon: Send,
    },
    {
      number: "2",
      title: "Bakery Reviews & Quotes",
      title_kn: "ಬೇಕರಿ ಪರಿಶೀಲನೆ",
      description:
        "Our team reviews the design, confirms preparation time, and provides a clear price quote with pickup schedule.",
      icon: MessageSquare,
    },
    {
      number: "3",
      title: "Confirm & Pick Up",
      title_kn: "ಖಚಿತಪಡಿಸಿ ಸಂಗ್ರಹಿಸಿ",
      description:
        "Review your quote online, accept with one tap, and pay at the bakery counter when you collect.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="bg-cocoa text-cream py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-sm border border-cream/20 bg-cream/10 px-3 py-1 text-xs text-cream/90">
            <Sparkles className="h-3.5 w-3.5 text-caramel" />
            <span className="font-kannada font-medium">ನಿಮ್ಮಿಷ್ಟದಂತೆ ವಿನ್ಯಾಸಗೊಳಿಸಿದ ಕೇಕುಗಳು</span>
          </div>

          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
            Want Something Made Your Way?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/80 sm:text-base">
            Looking for a theme cake or celebration bake outside our standard menu?
            Send us a custom request. We review your details and confirm everything with you
            before baking.
          </p>
        </div>

        {/* 3-Step Process Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative rounded-sm border border-cream/15 bg-cream/5 p-6 backdrop-blur-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-cream/10 text-caramel">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-heading text-2xl font-bold text-cream/30">
                    0{step.number}
                  </span>
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-heading text-lg font-semibold text-cream">
                      {step.title}
                    </h3>
                    <span className="font-kannada text-xs text-cream/60">
                      {step.title_kn}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-cream/75 sm:text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-cream/15 pt-8">
          <p className="text-xs text-cream/70">
            Requests are reviewed daily during bakery hours. No payment required until pickup.
          </p>
          <Link
            href="/custom-cake"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-sm bg-caramel px-6 text-sm font-semibold text-cream transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream"
          >
            <span>Start a Custom Cake Request</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
