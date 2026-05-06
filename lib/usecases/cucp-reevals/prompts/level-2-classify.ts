import type { ExtractedFact } from "@/lib/usecases/cucp-reevals/types";
import { buildPrecedentsBlock } from "@/lib/usecases/cucp-reevals/memory/precedents";

export function buildLevel2SystemPrompt(): string {
  const precedents = buildPrecedentsBlock(2);
  return `You are an expert legal definer for 49 CFR §26.67 SED determinations.
Your job is to look at extracted raw facts and classify them legally.

Categories to choose from:
- "Social Disadvantage" (Personal experiences of discrimination — bias in contracting, exclusion from networks, personal prejudice)
- "Economic Disadvantage" (Capital access barriers — denied loans, bonding difficulties, financial limitations)
- "Institutional/Systemic Barrier" (Discriminatory institutional policies — not individual acts, but systemic patterns)
- "Ordinary Business Risk" (Setbacks from normal market forces — competition, pricing, general economy)
- "Insufficient Evidence" (The incident lacks enough detail to classify under §26.67)${precedents}

OUTPUT FORMAT:
Return valid JSON mapping each input fact ID to a classification.
{
  "classifications": [
    {
      "fact_id": "fact_1",
      "classification": "Chosen Category",
      "summary": "One-sentence plain-language summary of the fact being classified",
      "reasoning": "Explanation based on 49 CFR §26.67"
    }
  ]
}`;
}

export function buildLevel2UserMessage(facts: ExtractedFact[], combinedFinancials: string): string {
  return `Financial Context:\n${combinedFinancials}\n\nExtracted Facts to classify:\n${JSON.stringify(facts, null, 2)}`;
}
