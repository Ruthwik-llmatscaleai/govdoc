import {
  BookOpenCheck,
  Search,
  CheckCircle2,
  ScanText,
  Tag,
  AlertTriangle,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { CapabilityCard } from "@/components/workspace/capability-card";

export function CapabilityGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <CapabilityCard
        number="01"
        icon={BookOpenCheck}
        title="Rubric"
        accent="Tools"
        description="Define and apply scoring rubrics. Reusable and audit-ready."
        href="/work/search"
      />
      <CapabilityCard
        number="02"
        icon={Search}
        title="Search &"
        accent="Ask"
        description="Plain-language queries across your corpus. Cited answers."
        href="/work/chat"
      />
      <CapabilityCard
        number="03"
        icon={CheckCircle2}
        title="Validate"
        accent="Documents"
        description="Check documents against policy. Pass/fail with reasoning."
        href="/work/review"
      />
      <CapabilityCard
        number="04"
        icon={ScanText}
        title="OCR &"
        accent="Extract"
        description="Convert scanned docs into structured data. Tables preserved."
        href="/work/ocr"
      />
      <CapabilityCard
        number="05"
        icon={Tag}
        title="Classify &"
        accent="Tag"
        description="Auto-categorize and route incoming documents."
        href="/work/classify"
      />
      <CapabilityCard
        number="06"
        icon={AlertTriangle}
        title="Detect"
        accent="Risk"
        description="Flag missing signatures, expired refs, and sensitive PII."
        href="/work/detect-risk"
      />
      <CapabilityCard
        number="07"
        icon={ClipboardList}
        title="Fill"
        accent="Forms"
        description="Pre-populate government forms from source documents."
        href="/work/fill-forms"
      />
      <CapabilityCard
        number="08"
        icon={ShieldCheck}
        title="Audit &"
        accent="Trace"
        description="Full chain of evidence for every decision. Court-ready."
        href="/work/audit"
      />
      <CapabilityCard
        number="09"
        icon={BookOpenCheck}
        title="Policy &"
        accent="Standards"
        description="Manage policies and statutes. Version-controlled."
        href="/work/policy"
      />
    </div>
  );
}
