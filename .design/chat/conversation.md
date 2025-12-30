# React AI Conversation
#### Consider:
**Next Steps (Optional) Consider these future enhancements:**
- Badge count - Show number of unseen messages
- Virtualization - For 200+ message conversations
- Scroll anchoring - For loading historical messages
- Custom animations - Spring physics or other effects


URL: /ai/conversation
Auto-scrolling chat container that stays at bottom during streaming. React component with TypeScript and shadcn/ui for smooth AI conversations.

***

title: React AI Conversation
description: Auto-scrolling chat container that stays at bottom during streaming. React component with TypeScript and shadcn/ui for smooth AI conversations.
icon: MessageSquare
component: true
---------------

<PoweredBy
  packages={[
  { name: "AI Elements", url: "https://ai-sdk.dev/elements/overview" },
  {
    name: "use-stick-to-bottom",
    url: "https://github.com/use-stick-to-bottom/use-stick-to-bottom",
  },
  { name: "Radix UI", url: "https://radix-ui.com/" },
]}
/>

<Callout title="Trying to implement AI Elements?">
  [Join our Discord community](https://discord.com/invite/Z9NVtNE7bj) for help
  from other developers.
</Callout>

<br />

Chat interfaces that don't auto-scroll are broken. Users shouldn't have to manually scroll down every time a new message arrives. This free open source React component handles the scroll behavior that makes conversations feel natural in your Next.js application—stick to bottom included.

### Auto-scrolling conversation

Chat container with automatic scroll-to-bottom behavior:

<Preview path="ai/conversation" />

This React component automatically scrolls when new messages arrive, shows a scroll button when users scroll up, and maintains position during typing. Built with TypeScript for type safety and Tailwind CSS for consistent styling in your JavaScript projects.

## Installation

<Installer packageName="ai" />

## Usage

```tsx
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai/conversation";

<Conversation className="relative w-full" style={{ height: "500px" }}>
  <ConversationContent>
    <Message from={"user"}>
      <MessageContent>Hi there!</MessageContent>
    </Message>
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>;
```

## Why scroll behavior matters

Bad scroll handling kills chat UX in React applications. Users miss new messages, lose their place, or fight with jumpy animations. Get it wrong and your chat feels broken.

Auto-scroll isn't just convenience in Next.js projects—it's expected behavior. Every major chat app does it. Skip it and users think something's wrong in your JavaScript implementation.

## Usage with AI SDK

Build conversational UI with automatic scrolling in React applications:

```tsx
"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
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

export default function Chat() {
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
    <div className="flex flex-col h-full">
      <Conversation>
        <ConversationContent>
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                <Response>{message.content}</Response>
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="mt-4">
        <PromptInputTextarea
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
        <PromptInputSubmit status={status} disabled={!input.trim()} />
      </PromptInput>
    </div>
  );
}
```

Backend route for streaming:

```tsx
// app/api/chat/route.ts
import { streamText, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: "openai/gpt-4o",
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

## Features

* Automatic scrolling to bottom when new messages arrive in React applications
* Smooth scrolling animations with configurable behavior in TypeScript components
* Scroll-to-bottom button that appears when scrolled up
* Maintains scroll position while users read history in JavaScript frameworks
* Responsive design with customizable padding for Next.js projects
* ARIA roles for screen reader accessibility
* Resize handling without scroll jumps in modern React applications
* Free open source component perfect for AI chat, support systems, and messaging apps
* Built for Next.js with shadcn/ui design system integration

## API Reference

### Conversation

Main container with scroll behavior management.

| Prop       | Type                            | Default    | Description                       |
| ---------- | ------------------------------- | ---------- | --------------------------------- |
| `initial`  | `ScrollBehavior`                | `"smooth"` | Initial scroll behavior           |
| `resize`   | `ScrollBehavior`                | `"smooth"` | Behavior on container resize      |
| `...props` | `ComponentProps<StickToBottom>` | -          | Props for StickToBottom component |

### ConversationContent

Content wrapper with consistent spacing.

| Prop       | Type                                    | Description                 |
| ---------- | --------------------------------------- | --------------------------- |
| `...props` | `ComponentProps<StickToBottom.Content>` | Props for content container |

### ConversationScrollButton

Floating button to return to bottom.

| Prop       | Type                     | Description                            |
| ---------- | ------------------------ | -------------------------------------- |
| `...props` | `ComponentProps<Button>` | Spreads to underlying Button component |

## Keyboard interactions

| Key        | Description                         |
| ---------- | ----------------------------------- |
| `End`      | Scroll to bottom of conversation    |
| `Home`     | Scroll to top of conversation       |
| `PageUp`   | Scroll up one page                  |
| `PageDown` | Scroll down one page                |
| `Space`    | Activate scroll button when focused |

## Production tips

**Set explicit height.** Conversation needs a height constraint to scroll in React applications. Use viewport units or fixed height.

**Debounce scroll events.** Heavy scroll listeners kill performance in JavaScript implementations. This component handles this automatically.

**Keep scroll button visible.** Users panic when they can't find bottom in Next.js projects. The button should be obvious.

**Test with long conversations.** 100+ messages reveal performance issues in TypeScript components. Virtualize if needed.

**Handle image loading.** Images that load after render break scroll position in React applications. Use fixed dimensions.

## Integration with other components

Conversation works seamlessly with [Message](/ai/message) for displaying chat bubbles in React applications. Combine with [PromptInput](/ai/prompt-input) for complete chat UI in Next.js projects. Use with [Response](/ai/response) for markdown rendering. This free open source component family ensures consistent styling across all JavaScript frameworks with shadcn/ui design system.

## Questions developers actually ask

<Accordions type="single">
  <Accordion id="custom-scroll" title="Can I customize scroll behavior?">
    Pass `initial` and `resize` props with "smooth", "instant", or "auto" values in React applications.
  </Accordion>

  {" "}

  <Accordion id="programmatic-scroll" title="How do I scroll programmatically?">
    Access the context ref and call `scrollToBottom()` method directly in TypeScript components.
  </Accordion>

  {" "}

  <Accordion id="preserve-position" title="How to preserve position on new messages?">
    This React component auto-preserves when user has scrolled up. Only auto-scrolls when at bottom in Next.js applications.
  </Accordion>

  {" "}

  <Accordion id="virtualization" title="When should I add virtualization?">
    After 200-300 messages in JavaScript applications. Use react-window or react-virtualized for large lists.
  </Accordion>

  <Accordion id="mobile-scroll" title="Any mobile considerations?">
    iOS Safari has quirks with scroll in React applications. Test thoroughly in TypeScript projects. Consider momentum scrolling settings.
  </Accordion>
</Accordions>
