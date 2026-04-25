import { useCallback, useState } from "react";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { parseFile, type ParsedDataset } from "@/lib/parseFile";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  userId: string;
  onSaved: () => void;
  onCancel: () => void;
};

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 50_000;

export function DatasetUploader({ userId, onSaved, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsed, setParsed] = useState<ParsedDataset | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    if (f.size > MAX_BYTES) {
      toast.error("File is larger than 10MB");
      return;
    }
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "json") {
      toast.error("Only .csv and .json files are supported");
      return;
    }
    setFile(f);
    setName((prev) => prev || f.name.replace(/\.(csv|json)$/i, ""));
    setParsing(true);
    try {
      const result = await parseFile(f);
      if (result.rows.length > MAX_ROWS) {
        toast.error(`Dataset too large (${result.rows.length} rows). Max ${MAX_ROWS}.`);
        setFile(null);
        setParsed(null);
        return;
      }
      setParsed(result);
      toast.success(`Parsed ${result.rows.length} rows · ${result.columns.length} columns`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse file";
      toast.error(msg);
      setFile(null);
      setParsed(null);
    } finally {
      setParsing(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  };

  const handleSave = async () => {
    if (!parsed || !name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("datasets").insert({
        user_id: userId,
        name: name.trim(),
        file_type: parsed.fileType,
        columns: parsed.columns,
        rows: parsed.rows,
        row_count: parsed.rows.length,
      });
      if (error) throw error;
      toast.success("Dataset saved");
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save dataset";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {!parsed ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-surface/40 hover:border-primary/60"
          }`}
        >
          {parsing ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
          )}
          <div>
            <div className="font-medium">
              {parsing ? "Parsing…" : "Drop a CSV or JSON file"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              or click to browse · max 10 MB · max 50K rows
            </div>
          </div>
          <input
            type="file"
            accept=".csv,.json,application/json,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
            disabled={parsing}
          />
        </label>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">{file?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {parsed.rows.length} rows · {parsed.columns.length} columns ·{" "}
                  {parsed.fileType.toUpperCase()}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setFile(null);
                setParsed(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ds-name">Dataset name</Label>
            <Input
              id="ds-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="Q3 sales report"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Schema preview
            </Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {parsed.columns.map((c) => (
                <span
                  key={c}
                  className="rounded-md border border-border bg-surface/60 px-2 py-1 font-mono text-xs"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              First 5 rows
            </Label>
            <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface">
                  <tr>
                    {parsed.columns.map((c) => (
                      <th
                        key={c}
                        className="border-b border-border px-3 py-2 text-left font-medium"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="odd:bg-background/40">
                      {parsed.columns.map((c) => (
                        <td
                          key={c}
                          className="border-b border-border/50 px-3 py-1.5 font-mono text-muted-foreground"
                        >
                          {r[c] === null || r[c] === undefined ? "—" : String(r[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="hero"
          onClick={handleSave}
          disabled={!parsed || !name.trim() || saving}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save dataset
        </Button>
      </div>
    </div>
  );
}
