import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calculator, MessageSquare, Sparkles } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleStart = () => {
    if (isAuthenticated) {
      setLocation("/chat");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
            <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
          </div>
          {isAuthenticated && (
            <Button onClick={() => setLocation("/chat")} variant="outline">
              대화 시작
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container flex flex-col items-center justify-center py-20">
        <div className="max-w-3xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            <Sparkles className="h-4 w-4" />
            AI 기반 수학 학습 도구
          </div>

          <h2 className="text-5xl font-bold tracking-tight text-foreground">
            수학 문제,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI가 함께 풀어드립니다
            </span>
          </h2>

          <p className="text-xl text-muted-foreground">
            복잡한 수학 문제도 단계별로 자세히 설명해드립니다.
            <br />
            언제 어디서나 나만의 AI 수학 선생님과 함께하세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleStart}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              {isAuthenticated ? "대화 시작하기" : "로그인하고 시작"}
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 sm:grid-cols-3 max-w-5xl">
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">단계별 풀이</h3>
            <p className="text-sm text-muted-foreground">
              각 문제를 단계별로 나누어 자세히 설명해드립니다.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">대화형 학습</h3>
            <p className="text-sm text-muted-foreground">
              궁금한 점을 자유롭게 물어보고 추가 설명을 받을 수 있습니다.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">수식 렌더링</h3>
            <p className="text-sm text-muted-foreground">
              복잡한 수식도 아름답게 표현되어 이해하기 쉽습니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
