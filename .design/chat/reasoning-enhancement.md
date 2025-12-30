# Reasoning Enhancement Documentation

## Overview

Implemented **collapsible reasoning display** for the Nexus Chat system, showing AI thinking/reasoning process inline with messages. Based on **AI Elements** design patterns, the reasoning component automatically opens during thinking, closes when complete, and tracks thinking duration.

**Date**: September 30, 2025  
**Component Location**: `/components/ai/reasoning.tsx`  
**Integration**: NexusChat → useNexusAgent → NexusChatMessage

---

## Problem Statement

### Before Enhancement

The previous implementation had a confusing UX flow:

1. **User submits message** → Empty assistant message appears (robot icon, no content)
2. **Below it**: New row with "thinking..." indicator appears
3. **Thinking completes** → Original message updates with response
4. **Cycle repeats**: For each tool call, thinking row updates while original message shows final output

**Issues**:
- ❌ Two separate rows for single response (thinking below, content above)
- ❌ Thinking content lost after completion (not preserved)
- ❌ Confusing visual flow (updating content above, streaming below)
- ❌ No way to review AI's thought process after response
- ❌ User can't collapse thinking to focus on final answer

### After Enhancement

**Single unified message** with collapsible reasoning:

1. **User submits message** → Assistant message appears
2. **Thinking section** (open by default) shows reasoning in real-time
3. **Content appears** below reasoning as it streams
4. **Auto-closes** 1s after completion (user can reopen anytime)
5. **Preserved** - thinking remains available for review

**Benefits**:
✅ Single message row (cleaner UI)  
✅ Reasoning preserved and collapsible  
✅ Clear visual hierarchy (thinking → content)  
✅ User control over visibility  
✅ Auto-open/close behavior  
✅ Duration tracking ("Thought for 8s")

---

## Architecture

### Component Flow

```
User Input
  ↓
useNexusAgent.sendMessage()
  ↓
POST /api/agents/stream (SSE)
  ↓
SessionManagerAgent.stream()
  ↓
Claude API streams chunks:
  - type: 'thinking' → Accumulated in message.thinking
  - type: 'content'  → Accumulated in message.content
  - type: 'tool_call' → Stored in message.toolCalls[]
  ↓
NexusChatMessage renders:
  - <Reasoning> (if message.thinking exists)
  - <div> Main content (if message.content exists)
  - Tool execution details (if message.toolCalls exists)
```

### Data Flow

**Type System**:
```typescript
// Agent chunk types (types.ts)
export type AgentChunkType = 'thinking' | 'content' | 'tool_call' | 'metadata' | 'error';

// Message structure (useNexusAgent.ts)
export interface NexusMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;        // NEW: AI reasoning process
  timestamp: number;
  toolCalls?: Array<{
    name: string;
    input: unknown;
    result?: unknown;
  }>;
  metadata?: Record<string, unknown>;
}
```

**Chunk Processing**:
```typescript
// useNexusAgent.ts - processChunk()
switch (chunk.type) {
  case 'thinking':
    // Accumulate thinking content
    if (!currentMessageRef.current.thinking) {
      currentMessageRef.current.thinking = '';
    }
    currentMessageRef.current.thinking += chunk.data;
    break;
    
  case 'content':
    // Accumulate main content
    currentMessageRef.current.content += chunk.data;
    break;
    
  case 'tool_call':
    // Track tool execution
    currentMessageRef.current.toolCalls.push(chunk.data);
    break;
}
```

---

## Components Created

### 1. `Reasoning` (Main Container)

Collapsible container managing reasoning state and auto-behavior.

**Props**:
```typescript
interface ReasoningProps {
  isStreaming?: boolean;     // Auto-opens when true, auto-closes when false
  open?: boolean;            // Controlled open state
  defaultOpen?: boolean;     // Initial open state (uncontrolled)
  onOpenChange?: (open: boolean) => void;
  duration?: number;         // Controlled duration in seconds
  className?: string;
}
```

**Auto-Behavior**:
- **Auto-Open**: Opens when `isStreaming` becomes `true`
- **Auto-Close**: Closes 1 second after `isStreaming` becomes `false`
- **Duration Tracking**: Starts timer when streaming begins, stops when ends
- **Manual Override**: User can toggle anytime, auto-behavior continues

**Implementation Details**:
```typescript
// Auto-open/close effect
React.useEffect(() => {
  if (isStreaming) {
    setUncontrolledOpen(true);
    setStartTime(Date.now());
    clearTimeout(closeTimeoutRef.current);
  } else if (startTime) {
    const finalElapsed = Math.round((Date.now() - startTime) / 1000);
    setElapsedTime(finalElapsed);
    
    closeTimeoutRef.current = setTimeout(() => {
      setUncontrolledOpen(false);
    }, AUTO_CLOSE_DELAY); // 1000ms
  }
}, [isStreaming, startTime]);
```

