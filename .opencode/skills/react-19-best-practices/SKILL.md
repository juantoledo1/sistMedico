---
name: react-19-best-practices
description: >-
  React 19 best practices extracted from official react.dev docs.
  Component size limits, hooks rules, useActionState/useOptimistic for forms,
  purity, props patterns, TypeScript strict mode, and code organization.
  ALWAYS load this skill when writing or refactoring React components.
license: MIT
compatibility: opencode
metadata:
  framework: react
  version: "19"
  audience: developer
---

# React 19 Best Practices

## Core Rules (from react.dev)

### 1. Component Size & Structure

> "A component should ideally only be concerned with one thing. If it ends up growing, it should be decomposed into smaller subcomponents." — [react.dev](https://react.dev/learn/thinking-in-react)

- **Max 200 lines per component.** If a file exceeds this, extract subcomponents.
- **Max 3 `useState` per component** unless there's a strong reason. More than 3 → extract custom hook.
- **Max 2 `useEffect` per component.** More than 2 → extract logic to custom hook.
- **Dedicated `Props` interface** for every component.
- **One component = one file.** No multiple components in one file unless they're tiny and tightly coupled (<50 lines each).
- **Never define components inside other components.** Always at top level. [Source](https://react.dev/learn/your-first-component)

### 2. Component Declaration

```tsx
// ✅ CORRECT: function declaration (preferred by React team)
function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // ...
}

// ✅ ALSO CORRECT: const with React.FC (acceptable but function is simpler)
const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  // ...
};

interface MyComponentProps {
  prop1: string;
  prop2?: number; // optional with ?
}
```

### 3. Props Pattern

> "Props are read-only snapshots in time: every render receives a new version of props. You can't change props." — [react.dev](https://react.dev/learn/passing-props-to-a-component)

- Destructure props in the function signature: `function Card({ title, children }: Props)`
- Use `children` prop for wrapper components instead of passing JSX as props
- Use spread syntax `<Avatar {...props} />` with restraint — only for pass-through components
- Default values: `function Avatar({ size = 100 }: { size?: number })`

### 4. Pure Components

> "React assumes that every component you write is a pure function. Same inputs, same outputs. Always." — [react.dev](https://react.dev/learn/keeping-components-pure)

- **No mutations during render.** Don't modify props, outer variables, or DOM during render.
- **Local mutation is OK**: creating and mutating arrays/objects inside the component is fine.
- **Side effects go in event handlers** (click handlers, form submissions), NOT in the component body.
- **`useEffect` is last resort.** Try to express logic with rendering alone first.

### 5. React 19 Hooks

#### `useActionState` for all form submissions

> "Use `useActionState` to manage state of Actions. The reducer can perform side effects." — [react.dev](https://react.dev/reference/react/useActionState)

- ✅ **USE `useActionState`** instead of `useState` + manual submit handlers
- Provides `[state, dispatchAction, isPending]` — built-in pending state
- The reducer can be async and do API calls
- Pass `dispatchAction` to `<form action={dispatchAction}>` for automatic transition wrapping

```tsx
import { useActionState } from "react";

async function submitAction(prevState: FormState, formData: FormData) {
  try {
    const result = await api.submit(formData);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function MyForm() {
  const [state, formAction, isPending] = useActionState(submitAction, {
    success: false,
    data: null,
    error: null,
  });

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Enviando..." : "Guardar"}
      </button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

#### `useOptimistic` for instant UI feedback

> "Use `useOptimistic` to optimistically update the UI while an Action is in progress." — [react.dev](https://react.dev/reference/react/useOptimistic)

- Shows temporary state immediately while server action completes
- Automatically reverts on error
- Combine with `useActionState` for best UX

```tsx
const [optimisticCount, setOptimisticCount] = useOptimistic(count);

function handleAdd() {
  startTransition(async () => {
    setOptimisticCount((c) => c + 1);
    await api.addItem();
  });
}
```

#### `useTransition` for non-urgent updates

> "Use `useTransition` to mark a state update as non-urgent." — [react.dev](https://react.dev/reference/react/useTransition)

- Keeps UI responsive during expensive state updates
- Provides `isPending` to show loading state

#### Rules of Hooks

> "Hooks can only be called at the top level of your component or your own Hooks. You can't call Hooks inside conditions, loops, or other nested functions." — [react.dev](https://react.dev/learn/state-a-components-memory)

### 6. State Management

- **Lifted state** for shared state: put state in closest common ancestor, pass down via props.
- **No global stores** (Redux, Zustand) unless the app genuinely needs cross-cutting state.
- **`useState` for local UI state** (form inputs, toggles, modals).
- **Keep state DRY**: compute derived values instead of storing them.

### 7. Custom Hooks

Extract reusable logic into custom hooks when:
- A component has >3 state variables
- A component has >2 `useEffect` calls
- The same logic appears in multiple components
- Business logic is mixed with presentation

```tsx
function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { users, loading, error };
}
```

### 8. Separation of Concerns

- **Components**: presentation only (JSX, Tailwind, layout)
- **Custom hooks**: stateful logic (API calls, form state, side effects)
- **Utilities**: pure functions (formatting, calculations, data transformation)
- **API client**: single service layer for all HTTP calls

### 9. TypeScript

- **`strict: true` in tsconfig.json** — enables strictNullChecks, noImplicitAny, etc.
- **No `any`** — use `unknown` if type is truly unknown, then narrow with type guards
- **Explicit `Props` interface** for every component
- **No `React.FC`** — use plain function declarations (simpler, no implicit children)

### 10. Styling Conventions

- Classes via `cn()` utility (clsx + tailwind-merge): `cn("base", condition && "conditional")`
- Mobile-first: base = mobile, `lg:` = desktop, `sm:` = tablet
- Dark mode: `settings.darkMode ? "text-white" : "text-slate-900"` with `"dark:text-white"` fallback

### 11. File Organization

```
components/
  Dashboard.tsx          # max 200 lines
  Dashboard/
    StatsCards.tsx       # extracted from Dashboard
    MonthlyChart.tsx     # extracted from Dashboard
    SearchModal.tsx      # extracted from Dashboard
hooks/
  useTransactions.ts     # extracted business logic
  useUsers.ts            # extracted business logic
  useAuth.ts            # extracted auth logic
utils/
  format.ts             # pure formatting functions
  calculations.ts       # pure computation functions
  cn.ts                 # classname utility
services/
  api.ts                # API client singleton
```

### 12. Form Patterns (React 19 way)

Instead of:

```tsx
// ❌ OLD: useState + manual handleSubmit
const [name, setName] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  try {
    await api.submit({ name });
  } catch (err) {
    setError(String(err));
  } finally {
    setLoading(false);
  }
}
```

Do:

```tsx
// ✅ NEW: useActionState
const [state, formAction, isPending] = useActionState(
  async (prev: FormState, formData: FormData) => {
    try {
      await api.submit(Object.fromEntries(formData));
      return { ...prev, success: true, error: null };
    } catch (err) {
      return { ...prev, error: String(err) };
    }
  },
  { success: false, error: null }
);
```

---

## What NOT to do

| ❌ Bad practice | ✅ Instead |
|---------------|-----------|
| Components >300 lines | Split into subcomponents |
| 24+ `useState` in one file | Extract custom hooks |
| 7 `useEffect` calls | Extract effects into hooks |
| `confirm()` native dialog | Custom modal component |
| `any` type | `unknown` + type guard or proper type |
| API calls inside components | Custom hook or service layer |
| Duplicated logic (e.g. `findOverlaps` in 2 files) | Shared utility function |
| `React.FC` | Plain `function` declaration |
| Inline translations object | Shared `translations.ts` file |

---

## Component size checklist

- [ ] < 200 lines
- [ ] < 4 `useState`
- [ ] < 3 `useEffect`
- [ ] Dedicated Props interface
- [ ] No inline API calls
- [ ] No duplicated logic
- [ ] No `any`
- [ ] Uses `useActionState` for forms
- [ ] Side effects only in event handlers / hooks
