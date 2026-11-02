# Expense Tracker — Design System (Master)

Source of truth for the web app (`frontend/`) and the Flutter app (`mobile_app/`).
Generated with the ui-ux-pro-max skill (fintech dashboard → Dark Mode (OLED), IBM Plex Sans).

## Principles
1. **Colour carries meaning.** Emerald = money in. Rose = money out. Amber = warning/overdue.
   Indigo = actions, focus, active navigation. Never use green/red decoratively.
2. **One dark surface system.** No white or light-grey panels anywhere in dark UI.
3. **Numbers are the content.** Amounts use tabular figures, semibold, and are the largest
   text in their card. Labels are small, muted, and secondary.
4. **Quiet chrome.** Flat surfaces with a hairline border. No gradient text, glow, blur blobs,
   scale-on-hover or pulsing (pulsing only for a genuine alert, if at all).
5. **Accessible by default.** Text contrast ≥ 4.5:1, visible focus rings, 44px touch targets,
   labels on every input, aria-labels on icon-only buttons, respect reduced motion.

## Tokens
| Token | Hex | Use |
|---|---|---|
| ink-950 | `#020617` | Page background |
| ink-900 | `#0B1222` | Cards |
| ink-850 | `#101A2E` | Inputs, raised areas inside cards |
| ink-800 | `#16223A` | Hover |
| ink-700 | `#22304D` | Strong borders, active segment |
| border | `white @ 8%` | Card and divider hairlines |
| text | `#F8FAFC` / slate-100 | Primary text |
| text-muted | slate-400 `#94A3B8` | Secondary text (min. for body copy) |
| text-faint | slate-500 `#64748B` | Placeholders, hints only |
| brand-500 | `#6366F1` | Primary buttons, active nav, focus (brand-400 `#818CF8` for rings/text) |
| income-400 | `#34D399` | Money in (text); income-500 `#10B981` fills |
| expense-400 | `#FB7185` | Money out (text); expense-500 `#F43F5E` fills |
| amber-400 | `#FBBF24` | Warnings, overdue |

Chart categorical palette (dark-safe, in order): `#818CF8 #34D399 #FBBF24 #FB7185 #38BDF8 #C084FC #F472B6 #A3E635`.

## Typography
- Family: **IBM Plex Sans** (400/500/600/700); IBM Plex Mono only for raw SMS text.
- Page title 24–30px/600, card title 16–18px/600, body 14–15px/400, label 12–14px/500.
- Amounts: `tabular-nums`, 600. KPI value 24–28px.
- Uppercase only for tiny eyebrow labels (tracking-wider). Never for headings or buttons.

## Shape & spacing
- Radius: cards 16px, inputs/buttons 12px, badges full.
- Spacing scale 4/8/12/16/20/24/32. Card padding 20–24px. Gap between cards 16–24px.
- Max content width 1152px (`max-w-6xl`).

## Web implementation (`frontend/src/index.css`)
Compose these classes instead of hand-rolling colours:
`page page-header page-title page-subtitle card card-pad card-header card-title card-subtitle divider
kpi kpi-label kpi-value kpi-hint icon-tile amount amount-in amount-out label input select field-hint
field-error btn btn-primary btn-secondary btn-ghost btn-success btn-danger btn-sm btn-icon badge
badge-neutral badge-brand badge-income badge-expense badge-warning segmented segmented-item
segmented-item-active table empty-state skeleton modal-backdrop modal-panel`.
Icons: `lucide-react` only, 16–20px, `aria-hidden` when decorative.

## Navigation
- Web desktop (≥768px): top bar — brand, nav links with active state, user menu (name, Refresh app, Sign out).
- Web mobile (<768px): compact top bar + fixed bottom tab bar (5 items, icon + short label, safe-area padding).
- Flutter: bottom NavigationBar with labels always visible.

## Anti-patterns (do not use)
Light panels in dark UI · gradient text · emoji as icons · scale/translate on hover · placeholder-only
inputs · colour as the only signal (pair with +/− sign, icon or label) · text below 12px · truncated
primary labels · decorative blobs overlapping content.