---

### 2. `ReasoningTrigger` (Click Target)

Clickable trigger showing reasoning status and duration.

**Props**:
```typescript
interface ReasoningTriggerProps {
  title?: string;    // Custom title (default: "Reasoning")
  className?: string;
}
```

**Visual States**:
| State       | Icon           | Text                | Animation |
|-------------|----------------|---------------------|-----------|
| Streaming   | Brain (pulsing)| "Thinking..."       | Pulse     |
| Complete    | Brain          | "{title} • Thought for {duration}s" | -  |
| Open        | ChevronDown    | -                   | -         |
| Closed      | ChevronRight (-90deg) | -            | Rotate    |

**Example Render**:
```tsx
// While streaming
<button>
  <Brain className="animate-pulse" />
  <span>Thinking...</span>
  <ChevronDown />
</button>

// After completion (8s thinking)
<button>
  <Brain />
  <span>Reasoning • Thought for 8s</span>
  <ChevronRight className="rotate-[-90deg]" />
</button>
```

---

### 3. `ReasoningContent` (Content Display)

Content container for reasoning text with animations.

**Props**:
```typescript
interface ReasoningContentProps {
  children: string | React.ReactNode;  // Reasoning content
  className?: string;
}
```

**Features**:
- **Max Height**: `300px` with scroll
- **Animations**: Smooth slide-down/up transitions
- **Typography**: Prose formatting for readability
- **Theming**: Dark mode optimized

**Styling**:
```tsx
<div className="
  mt-2 px-3 py-2.5 rounded-lg
  bg-neutral-900/50 border border-neutral-700
  text-sm text-neutral-300 leading-relaxed
  max-h-[300px] overflow-y-auto
  prose prose-sm prose-invert max-w-none
">
  {children}
</div>
```

---

## Integration Details

### NexusChatMessage Update

**Changes**:
1. Added `isStreaming` prop to detect last message
2. Conditionally render `<Reasoning>` if `message.thinking` exists
3. Changed layout from single `<div>` to `<div className="space-y-2">` for stacking
4. Reasoning displayed above main content

**Implementation**:
```tsx
export function NexusChatMessage({
  message,
  className,
  isStreaming = false  // NEW: Passed from parent
}: NexusChatMessageProps) {
  return (
    <div className="flex gap-4">
      <Avatar />
      <div className="flex-1 max-w-3xl space-y-2">
        {/* Reasoning Block - NEW */}
        {message.thinking && message.role === "assistant" && (
          <Reasoning
            isStreaming={isStreaming && !message.content}
            defaultOpen={false}
            className="inline-block max-w-full text-left"
          >
            <ReasoningTrigger />
            <ReasoningContent>{message.thinking}</ReasoningContent>
          </Reasoning>
        )}

        {/* Main Content */}
        {message.content && (
          <div className="...">
            <p>{message.content}</p>
            {/* Tool calls */}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-neutral-600">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
```

**Key Logic**:
```typescript
// Only show reasoning for assistant messages
message.thinking && message.role === "assistant"

// isStreaming only applies to the LAST message
// Calculated in parent: isStreaming && index === messages.length - 1

// Keep reasoning open while streaming, close after content appears
isStreaming={isStreaming && !message.content}
```

---

### NexusChat Update

**Changes**:
1. Removed `StreamingIndicator` import
2. Removed separate streaming indicator row
3. Pass `isStreaming` prop to last message only

**Before**:
```tsx
{messages.map((msg) => (
  <NexusChatMessage key={msg.id} message={msg} />
))}

{/* Separate streaming indicator */}
{isStreaming && <StreamingIndicator />}
```

**After**:
```tsx
{messages.map((msg, index) => (
  <NexusChatMessage
    key={msg.id}
    message={msg}
    isStreaming={isStreaming && index === messages.length - 1}
  />
))}
```

---

### useNexusAgent Update

**Added `thinking` chunk handling**:
```typescript
case 'thinking':
  // Append thinking content
  if (typeof chunk.data === 'string') {
    console.log('[useNexusAgent] Appending thinking:', chunk.data.substring(0, 50));
    
    if (!currentMessageRef.current.thinking) {
      currentMessageRef.current.thinking = '';
    }
    
    currentMessageRef.current.thinking += chunk.data;
    console.log('[useNexusAgent] Total thinking length now:', currentMessageRef.current.thinking.length);
    
    // Update messages with new reference to trigger re-render
    setMessages((prev) => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (lastIndex >= 0 && currentMessageRef.current) {
        updated[lastIndex] = { ...currentMessageRef.current };
      }
      return updated;
    });
  }
  break;
```

