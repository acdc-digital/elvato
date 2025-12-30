# React AI Suggestion
URL: /ai/suggestion
Suggestion chips like ChatGPT's follow-up prompts. Scrollable React pills for guiding conversations with TypeScript and shadcn/ui.

***

title: React AI Suggestion
description: Suggestion chips like ChatGPT's follow-up prompts. Scrollable React pills for guiding conversations with TypeScript and shadcn/ui.
icon: Sparkles
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

Scrollable suggestion pills for AI chat interfaces with React, Next.js, and TypeScript. Because staring at an empty input box is the worst UX—give users actual prompts to click instead of making them think of questions from scratch. This free open source shadcn/ui component provides quick AI prompts for your conversational AI applications using Vercel AI SDK in JavaScript frameworks.

### Horizontal scrolling suggestions

Clickable prompt suggestions with overflow handling:

<Preview path="ai/suggestion" />

The React component provides horizontally scrollable pills, smooth overflow behavior on mobile, and click-to-send functionality. Built with TypeScript for type safety and designed for seamless integration in your JavaScript projects.

## Installation

<Installer packageName="ai" />

## Usage

```tsx
import { Suggestions, Suggestion } from "@/components/ai/suggestion";

<Suggestions>
  <Suggestion suggestion="What are the latest trends in AI?" />
  <Suggestion suggestion="How does machine learning work?" />
  <Suggestion suggestion="Explain quantum computing" />
</Suggestions>;
```

## Why not just let users type?

Blank text boxes are intimidating in AI chat applications. Users don't know what to ask, how to phrase it, or what the conversational AI can even do in React projects. They'll type "hello" and waste everyone's time.

Suggestion pills show AI capabilities immediately in TypeScript components. "Explain quantum computing" tells users this AI handles complex topics. "Write a Python function" shows it codes in JavaScript implementations. Much better than guessing in your Next.js AI application.

## Usage with AI SDK

Quick-start conversations with clickable prompts in React applications:

```tsx
"use client";

import { Suggestions, Suggestion } from "@/components/ai/suggestion";
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

const starterPrompts = [
  "What can you help me with?",
  "Explain how AI works in simple terms",
  "Give me creative project ideas",
  "Help me learn something new today",
];

export default function SuggestionChat() {
  const [input, setInput] = useState("");
  const { messages, append, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      append({ role: "user", content: input });
      setInput("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    append({ role: "user", content: suggestion });
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 p-8">
          <h2 className="text-2xl font-semibold mb-4">
            How can I help you today?
          </h2>
          <Suggestions>
            {starterPrompts.map((prompt) => (
              <Suggestion
                key={prompt}
                suggestion={prompt}
                onClick={handleSuggestionClick}
              />
            ))}
          </Suggestions>
        </div>
      )}

      {messages.length > 0 && (
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
        </Conversation>
      )}

      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder="Type your message..."
        />
        <PromptInputSubmit disabled={!input.trim()} status={status} />
      </PromptInput>
    </div>
  );
}
```

Backend route for handling suggestions:

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

## Examples

### Dynamic follow-up suggestions

Generate contextual suggestions based on conversation:

<Preview path="ai/suggestion-followup" />

## Features

* Horizontal scrolling container with hidden scrollbar in React applications
* Click-to-send functionality with suggestion callbacks for TypeScript components
* Customizable button variants (outline, solid, ghost, etc.) in JavaScript frameworks
* Flexible sizing options (sm, default, lg) for Next.js projects
* Responsive design with touch-friendly scrolling
* Automatic overflow handling for many suggestions
* Rounded pill styling for modern appearance
* Accessible keyboard navigation
* Perfect for AI chat applications, onboarding, empty states, and follow-up prompts
* Free open source component built for Next.js with shadcn/ui design system and AI Elements
* Optimized for Vercel AI SDK and conversational AI interfaces

## API Reference

### Suggestions

Scrollable container for suggestion pills.

| Prop        | Type                                | Description                |
| ----------- | ----------------------------------- | -------------------------- |
| `className` | `string`                            | Additional CSS classes     |
| `...props`  | `ComponentProps<typeof ScrollArea>` | ScrollArea component props |

### Suggestion

Individual clickable suggestion button.

| Prop         | Type                                             | Default     | Description                             |
| ------------ | ------------------------------------------------ | ----------- | --------------------------------------- |
| `suggestion` | `string`                                         | -           | **Required** - Text to display and emit |
| `onClick`    | `(suggestion: string) => void`                   | -           | Callback when clicked                   |
| `variant`    | `ButtonVariant`                                  | `"outline"` | Button style variant                    |
| `size`       | `ButtonSize`                                     | `"sm"`      | Button size                             |
| `className`  | `string`                                         | -           | Additional CSS classes                  |
| `children`   | `ReactNode`                                      | -           | Custom content (overrides suggestion)   |
| `...props`   | `Omit<ComponentProps<typeof Button>, "onClick">` | -           | Button component props                  |

## Keyboard interactions

| Key               | Description                             |
| ----------------- | --------------------------------------- |
| `Tab`             | Navigate between suggestions            |
| `Enter` / `Space` | Select focused suggestion               |
| `Arrow Keys`      | Scroll through suggestions when focused |

## Production tips

**Keep suggestions short.** Long text breaks the pill design in React applications. Aim for 3-7 words per suggestion in TypeScript components.

**Make them actionable.** Use verbs and clear intentions: "Explain...", "Show me...", "Help with..." in JavaScript implementations.

**Rotate suggestions.** Show different prompts on each visit to encourage exploration in Next.js projects.

**Context matters.** After initial interaction, show follow-up suggestions relevant to the conversation in React applications.

**Mobile scrolling needs testing.** Ensure smooth horizontal scrolling on touch devices in TypeScript frameworks.

**Limit suggestion count.** 3-5 visible suggestions work best in JavaScript applications. Too many overwhelm users.

## Integration with other components

Suggestions works seamlessly with [PromptInput](/ai/prompt-input) for complete input experiences in React applications. Use within [Conversation](/ai/conversation) for contextual follow-ups in Next.js projects. Combine with [Message](/ai/message) for suggested responses. This free open source component integrates seamlessly with modern JavaScript frameworks.

## Questions developers actually ask

<Accordions type="single">
  <Accordion id="dynamic-suggestions" title="How do I generate suggestions dynamically?">
    Store suggestions in state and update based on conversation context, user history, or API responses in React applications. Consider using the AI to generate relevant follow-ups in TypeScript components.
  </Accordion>

  {" "}

  <Accordion id="suggestion-analytics" title="Should I track which suggestions get clicked?">
    Yes. Analytics help you understand what users want to know in React applications. Track clicks to improve suggestion quality over time in JavaScript implementations.
  </Accordion>

  {" "}

  <Accordion id="empty-state" title="When should I show suggestions?">
    Show them on empty chat states, after responses for follow-ups, or when users seem stuck in TypeScript components. Hide when actively typing in React applications.
  </Accordion>

  {" "}

  <Accordion id="mobile-behavior" title="How do suggestions work on mobile?">
    The ScrollArea component handles touch scrolling automatically in Next.js projects. Test momentum scrolling and ensure pills are touch-friendly (44px minimum tap target) in JavaScript frameworks.
  </Accordion>

  <Accordion id="custom-styling" title="Can I customize the pill appearance?">
    Use the variant and size props for built-in styles, or pass className for custom styling in React applications. The TypeScript component uses shadcn/ui Button under the hood.
  </Accordion>
</Accordions>