# Plotwise Kit — Accessibility (a11y) & Keyboard Navigation Guide

Plotwise Kit prioritizes accessibility, keyboard usability, and assistive technology support across both desktop and mobile layouts.

## 1. Keyboard Navigation Flow

A critical design principle is that **users must never be forced to tab through thousands of map SVG polygons**.

### Standard Tab Order:
1. **Header Toolbar**: Brand, Fixture picker, Area Unit select, Vector Grid toggle, Import GeoJSON, Export menu, Tour Guide button.
2. **Filter Controls**: Status filter toggle chips (space/enter toggles, displays counts), Min/Max area inputs, Reset button.
3. **Parcel Search Box**: Search input (`role="searchbox"`) and Clear button.
4. **Parcel List**: The list container has `tabIndex={0}` and `role="listbox"`.
   - <kbd>↓</kbd> (Arrow Down): Highlights and focuses the next parcel.
   - <kbd>↑</kbd> (Arrow Up): Highlights and focuses the previous parcel.
   - <kbd>Home</kbd>: Navigates to the first parcel.
   - <kbd>End</kbd>: Navigates to the last parcel.
   - <kbd>Enter</kbd> / <kbd>Space</kbd>: Selects the active parcel, synchronizing the map viewport and opening details.
5. **Details Card**: Close button, Reveal Parcel button (when hidden by active filters), Copy Shareable Link button.

## 2. Dialog Modals (Import & Tour Guide)

- **Focus Trap**: Keyboard focus is constrained within the dialog while active.
- **Escape Dismissal**: Pressing <kbd>Escape</kbd> immediately closes the modal.
- **Focus Restoration**: Focus returns to the triggering button when the dialog closes.

## 3. Visible Non-Color Cues

Color alone is never used to convey status. Every inventory state is reinforced by text, distinct symbol shapes, and map stroke patterns:

| Status | Icon Symbol | Label | Map Stroke Pattern |
|---|---|---|---|
| **Available** | `●` | Available | Solid stroke (1.5px) |
| **Reserved** | `◐` | Reserved | Dashed stroke (`5, 4`) |
| **Sold** | `■` | Sold | Fine dotted stroke (`2, 3`) |
| **Unavailable** | `✖` | Unavailable | Sparse dotted stroke (`1, 4`) |

## 4. Assistive Technology & ARIA Roles

- **ARIA Live Region**: An invisible polite live region announces selection changes:
  `"Selected parcel Lot 36, status available"`
- **Visible Focus Rings**: High-contrast 2px focus outlines (`:focus-visible`) are applied to all interactive controls.
- **`prefers-reduced-motion`**: When enabled, smooth scrolling, fly-to-bounds transitions, and micro-animations are disabled.

## 5. Known Limitations

- Direct spatial keyboard traversal of Canvas-rendered map polygons is not supported in version 0.1. Users navigate through the synchronized accessible parcel listbox instead.
