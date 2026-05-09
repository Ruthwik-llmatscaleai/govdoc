import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { loadCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-merged";
import { loadCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { loadRowRubric } from "@/lib/usecases/row-appraisal/rubric-merged";
import { buildCmgcRubricXlsx } from "@/lib/usecases/cmgc-pde/exporters/rubric-xlsx";
import { buildCucpRubricPdf } from "@/lib/usecases/cucp-reevals/exporters/rubric-pdf";
import { buildRowRubricXlsx } from "@/lib/usecases/row-appraisal/exporters/rubric-xlsx";

const KNOWN_IDS = new Set(["cmgc-pde", "cucp-reevals", "row-appraisal"]);

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!KNOWN_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown rubric use case" }, { status: 404 });
  }

  if (id === "cmgc-pde") {
    const data = await loadCmgcRubric();
    const buf = await buildCmgcRubricXlsx(data);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="cmgc-pde-rubric.xlsx"`,
      },
    });
  }

  if (id === "cucp-reevals") {
    const data = await loadCucpRubric();
    const buf = await buildCucpRubricPdf(data);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="cucp-reevals-rubric.pdf"`,
      },
    });
  }

  // row-appraisal
  const data = await loadRowRubric();
  const buf = await buildRowRubricXlsx(data);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="row-appraisal-rubric.xlsx"`,
    },
  });
}
