export function RubricShell({
  intro,
  children,
}: {
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {intro}
      <div className="flex flex-col border border-[var(--color-line)] bg-[var(--color-paper)]">
        {children}
      </div>
    </div>
  );
}
