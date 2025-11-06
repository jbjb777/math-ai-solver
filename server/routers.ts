import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  math: router({
    // Create a new conversation
    createConversation: protectedProcedure
      .input(z.object({ title: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const conversationId = await db.createConversation(ctx.user.id, input.title);
        return { conversationId };
      }),

    // Get all user conversations
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserConversations(ctx.user.id);
    }),

    // Get messages in a conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getConversationMessages(input.conversationId);
      }),

    // Delete a conversation
    deleteConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteConversation(input.conversationId);
        return { success: true };
      }),

    // Solve math problem
    solveProblem: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          question: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // Save user message
        await db.addMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.question,
        });

        // Get conversation history
        const history = await db.getConversationMessages(input.conversationId);

        // Prepare messages for LLM
        const llmMessages = [
          {
            role: "system" as const,
            content:
              "당신은 수학 문제를 해결하는 전문 AI 조수입니다. 사용자가 수학 문제를 제공하면, 단계별로 자세히 풀이 과정을 설명하고 최종 답을 제시하세요. 수식은 LaTeX 형식으로 작성하여 $...$ 또는 $$...$$ 로 감싸주세요.",
          },
          ...history.slice(-10).map((msg) => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
          })),
        ];

        // Call LLM
        const response = await invokeLLM({
          messages: llmMessages,
        });

        const rawContent = response.choices[0].message.content;
        const answer = typeof rawContent === "string" ? rawContent : "답변을 생성할 수 없습니다.";

        // Save assistant message
        await db.addMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: answer,
        });

        return { answer };
      }),
  }),
});

export type AppRouter = typeof appRouter;
