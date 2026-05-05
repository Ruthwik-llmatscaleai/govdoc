import { LoginForm } from "@/components/login/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
      <div className="space-y-6 w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-govdoc-primary">GovDoc</h1>
          <p className="text-sm text-neutral-600 mt-1">State of California document intelligence</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