**Pattern**: Same as `content` chunk handling, but appends to `message.thinking` instead of `message.content`.

---

## Tailwind Animations

Added collapsible animations to `tailwind.config.ts`:

```typescript
keyframes: {
  'collapsible-down': {
    from: { height: '0' },
    to: { height: 'var(--radix-collapsible-content-height)' },
  },
  'collapsible-up': {
    from: { height: 'var(--radix-collapsible-content-height)' },
    to: { height: '0' },
  },
},
animation: {
  'collapsible-down': 'collapsible-down 0.2s ease-out',
  'collapsible-up': 'collapsible-up 0.2s ease-out',
}
```

**Usage**:
```tsx
<CollapsibleContent className="
  data-[state=open]:animate-collapsible-down
  data-[state=closed]:animate-collapsible-up
">
```

---

## API Reference

### Reasoning

| Prop           | Type                   | Default | Description                                  |
|----------------|------------------------|---------|----------------------------------------------|
| `isStreaming`  | `boolean`              | `false` | Auto-opens when true, auto-closes when false |
| `open`         | `boolean`              | -       | Controlled open state                        |
| `defaultOpen`  | `boolean`              | `false` | Initial open state (uncontrolled)            |
| `onOpenChange` | `(open: boolean) => void` | -    | Callback when open state changes             |
| `duration`     | `number`               | `0`     | Controlled duration in seconds               |
| `className`    | `string`               | -       | Additional CSS classes                       |

### ReasoningTrigger

| Prop        | Type     | Default       | Description                     |
|-------------|----------|---------------|---------------------------------|
| `title`     | `string` | `"Reasoning"` | Custom title for thinking state |
| `className` | `string` | -             | Additional CSS classes          |

### ReasoningContent

| Prop        | Type                    | Description                           |
|-------------|-------------------------|---------------------------------------|
| `children`  | `string` \| `ReactNode` | **Required** - Reasoning content text |
| `className` | `string`                | Additional CSS classes                |

---

## Keyboard Interactions

| Key               | Description                            |
|-------------------|----------------------------------------|
| `Space` / `Enter` | Toggle reasoning visibility on trigger |
| `Tab`             | Focus reasoning trigger                |
| `Escape`          | Close reasoning panel when focused     |

---

## Best Practices

### 1. **Auto-Close Timing**
```typescript
// Default: 1000ms (1 second)
const AUTO_CLOSE_DELAY = 1000;

// Adjust if users complain timing feels abrupt
const AUTO_CLOSE_DELAY = 2000; // 2 seconds
```

### 2. **Max Height for Mobile**
```tsx
// Prevent 2000-word reasoning from breaking mobile
<ReasoningContent className="max-h-[200px] sm:max-h-[300px]">
```

### 3. **Default Open State**
```tsx
// Most users want reasoning CLOSED by default
<Reasoning defaultOpen={false}>

// Power users or debugging contexts
<Reasoning defaultOpen={true}>
```

### 4. **Streaming Detection**
```tsx
// Only mark LAST message as streaming
isStreaming={isStreaming && index === messages.length - 1}

// Stop showing "Thinking..." once content appears
isStreaming={isStreaming && !message.content}
```

### 5. **Empty Reasoning Handling**
```tsx
// Don't render reasoning component for empty thinking
{message.thinking && message.role === "assistant" && (
  <Reasoning>...</Reasoning>
)}
```

---

## Common Pitfalls

### ❌ Don't: Render reasoning for every message
```tsx
// This will show reasoning for all messages, even completed ones
{messages.map((msg) => (
  <Reasoning isStreaming={isStreaming}>
))}
```

### ✅ Do: Only stream the last message
```tsx
{messages.map((msg, index) => (
  <Reasoning isStreaming={isStreaming && index === messages.length - 1}>
))}
```

---

### ❌ Don't: Keep reasoning open after content appears
```tsx
// Reasoning stays open even when response is complete
<Reasoning isStreaming={isStreaming}>
```

### ✅ Do: Close when content starts
```tsx
// Auto-closes once final content begins streaming
<Reasoning isStreaming={isStreaming && !message.content}>
```

---

### ❌ Don't: Forget max-height constraints
```tsx
// DeepSeek R1 can generate 2000+ word reasoning
<ReasoningContent>{thinking}</ReasoningContent>
```

### ✅ Do: Set reasonable scroll limits
```tsx
<ReasoningContent className="max-h-[300px] overflow-y-auto">
```

---

## Backend Integration (Future)

### If Using Claude API Directly

