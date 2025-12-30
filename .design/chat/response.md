# React AI Response
URL: /ai/response
Markdown renderer optimized for streaming AI responses. Handles incomplete code blocks and formatting with React, TypeScript, and shadcn/ui.

***

title: React AI Response
description: Markdown renderer optimized for streaming AI responses. Handles incomplete code blocks and formatting with React, TypeScript, and shadcn/ui.
icon: MessageSquareText
component: true
---------------

<PoweredBy
  packages={[
  { name: "AI Elements", url: "https://ai-sdk.dev/elements/overview" },
  {
    name: "React Markdown",
    url: "https://github.com/remarkjs/react-markdown",
  },
  { name: "Rehype Katex", url: "https://github.com/rehypejs/rehype-katex" },
  { name: "Remark GFM", url: "https://github.com/remarkjs/remark-gfm" },
]}
/>

<Callout title="Trying to implement AI Elements?">
  [Join our Discord community](https://discord.com/invite/Z9NVtNE7bj) for help
  from other developers.
</Callout>

<br />

Streaming markdown without smart parsing shows users broken `**bold` and incomplete `[links` in React applications. This free open source component auto-completes formatting as content arrives and hides broken elements until ready in Next.js projects.

### Intelligent streaming markdown

Auto-completing formatting with syntax highlighting:

<Preview path="ai/response" />

The React component automatically completes incomplete bold, italic, and code formatting during streaming, hides broken links until complete, and renders syntax-highlighted code blocks with copy buttons. Built with TypeScript for type safety and designed for seamless integration in your JavaScript projects.

## Installation

<Installer packageName="ai" />

## Usage

```tsx
import { Response } from "@/components/ai/response";

<Response>**Hi there.** I am an AI model designed to help you.</Response>;
```

For code blocks, nest markdown inside the Response component:

```tsx
<Response>
  {`Here's some code:
  
\`\`\`javascript
const greeting = "Hello, world!";
console.log(greeting);
\`\`\`
`}
</Response>
```

## Why streaming markdown is hard

AI responses stream character by character in React applications. Regular markdown parsers show `**incomplete bold` and `[broken links` while text arrives in Next.js projects. This looks buggy and unprofessional in JavaScript implementations.

The TypeScript component fixes this by auto-completing formatting tokens and hiding incomplete links until ready. Users see clean text throughout the entire stream in React applications.

## Usage with AI SDK

Render streaming AI responses with intelligent formatting in React applications:

```tsx
"use client";

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

export default function ResponseDemo() {
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
          placeholder="Ask for markdown content..."
        />
        <PromptInputSubmit disabled={!input.trim()} status={status} />
      </PromptInput>
    </div>
  );
}
```

Backend route for markdown-rich responses:

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

* **Streaming-optimized parsing** - Auto-completes incomplete formatting during streaming in React applications
* **Rich markdown support** - Paragraphs, headers, lists, tables, blockquotes, and more in TypeScript components
* **Syntax-highlighted code blocks** - Multiple programming languages with copy buttons for JavaScript frameworks
* **Math equation support** - LaTeX rendering via rehype-katex in Next.js projects
* **GFM features** - Tables, task lists, strikethrough via remark-gfm
* **Link and image security** - Configurable allowed prefixes for safety
* **Intelligent hiding** - Incomplete links and images hidden until complete
* **Responsive design** - Adapts to different screen sizes while maintaining readability
* **Theme-aware styling** - Works seamlessly in light and dark modes
* **Accessibility focused** - Proper semantic HTML and screen reader support
* **Perfect for AI assistants and conversational AI interfaces** - Built specifically for streaming AI content
* Free open source component built for Next.js with shadcn/ui design system and AI Elements
* Optimized for Vercel AI SDK streaming and AI chat applications

## API Reference

### Response

Markdown renderer with intelligent streaming support.

| Prop                      | Type                             | Default | Description                               |
| ------------------------- | -------------------------------- | ------- | ----------------------------------------- |
| `children`                | `string \| ReactNode`            | -       | **Required** - Markdown content to render |
| `options`                 | `ReactMarkdown["options"]`       | -       | React Markdown configuration options      |
| `allowedImagePrefixes`    | `string[]`                       | `["*"]` | Allowed image URL prefixes for security   |
| `allowedLinkPrefixes`     | `string[]`                       | `["*"]` | Allowed link URL prefixes for security    |
| `defaultOrigin`           | `string`                         | -       | Default origin for relative URLs          |
| `parseIncompleteMarkdown` | `boolean`                        | `true`  | Enable intelligent streaming parsing      |
| `className`               | `string`                         | -       | Additional CSS classes                    |
| `...props`                | `HTMLAttributes<HTMLDivElement>` | -       | Standard div attributes                   |

## Streaming optimizations

The Response component includes several intelligent parsing features:

### Auto-completion of incomplete formatting

* **Bold**: `**incomplete` → `**incomplete**` (auto-closed)
* **Italic**: `*incomplete` → `*incomplete*` (auto-closed)
* **Strikethrough**: `~~incomplete` → `~~incomplete~~` (auto-closed)
* **Inline code**: `` `incomplete `` → `` `incomplete` `` (auto-closed)

