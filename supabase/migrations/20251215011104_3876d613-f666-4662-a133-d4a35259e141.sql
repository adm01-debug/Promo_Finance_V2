-- Create table for EXPERT conversations
CREATE TABLE public.expert_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL DEFAULT 'Nova Conversa',
  resumo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for EXPERT messages
CREATE TABLE public.expert_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.expert_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  actions JSONB,
  actions_executed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expert_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expert_conversations
CREATE POLICY "Users can view own conversations"
ON public.expert_conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
ON public.expert_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.expert_conversations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
ON public.expert_conversations
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for expert_messages
CREATE POLICY "Users can view messages from own conversations"
ON public.expert_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.expert_conversations
    WHERE id = expert_messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to own conversations"
ON public.expert_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.expert_conversations
    WHERE id = expert_messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in own conversations"
ON public.expert_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.expert_conversations
    WHERE id = expert_messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_expert_conversations_user_id ON public.expert_conversations(user_id);
CREATE INDEX idx_expert_messages_conversation_id ON public.expert_messages(conversation_id);

-- Trigger to update updated_at on conversations
CREATE TRIGGER update_expert_conversations_updated_at
BEFORE UPDATE ON public.expert_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();