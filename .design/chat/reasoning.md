#### Context:

I'm thinking that our current implementation looks like:
```
User types message → NexusChat.tsx
    ↓
sendMessage() in useNexusAgent hook
    ↓
POST /api/agents/stream (SSE endpoint)
    ↓
SessionManagerAgent.stream() begins
```

In reality, we see - thinking > out, then thinking > updated output, and so on for every tool call. So what we need to do, is review the documentation below, and output the thinking streaming events into a collapsable element. Here's the reference:


#### Reference Materials
# React AI Reasoning
URL: /ai/reasoning
Show AI thinking process like Claude's "thinking" blocks. Collapsible React component with TypeScript and shadcn/ui for transparent AI.

***

title: React AI Reasoning
description: Show AI thinking process like Claude's "thinking" blocks. Collapsible React component with TypeScript and shadcn/ui for transparent AI.
icon: Brain
component: true
---------------

<PoweredBy
  packages={[
  { name: "AI Elements", url: "https://ai-sdk.dev/elements/overview" },
  { name: "Radix UI", url: "https://radix-ui.com/" },
]}
/>

<Callout title="Trying to implement AI Elements?">
  [Join our Discord community](https://discord.com/invite/Z9NVtNE7bj) for help
  from other developers.
</Callout>

<br />

Collapsible reasoning display for AI models that show their thinking process in conversational AI applications. This free open source React component automatically opens during reasoning, closes when complete, and tracks thinking duration in Next.js projects.

### Auto-collapsing reasoning display

Thinking indicator with expandable content:

<Preview path="ai/reasoning" />

Automatically opens during streaming in React applications, closes when complete in TypeScript components, tracks thinking duration, and provides smooth animations. Works with any reasoning-capable AI model in JavaScript frameworks.

## Installation

<Installer packageName="ai" />

## Usage

```tsx
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai/reasoning";

<Reasoning isStreaming={isThinking}>
  <ReasoningTrigger title="Thinking" />
  <ReasoningContent>Let me think about this step by step...</ReasoningContent>
</Reasoning>;
```

## Why show AI reasoning?

Users don't trust black box responses for important decisions in React applications. Showing the thinking process builds confidence and lets users verify the logic in Next.js projects.

Duration tracking shows effort in TypeScript components. "Thought for 8 seconds" signals deliberate consideration, not instant pattern matching in JavaScript implementations.

## Usage with Vercel AI SDK

Stream reasoning from models that support it using Vercel AI SDK in React applications:

```tsx
"use client";

import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai/reasoning";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai/conversation";
import { Message, MessageContent } from "@/components/ai/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai/prompt-input";
import { Response } from "@/components/ai/response";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export default function ReasoningChat() {
  const [input, setInput] = useState("");
  const { messages, append, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      append({ role: "user", content: input });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <Conversation>
        <ConversationContent>
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts?.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <Response key={`${message.id}-${i}`}>
                          {part.text}
                        </Response>
                      );
                    case "reasoning":
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          isStreaming={status === "streaming"}
                          defaultOpen={false}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                })}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
      </Conversation>

      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder="Ask me to reason through something..."
        />
        <PromptInputSubmit disabled={!input.trim()} status={status} />
      </PromptInput>
    </div>
  );
}
```

Backend route with reasoning support:

```tsx
// app/api/chat/route.ts
import { streamText, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: "deepseek/deepseek-r1", // or other reasoning-capable model
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true, // Enable reasoning part streaming
  });
}
```

## Features

* Automatic open/close behavior during reasoning streams (opens when reasoning starts, closes when done) in React applications
* Manual toggle control with smooth animations in TypeScript components
* Duration tracking with "Thought for X seconds" display for JavaScript frameworks
* Controllable state for custom behavior in Next.js projects
* Accessible keyboard navigation and screen reader support
* Works with any Vercel AI SDK setup and AI chat applications
* Free open source component designed for reasoning-capable AI models (DeepSeek R1, o1, etc.) in conversational AI interfaces

## API Reference

### Reasoning

Container component managing reasoning state and auto-behavior.

| Prop           | Type                                 | Default | Description                                  |
| -------------- | ------------------------------------ | ------- | -------------------------------------------- |
| `isStreaming`  | `boolean`                            | `false` | Auto-opens when true, auto-closes when false |
| `open`         | `boolean`                            | -       | Controlled open state                        |
| `defaultOpen`  | `boolean`                            | `false` | Initial open state for uncontrolled usage    |
| `onOpenChange` | `(open: boolean) => void`            | -       | Callback when open state changes             |
| `duration`     | `number`                             | `0`     | Controlled duration in seconds               |
| `className`    | `string`                             | -       | Additional CSS classes                       |
| `...props`     | `ComponentProps<typeof Collapsible>` | -       | Collapsible component props                  |

### ReasoningTrigger

Clickable trigger showing reasoning status and duration.

| Prop        | Type                                        | Default       | Description                     |
| ----------- | ------------------------------------------- | ------------- | ------------------------------- |
| `title`     | `string`                                    | `"Reasoning"` | Custom title for thinking state |
| `className` | `string`                                    | -             | Additional CSS classes          |
| `...props`  | `ComponentProps<typeof CollapsibleTrigger>` | -             | Collapsible trigger props       |

### ReasoningContent

Content container for reasoning text with animations.

| Prop        | Type                                        | Description                           |
| ----------- | ------------------------------------------- | ------------------------------------- |
| `children`  | `string`                                    | **Required** - Reasoning content text |
| `className` | `string`                                    | Additional CSS classes                |
| `...props`  | `ComponentProps<typeof CollapsibleContent>` | Collapsible content props             |

## Keyboard interactions

| Key               | Description                            |
| ----------------- | -------------------------------------- |
| `Space` / `Enter` | Toggle reasoning visibility on trigger |
| `Tab`             | Focus reasoning trigger                |
| `Escape`          | Close reasoning panel when focused     |

## Reasoning display gotchas

**Auto-close timing can feel abrupt**: The React component auto-closes 1 second after streaming ends. Adjust AUTO\_CLOSE\_DELAY if users complain in TypeScript implementations.

**Long reasoning breaks mobile**: DeepSeek R1 reasoning can be 2000+ words in JavaScript applications. Set max-height and scroll, or mobile users scroll forever in Next.js projects.

**Streaming performance issues**: Large reasoning content updates rapidly in React components. Consider throttling updates for smoother animations.

**Default open state matters**: Most users want reasoning closed by default in TypeScript applications. They'll expand it if interested.

**Empty reasoning handling**: Not all models provide reasoning for every response in JavaScript frameworks. Handle undefined reasoning gracefully in React implementations.

## Integration with other components

Works great with [Response](/ai/response) for formatted reasoning content in React applications. Drop into [Message](/ai/message) for chat-based reasoning display in Next.js projects. Combine with [Conversation](/ai/conversation) for scrolling reasoning streams. This free open source component integrates seamlessly with modern JavaScript frameworks.

## Questions developers actually ask

<Accordions type="single">
  <Accordion id="auto-behavior" title="How does the auto open/close behavior work?">
    When isStreaming becomes true, reasoning opens in React applications. When false, it closes after 1 second delay. Users can still manually toggle anytime in TypeScript components.
  </Accordion>

  <Accordion id="duration-tracking" title="How is thinking duration calculated?">
    Duration starts when isStreaming becomes true and ends when it becomes false in React applications. The component tracks elapsed time automatically in JavaScript implementations.
  </Accordion>

  <Accordion id="controlled-state" title="Can I control the open state manually?">
    Yeah. Use open/onOpenChange for controlled state, or defaultOpen for initial state in TypeScript components. Auto-behavior still works alongside manual control in React applications.
  </Accordion>

  <Accordion id="reasoning-models" title="Which AI models support reasoning parts?">
    DeepSeek R1, OpenAI o1, and other reasoning models in React applications. Check your model's docs for reasoning support and enable sendReasoning in the response for Next.js projects.
  </Accordion>

  <Accordion id="custom-trigger" title="Can I customize the trigger appearance?">
    Pass custom children to ReasoningTrigger to override the default brain icon and text in TypeScript components. The component handles state display automatically in JavaScript frameworks.
  </Accordion>
</Accordions>
