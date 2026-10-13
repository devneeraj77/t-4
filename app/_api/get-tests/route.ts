export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const n = searchParams.get("n");

  try {
    const runner = require("../../../test-runner");
    let tests = runner.report || [];
    if (type === "unit") {
      tests = tests.filter((t: any) => t.context && t.context.includes("Unit Tests"));
    } else if (type === "functional") {
      tests = tests.filter(
        (t: any) => t.context && t.context.includes("Functional Tests") && !t.title.includes("#example")
      );
    }
    const result = n !== null && n !== undefined ? tests[Number(n)] || tests : tests;
    return Response.json(result, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch {
    return Response.json([], {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
