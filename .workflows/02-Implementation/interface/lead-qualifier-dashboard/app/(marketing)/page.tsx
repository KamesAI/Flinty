import { Hero } from "@/components/marketing/Hero";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { FeatureZigzag } from "@/components/marketing/FeatureZigzag";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ResultsSection } from "@/components/marketing/ResultsSection";
import { ComparisonSection } from "@/components/marketing/ComparisonSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { BookDemoSection } from "@/components/marketing/BookDemoSection";
import { FinalCta } from "@/components/marketing/FinalCta";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <FeatureZigzag />
      <HowItWorks />
      <ResultsSection />
      <ComparisonSection />
      <PricingSection />
      <FaqSection />
      <BookDemoSection />
      <FinalCta />
    </>
  );
}
