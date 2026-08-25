"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { parseBankZeroCSV, matchTransactionsToSubscriptions, BankZeroTransaction } from "@/lib/bankzero-parser";

interface BankZeroUploaderProps {
  onUploadComplete?: () => void;
}

export function BankZeroUploader({ onUploadComplete }: BankZeroUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [parsedTransactions, setParsedTransactions] = useState<BankZeroTransaction[]>([]);
  const [matchedTransactions, setMatchedTransactions] = useState<BankZeroTransaction[]>([]);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Reset previous state
    setUploadStatus("idle");
    setUploadMessage("");
    setParsedTransactions([]);
    setMatchedTransactions([]);
    setUnmatchedCount(0);
    
    // Validate file type
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".pdf")) {
      setUploadStatus("error");
      setUploadMessage("Please upload a CSV or PDF file");
      return;
    }
    
    setUploadStatus("uploading");
    setUploadMessage("Processing file...");
    
    try {
      // Read file content
      let content = "";
      if (file.name.endsWith(".csv")) {
        content = await readFileContent(file);
      } else if (file.name.endsWith(".pdf")) {
        // For PDF, we'd need a PDF parser, but for now we'll treat it as text
        // In a real implementation, you'd use a PDF parsing library
        content = await readFileContent(file);
      }
      
      // Parse CSV content
      const transactions = parseBankZeroCSV(content);
      
      if (transactions.length === 0) {
        setUploadStatus("error");
        setUploadMessage("No transactions found in the file");
        return;
      }
      
      setParsedTransactions(transactions);
      setUploadMessage(`Parsed ${transactions.length} transactions`);
      
      // Fetch subscriptions for matching
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from("subscriptions")
        .select("id, name")
        .order("name");
      
      if (subscriptionsError) {
        throw new Error(`Failed to fetch subscriptions: ${subscriptionsError.message}`);
      }
      
      // Match transactions to subscriptions
      const matched = matchTransactionsToSubscriptions(transactions, subscriptions || []);
      setMatchedTransactions(matched);
      
      // Count unmatched transactions
      const unmatched = matched.filter(t => !t.matchedSubscriptionId);
      setUnmatchedCount(unmatched.length);
      
      setUploadStatus("success");
      setUploadMessage(`Successfully processed ${transactions.length} transactions (${unmatched.length} unmatched)`);
      
      // Trigger callback if provided
      if (onUploadComplete) {
        onUploadComplete();
      }
      
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadStatus("error");
      setUploadMessage(`Error: ${(error as Error).message || "Failed to process file"}`);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = (e) => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsText(file);
    });
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetUploader = () => {
    setUploadStatus("idle");
    setUploadMessage("");
    setParsedTransactions([]);
    setMatchedTransactions([]);
    setUnmatchedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Bank Zero Statement Uploader</h2>
      
      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".csv,.pdf"
          className="hidden"
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          CSV or PDF files from Bank Zero
        </p>
      </div>
      
      {/* Status Messages */}
      {uploadStatus !== "idle" && (
        <div className={`mt-4 p-4 rounded-md ${
          uploadStatus === "success" 
            ? "bg-green-50 text-green-800" 
            : uploadStatus === "error"
            ? "bg-red-50 text-red-800"
            : "bg-blue-50 text-blue-800"
        }`}>
          {uploadStatus === "uploading" && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span>Processing file...</span>
            </div>
          )}
          {uploadStatus === "success" && (
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>{uploadMessage}</span>
            </div>
          )}
          {uploadStatus === "error" && (
            <div className="flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              <span>{uploadMessage}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Results Section */}
      {matchedTransactions.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Processing Results</h3>
            <button
              onClick={resetUploader}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Reset
            </button>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{matchedTransactions.length}</div>
              <div className="text-sm text-blue-600">Total Transactions</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {matchedTransactions.length - unmatchedCount}
              </div>
              <div className="text-sm text-green-600">Matched Transactions</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{unmatchedCount}</div>
              <div className="text-sm text-yellow-600">Unmatched Transactions</div>
            </div>
          </div>
          
          {/* Unmatched Transactions */}
          {unmatchedCount > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                Unmatched Transactions ({unmatchedCount})
              </h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700 mb-2">
                  These transactions couldn't be automatically matched to subscriptions. 
                  You may need to manually categorize them.
                </p>
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {matchedTransactions
                        .filter(t => !t.matchedSubscriptionId)
                        .slice(0, 5) // Show first 5 unmatched
                        .map((transaction, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {transaction.transactionDate}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                              {transaction.description}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {transaction.type === 'credit' ? '+' : '-'}R{transaction.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {unmatchedCount > 5 && (
                    <p className="text-sm text-gray-500 mt-2">
                      ... and {unmatchedCount - 5} more unmatched transactions
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Matched Transactions Preview */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Matched Transactions Preview</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matched Subscription</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {matchedTransactions
                    .filter(t => t.matchedSubscriptionId)
                    .slice(0, 5) // Show first 5 matched
                    .map((transaction, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {transaction.transactionDate}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                          {transaction.description}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {transaction.type === 'credit' ? '+' : '-'}R{transaction.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {transaction.matchedSubscriptionId ? "Matched" : "Unmatched"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {matchedTransactions.filter(t => t.matchedSubscriptionId).length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  ... and {matchedTransactions.filter(t => t.matchedSubscriptionId).length - 5} more matched transactions
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">How to Use</h4>
        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
          <li>Upload a CSV or PDF file from Bank Zero</li>
          <li>Transactions will be automatically parsed and categorized</li>
          <li>Matching is done based on description similarity</li>
          <li>Unmatched transactions require manual review</li>
          <li>Matched transactions are marked as reconciled</li>
        </ul>
      </div>
    </div>
  );
}