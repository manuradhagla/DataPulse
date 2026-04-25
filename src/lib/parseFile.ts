import Papa from "papaparse";
import type { Row } from "./analytics";

export type ParsedDataset = {
  columns: string[];
  rows: Row[];
  fileType: "csv" | "json";
};

export async function parseFile(file: File): Promise<ParsedDataset> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const text = await file.text();

  if (ext === "json") {
    const data = JSON.parse(text);
    const arr = Array.isArray(data)
      ? data
      : Array.isArray((data as { data?: unknown }).data)
        ? ((data as { data: Row[] }).data)
        : null;
    if (!arr) throw new Error("JSON must be an array of objects");
    const rows = arr.filter(
      (r): r is Row => r !== null && typeof r === "object" && !Array.isArray(r),
    );
    if (rows.length === 0) throw new Error("No row objects found in JSON");
    const columns = Array.from(
      rows.reduce<Set<string>>((set, r) => {
        Object.keys(r).forEach((k) => set.add(k));
        return set;
      }, new Set()),
    );
    return { columns, rows, fileType: "json" };
  }

  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      Papa.parse<Row>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data.filter(
            (r) => r && typeof r === "object" && Object.keys(r).length > 0,
          );
          const columns =
            results.meta.fields ?? (rows[0] ? Object.keys(rows[0]) : []);
          if (rows.length === 0) {
            reject(new Error("CSV contains no rows"));
            return;
          }
          resolve({ columns, rows, fileType: "csv" });
        },
        error: (err: Error) => reject(err),
      });
    });
  }

  throw new Error("Unsupported file type. Use .csv or .json");
}
