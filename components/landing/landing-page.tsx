import { PageHeader } from "@/components/shared/page-header";
import { PageFooter } from "@/components/shared/page-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { ProcessFlow } from "@/components/landing/process-flow";
import { ComparisonTable } from "@/components/landing/comparison-table";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F3EEE0]">
      <PageHeader showAuth />
      <main className="flex-1">
        <div className="govdoc-grid-bg">
          <HeroSection />
          <div className="govdoc-page-pad">
            <div className="govdoc-page-inner">
              <hr className="border-t border-[#d8d0bc]" />
            </div>
          </div>
          <ProcessFlow />
          <ComparisonTable />
        </div>
      </main>
      <PageFooter />
    </div>
  );
}
