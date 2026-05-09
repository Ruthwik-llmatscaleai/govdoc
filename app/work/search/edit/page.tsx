import { ComingSoon } from "@/components/work/coming-soon";

export default function Page() {
  return (
    <ComingSoon
      title="Edit Rubrics"
      blurb="Adjust questions, options, and weights for any review type. Saved edits will auto-apply to subsequent reviews."
      backHref="/work/search"
    />
  );
}
