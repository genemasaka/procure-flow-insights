
import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, AlertCircle, CheckCircle, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'analyzing' | 'completed' | 'error';
  progress: number;
  extractedData?: {
    counterparties: string[];
    effectiveDate: string;
    renewalDate: string;
    monetaryValues: string[];
  };
}

export const DocumentUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

  const processFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate file processing
    newFiles.forEach(file => {
      simulateFileProcessing(file.id);
    });

    toast({
      title: "Files uploaded successfully",
      description: `${fileList.length} file(s) are being processed.`,
    });
  };

  const simulateFileProcessing = (fileId: string) => {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'uploading') {
          const newProgress = Math.min(file.progress + 10, 100);
          if (newProgress === 100) {
            clearInterval(uploadInterval);
            setTimeout(() => simulateOCRProcessing(fileId), 500);
            return { ...file, progress: newProgress, status: 'processing' };
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 200);
  };

  const simulateOCRProcessing = (fileId: string) => {
    setTimeout(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          return { ...file, status: 'analyzing', progress: 0 };
        }
        return file;
      }));
      
      simulateAIAnalysis(fileId);
    }, 1000);
  };

  const simulateAIAnalysis = (fileId: string) => {
    const analysisInterval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'analyzing') {
          const newProgress = Math.min(file.progress + 15, 100);
          if (newProgress === 100) {
            clearInterval(analysisInterval);
            return {
              ...file,
              progress: newProgress,
              status: 'completed',
              extractedData: {
                counterparties: ['ACME Corp', 'Global Shipping Ltd'],
                effectiveDate: '2024-01-15',
                renewalDate: '2024-12-31',
                monetaryValues: ['$125,000', '$15,000']
              }
            };
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 300);
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'processing':
        return <FileText className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'analyzing':
        return <Brain className="w-4 h-4 text-purple-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Running OCR...';
      case 'analyzing':
        return 'AI Analysis...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Document Upload
          </CardTitle>
          <CardDescription>
            Upload PDF, Word documents, or images for AI-powered contract analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Drop files here or click to upload
                </h3>
                <p className="text-slate-500 mt-1">
                  Supports PDF, DOC, DOCX, PNG, JPG (max 10MB each)
                </p>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Processing List */}
      {files.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Processing Queue</CardTitle>
            <CardDescription>
              Track the status of your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <h4 className="font-medium text-slate-900">{file.name}</h4>
                        <p className="text-sm text-slate-500">
                          {formatFileSize(file.size)} • {getStatusText(file.status)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={file.status === 'completed' ? 'default' : 'secondary'}>
                      {file.status}
                    </Badge>
                  </div>
                  
                  {file.status !== 'completed' && (
                    <Progress value={file.progress} className="w-full" />
                  )}

                  {file.status === 'completed' && file.extractedData && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <h5 className="font-medium text-green-900 mb-2">Extracted Information</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-700">Counterparties:</span>
                          <div className="mt-1">
                            {file.extractedData.counterparties.map((party, idx) => (
                              <Badge key={idx} variant="outline" className="mr-1">
                                {party}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Key Dates:</span>
                          <p className="text-slate-600 mt-1">
                            Effective: {file.extractedData.effectiveDate}<br/>
                            Renewal: {file.extractedData.renewalDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