### Hiding incomplete elements

* **Links**: `[incomplete text` (hidden until `]` appears)
* **Images**: `![incomplete alt` (hidden until `]` appears)
* **Code blocks**: Protects triple backticks from inline code completion

### Smart parsing behavior

* Only applies during streaming when `parseIncompleteMarkdown={true}` in React applications
* Preserves code block boundaries to prevent interference in TypeScript components
* Counts formatting tokens to determine completion needs in JavaScript implementations
* Works with both single and double character formatters in Next.js projects

## Security considerations

**Always validate allowed prefixes.** The default `["*"]` allows all URLs in React applications. In production, restrict to trusted domains in Next.js projects:

```tsx
<Response
  allowedImagePrefixes={["https://yourdomain.com", "https://cdn.example.com"]}
  allowedLinkPrefixes={["https://", "mailto:"]}
>
  {content}
</Response>
```

**Content sanitization is built-in.** The React component uses `harden-react-markdown` for XSS protection in TypeScript implementations.

## Integration with other components

Response works seamlessly with [Message](/ai/message) for chat interfaces in React applications. Use within [Conversation](/ai/conversation) for scrolling markdown content in Next.js projects. Combine with [CodeBlock](/ai/code-block) for enhanced code display. This free open source component integrates seamlessly with modern JavaScript frameworks.

## Questions developers actually ask

<Accordions type="single">
  <Accordion id="streaming-parsing" title="How does the streaming optimization work?">
    The React component detects incomplete formatting tokens and automatically completes them in TypeScript implementations. Bold, italic, code, and strikethrough are closed when streaming. Broken links are hidden until complete in JavaScript applications.
  </Accordion>

  {" "}

  <Accordion id="code-highlighting" title="Which programming languages are supported for syntax highlighting?">
    The React component supports all languages that Prism.js supports in Next.js projects, including JavaScript, Python, TypeScript, Rust, Go, and many others. Language is detected from code fence info in React applications.
  </Accordion>

  {" "}

  <Accordion id="math-equations" title="How do I render LaTeX math equations?">
    Use standard LaTeX syntax: `$inline math$` for inline equations and `$$block math$$` for block equations in React applications. The TypeScript component includes rehype-katex for rendering in JavaScript frameworks.
  </Accordion>

  {" "}

  <Accordion id="custom-components" title="Can I customize the rendered HTML components?">
    Yes, pass custom components via the options prop in React applications. The TypeScript component uses react-markdown which accepts custom renderers for any HTML element in Next.js projects.
  </Accordion>

  <Accordion id="performance-streaming" title="Does the parsing affect streaming performance?">
    The parsing is lightweight and optimized for real-time streaming in React applications. It only processes the text when parseIncompleteMarkdown is true and minimal regex operations in TypeScript components.
  </Accordion>
</Accordions>
