import { LayoutGrid, ShieldCheck, Sparkles, Layers, Lock, BadgeCheck } from "lucide-react";
import { LoginForm } from "@/components/login/login-form";
import { CaSeal } from "@/components/brand/ca-seal";

const principles = [
  { icon: LayoutGrid, text: "Three screens, many functions" },
  { icon: Sparkles, text: "No training required" },
  { icon: ShieldCheck, text: "Human always in control" },
  { icon: Layers, text: "Same shell, every document type" },
];

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      {/* Left: GovDoc branding panel */}
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
          {/* Wordmark */}
          <div className="flex items-center gap-4">
            <CaSeal size={56} />
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                GovDoc
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="h-px w-6 bg-primary/60" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  State of California
                </span>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="max-w-lg">
            <h2 className="text-[2.5rem] font-semibold leading-[1.15] text-foreground">
              Document intelligence
              <br />
              for every State program.{" "}
              <span className="text-primary">One shell.</span>
            </h2>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Read, understand, and act on any document the State produces or
              receives — with citations on every answer and a human approving
              every consequential action.
            </p>

            <ul className="mt-10 space-y-4">
              {principles.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/[0.07] ring-1 ring-primary/15">
                    <Icon className="size-[18px] text-primary" />
                  </div>
                  <span className="text-sm text-foreground/75">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Compliance badges */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge icon={Lock} label="FedRAMP-aligned cloud" />
            <Badge icon={ShieldCheck} label="CDT-aligned" />
            <Badge icon={BadgeCheck} label="CPRA-ready audit log" />
          </div>
        </div>
      </div>

      {/* Right: Sign-in card */}
      <div className="flex w-full flex-col lg:w-[45%]">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-14">
          {/* Mobile-only brand */}
          <div className="mb-8 flex w-full max-w-[400px] items-center gap-3 lg:hidden">
            <CaSeal size={44} />
            <div>
              <div className="text-xl font-bold tracking-tight">GovDoc</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                State of California
              </div>
            </div>
          </div>

          <div className="w-full max-w-[400px]">
            <div className="mb-7">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Sign in to continue
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Use your State of California credentials.
              </p>
            </div>

            <LoginForm />

            <p className="mt-10 text-center text-[11px] leading-relaxed text-muted-foreground/70">
              © {new Date().getFullYear()} State of California — GovDoc
              <br />
              Built by LLM at Scale.AI · Confidential and Proprietary
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({
  icon: Icon,
  label,
}: {
  icon: typeof Lock;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-background/80 px-3.5 py-1.5 ring-1 ring-border">
      <Icon className="size-3.5 text-primary/80" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
