# Feature Spec: Video Hub (YouTube 2026 "Clone Mode")

## Overview
The MARB Video Hub is being upgraded to match the 2026 YouTube experience. This includes a shift from simple long-form hosting to an AI-driven, immersive, and commerce-integrated ecosystem.

## Trigger
- **4-Box Grid -> Video Hub**: Primary entry point.

## UI Elements Table (YouTube 2026 Style)

| Element | Component Type | Function / Behaviour | 2026 Special Feature |
|---|---|---|---|
| **Multiview Player** | SplitScreenGrid | Allows watching up to 4 streams simultaneously. | Physics-based resizing of grids. |
| **AI Digital Twin Toggle** | Switch/Button | Switch between human creator and their AI Digital Twin. | Seamless transition without buffering. |
| **One-Click Checkout** | Over-Video Overlay | Purchase products mentioned in the video directly. | In-app commerce integration. |
| **Spatial Mode Button** | IconButton (360) | Expands video into a 3D immersive environment. | Dynamic lighting sync with video content. |
| **Shorts Carousel** | HorizontalList | Mixed media posts (Images + Vertical Video) in the feed. | Integrated social engagement posts. |
| **AI Background Gen** | Creator Tool | Instant background replacement for uploaded clips. | Powered by MARB AI (Veo 3 style). |

## States & Micro-interactions
- **Fluid Grid Transition**: Drag-and-drop streams in Multiview mode with `reanimated` physics.
- **AI Pulse**: Subtle blue gradient pulse around the player when AI features (summaries, generation) are active.
- **Immersive Fade**: Background dims and adopt video's dominant colors (Ambient Mode 2.0).

## Backend/Data Requirements
- **Video Schema**: Support for `multiview_groups`, `digital_twin_url`, and `shoppable_items`.
- **Commerce API**: Secure checkout flow for in-app purchases.
- **AI Processing**: Edge functions for real-time video background removal/replacement.

## Edge Cases
- **Low Bandwidth**: Multiview drops to single stream automatically.
- **AI Detection**: Labeling AI-generated content (Digital Twins) for transparency.
- **Device Support**: Spatial mode only active on AR/VR or high-end mobile sensors.

"RESEARCH COMPLETE for Video Hub (YouTube 2026) → ready for feature-builder."
