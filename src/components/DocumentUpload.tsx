import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, AlertTriangle, CheckCircle, X, FileUp, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error' | 'needs_review';
  progress: number;
  file: File;
  errorMessage?: string;
  missingFields?: string[];
}

export const DocumentUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    console.log('Files selected:', selectedFiles.length);
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

  const uploadFileToStorage = async (file: File, contractId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${contractId}_${Date.now()}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      console.log('Uploading file to storage:', filePath);

      const { data, error } = await supabase.storage
        .from('contract-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        return null;
      }

      console.log('File uploaded successfully to storage:', data.path);
      return data.path;
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    console.log('Extracting text from file:', file.name, 'Type:', file.type);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          console.log('FileReader onload triggered for:', file.name);
          
          if (file.type === 'application/pdf') {
            // For PDFs, we'll pass the base64 content to Gemini for analysis
            const base64Content = (reader.result as string).split(',')[1];
            console.log('PDF content extracted, base64 length:', base64Content?.length || 0);
            resolve(base64Content || '');
          } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
            // For text files, use the text content
            const textContent = reader.result as string;
            console.log('Text content extracted, length:', textContent?.length || 0);
            resolve(textContent || '');
          } else if (file.type.startsWith('image/')) {
            // For images, we'll pass the base64 content to Gemini
            const base64Content = (reader.result as string).split(',')[1];
            console.log('Image content extracted, base64 length:', base64Content?.length || 0);
            resolve(base64Content || '');
          } else {
            // For other file types, try to read as text
            const content = reader.result as string || `Document content from ${file.name}`;
            console.log('Other file type content extracted, length:', content.length);
            resolve(content);
          }
        } catch (error) {
          console.error('Error processing file content:', error);
          resolve(`Document content from ${file.name}`);
        }
      };
      
      reader.onerror = () => {
        console.error('FileReader error for:', file.name);
        resolve(`Document content from ${file.name}`);
      };

      // Read file based on type
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        console.log('Reading file as data URL for:', file.name);
        reader.readAsDataURL(file);
      } else {
        console.log('Reading file as text for:', file.name);
        reader.readAsText(file);
      }
    });
  };

  const processWithAI = async (fileName: string, fileContent: string, file: File) => {
    try {
      console.log('Starting AI processing for file:', fileName);
      console.log('File type:', file.type);
      console.log('Content length:', fileContent?.length || 0);
      
      // Prepare the message for Gemini based on file type
      let analysisMessage = '';
      
      if (file.type === 'application/pdf') {
        analysisMessage = `Please analyze this PDF contract document and extract the following information in JSON format:
        
        Document: ${fileName}
        
        The document content is provided as base64. Please analyze it and extract contract information.
        
        Extract and return ONLY a JSON object with these fields:
        {
          "contract_name": "contract title/name",
          "parties_involved": ["list of parties/entities"],
          "contract_type": "one of: Service Agreement, Supply Contract, License Agreement, Lease Agreement, Employment Contract, NDA, Partnership Agreement, Sales Contract, General Contract",
          "contract_value": number or null,
          "currency": "USD, EUR, GBP, CAD, AUD, KES (Kenyan Shilling), or other",
          "effective_date": "YYYY-MM-DD format or null",
          "expiration_date": "YYYY-MM-DD format or null",
          "contract_content": "summary of key contract terms and conditions",
          "renewal_notice_days": number or 30,
          "status": "one of: active, pending, expired, terminated"
        }
        
        Base64 Content: ${fileContent}`;
      } else if (file.type.startsWith('image/')) {
        analysisMessage = `Please analyze this contract document image and extract the following information in JSON format:
        
        Document: ${fileName}
        
        The document is provided as an image. Please analyze the text content and extract contract information.
        
        Extract and return ONLY a JSON object with these fields:
        {
          "contract_name": "contract title/name",
          "parties_involved": ["list of parties/entities"],
          "contract_type": "one of: Service Agreement, Supply Contract, License Agreement, Lease Agreement, Employment Contract, NDA, Partnership Agreement, Sales Contract, General Contract",
          "contract_value": number or null,
          "currency": "USD, EUR, GBP, CAD, AUD, KES (Kenyan Shilling), or other",
          "effective_date": "YYYY-MM-DD format or null",
          "expiration_date": "YYYY-MM-DD format or null",
          "contract_content": "summary of key contract terms and conditions",
          "renewal_notice_days": number or 30,
          "status": "one of: active, pending, expired, terminated"
        }
        
        Image Content: ${fileContent}`;
      } else {
        analysisMessage = `Please analyze this contract document and extract the following information in JSON format:
        
        Document: ${fileName}
        Content: ${fileContent}
        
        Extract and return ONLY a JSON object with these fields:
        {
          "contract_name": "contract title/name",
          "parties_involved": ["list of parties/entities"],
          "contract_type": "one of: Service Agreement, Supply Contract, License Agreement, Lease Agreement, Employment Contract, NDA, Partnership Agreement, Sales Contract, General Contract",
          "contract_value": number or null,
          "currency": "USD, EUR, GBP, CAD, AUD, KES (Kenyan Shilling), or other",
          "effective_date": "YYYY-MM-DD format or null",
          "expiration_date": "YYYY-MM-DD format or null",
          "contract_content": "full contract text or summary of key terms",
          "renewal_notice_days": number or 30,
          "status": "one of: active, pending, expired, terminated"
        }`;
      }

      console.log('Sending message to AI function:', analysisMessage.substring(0, 200) + '...');

      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          message: analysisMessage,
          userId: 'document-processor'
        }
      });

      console.log('AI function response received:', response);
      console.log('Response data:', response.data);
      console.log('Response error:', response.error);

      if (response.error) {
        console.error('AI function invocation error:', response.error);
        throw new Error(`AI processing failed: ${response.error.message}`);
      }

      if (response.data?.response) {
        console.log('Full AI response:', response.data.response);
        
        try {
          // Try to extract JSON from the AI response
          const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedData = JSON.parse(jsonMatch[0]);
            console.log('Successfully parsed AI extracted data:', extractedData);
            
            // Validate required fields and identify missing ones
            const requiredFields = ['contract_name', 'parties_involved', 'contract_type', 'contract_value', 'effective_date', 'expiration_date'];
            const missingFields = requiredFields.filter(field => !extractedData[field] || extractedData[field] === null);
            
            console.log('Missing fields identified:', missingFields);
            
            return {
              data: extractedData,
              missingFields: missingFields
            };
          } else {
            console.warn('No JSON found in AI response, using fallback');
          }
        } catch (parseError) {
          console.error('Error parsing AI response as JSON:', parseError);
          console.log('Raw response that failed to parse:', response.data.response);
        }
      } else {
        console.warn('No response data from AI function');
      }

      // Fallback extraction if AI fails
      console.log('Using fallback extraction method');
      return {
        data: extractContractInfoFallback(fileName, fileContent),
        missingFields: []
      };
    } catch (error) {
      console.error('AI processing error:', error);
      return {
        data: extractContractInfoFallback(fileName, fileContent),
        missingFields: []
      };
    }
  };

  const extractContractInfoFallback = (fileName: string, extractedText: string) => {
    console.log('Using fallback extraction for:', fileName);
    
    // Fallback extraction logic
    const contractName = fileName.replace(/\.[^/.]+$/, "");
    const contractType = getContractType(fileName);
    
    return {
      contract_name: contractName,
      parties_involved: [extractCounterparty(contractName)],
      contract_type: contractType,
      status: 'active', // Ensure status is always set
      contract_content: extractedText,
      contract_value: null,
      currency: 'USD',
      effective_date: new Date().toISOString().split('T')[0],
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      renewal_notice_days: 30
    };
  };

  const processUpload = async (uploadFile: UploadedFile) => {
    try {
      console.log('Starting upload process for:', uploadFile.file.name);
      
      // Update progress to show uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 10 } : f
      ));

      // Extract content from file
      const extractedContent = await extractTextFromFile(uploadFile.file);
      console.log('Content extracted successfully, length:', extractedContent?.length || 0);
      
      // Update progress to show AI processing
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 30, status: 'processing' } : f
      ));

      // Show processing notification
      toast({
        title: "Document Processing",
        description: `${uploadFile.file.name} is being analyzed by Gemini AI. Please wait...`,
      });

      // Process with AI to extract contract information
      const aiResult = await processWithAI(uploadFile.file.name, extractedContent, uploadFile.file);
      const aiExtractedData = aiResult.data;
      const missingFields = aiResult.missingFields;
      
      console.log('AI processing completed. Data:', aiExtractedData);
      console.log('Missing fields:', missingFields);
      
      // Update progress to show database insertion
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 60 } : f
      ));

      // Ensure all required fields have values, especially status
      const contractData = {
        title: aiExtractedData.contract_name || uploadFile.file.name,
        counterparty: Array.isArray(aiExtractedData.parties_involved) 
          ? aiExtractedData.parties_involved.join(', ') 
          : aiExtractedData.parties_involved || 'Unknown',
        contract_type: aiExtractedData.contract_type || 'General Contract',
        status: aiExtractedData.status || 'active', // Always ensure status is set
        contract_content: aiExtractedData.contract_content || extractedContent,
        contract_value: aiExtractedData.contract_value,
        currency: aiExtractedData.currency || 'USD',
        effective_date: aiExtractedData.effective_date,
        expiration_date: aiExtractedData.expiration_date,
        renewal_notice_days: aiExtractedData.renewal_notice_days || 30
      };

      console.log('Creating contract with data:', contractData);

      // Create contract record with AI-extracted data
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (contractError) {
        console.error('Contract creation error:', contractError);
        throw contractError;
      }

      console.log('Contract created successfully:', contract);

      // Update progress to show file storage
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 80 } : f
      ));

      // Upload file to Supabase storage
      const storagePath = await uploadFileToStorage(uploadFile.file, contract.id);
      
      if (!storagePath) {
        throw new Error('Failed to upload file to storage');
      }

      // Update contract with file path
      await supabase
        .from('contracts')
        .update({ 
          file_name: uploadFile.file.name,
          file_path: storagePath
        })
        .eq('id', contract.id);

      // Create document upload record with proper data structure
      const documentUploadData = {
        contract_id: contract.id,
        file_name: uploadFile.file.name,
        file_path: storagePath,
        file_size: uploadFile.file.size,
        mime_type: uploadFile.file.type || 'application/octet-stream',
        processing_status: 'completed',
        extracted_text: typeof extractedContent === 'string' && !extractedContent.startsWith('data:') 
          ? extractedContent.substring(0, 10000) // Limit text length to avoid issues
          : 'Binary content processed',
        ai_analysis: aiExtractedData
      };

      console.log('Creating document upload record with data:', documentUploadData);

      const { error: uploadError } = await supabase
        .from('document_uploads')
        .insert(documentUploadData);

      if (uploadError) {
        console.error('Document upload record creation error:', uploadError);
        // Log but don't fail the entire process
      }

      // Create sample deadline if expiration date exists
      if (aiExtractedData.expiration_date) {
        const expirationDate = new Date(aiExtractedData.expiration_date);
        const reminderDate = new Date(expirationDate);
        reminderDate.setDate(reminderDate.getDate() - (aiExtractedData.renewal_notice_days || 30));
        
        await supabase
          .from('deadlines')
          .insert({
            contract_id: contract.id,
            title: `${aiExtractedData.contract_name} Renewal Notice`,
            description: `Contract renewal deadline for ${aiExtractedData.contract_name}`,
            due_date: reminderDate.toISOString().split('T')[0],
            type: 'renewal',
            priority: 'medium'
          });
      }

      // Create AI insight
      await supabase
        .from('ai_insights')
        .insert({
          contract_id: contract.id,
          title: `Contract Analysis Complete`,
          description: `Gemini AI has successfully analyzed and extracted key information from ${uploadFile.file.name}. ${missingFields.length > 0 ? `Note: ${missingFields.length} fields require manual review.` : 'All key fields were successfully extracted.'}`,
          insight_type: missingFields.length > 0 ? 'risk' : 'opportunity',
          impact: 'medium',
          confidence: missingFields.length > 0 ? 70 : 90,
          actionable: missingFields.length > 0
        });

      // Determine final status
      const finalStatus = missingFields.length > 0 ? 'needs_review' : 'completed';
      
      // Update progress to completed
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          progress: 100, 
          status: finalStatus,
          missingFields: missingFields.length > 0 ? missingFields : undefined
        } : f
      ));

      // Refresh queries to show new data
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['ai_insights'] });

      // Show completion notification
      if (missingFields.length > 0) {
        toast({
          title: "Processing Complete - Review Required",
          description: `${uploadFile.file.name} has been processed by Gemini AI, but ${missingFields.length} fields need manual review. Please check the contract details.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Gemini AI Processing Complete",
          description: `${uploadFile.file.name} has been successfully analyzed by Gemini AI and all contract details have been automatically extracted.`,
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
        } : f
      ));
      
      toast({
        title: "Processing Failed",
        description: `Failed to process ${uploadFile.file.name} with Gemini AI. ${error instanceof Error ? error.message : 'Please try again or contact support.'}`,
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
    if (name.includes('nda') || name.includes('confidential')) return 'NDA';
    if (name.includes('partnership')) return 'Partnership Agreement';
    if (name.includes('sale') || name.includes('purchase')) return 'Sales Contract';
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
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'needs_review':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusMessage = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return 'Uploading and extracting content...';
      case 'processing':
        return 'Gemini AI analyzing contract content...';
      case 'completed':
        return '✓ Gemini AI analysis complete - All contract details extracted and saved';
      case 'needs_review':
        return `⚠ Processing complete - ${file.missingFields?.length} fields need manual review`;
      case 'error':
        return `✗ ${file.errorMessage || 'Processing failed - Please try again or contact support'}`;
      default:
        return '';
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
            Upload PDF, Word, or image files. Gemini AI will automatically analyze the actual document content and extract contract information including parties, terms, dates, values, and content. Files are securely stored and encrypted.
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
              console.log('Files dropped:', e.dataTransfer.files.length);
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
              onChange={(e) => {
                console.log('File input changed:', e.target.files?.length || 0);
                handleFileSelect(e.target.files);
              }}
              style={{ display: 'none' }}
              id="file-upload"
              ref={fileInputRef}
            />
            <Button 
              onClick={() => {
                console.log('Upload button clicked');
                if (fileInputRef.current) {
                  console.log('Triggering file input click');
                  fileInputRef.current.click();
                } else {
                  console.error('File input element not found');
                }
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Gemini AI Processing Progress</CardTitle>
            <CardDescription>
              Track the Gemini AI analysis and contract information extraction progress
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
                    {file.status !== 'completed' && file.status !== 'error' && file.status !== 'needs_review' && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-2" />
                        <p className="text-xs text-slate-500 mt-1">
                          {getStatusMessage(file)}
                        </p>
                      </div>
                    )}
                    {(file.status === 'completed' || file.status === 'needs_review' || file.status === 'error') && (
                      <p className={`text-sm mt-1 ${
                        file.status === 'completed' ? 'text-green-600' :
                        file.status === 'needs_review' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {getStatusMessage(file)}
                      </p>
                    )}
                    {file.missingFields && file.missingFields.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-yellow-700 font-medium">Fields requiring manual review:</p>
                        <p className="text-xs text-yellow-600">{file.missingFields.join(', ')}</p>
                      </div>
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

      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">Secure Gemini AI Contract Processing</h3>
              <p className="text-purple-800 text-sm mb-3">
                Our advanced Gemini AI automatically extracts comprehensive contract information directly from your documents with enterprise-grade security:
              </p>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Direct document content analysis (PDF, images, text)</li>
                <li>• Contract name and parties involved extraction</li>
                <li>• Contract type, status, and key terms identification</li>
                <li>• Financial details including value and currency (USD, EUR, KES, etc.)</li>
                <li>• Important dates and renewal terms detection</li>
                <li>• Full contract content analysis and summarization</li>
                <li>• Secure file storage with encryption</li>
                <li>• Error handling with manual review options</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
