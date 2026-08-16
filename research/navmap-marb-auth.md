## Screen: MARB Auth Navigation & UI Map

### Total interactive elements: 22

| # | Element name | Location | Element type | What it does when tapped/used | Sub-elements or states |
|---|---|---|---|---|---|
| 1 | Email Input | Login Screen | TextInput | User enters email | Focus state, error state |
| 2 | Password Input | Login Screen | TextInput | User enters password | Secure entry, toggle visibility |
| 3 | Login Button | Login Screen | Button | Triggers `signInWithPassword` | Loading state, disabled state |
| 4 | Google Login | Login Screen | Button | Triggers Google OAuth | Opens external browser |
| 5 | Facebook Login | Login Screen | Button | Triggers Facebook OAuth | Opens external browser |
| 6 | Signup Link | Login Screen | Text Link | Navigates to Signup flow | — |
| 7 | Username Input | Signup (Step 1) | TextInput | Sets profile username | Auto-lowercasing, sanitization |
| 8 | Next Button | Signup Flow | Button | Moves to next step | Validates current input |
| 9 | Pass Input | Signup (Step 2) | TextInput | Sets account password | Error message if < 6 chars |
| 10 | DOB Wheels | Signup (Step 3) | ScrollView | Selects Birth Day/Month/Year | Horizontal layout |
| 11 | Email Input | Signup (Step 4) | TextInput | Sets account email | Validation (@) |
| 12 | DP Picker | Signup (Step 5) | ImageButton | Opens system image picker | Base64 preview |
| 13 | Full Name | Signup (Step 5) | TextInput | Sets profile full name | — |
| 14 | Bio Input | Signup (Step 5) | TextInput | Sets profile bio | Multi-line support |
| 15 | Finish Button | Signup (Step 5) | Button | Triggers `signUp` + profile creation | Finalizing state |
| 16 | Get Started | Signup (Step 6) | Button | Navigates to Home | — |
| 17 | Back Arrow | Auth Screens | Icon Button | Goes to previous step or screen | — |
| 18 | OTP Digits (6) | OTP Screen | Inputs | Enter verification code | Auto-focus next field |
| 19 | Verify Button | OTP Screen | Button | Triggers OTP validation | — |
| 20 | Resend Code | OTP Screen | Button | Resends OTP | 30s timer |
| 21 | Forgot Password| Login Screen | Text Link | Goes to recovery flow | — |
| 22 | Social Signup | Signup (Step 1) | Buttons | Triggers Social OAuth | — |

### Navigation Tree
- **Landing**
  - **Login** (Default)
    - -> Tap "Sign up" -> **Signup Flow** (Username -> Password -> DOB -> Email -> Profile -> Welcome -> Home)
    - -> Tap "Forgot Password" -> **Reset Flow**
    - -> Successful Login -> **Home**
  - **OTP Verification** (Post-Signup or Post-Login if enabled)
    - -> Successful Verify -> **Onboarding/Home**

"NAV MAP COMPLETE for MARB Auth System → 22 elements found."
