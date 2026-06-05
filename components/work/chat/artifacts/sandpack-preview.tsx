"use client";

import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";

// Minimal index.html so artifacts can use Tailwind utility classes in the preview.
const TAILWIND_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body><div id="root"></div></body>
</html>`;

/** Live React artifact preview via Sandpack. Loaded lazily by the artifact panel. */
export function SandpackArtifact({ content, ts }: { content: string; ts?: boolean }) {
  const entry = ts ? "/App.tsx" : "/App.js";
  return (
    <SandpackProvider
      template={ts ? "react-ts" : "react"}
      theme="light"
      files={{ [entry]: content, "/public/index.html": TAILWIND_HTML }}
      options={{ recompileMode: "delayed", recompileDelay: 400 }}
    >
      <SandpackPreview
        style={{ height: "100%", width: "100%" }}
        showOpenInCodeSandbox={false}
        showRefreshButton
      />
    </SandpackProvider>
  );
}
