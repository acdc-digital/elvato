# React AI Prompt Input
URL: /ai/prompt-input
ChatGPT-style input with auto-resize and model selector. React component with TypeScript, keyboard shortcuts, and shadcn/ui for AI chat.

***

title: React AI Prompt Input
description: ChatGPT-style input with auto-resize and model selector. React component with TypeScript, keyboard shortcuts, and shadcn/ui for AI chat.
icon: MessageSquare
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

Auto-resizing textarea with toolbar for AI prompts in conversational AI applications. This free open source React component handles Enter submits, Shift+Enter adds new lines, and includes model selection with proper form handling for Next.js projects.

### Auto-resizing prompt input with toolbar

Textarea with submit button and model selection:

<Preview path="ai/prompt-input" />

Automatically adjusts height based on content in React applications, handles Enter/Shift+Enter shortcuts correctly in TypeScript components, and provides a flexible toolbar system for JavaScript frameworks. Integrates seamlessly with Vercel AI SDK status.

## Installation

<Installer packageName="ai" />

## Usage

```tsx
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from "@/components/ai/prompt-input";

<PromptInput onSubmit={() => {}}>
  <PromptInputTextarea
    value={input}
    onChange={(e) => setInput(e.currentTarget.value)}
    placeholder="Type your message..."
  />
  <PromptInputToolbar>
    <PromptInputSubmit disabled={!input.trim()} />
  </PromptInputToolbar>
</PromptInput>;
```

## Why not just use a regular textarea?

Fixed-height textareas cut off AI prompts in React applications. Users write long, complex prompts and need to see what they're typing without scrolling in a tiny box in Next.js projects.

Enter/Shift+Enter behavior has to be right in JavaScript implementations. Users expect Enter to submit, Shift+Enter for new lines in TypeScript components. Get this wrong and your chat feels broken.

## Usage with Vercel AI SDK

Complete chat interface using Vercel AI SDK with model selection and status integration in React applications:

```tsx
"use client";

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue,
} from "@/components/ai/prompt-input";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai/conversation";
import { Message, MessageContent } from "@/components/ai/message";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { MicIcon, PaperclipIcon } from "lucide-react";

const models = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
];

export default function Chat() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(models[0].id);

  const { messages, append, status } = useChat({
    body: { model: selectedModel },
  });

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
              <MessageContent>{message.content}</MessageContent>
            </Message>
          ))}
        </ConversationContent>
      </Conversation>

      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder="Type your message..."
        />
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputButton>
              <PaperclipIcon size={16} />
            </PromptInputButton>
            <PromptInputButton>
              <MicIcon size={16} />
              <span>Voice</span>
            </PromptInputButton>
            <PromptInputModelSelect
              value={selectedModel}
              onValueChange={setSelectedModel}
            >
              <PromptInputModelSelectTrigger>
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {models.map((model) => (
                  <PromptInputModelSelectItem key={model.id} value={model.id}>
                    {model.name}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </PromptInputTools>
          <PromptInputSubmit disabled={!input.trim()} status={status} />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
```

Backend route handling model selection:

```tsx
// app/api/chat/route.ts
import { streamText, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const result = streamText({
    model: model || "openai/gpt-4o",
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

## Features

* Auto-resizing textarea with configurable min/max height (prevents layout jumps) in React applications
* Keyboard shortcuts that work like users expect (Enter to submit, Shift+Enter for new lines) in TypeScript components
* Submit button states that integrate with Vercel AI SDK status in Next.js projects
* Flexible toolbar system for custom actions and model selection in JavaScript frameworks
* Form validation that prevents empty submissions
* Proper focus management for continuous conversation
* Works with any Vercel AI SDK setup and AI chat applications
* Free open source component designed for conversational AI interfaces and prompt-based applications

## API Reference

### PromptInput

Form container for the prompt input system.

| Prop        | Type                              | Description              |
| ----------- | --------------------------------- | ------------------------ |
| `onSubmit`  | `FormEventHandler`                | Form submission handler  |
| `className` | `string`                          | Additional CSS classes   |
| `...props`  | `HTMLAttributes<HTMLFormElement>` | Standard form attributes |

### PromptInputTextarea

Auto-resizing textarea with keyboard shortcuts.

| Prop          | Type                              | Default                          | Description              |
| ------------- | --------------------------------- | -------------------------------- | ------------------------ |
| `placeholder` | `string`                          | `"What would you like to know?"` | Placeholder text         |
| `minHeight`   | `number`                          | `48`                             | Minimum height in pixels |
| `maxHeight`   | `number`                          | `164`                            | Maximum height in pixels |
| `className`   | `string`                          | -                                | Additional CSS classes   |
| `...props`    | `ComponentProps<typeof Textarea>` | -                                | Textarea component props |

### PromptInputToolbar

Container for toolbar actions and submit button.

| Prop        | Type                             | Description             |
| ----------- | -------------------------------- | ----------------------- |
| `className` | `string`                         | Additional CSS classes  |
| `...props`  | `HTMLAttributes<HTMLDivElement>` | Standard div attributes |

### PromptInputTools

Container for tool buttons and controls.

| Prop        | Type                             | Description             |
| ----------- | -------------------------------- | ----------------------- |
| `className` | `string`                         | Additional CSS classes  |
| `...props`  | `HTMLAttributes<HTMLDivElement>` | Standard div attributes |

### PromptInputButton

Toolbar button with automatic sizing.

| Prop        | Type                            | Default         | Description            |
| ----------- | ------------------------------- | --------------- | ---------------------- |
| `variant`   | `ButtonVariant`                 | `"ghost"`       | Button style variant   |
| `size`      | `ButtonSize`                    | `"icon"` (auto) | Button size            |
| `className` | `string`                        | -               | Additional CSS classes |
| `...props`  | `ComponentProps<typeof Button>` | -               | Button component props |

### PromptInputSubmit

Submit button with status indicators.

| Prop        | Type                            | Default     | Description                          |
| ----------- | ------------------------------- | ----------- | ------------------------------------ |
| `status`    | `ChatStatus`                    | -           | Current chat status for icon display |
| `variant`   | `ButtonVariant`                 | `"default"` | Button style variant                 |
| `size`      | `ButtonSize`                    | `"icon"`    | Button size                          |
| `className` | `string`                        | -           | Additional CSS classes               |
| `...props`  | `ComponentProps<typeof Button>` | -           | Button component props               |

### Model Selection Components

All model selection components forward props to their underlying shadcn/ui Select components:

* `PromptInputModelSelect` - Select root component
* `PromptInputModelSelectTrigger` - Select trigger with custom styling
* `PromptInputModelSelectContent` - Select dropdown content
* `PromptInputModelSelectItem` - Individual model option
* `PromptInputModelSelectValue` - Selected value display

## Keyboard interactions

| Key             | Description                           |
| --------------- | ------------------------------------- |
| `Enter`         | Submit form (when not in composition) |
| `Shift + Enter` | Insert new line                       |
| `Tab`           | Navigate between toolbar elements     |
| `Escape`        | Blur textarea                         |

## Prompt input gotchas

**Unconstrained auto-resize breaks layouts**: Set reasonable minHeight/maxHeight in React applications. Long AI prompts can grow to 500+ lines without constraints in TypeScript components.

**Mobile keyboard inconsistency**: Enter behavior varies across mobile keyboards in JavaScript implementations. Test on real devices, not just desktop browsers in Next.js projects.

**Empty input submission**: Users will hit Enter on empty textareas in React applications. Validate and disable submit for empty/whitespace-only input.

**Model selection persistence**: Consider saving user's model preference to localStorage in TypeScript projects. They don't want to reselect every session.

**Focus management after submit**: Return focus to the textarea after successful submission in React components so users can continue the conversation.

## Integration with other components

Works great with [Conversation](/ai/conversation) for scrolling chat interfaces in React applications. Combine with [Message](/ai/message) for complete chat UI in Next.js projects. Add [Actions](/ai/actions) for message interactions like copy, regenerate, or edit. This free open source component integrates seamlessly with modern JavaScript frameworks.

## Questions developers actually ask

<Accordions type="single">
  <Accordion id="textarea-resizing" title="How do I control textarea auto-resizing?">
    Use minHeight and maxHeight props to set boundaries in React applications. The component uses CSS field-sizing for automatic height adjustment in TypeScript implementations.
  </Accordion>

  <Accordion id="keyboard-shortcuts" title="Can I customize keyboard shortcuts?">
    Override onKeyDown on PromptInputTextarea in React components. The default Enter/Shift+Enter behavior works for most users in JavaScript applications.
  </Accordion>

  <Accordion id="submit-states" title="What submit button states are available?">
    The status prop accepts Vercel AI SDK status values: "ready", "submitted", "streaming", or "error" in React applications. Icons change automatically in TypeScript components.
  </Accordion>

  <Accordion id="toolbar-customization" title="How do I add custom toolbar buttons?">
    Add PromptInputButton components inside PromptInputTools in React applications. They size automatically based on content (icon vs text+icon) in Next.js projects.
  </Accordion>

  <Accordion id="mobile-behavior" title="How does this work on mobile devices?">
    Adapts to virtual keyboards and touch interactions in JavaScript frameworks. Test thoroughly across different mobile browsers—behavior varies in TypeScript implementations.
  </Accordion>
</Accordions>
