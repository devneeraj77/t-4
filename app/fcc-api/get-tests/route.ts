import fs from "fs";
import path from "path";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const n = searchParams.get("n");

  let tests: any[] = [];
  try {
    const reportPath = path.join(process.cwd(), "test-report.json");
    if (fs.existsSync(reportPath)) {
      tests = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    }
  } catch {
    tests = [];
  }

  let out = tests;
  if (type === "unit") {
    out = tests.filter((t: any) => t.context && t.context.match(/Unit Tests/i));
  } else if (type === "functional") {
    out = tests.filter(
      (t: any) => t.context && t.context.match(/Functional Tests/i) && !t.title.match(/#example/)
    );
  }

  if (n !== null && n !== undefined) {
    const idx = parseInt(n, 10);
    return Response.json(out[idx] || out, { headers: corsHeaders });
  }

  return Response.json(out, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
