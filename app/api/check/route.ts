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
    return Response.json({ error: "Required field(s) missing" });
  }

  // 2. Validate coordinate
  if (typeof coordinate !== "string" || !/^[a-i][1-9]$/i.test(coordinate)) {
    return Response.json({ error: "Invalid coordinate" });
  }

  // 3. Validate value
  if (!/^[1-9]$/.test(String(value))) {
    return Response.json({ error: "Invalid value" });
  }

  // 4. Validate puzzle length
  if (typeof puzzle !== "string" || puzzle.length !== 81) {
    return Response.json({ error: "Expected puzzle to be 81 characters long" });
  }

  // 5. Validate puzzle characters
  if (/[^1-9.]/.test(puzzle)) {
    return Response.json({ error: "Invalid characters in puzzle" });
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
    return Response.json({ valid: true });
  } else {
    return Response.json({ valid: false, conflict });
  }
}
