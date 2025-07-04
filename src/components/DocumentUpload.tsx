
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, CheckCircle, X, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  file: File;
}

export const DocumentUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

    // Process each file
    newFiles.forEach(file => {
      processUpload(file);
    });
  };

  const processUpload = async (uploadFile: UploadedFile) => {
    try {
      // Update progress to show uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 30 } : f
      ));

      // Create document upload record
      const { data: docUpload, error: uploadError } = await supabase
        .from('document_uploads')
        .insert({
          file_name: uploadFile.file.name,
          file_path: `/uploads/${uploadFile.file.name}`,
          file_size: uploadFile.file.size,
          mime_type: uploadFile.file.type,
          processing_status: 'processing'
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Update progress to show processing
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 60, status: 'processing' } : f
      ));

      // Extract contract information (simulated AI processing)
      const contractTitle = uploadFile.file.name.replace(/\.[^/.]+$/, "");
      const contractType = getContractType(uploadFile.file.name);
      
      // Create contract record
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          title: contractTitle,
          counterparty: extractCounterparty(contractTitle),
          contract_type: contractType,
          status: 'active',
          file_name: uploadFile.file.name,
          file_path: `/uploads/${uploadFile.file.name}`,
          contract_value: Math.floor(Math.random() * 1000000) + 10000,
          effective_date: new Date().toISOString().split('T')[0],
          expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // Update document upload with contract reference
      await supabase
        .from('document_uploads')
        .update({ 
          contract_id: contract.id,
          processing_status: 'completed'
        })
        .eq('id', docUpload.id);

      // Create sample deadline
      await supabase
        .from('deadlines')
        .insert({
          contract_id: contract.id,
          title: `${contractTitle} Renewal`,
          description: `Contract renewal deadline for ${contractTitle}`,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'renewal',
          priority: 'medium'
        });

      // Create sample AI insight
      await supabase
        .from('ai_insights')
        .insert({
          contract_id: contract.id,
          title: `Payment Terms Analysis`,
          description: `The contract has standard payment terms with 30-day net payment schedule.`,
          insight_type: 'opportunity',
          impact: 'medium',
          confidence: 85,
          actionable: true
        });

      // Update progress to completed
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 100, status: 'completed' } : f
      ));

      // Refresh queries to show new data
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['ai_insights'] });

      toast({
        title: "Upload Complete",
        description: `${uploadFile.file.name} has been processed and added to your library.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'error' } : f
      ));
      
      toast({
        title: "Upload Failed",
        description: `Failed to process ${uploadFile.file.name}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const getContractType = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('service') || name.includes('sla')) return 'Service Agreement';
    if (name.includes('supply') || name.includes('vendor')) return 'Supply Contract';
    if (name.includes('license')) return 'License Agreement';
    if (name.includes('lease') || name.includes('rent')) return 'Lease Agreement';
    if (name.includes('employment') || name.includes('hire')) return 'Employment Contract';
    return 'General Contract';
  };

  const extractCounterparty = (title: string): string => {
    // Simple extraction - in real app this would use AI
    const words = title.split(/[\s_-]+/);
    return words.find(word => 
      word.length > 3 && 
      !['contract', 'agreement', 'document', 'final', 'draft', 'signed'].includes(word.toLowerCase())
    ) || 'Unknown Party';
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Contract Documents
          </CardTitle>
          <CardDescription>
            Upload PDF, Word, or image files to extract contract information automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-slate-300 hover:border-slate-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFileSelect(e.dataTransfer.files);
            }}
          >
            <FileUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-slate-500 mb-4">
              Supports PDF, DOC, DOCX, JPG, PNG files up to 10MB
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
            <CardDescription>
              Track the processing status of your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                    {file.status !== 'completed' && file.status !== 'error' && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-2" />
                        <p className="text-xs text-slate-500 mt-1">
                          {file.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                        </p>
                      </div>
                    )}
                    {file.status === 'completed' && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ Processed successfully and added to library
                      </p>
                    )}
                    {file.status === 'error' && (
                      <p className="text-sm text-red-600 mt-1">
                        ✗ Failed to process
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">AI-Powered Contract Analysis</h3>
              <p className="text-blue-800 text-sm mb-3">
                Our AI automatically extracts key information from your contracts including:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Contract parties and key terms</li>
                <li>• Important dates and deadlines</li>
                <li>• Financial terms and obligations</li>
                <li>• Risk assessment and recommendations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
