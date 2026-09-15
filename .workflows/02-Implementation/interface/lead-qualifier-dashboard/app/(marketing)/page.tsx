import { Hero } from "@/components/marketing/Hero";
import { ProblemSolution } from "@/components/marketing/ProblemSolution";
import { FeatureZigzag } from "@/components/marketing/FeatureZigzag";
import { ComparisonSection } from "@/components/marketing/ComparisonSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { BookDemoSection } from "@/components/marketing/BookDemoSection";
import { FinalCta } from "@/components/marketing/FinalCta";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSolution />
      <FeatureZigzag />
      <ComparisonSection />
      <PricingSection />
      <FaqSection />
      <BookDemoSection />
      <FinalCta />
    </>
  );
}