Claude doesn't natively stream thinking chunks. You'd need to:

**Option 1: Parse thinking from content**
```typescript
// Look for markdown-style thinking blocks
const thinkingMatch = content.match(/<thinking>(.*?)<\/thinking>/s);
if (thinkingMatch) {
  yield { type: 'thinking', data: thinkingMatch[1] };
}
```

**Option 2: Use extended thinking format**
```typescript
// Claude extended thinking (if supported)
const stream = await anthropic.messages.stream({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 2048,
  thinking: { type: "extended", budget_tokens: 1000 },
  messages: [{ role: "user", content: "..." }],
});

for await (const event of stream) {
  if (event.type === 'thinking_delta') {
    yield { type: 'thinking', data: event.delta.content };
  }
  if (event.type === 'content_block_delta') {
    yield { type: 'content', data: event.delta.text };
  }
}
```

### If Using Vercel AI SDK

```typescript
// app/api/chat/route.ts
import { streamText } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: "deepseek/deepseek-r1", // Reasoning-capable model
    messages,
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true, // Enable reasoning part streaming
  });
}
```

**Frontend consumption**:
```typescript
const { messages } = useChat();

messages.map((message) => {
  message.parts?.map((part) => {
    if (part.type === "reasoning") {
      // Display in <Reasoning> component
    }
    if (part.type === "text") {
      // Display in main content
    }
  });
});
```

---

## Testing Checklist

- [ ] Reasoning opens automatically when thinking starts
- [ ] Reasoning closes 1 second after streaming stops
- [ ] User can manually toggle reasoning open/closed
- [ ] Duration tracking shows correct seconds
- [ ] Multiple tool calls show all thinking content
- [ ] Reasoning preserves after message complete
- [ ] Max height scrolling works for long reasoning
- [ ] Animations smooth (no jarring transitions)
- [ ] Keyboard navigation works (Space/Enter/Escape)
- [ ] Mobile displays correctly (not too tall)
- [ ] Empty thinking doesn't render component
- [ ] Only last message marked as streaming
- [ ] Thinking stops streaming when content appears

---

## Performance Notes

**Streaming Updates**:
- Each thinking chunk triggers a React re-render
- Uses ref-based accumulation (same pattern as content)
- No performance issues observed with 2000+ word reasoning

**Collapsible Performance**:
- Radix UI Collapsible is highly optimized
- CSS animations via height calculation
- No layout thrashing or jank

**Recommendation**: For extremely long reasoning (5000+ words), consider throttling updates:
```typescript
const throttledUpdate = throttle(() => {
  setMessages((prev) => [...prev.slice(0, -1), {...currentMessageRef.current}]);
}, 100); // Update every 100ms instead of every chunk
```

---

## Future Enhancements

### Potential Features:
1. **Reasoning Summary** - Show condensed summary when collapsed
2. **Thinking Phases** - Break reasoning into sections (Analysis → Planning → Execution)
3. **Confidence Scores** - Display AI's confidence in its reasoning
4. **Highlighting** - Highlight key reasoning steps
5. **Export** - Download reasoning as markdown/text
6. **Search** - Search within reasoning content
7. **Annotations** - User can add notes to specific reasoning steps
8. **Compare** - Side-by-side reasoning comparison for different responses

### Implementation Priority:
- **High**: Reasoning summary, export
- **Medium**: Thinking phases, highlighting
- **Low**: Confidence scores, annotations

---

## Related Components

- **[Conversation](/components/ai/conversation.tsx)** - Auto-scroll chat container
- **[Prompt Input](/components/ai/prompt-input.tsx)** - Auto-resize input with toolbar
- **[Message](/components/ui/message.tsx)** - Message display components
- **[NexusChat](/lib/services/sessionManager/NexusChat.tsx)** - Session manager chat

---

## Resources

- **AI Elements Documentation**: https://ai-sdk.dev/elements/overview
- **Radix UI Collapsible**: https://www.radix-ui.com/primitives/docs/components/collapsible
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **Original Reference**: `/Users/matthewsimon/Projects/acdc-digital/.design/chat/reasoning.md`

---

## Summary

The reasoning enhancement provides:

✅ **Collapsible thinking display** with auto-open/close behavior  
✅ **Duration tracking** showing thinking time  
✅ **Inline integration** (no separate streaming indicator)  
✅ **Preserved reasoning** for later review  
✅ **Clean visual hierarchy** (thinking → content → tools)  
✅ **User control** (manual toggle, keyboard nav)  
✅ **Mobile optimized** with max-height scrolling  

This creates a **transparent AI experience** where users can see the agent's thought process, verify reasoning logic, and understand how conclusions were reached - critical for building trust in AI-driven decisions.
