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
  const { puzzle, coordinate, value } = body;

  // 1. Missing required fields
  if (
    puzzle === undefined ||
    coordinate === undefined ||
    value === undefined ||
    puzzle === "" ||
    coordinate === "" ||
    value === ""
  ) {
    return Response.json(
      { error: "Required field(s) missing" },
      { headers: corsHeaders }
    );
  }

  // 2. Validate coordinate
  if (typeof coordinate !== "string" || !/^[a-i][1-9]$/i.test(coordinate)) {
    return Response.json({ error: "Invalid coordinate" }, { headers: corsHeaders });
  }

  // 3. Validate value
  if (!/^[1-9]$/.test(String(value))) {
    return Response.json({ error: "Invalid value" }, { headers: corsHeaders });
  }

  // 4. Validate puzzle length
  if (typeof puzzle !== "string" || puzzle.length !== 81) {
    return Response.json(
      { error: "Expected puzzle to be 81 characters long" },
      { headers: corsHeaders }
    );
  }

  // 5. Validate puzzle characters
  if (/[^1-9.]/.test(puzzle)) {
    return Response.json(
      { error: "Invalid characters in puzzle" },
      { headers: corsHeaders }
    );
  }

  const row = coordinate[0].toUpperCase();
  const col = coordinate[1];

  const validRow = solver.checkRowPlacement(puzzle, row, col, value);
  const validCol = solver.checkColPlacement(puzzle, row, col, value);
  const validRegion = solver.checkRegionPlacement(puzzle, row, col, value);

  const conflict: string[] = [];
  if (!validRow) conflict.push("row");
  if (!validCol) conflict.push("column");
  if (!validRegion) conflict.push("region");

  if (conflict.length === 0) {
    return Response.json({ valid: true }, { headers: corsHeaders });
  } else {
    return Response.json({ valid: false, conflict }, { headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
