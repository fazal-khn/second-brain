import DocumentAnalyzerClient from "./DocumentAnalyzerClient";

export const dynamicParams = false;

export function generateStaticParams() {
  // Return a dummy value so Next.js generates the static shell during build.
  return [{ id: "preview" }];
}

export default function Page() {
  return <DocumentAnalyzerClient />;
}
