import { SudokuSolver } from "@/controllers/sudoku-solver";

const solver = new SudokuSolver();

async function parseRequestBody(request: Request): Promise<Record<string, any>> {
  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      return await request.json();
    }
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      return Object.fromEntries(formData.entries());
    }
    const text = await request.text();
    try {
      return JSON.parse(text);
    } catch {
      const params = new URLSearchParams(text);
      return Object.fromEntries(params.entries());
    }
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = await parseRequestBody(request);
  const puzzle = body.puzzle;

  // 1. Missing puzzle field
  if (puzzle === undefined) {
    return Response.json({ error: "Required field missing" });
  }

  // 2. Validate length
  if (typeof puzzle !== "string" || puzzle.length !== 81) {
    return Response.json({ error: "Expected puzzle to be 81 characters long" });
  }

  // 3. Validate characters
  if (/[^1-9.]/.test(puzzle)) {
    return Response.json({ error: "Invalid characters in puzzle" });
  }

  // 4. Attempt to solve
  const solution = solver.solve(puzzle);
  if (!solution) {
    return Response.json({ error: "Puzzle cannot be solved" });
  }

  return Response.json({ solution });
}
