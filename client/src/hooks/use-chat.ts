import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type StartChatInput = z.infer<typeof api.chat.start.input>;
type SendMessageInput = z.infer<typeof api.chat.message.input>;

// Start a new conversation
export function useStartChat() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: StartChatInput) => {
      const res = await fetch(api.chat.start.path, {
        method: api.chat.start.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error("Failed to start conversation");
      }
      
      return api.chat.start.responses[201].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Error starting chat",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Get conversation history
export function useChatHistory(sessionId: string) {
  return useQuery({
    queryKey: [api.chat.history.path, sessionId],
    queryFn: async () => {
      const url = buildUrl(api.chat.history.path, { sessionId });
      const res = await fetch(url);
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load chat history");
      
      return api.chat.history.responses[200].parse(await res.json());
    },
    enabled: !!sessionId,
    retry: false,
  });
}

// Send a message
export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SendMessageInput) => {
      const url = buildUrl(api.chat.message.path, { sessionId });
      const res = await fetch(url, {
        method: api.chat.message.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      return api.chat.message.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate specific chat query to refetch updated history/state
      queryClient.invalidateQueries({ queryKey: [api.chat.history.path, sessionId] });
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
