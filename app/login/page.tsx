import { LoginForm } from "@/components/login/login-form";
import { AppLogo } from "@/components/brand/app-logo";
import { CapabilityPill } from "@/components/login/capability-pill";

const capabilities = [
  { label: "Document Compare", dotColor: "oklch(0.55 0.18 295)" },
  { label: "Regulatory Watch", dotColor: "oklch(0.72 0.16 50)" },
  { label: "Decision Support", dotColor: "oklch(0.62 0.20 350)" },
];

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      {/* Left: branding panel */}
      <div className="relative hidden w-[55%] flex-col justify-between border-r border-border bg-[var(--color-govdoc-tint)] lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-14">
          <div className="flex items-center gap-4">
            <AppLogo size={80} />
          </div>

          <div className="max-w-lg">
            <h2
              className="text-[2.5rem] font-semibold leading-[1.15] text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Document intelligence
              <br />
              built for review at scale.{" "}
              <span className="text-primary">Auditable AI.</span>
            </h2>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Read, understand, and act on any document — with citations on
              every answer and a human approving every consequential action.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {capabilities.map((c) => (
                <CapabilityPill
                  key={c.label}
                  label={c.label}
                  dotColor={c.dotColor}
                />
              ))}
            </div>
          </div>

          <div />
        </div>
      </div>

      {/* Right: Sign-in card */}
      <div className="flex w-full flex-col lg:w-[45%]">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-14">
          {/* Mobile-only brand */}
          <div className="mb-8 flex w-full max-w-[400px] justify-center lg:hidden">
            <AppLogo size={64} />
          </div>

          <div className="w-full max-w-[400px]">
            <div className="mb-7">
              <h1
                className="text-2xl font-semibold tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sign in to continue
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Use your administrator-issued credentials.
              </p>
            </div>

            <LoginForm />

            <p className="mt-10 text-center text-[11px] leading-relaxed text-muted-foreground/70">
              © {new Date().getFullYear()} LLM at Scale.AI
              <br />
              Confidential and Proprietary
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
