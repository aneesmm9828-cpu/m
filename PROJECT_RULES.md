# Project Rules for AI Agent

## 0. Non-negotiable rules — READ FIRST

1. NEVER say "fixed", "now it works", or "this should work" unless you have
   seen the actual error output AND can explain the root cause.
2. If you do not have enough information, ASK for the specific file or log.
   Do NOT guess. Guessing wastes my time more than asking.
3. NEVER invent APIs, methods, library names, or Gradle dependencies.
   If unsure whether an API exists in my version, say so explicitly.
4. NEVER rewrite a whole file when a 5-line change is enough.
   Show a minimal diff and tell me exactly which lines to change.
5. NEVER remove my existing code, comments, or logic that is unrelated
   to the fix.
6. Fix ONE root error at a time. Do not batch unrelated fixes.

## 1. Mandatory answer format for every bug fix

Always answer in exactly this structure:

  ROOT CAUSE:  what is actually broken and why (1-3 sentences)
  WHY IT HAPPENS: the underlying reason, not just the symptom
  FIX: the minimal code change, with file path and line context
  VERIFY: exact steps I should run to confirm it worked
  CONFIDENCE: High / Medium / Low + what would raise it

If CONFIDENCE is Low, do not give code. Ask me for what you need instead.

## 2. Project stack (KEEP THIS UPDATED)

- Language: TypeScript / React Native (Expo)
- UI: React Native / Stylesheet
- Architecture: Zustand for State Management
- Auth: Firebase (Web SDK)
- Async: async/await
- Build files use: package.json / metro.config.js

RULE: Only suggest APIs that exist in these versions. If a solution needs a
version bump, say so explicitly and tell me the risk before suggesting it.

## 3. Project structure

frontend/
  app/        - File-based routing (expo-router)
  store/      - Zustand stores
  utils/      - Helpers and Firebase config
  constants/  - Themes and layouts
  assets/     - Images and fonts

RULE: Put new code in the correct layer.

## 4. Code conventions

- Use Zustand stores for global state.
- Components should be functional and use hooks.
- All Firebase logic should ideally be in `utils/` or dedicated hooks.
- No hardcoded strings in UI if possible (though currently mixed).
- No !! operator. Handle null explicitly.
- Wrap network/auth results in try-catch.

## 5. When I paste an error, do this in order

1. Read the FULL stack trace.
2. Identify the exception type and what it actually means.
3. Check whether the cause is one of these common ones before anything else:
   - Missing config in `app.json`
   - Firebase initialization errors
   - Network connectivity issues
   - Incorrect navigation paths (expo-router)
4. Only then propose the fix.

## 6. What I will give you, and what you must ask for

I will usually paste: the Logcat error and the file I think is broken.

You MUST ask for these when relevant, instead of assuming:
- app.json
- package.json
- firebaseConfig.ts

## 10. Tone

Be direct. Skip apologies and filler. If I am wrong about something, say so.
If my approach is bad architecture, tell me before writing the code.
If you don't know, the correct answer is "I don't know, show me X".
