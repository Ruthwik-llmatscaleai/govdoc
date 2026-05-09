import { describe, it, expect } from "vitest";
import { CUCP_L2_CATEGORIES, CUCP_L3_CRITERIA } from "./rubric";
import { buildLevel2SystemPrompt } from "./prompts/level-2-classify";
import { buildLevel3SystemPrompt } from "./prompts/level-3-threshold";

describe("CUCP rubric drift guard", () => {
  describe("Level 2 categories", () => {
    const prompt = buildLevel2SystemPrompt([]);

    it.each(CUCP_L2_CATEGORIES)(
      "the L2 prompt contains the verbatim name and description for $name",
      ({ name, description }) => {
        expect(prompt).toContain(name);
        expect(prompt).toContain(description);
      },
    );

    it("rubric and prompt agree on category count", () => {
      // 5 legal categories in the rubric — make sure the prompt mentions all
      // of them and only those (the override-form's L2_LEGAL_CATEGORIES adds
      // a "Keep Current" sentinel which is intentionally NOT in the rubric).
      expect(CUCP_L2_CATEGORIES).toHaveLength(5);
      for (const c of CUCP_L2_CATEGORIES) {
        expect(prompt).toContain(`"${c.name}"`);
      }
    });
  });

  describe("Level 3 criteria", () => {
    const prompt = buildLevel3SystemPrompt([]);

    it.each(CUCP_L3_CRITERIA)(
      "the L3 prompt contains the criterion line for s_no $s_no",
      ({ s_no, name }) => {
        expect(prompt).toContain(`${s_no}. ${name}`);
      },
    );

    it("the L3 prompt contains the verbatim rule for criterion 2", () => {
      const c2 = CUCP_L3_CRITERIA.find((c) => c.s_no === 2);
      expect(c2?.rule).toBeDefined();
      expect(prompt).toContain(c2!.rule!);
    });

    it("rubric has exactly 7 criteria", () => {
      expect(CUCP_L3_CRITERIA).toHaveLength(7);
    });
  });
});
