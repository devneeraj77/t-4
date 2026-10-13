import { SudokuSolver } from "@/controllers/sudoku-solver";

const solver = new SudokuSolver();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
};

async function parseRequestBody(request: Request): Promise<Record<string, any>> {
  try {
    const text = await request.text();
    if (!text || text.trim() === "") return {};

    // 1. Try parsing JSON
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
    } catch {
      // Not JSON, continue to form-urlencoded
    }

    // 2. Try parsing URLSearchParams (application/x-www-form-urlencoded)
    const params = new URLSearchParams(text);
    const result: Record<string, any> = {};
    for (const [k, v] of params.entries()) {
      result[k] = v;
    }
    return result;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = await parseRequestBody(request);
  const puzzle = body.puzzle;

  // 1. Missing puzzle field
  if (puzzle === undefined) {
    return Response.json({ error: "Required field missing" }, { headers: corsHeaders });
  }

  // 2. Validate length
  if (typeof puzzle !== "string" || puzzle.length !== 81) {
    return Response.json(
      { error: "Expected puzzle to be 81 characters long" },
      { headers: corsHeaders }
    );
  }

  // 3. Validate characters
  if (/[^1-9.]/.test(puzzle)) {
    return Response.json(
      { error: "Invalid characters in puzzle" },
      { headers: corsHeaders }
    );
  }

  // 4. Attempt to solve
  const solution = solver.solve(puzzle);
  if (!solution) {
    return Response.json(
      { error: "Puzzle cannot be solved" },
      { headers: corsHeaders }
    );
  }

  return Response.json({ solution }, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
