# Expense Tracker — Design System (Master)

Source of truth for the web app (`frontend/`) and the Flutter app (`mobile_app/`).
Generated with the ui-ux-pro-max skill (fintech dashboard → Dark Mode (OLED), IBM Plex Sans).

## Principles
1. **Colour carries meaning.** Green = money in. Coral = money out. Orange = warning/overdue.
   Champagne gold = actions, focus, active navigation, brand. Never use green/red decoratively.
2. **One warm-dark surface system.** No white or light-grey panels anywhere in dark UI.
3. **Numbers are the content.** Amounts use tabular figures, bold, and are the largest
   text in their card. Labels are small, muted, and secondary.
4. **Quiet luxury.** Hairline borders, a faint top sheen on cards, gold used sparingly.
   One `card-gold` highlight per screen at most. No gradient text, scale-on-hover or pulsing.
5. **Accessible by default.** Text contrast ≥ 4.5:1, visible focus rings, 44px touch targets,
   labels on every input, aria-labels on icon-only buttons, respect reduced motion.

## Tokens (web)
| Token | Hex | Use |
|---|---|---|
| ink-950 | `#0B0B0D` | Page background |
| ink-900 | `#131316` | Cards |
| ink-850 | `#1A1A1E` | Inputs, raised areas inside cards |
| ink-800 | `#222227` | Hover |
| ink-700 | `#2E2E34` | Strong borders, active segment |
| border | `white @ 7%` | Card and divider hairlines |
| text | stone-100 `#F5F5F4` | Primary text |
| text-muted | stone-400 `#A8A29E` | Secondary text (min. for body copy) |
| text-faint | stone-500 `#78716C` | Placeholders, hints only |
| brand-400 | `#D6B36A` | Gold: links, icons, focus. Buttons are a brand-300 → brand-500 gradient with **ink-950 text** |
| income-400 | `#4ADE80` | Money in (text); income-500 `#22C55E` fills |
| expense-400 | `#F87171` | Money out (text); expense-500 `#EF4444` fills |
| orange-400 | `#FB923C` | Warnings, overdue (amber is too close to gold) |

Chart categorical palette (dark-safe, in order): `#D6B36A #60A5FA #34D399 #F472B6 #A78BFA #FB923C #2DD4BF #E7E5E4`.

The Flutter app (`mobile_app/`) still uses the previous indigo palette.

## Typography
- UI: **Manrope** (400–800). Page and auth titles: **Instrument Serif** (`font-display`).
  **JetBrains Mono** only for raw SMS text, keys and account numbers.
- Page title 32–40px serif, card title 16–18px/700, body 14–15px/400, label 12–14px/500.
- Amounts: `tabular-nums`, 700. KPI value 24–30px.
- Uppercase only for tiny eyebrow labels (`eyebrow`, `kpi-label`). Never for headings or buttons.

## Shape & spacing
- Radius: cards 16px, inputs/buttons 12px, badges full.
- Spacing scale 4/8/12/16/20/24/32. Card padding 20–24px. Gap between cards 16–24px.
- Max content width 1152px (`max-w-6xl`).

## Web implementation (`frontend/src/index.css`)
Compose these classes instead of hand-rolling colours:
`page page-header page-title page-subtitle eyebrow card card-gold brand-mark card-pad card-header card-title card-subtitle divider
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
