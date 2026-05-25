import { PageHeader } from "@/components/shared/page-header";
import { PageFooter } from "@/components/shared/page-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { ProcessFlow } from "@/components/landing/process-flow";
import { ComparisonTable } from "@/components/landing/comparison-table";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader showAuth />
      <main className="flex-1">
        <HeroSection />
        <ProcessFlow />
        <ComparisonTable />
      </main>
      <PageFooter />
    </div>
  );
}
