import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  FileUp, 
  Sparkles,
  Edit3,
  Save,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { TextExtractor, type ExtractionResult } from "@/lib/textExtractor";
import { useNavigate } from "react-router-dom";

interface ExtractedContractData {
  title: string | null;
  counterparty: string | null;
  contract_type: string | null;
  status: string;
  contract_value: number | null;
  currency: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  renewal_notice_days: number | null;
  contract_content: string;
}

interface ConfidenceScores {
  title: number;
  counterparty: number;
  contract_type: number;
  contract_value: number;
  currency: number;
  effective_date: number;
  expiration_date: number;
  renewal_notice_days: number;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'extracting' | 'reviewing' | 'completed' | 'error';
  progress: number;
  file: File;
  extractedData?: ExtractedContractData;
  confidence?: ConfidenceScores;
  missingFields?: string[];
  warnings?: string[];
  errorMessage?: string;
}

export const EnhancedContractUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const contractTypes = [
    "Employment", "Service Agreement", "NDA", "Purchase Agreement", 
    "Lease", "Partnership", "Consulting", "Software License", 
    "Vendor Agreement", "Other"
  ];

  const currencies = ["USD", "EUR", "KES", "GBP", "CAD", "AUD", "JPY"];
  const statuses = ["Active", "Pending", "Expired", "Terminated"];

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
      file
    }));

    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(processUpload);
  };

  const processUpload = async (uploadFile: UploadedFile) => {
    try {
      // Update status to extracting
      updateFileStatus(uploadFile.id, 'extracting', 20);

      // Extract text from file
      const extractionResult = await TextExtractor.extractText(uploadFile.file);
      
      if (!TextExtractor.validateExtraction(extractionResult)) {
        throw new Error('Text extraction failed or produced low-quality results');
      }

      updateFileStatus(uploadFile.id, 'extracting', 50);

      // Process with AI for contract information extraction
      const aiResult = await extractContractInformation(
        uploadFile.name,
        extractionResult.text,
        uploadFile.file
      );

      updateFileStatus(uploadFile.id, 'reviewing', 80);

      // Update file with extracted data
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? {
              ...f,
              extractedData: aiResult.contractData,
              confidence: aiResult.confidence,
              missingFields: aiResult.missingFields,
              warnings: aiResult.warnings,
              status: aiResult.missingFields.length > 0 || aiResult.warnings.length > 0 
                ? 'reviewing' 
                : 'completed',
              progress: 100
            }
          : f
      ));

      if (aiResult.missingFields.length > 0 || aiResult.warnings.length > 0) {
        toast({
          title: "Review Required",
          description: `Contract extracted but needs review for ${aiResult.missingFields.length} missing fields`,
          variant: "default"
        });
      } else {
        toast({
          title: "Extraction Complete",
          description: "Contract information successfully extracted",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Upload processing error:', error);
      updateFileStatus(uploadFile.id, 'error', 0, error instanceof Error ? error.message : 'Processing failed');
      
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    }
  };

  const extractContractInformation = async (
    fileName: string, 
    fileContent: string, 
    file: File
  ): Promise<{
    contractData: ExtractedContractData;
    confidence: ConfidenceScores;
    missingFields: string[];
    warnings: string[];
  }> => {
    try {
      const response = await supabase.functions.invoke('contract-extractor', {
        body: {
          fileName,
          fileContent,
          existingData: {}
        }
      });

      if (response.error) {
        throw new Error(`AI processing failed: ${response.error.message}`);
      }

      return response.data;
    } catch (error) {
      console.error('AI extraction error:', error);
      throw error;
    }
  };

  const updateFileStatus = (
    fileId: string, 
    status: UploadedFile['status'], 
    progress: number, 
    errorMessage?: string
  ) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status, progress, errorMessage }
        : f
    ));
  };

  const saveContract = async (file: UploadedFile) => {
    if (!file.extractedData) return;

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(filePath, file.file);

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // Save contract to database
      const { data: contractData, error: insertError } = await supabase
        .from('contracts')
        .insert({
          ...file.extractedData,
          file_name: file.name,
          file_path: filePath
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Database save failed: ${insertError.message}`);
      }

      // Update file status
      updateFileStatus(file.id, 'completed', 100);

      toast({
        title: "Contract Saved",
        description: `${file.extractedData.title} has been saved successfully`,
        variant: "default"
      });

      // Refresh contracts list
      queryClient.invalidateQueries({ queryKey: ['contracts'] });

      // Navigate to contract details
      navigate(`/contracts/${contractData.id}`);

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Failed to save contract',
        variant: "destructive"
      });
    }
  };

  const updateExtractedData = (fileId: string, field: keyof ExtractedContractData, value: any) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId && f.extractedData
        ? {
            ...f,
            extractedData: {
              ...f.extractedData,
              [field]: value
            }
          }
        : f
    ));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const retryExtraction = (file: UploadedFile) => {
    updateFileStatus(file.id, 'uploading', 0);
    processUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Powered Contract Upload
          </CardTitle>
          <CardDescription>
            Upload contract documents and let AI automatically extract key information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg mb-2">Drop contract files here or click to browse</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, DOCX, images, and text files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <FileUp className="mr-2 h-4 w-4" />
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Processing List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="border rounded-lg p-4 space-y-4">
                {/* File Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'error' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryExtraction(file)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {file.status}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {file.status !== 'completed' && file.status !== 'error' && (
                  <Progress value={file.progress} className="w-full" />
                )}

                {/* Error Message */}
                {file.status === 'error' && file.errorMessage && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{file.errorMessage}</span>
                  </div>
                )}

                {/* Extracted Data Review */}
                {file.extractedData && (file.status === 'reviewing' || file.status === 'completed') && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Extracted Information</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingFile(editingFile === file.id ? null : file.id)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          {editingFile === file.id ? 'Cancel' : 'Edit'}
                        </Button>
                        {file.status === 'reviewing' && (
                          <Button
                            size="sm"
                            onClick={() => saveContract(file)}
                            disabled={!file.extractedData}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save Contract
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Warnings */}
                    {file.warnings && file.warnings.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="flex items-center gap-2 text-yellow-800 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Warnings</span>
                        </div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {file.warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Extracted Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(file.extractedData).map(([key, value]) => {
                        if (key === 'contract_content') return null; // Handle separately
                        
                        const confidence = file.confidence?.[key as keyof ConfidenceScores] || 0;
                        const isEditing = editingFile === file.id;
                        const isMissing = file.missingFields?.includes(key);
                        
                        return (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label className="capitalize">
                                {key.replace(/_/g, ' ')}
                              </Label>
                              {confidence > 0 && (
                                <div className="flex items-center gap-1">
                                  <div
                                    className={`w-2 h-2 rounded-full ${getConfidenceColor(confidence)}`}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
                                  </span>
                                </div>
                              )}
                              {isMissing && (
                                <Badge variant="destructive" className="text-xs">
                                  Missing
                                </Badge>
                              )}
                            </div>
                            
                            {isEditing ? (
                              key === 'contract_type' ? (
                                <Select
                                  value={value || ""}
                                  onValueChange={(newValue) => updateExtractedData(file.id, key as keyof ExtractedContractData, newValue)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select contract type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {contractTypes.map(type => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : key === 'currency' ? (
                                <Select
                                  value={value || ""}
                                  onValueChange={(newValue) => updateExtractedData(file.id, key as keyof ExtractedContractData, newValue)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {currencies.map(currency => (
                                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : key === 'status' ? (
                                <Select
                                  value={value || ""}
                                  onValueChange={(newValue) => updateExtractedData(file.id, key as keyof ExtractedContractData, newValue)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statuses.map(status => (
                                      <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={value || ""}
                                  onChange={(e) => updateExtractedData(file.id, key as keyof ExtractedContractData, e.target.value)}
                                  type={key.includes('date') ? 'date' : key.includes('value') || key.includes('days') ? 'number' : 'text'}
                                  className={isMissing ? 'border-destructive' : ''}
                                />
                              )
                            ) : (
                              <p className={`text-sm p-2 rounded border ${isMissing ? 'bg-destructive/5 border-destructive' : 'bg-muted'}`}>
                                {value || 'Not extracted'}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Contract Content */}
                    {file.extractedData.contract_content && (
                      <div className="space-y-2">
                        <Label>Contract Content</Label>
                        {editingFile === file.id ? (
                          <Textarea
                            value={file.extractedData.contract_content}
                            onChange={(e) => updateExtractedData(file.id, 'contract_content', e.target.value)}
                            rows={6}
                            className="font-mono text-sm"
                          />
                        ) : (
                          <div className="bg-muted p-3 rounded text-sm max-h-40 overflow-y-auto">
                            {file.extractedData.contract_content.substring(0, 500)}
                            {file.extractedData.contract_content.length > 500 && '...'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};