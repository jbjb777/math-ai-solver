import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageSquare, Plus, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function Chat() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const conversationId = params.id ? parseInt(params.id) : null;

  const [input, setInput] = useState("");
  const [currentConvId, setCurrentConvId] = useState<number | null>(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  // Queries
  const { data: conversations = [], isLoading: conversationsLoading } =
    trpc.math.getConversations.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const { data: messages = [], isLoading: messagesLoading } =
    trpc.math.getMessages.useQuery(
      { conversationId: currentConvId! },
      { enabled: !!currentConvId }
    );

  // Mutations
  const createConversation = trpc.math.createConversation.useMutation({
    onSuccess: (data) => {
      setCurrentConvId(data.conversationId);
      setLocation(`/chat/${data.conversationId}`);
      utils.math.getConversations.invalidate();
    },
  });

  const solveProblem = trpc.math.solveProblem.useMutation({
    onSuccess: () => {
      setInput("");
      utils.math.getMessages.invalidate({ conversationId: currentConvId! });
      utils.math.getConversations.invalidate();
    },
    onError: (error) => {
      toast.error("문제 해결 중 오류가 발생했습니다: " + error.message);
    },
  });

  const deleteConversation = trpc.math.deleteConversation.useMutation({
    onSuccess: () => {
      utils.math.getConversations.invalidate();
      if (currentConvId) {
        setCurrentConvId(null);
        setLocation("/chat");
      }
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewChat = () => {
    createConversation.mutate({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentConvId) return;

    solveProblem.mutate({
      conversationId: currentConvId,
      question: input.trim(),
    });
  };

  const handleDeleteConversation = (id: number) => {
    if (confirm("이 대화를 삭제하시겠습니까?")) {
      deleteConversation.mutate({ conversationId: id });
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-6 w-6" />}
            <h1 className="font-bold text-card-foreground">{APP_TITLE}</h1>
          </div>
          <Button onClick={handleNewChat} className="w-full" disabled={createConversation.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            새 대화
          </Button>
        </div>

        <ScrollArea className="flex-1 p-2">
          {conversationsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-4">
              대화 내역이 없습니다
            </p>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center justify-between rounded-lg p-2 hover:bg-accent cursor-pointer ${
                    currentConvId === conv.id ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    setCurrentConvId(conv.id);
                    setLocation(`/chat/${conv.id}`);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{conv.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="text-sm text-muted-foreground">
            {user?.name || user?.email || "사용자"}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {!currentConvId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-semibold">수학 문제를 물어보세요</h2>
              <p className="text-muted-foreground">
                새 대화를 시작하거나 기존 대화를 선택하세요
              </p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messagesLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground p-8">
                  메시지를 입력하여 대화를 시작하세요
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <Card
                        className={`max-w-[80%] p-4 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-card-foreground"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <Streamdown>{msg.content}</Streamdown>
                        )}
                      </Card>
                    </div>
                  ))}
                  {solveProblem.isPending && (
                    <div className="flex justify-start">
                      <Card className="max-w-[80%] p-4 bg-card text-card-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="수학 문제를 입력하세요..."
                  disabled={solveProblem.isPending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || solveProblem.isPending}
                >
                  {solveProblem.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
