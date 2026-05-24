"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parseStatement } from "@/lib/statementParser";
import { dataCache } from "@/lib/cache";
import type { StatementData } from "@/app/page";

type FileUploadProps = {
  onStatementParsed: (data: StatementData) => void;
};

export default function FileUpload({ onStatementParsed }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsProcessing(true);
    setError(null);
    setUploadedFile(file.name);
    setProgress(0);
    setCurrentStep("Initializing...");

    try {
      // Check cache first
      setProgress(10);
      setCurrentStep("Checking cache...");
      const cachedData = await dataCache.get(file);
      
      if (cachedData) {
        setLoadedFromCache(true);
        setProgress(90);
        setCurrentStep("Loading from cache...");
        await new Promise(resolve => setTimeout(resolve, 300));
        setProgress(100);
        setCurrentStep("Complete!");
        await new Promise(resolve => setTimeout(resolve, 200));
        onStatementParsed(cachedData);
        return;
      }

      // If not in cache, parse the file
      setLoadedFromCache(false);
      setProgress(20);
      setCurrentStep("Reading file...");
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProgress(40);
      setCurrentStep("Parsing data...");
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setProgress(60);
      setCurrentStep("Processing transactions...");
      const data = await parseStatement(file);
      
      setProgress(80);
      setCurrentStep("Caching results...");
      await dataCache.set(file, data);
      
      setProgress(90);
      setCurrentStep("Calculating fees and P&L...");
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProgress(100);
      setCurrentStep("Complete!");
      await new Promise(resolve => setTimeout(resolve, 200));
      
      onStatementParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse statement");
      console.error("Parse error:", err);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStep("");
    }
  }, [onStatementParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      // PDF temporarily disabled due to Next.js 15 compatibility issues
      // 'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB limit
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      const errors = rejection.errors;
      
      let errorMessage = "File rejected: ";
      if (errors.some(e => e.code === 'file-invalid-type')) {
        errorMessage += "Invalid file type. Please upload CSV, XLS, or XLSX files only.";
      } else if (errors.some(e => e.code === 'file-too-large')) {
        errorMessage += "File too large. Maximum size is 10MB.";
      } else if (errors.some(e => e.code === 'too-many-files')) {
        errorMessage += "Too many files. Please upload only one file at a time.";
      } else {
        errorMessage += "Unknown error occurred.";
      }
      
      setError(errorMessage);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload .xlsx Export File From Cobra Account Activity Page</CardTitle>
        <CardDescription>
          <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block">
            💡 For accurate P&L calculations, include enough trading history to capture all positions that affect the current period
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
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                    style={{ 
                      background: `conic-gradient(from 0deg, #3b82f6 0deg, #3b82f6 ${progress * 3.6}deg, transparent ${progress * 3.6}deg)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">{progress}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-primary">{currentStep}</p>
                  <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop the file here</p>
                ) : (
                  <>
                    <div>
                      <p className="text-lg font-medium">Drag & drop your Account Activity export file here</p>
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
            {loadedFromCache && (
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <Database className="h-3 w-3" />
                <span>(from cache)</span>
              </div>
            )}
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


