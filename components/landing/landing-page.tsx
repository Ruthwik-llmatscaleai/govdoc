import { PageHeader } from "@/components/shared/page-header";
import { PageFooter } from "@/components/shared/page-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { ProcessFlow } from "@/components/landing/process-flow";
import { ComparisonTable } from "@/components/landing/comparison-table";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#efeadd]">
      <PageHeader showAuth />
      <main className="flex-1">
        <div
          style={{
            backgroundImage: "url('/landing/grid-bg.svg')",
            backgroundRepeat: "repeat",
            backgroundSize: "56px 56px",
            backgroundColor: "#efeadd",
          }}
        >
          <HeroSection />
          <div className="px-6 lg:px-10">
            <div className="ml-[3%] lg:ml-[3.5%]">
              <hr className="border-t border-[#d8d0bc]" />
            </div>
          </div>
          <ProcessFlow />
        </div>
        <ComparisonTable />
      </main>
      <PageFooter />
    </div>
  );
}
