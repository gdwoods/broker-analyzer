"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parseStatement } from "@/lib/statementParser";
import type { StatementData } from "@/app/page";

type FileUploadProps = {
  onStatementParsed: (data: StatementData) => void;
};

export default function FileUpload({ onStatementParsed }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsProcessing(true);
    setError(null);
    setUploadedFile(file.name);

    try {
      const data = await parseStatement(file);
      onStatementParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse statement");
      console.error("Parse error:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [onStatementParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Cobra Trading Statement</CardTitle>
        <CardDescription>
          Upload your monthly statement in CSV or Excel format
          <br />
          <span className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 block">
            💡 Tip: If you have a PDF, convert it to CSV using your broker&apos;s export feature or an online converter
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${isProcessing ? 'opacity-50 pointer-events-none' : 'hover:border-primary hover:bg-primary/5'}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-4">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Processing statement...</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop the file here</p>
                ) : (
                  <>
                    <div>
                      <p className="text-lg font-medium">Drag & drop your statement here</p>
                      <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
                    </div>
                  </>
                )}
                <p className="text-xs text-muted-foreground">
                  Supported formats: CSV, XLS, XLSX
                </p>
              </>
            )}
          </div>
        </div>

        {uploadedFile && !error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <FileText className="h-4 w-4" />
            <span>Successfully uploaded: {uploadedFile}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


