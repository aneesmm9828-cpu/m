# Feature Spec: MARB Login & Signup System

## Overview
The MARB authentication system is built using Supabase Auth, providing Email/Password signup and login, Social Auth (Google/Facebook), and an incremental profile setup flow. An OTP verification screen exists but is not yet integrated into the main flow.

## 1. Signup Flow (app/auth/signup.tsx)
- **Multi-step Process**:
  1. **Username**: Unique identifier selection.
  2. **Password**: Min 6 characters.
  3. **DOB**: Age verification/collection.
  4. **Email**: Primary contact.
  5. **Profile**: Full name, Bio, and Picture upload.
  6. **Welcome**: Final onboarding landing.
- **Backend**: Uses `supabase.auth.signUp`. Creates profile in `profiles` table via `ensureUserProfile` helper.

## 2. Login Flow (app/auth/login.tsx)
- **Traditional**: Email/Password login via `supabase.auth.signInWithPassword`.
- **Social**: Google and Facebook OAuth integration.
- **Navigation**: Redirects to `/(tabs)/home` upon success.

## 3. OTP Verification (app/auth/otp.tsx)
- **Status**: UI built but functionally disconnected from the main signup flow.
- **Gap**: Need to decide if MARB requires Email OTP or Phone OTP (Phone is usually preferred for mobile "viral" apps).

## Acceptance Criteria
- [ ] Signup works end-to-end (Auth + Profile storage).
- [ ] Login works correctly with session persistence.
- [ ] OTP Verification is integrated into the signup flow.
- [ ] Invalid credentials show appropriate user alerts.
- [ ] Social login deep-linking works.
- [ ] Profile picture uploads correctly during signup.

## Open Questions
- **OTP Type**: Should we stick to Email OTP or move to Phone (SMS) OTP for better parity with apps like Instagram/Snapchat?
- **Auto-Login**: Should the user be auto-logged in after OTP verification?

"RESEARCH COMPLETE for MARB Login System → ready for nav-mapper."
