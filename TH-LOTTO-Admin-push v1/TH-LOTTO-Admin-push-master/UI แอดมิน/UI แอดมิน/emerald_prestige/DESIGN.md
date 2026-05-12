---
name: Emerald Prestige
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#404944'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#25312b'
  on-tertiary: '#ffffff'
  tertiary-container: '#3b4741'
  on-tertiary-container: '#a8b5ad'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d9e6dd'
  tertiary-fixed-dim: '#bdcac1'
  on-tertiary-fixed: '#131e19'
  on-tertiary-fixed-variant: '#3e4943'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  h1:
    fontFamily: Prompt
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Prompt
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Prompt
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Prompt
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Prompt
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-sm:
    fontFamily: Prompt
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  button:
    fontFamily: Prompt
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-padding: 32px
  gutter: 24px
---

## Brand & Style
The design system is engineered to evoke an immediate sense of high-authority, security, and exclusivity. It targets executive-level administrators who require a command-and-control interface that feels like a luxury physical environment.

The aesthetic follows a **Modern Capsule** philosophy. It merges the cleanliness of a minimalist white-space-heavy layout with the sophisticated tactility of glassmorphism. Surfaces are treated as light-catching objects, utilizing high-radius "pill" shapes to remove all visual tension. The result is a UI that feels fluid, approachable, yet deeply authoritative through its use of a singular, commanding deep emerald hue.

## Colors
The palette is dominated by the **Deep Emerald (#064e3b)**, used strategically for primary actions, navigation sidebars, and critical indicators to signify prestige and security. 

- **Primary:** Deep Emerald for high-authority elements.
- **Secondary:** Vibrant Emerald for success states and active growth indicators.
- **Surface:** Pure White (#ffffff) is the baseline for all "Capsule" cards.
- **Background:** A cool, desaturated off-white (#f8fafc) creates the necessary contrast for white surfaces to float.
- **Accent Glass:** Semi-transparent variations of the primary color (8-12% opacity) are used for subtle backdrop blurs on floating navigation elements.

## Typography
This design system utilizes **Prompt** exclusively to ensure seamless bilingual harmony between Thai and Latin characters. The typeface’s geometric construction aligns perfectly with the "Capsule" shape language.

Headlines use a tighter letter-spacing and heavier weights to command attention, while body text maintains generous line-heights for readability in complex admin data views. Labels and small metadata should be set in Medium or SemiBold weights to maintain legibility against the Deep Emerald backgrounds or glass layers.

## Layout & Spacing
The layout operates on a **12-column fixed-fluid hybrid grid**. Main content containers are constrained to a maximum width of 1440px to prevent excessive line lengths on ultra-wide monitors, while the sidebar remains fixed at 280px.

A rhythmic 4px base unit is used, but the "Capsule" aesthetic requires significant white space (xl and above) between major UI sections to maintain the premium, "un-cluttered" feel. Gutters are kept wide (24px) to ensure that the large border-radii of adjacent cards do not visually overlap or feel cramped.

## Elevation & Depth
Depth is achieved through **Subtle Glassmorphism** and **Ambient Shadows**. This design system avoids harsh borders, preferring to use light to define hierarchy.

1.  **Level 0 (Floor):** Background color (#f8fafc).
2.  **Level 1 (The Capsule):** Pure white surface with a very soft, diffused shadow (15% opacity Deep Emerald tint, 40px blur).
3.  **Level 2 (Overlays/Glass):** 60% opacity white with a 20px backdrop blur and a 1px inner white border to simulate light hitting the edge of glass.
4.  **Level 3 (Active State):** High-contrast Deep Emerald surfaces with zero shadow, relying on color weight for prominence.

## Shapes
The "Capsule" identity is defined by extreme roundedness. The system mandates a **32px minimum radius** for all cards and containers, and **Full-Rounded (Pill)** settings for buttons, inputs, and tags.

This lack of sharp corners communicates safety and modernity. When nesting elements, the inner radius must be decreased proportionally to the outer radius (R_outer - Padding = R_inner) to maintain visual concentricity, ensuring the flow of the UI remains organic and premium.

## Components
- **Buttons:** Primary buttons are pill-shaped, using the Deep Emerald background with white text. Hover states should include a subtle scale-up (1.02x) rather than a color change to maintain the "prestige" feel.
- **Input Fields:** Semi-transparent light gray backgrounds (#f1f5f9) with pill-shaped borders. On focus, the border transitions to a 2px Deep Emerald stroke with a soft outer glow.
- **Cards:** White surfaces with a 32px radius. Titles within cards should always be bold and left-aligned to the content.
- **Navigation (Sidebar):** A floating glassmorphic pillar on the left. Active links are indicated by a pill-shaped Deep Emerald background that spans the width of the sidebar minus margins.
- **Chips/Status:** High-radius pills. Use the Tertiary Green (#f0fdf4) for positive statuses with Deep Emerald text for a sophisticated "tone-on-tone" effect.
- **Data Tables:** Instead of traditional borders, use alternating row fills with a 12px radius on the row hover state to maintain the capsule language even within dense data.