import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface GenerateInsightsButtonProps {
  contractId: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const GenerateInsightsButton = ({ 
  contractId, 
  variant = "outline", 
  size = "sm",
  className 
}: GenerateInsightsButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateInsights = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-insights', {
        body: { contractId }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate insights');
      }

      // Refresh insights data
      queryClient.invalidateQueries({ queryKey: ['ai_insights'] });

      toast({
        title: "Insights Generated",
        description: `Generated ${response.data.insights} new AI insights for this contract`,
      });

    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Failed to generate insights',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={generateInsights}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Brain className="w-4 h-4 mr-2" />
      )}
      {isGenerating ? 'Generating...' : 'Generate AI Insights'}
    </Button>
  );
};