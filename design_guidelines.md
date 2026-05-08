{
  "brand": {
    "name": "Open Specter",
    "attributes": [
      "enterprise",
      "white-collar professional",
      "restrained",
      "Apple-inspired calm",
      "high-trust",
      "typography-led hierarchy",
      "monochrome-first"
    ],
    "non_negotiables": [
      "No bright colors anywhere (UI, icons, highlights).",
      "Use Space Grotesk for headings, buttons, navigation labels.",
      "Use Inter for body, helper text, metadata.",
      "Preserve existing functionality exactly; redesign layout/spacing/states/motion only.",
      "All interactive and key informational elements MUST include data-testid (kebab-case, role-based)."
    ]
  },
  "typography": {
    "fonts": {
      "primary_heading": "Space Grotesk",
      "secondary_body": "Inter",
      "notes": [
        "Replace current serif usage (font-serif) for product UI headings with Space Grotesk.",
        "Keep any long-form legal content (USC/CFR sections) as-is if it relies on serif tokens; do not globally break reading views."
      ]
    },
    "scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-[550] tracking-[-0.02em]",
      "h2": "text-base md:text-lg font-[520] tracking-[-0.01em]",
      "section_title": "text-lg font-[550] tracking-[-0.01em]",
      "body": "text-sm md:text-base font-normal leading-6",
      "meta": "text-xs font-normal leading-5",
      "button": "text-sm font-[550] tracking-[-0.01em]"
    },
    "usage_rules": [
      "Headings/buttons/nav: add `font-space-grotesk` utility (create in globals via CSS variable or Tailwind config).",
      "Body/labels/help: default Inter (already --font-inter).",
      "Avoid heavy weights; prefer 450–600 range for Apple-like calm."
    ]
  },
  "color_system": {
    "intent": "Strict neutral grayscale system (no chroma accents).",
    "tokens_css_variables": {
      "background": "oklch(1 0 0)",
      "foreground": "oklch(0.145 0 0)",
      "card": "oklch(1 0 0)",
      "muted": "oklch(0.97 0 0)",
      "muted_foreground": "oklch(0.556 0 0)",
      "border": "oklch(0.922 0 0)",
      "ring": "oklch(0.708 0 0)",
      "primary": "oklch(0.205 0 0)",
      "primary_foreground": "oklch(0.985 0 0)",
      "danger": "oklch(0.577 0.245 27.325) (keep for destructive only)"
    },
    "component_palette": {
      "page_bg": "bg-background",
      "surface": "bg-card",
      "surface_subtle": "bg-muted/40",
      "stroke": "border-border/70",
      "text_primary": "text-foreground",
      "text_secondary": "text-muted-foreground",
      "focus_ring": "focus-visible:ring-2 focus-visible:ring-ring/35"
    },
    "hard_rules": [
      "Remove/avoid any blue accent usage in core product UI (e.g., RecentActivity icon chip currently uses azure).",
      "No gradients except extremely subtle neutral-only decorative backgrounds (and must obey gradient restriction rule).",
      "If a highlight is needed, use grayscale: bg-muted/60, border-border, shadow depth—not color."
    ]
  },
  "design_tokens": {
    "radius": {
      "sm": "rounded-md",
      "md": "rounded-xl",
      "lg": "rounded-2xl"
    },
    "shadows": {
      "card": "shadow-[0_10px_30px_rgba(2,6,23,0.045)]",
      "popover": "shadow-[0_12px_30px_rgba(0,0,0,0.12)]",
      "pressed": "shadow-[0_6px_18px_rgba(2,6,23,0.08)]"
    },
    "spacing": {
      "page_padding": "px-4 sm:px-6 lg:px-8",
      "section_gap": "space-y-10",
      "card_padding": "p-6 sm:p-7",
      "field_gap": "space-y-2",
      "row_padding": "px-4 py-3"
    }
  },
  "layout": {
    "global": {
      "principle": "Apple System Settings-inspired: left rail (Settings sections) + right content with grouped cards.",
      "grid": {
        "desktop": "max-w-5xl mx-auto grid grid-cols-12 gap-6",
        "rail": "col-span-12 md:col-span-4",
        "content": "col-span-12 md:col-span-8"
      },
      "patterns": [
        "Use grouped cards with section headers and subtle dividers.",
        "Prefer two-column field rows on desktop (label left, control right) for settings; stack on mobile.",
        "Keep primary actions right-aligned within each card footer on desktop; full-width on mobile."
      ]
    },
    "auth_pages": {
      "principle": "Quiet, premium login: centered card but left-aligned content; subtle background texture; no color accents.",
      "structure": [
        "Top: Open Specter logo lockup.",
        "Card: title + segmented switch (Login/Signup) + form.",
        "Footer: legal links and help.",
        "Optional: right-side ‘security reassurance’ panel on desktop only (SSO-ready, encryption, audit logs) as muted list."
      ]
    }
  },
  "components": {
    "component_path": {
      "button": "/app/frontend/src/components/ui/button.tsx",
      "input": "/app/frontend/src/components/ui/input.tsx",
      "dropdown_menu": "/app/frontend/src/components/ui/dropdown-menu.tsx",
      "tabs": "/app/frontend/src/components/ui/tabs.tsx",
      "dialog": "/app/frontend/src/components/ui/dialog.tsx",
      "tooltip": "/app/frontend/src/components/ui/tooltip.tsx",
      "sheet": "/app/frontend/src/components/ui/sheet.tsx"
    },
    "login_page_redesign": {
      "targets": ["/app/frontend/src/app/login/page.tsx", "/app/frontend/src/app/signup/page.tsx"],
      "instructions": [
        "Replace `font-serif` headings with Space Grotesk utility.",
        "Replace black button fill with near-black neutral: `bg-foreground text-background hover:bg-foreground/90`.",
        "Add subtle card depth: `rounded-2xl border border-border/70 bg-card/80 backdrop-blur-[2px]`.",
        "Background: remove any blue-ish radial gradients; use neutral-only: `radial-gradient(... rgba(2,6,23,0.04) ...)` + noise.",
        "Segmented switch: use Tabs (shadcn) instead of ad-hoc spans/links for consistent focus + motion.",
        "Add inline helper row under password: “Forgot password” link (if exists) styled as muted underline; if not supported, omit.",
        "Add `data-testid` to: email input, password input, submit button, auth-switch tabs, error banner.",
        "Micro-interactions: on card mount, fade+lift (motion). On button press: scale 0.98. On input focus: ring + subtle bg shift."
      ],
      "data_testids": {
        "login": {
          "email": "login-email-input",
          "password": "login-password-input",
          "submit": "login-submit-button",
          "switch_to_signup": "login-switch-to-signup",
          "error": "login-error-banner"
        },
        "signup": {
          "name": "signup-name-input",
          "organisation": "signup-organisation-input",
          "email": "signup-email-input",
          "password": "signup-password-input",
          "confirm": "signup-confirm-password-input",
          "submit": "signup-submit-button",
          "switch_to_login": "signup-switch-to-login",
          "error": "signup-error-banner",
          "success": "signup-success-panel"
        }
      }
    },
    "sidebar_user_menu_micro_interactions": {
      "targets": ["/app/frontend/src/app/components/shared/AppSidebar.tsx"],
      "instructions": [
        "Replace custom absolute dropdown with shadcn DropdownMenu for consistent animation (already motion-enhanced in dropdown-menu.tsx).",
        "Use `DropdownMenuTrigger asChild` wrapping the profile button.",
        "Add menu items: Account Settings, Sign out (if present), maybe divider.",
        "Add subtle hover/press states on trigger: `transition-[background-color] duration-150`, `active:scale-[0.99]`.",
        "Add focus-visible ring on trigger and menu items.",
        "Ensure click-outside behavior is handled by Radix; remove manual document click listener.",
        "Add `data-testid`: `sidebar-user-menu-trigger`, `sidebar-user-menu-content`, `sidebar-user-menu-account-settings`, `sidebar-user-menu-sign-out`."
      ]
    },
    "settings_general_page_redesign": {
      "targets": ["/app/frontend/src/app/(pages)/account/page.tsx"],
      "new_structure": {
        "rail": [
          "Settings",
          "General",
          "Models & API keys"
        ],
        "content_cards": [
          "Profile (Display name, Organisation, Email)",
          "Plan (Usage plan)",
          "Session (Sign out)",
          "Danger zone (Delete account)"
        ]
      },
      "instructions": [
        "Convert from long vertical sections to grouped cards with headers and descriptions.",
        "Use label-left/control-right rows on desktop: `md:grid md:grid-cols-[220px_1fr] md:items-center`.",
        "Move Save buttons into row trailing area; on mobile keep stacked full-width.",
        "Replace red heading styling with neutral heading + red only for destructive button/border.",
        "Add subtle inline ‘Saved’ state as a small badge (shadcn Badge) instead of icon+text inside button (optional).",
        "Add `data-testid` to all inputs and action buttons: save display name, save org, sign out, delete confirm/cancel.",
        "Micro-interactions: card hover lift is NOT recommended for enterprise settings; instead use subtle border darken on hover: `hover:border-border` and `transition-[border-color,background-color]`.",
        "Use motion for confirm panel expand/collapse: height+opacity (motion)."
      ]
    },
    "settings_models_api_keys_redesign": {
      "targets": ["/app/frontend/src/app/(pages)/account/models/page.tsx"],
      "instructions": [
        "Same settings shell as General: left rail + right grouped cards.",
        "Model Preferences card: show selected model + availability hint in muted text; keep dropdown.",
        "API Keys card: each provider as its own sub-card row with provider icon (lucide) in grayscale chip.",
        "Replace red alert icon usage for unavailable models with neutral warning (border + icon in gray). Only use red for destructive actions, not availability.",
        "API key reveal button: add tooltip (shadcn Tooltip) “Show key / Hide key”.",
        "Add `data-testid`: model dropdown trigger, each dropdown item, api key inputs, reveal toggles, save buttons.",
        "Ensure dropdown uses existing motion animation in dropdown-menu.tsx; keep durations <= 160ms."
      ],
      "data_testids": {
        "model": {
          "trigger": "settings-model-dropdown-trigger",
          "content": "settings-model-dropdown-content",
          "item": "settings-model-dropdown-item"
        },
        "api_keys": {
          "claude_input": "settings-claude-api-key-input",
          "claude_reveal": "settings-claude-api-key-reveal-button",
          "claude_save": "settings-claude-api-key-save-button",
          "gemini_input": "settings-gemini-api-key-input",
          "gemini_reveal": "settings-gemini-api-key-reveal-button",
          "gemini_save": "settings-gemini-api-key-save-button"
        }
      }
    },
    "recent_activity_redesign": {
      "targets": ["/app/frontend/src/app/components/assistant/RecentActivity.tsx"],
      "instructions": [
        "Remove azure/blue icon chip background and icon color; replace with neutral chip: `bg-muted text-foreground/80`.",
        "First row subtle highlight (reference): apply `bg-muted/40` only to first item, not all.",
        "Right aligned ‘View all’ link (if route exists) as ghost button; keep Refresh as icon-only on mobile.",
        "Row hover: `hover:bg-muted/45` is fine; add `active:bg-muted/60`.",
        "Add `data-testid` already present; ensure each row link has unique id testid if possible: `recent-activity-row-${event.id}`.",
        "Keep motion section entrance; ensure no color accents."
      ]
    }
  },
  "motion_micro_interactions": {
    "library": "motion.dev (motion/react already used)",
    "principles": [
      "Fast, subtle, reversible.",
      "Use opacity + small translate (4–8px) + tiny scale (0.98–1).",
      "Durations: 120–220ms for UI controls; 280–420ms for page/section entrance.",
      "Easing: [0.22, 1, 0.36, 1] for entrances; easeOut for menus."
    ],
    "recipes": {
      "dropdown": {
        "already_in": "/app/frontend/src/components/ui/dropdown-menu.tsx",
        "spec": "initial {opacity:0,y:4,scale:0.98} -> animate {opacity:1,y:0,scale:1} duration 0.16"
      },
      "button": {
        "tailwind": "transition-[background-color,box-shadow] duration-150 active:scale-[0.98]",
        "note": "Do not use transition-all."
      },
      "settings_confirm_panel": {
        "motion_div": "animate height + opacity; use overflow-hidden; duration 0.22"
      }
    }
  },
  "accessibility": {
    "rules": [
      "WCAG AA contrast: ensure muted text still readable on white.",
      "All focusable elements must have visible focus ring (use ring token).",
      "Touch targets >= 40px height for primary controls.",
      "Do not rely on color alone for state; use text + icon + border."
    ]
  },
  "images": {
    "image_urls": [
      {
        "category": "auth_background_texture",
        "description": "No photography; use CSS noise + neutral radial only. Keep brand minimal.",
        "urls": []
      }
    ]
  },
  "implementation_notes_js": {
    "note": "Project contains .tsx currently, but if you add new components, prefer .js/.jsx only if repo conventions require. Keep guidance compatible with JS by avoiding TS-only syntax in new files.",
    "data_testid_convention": "kebab-case, role-based (e.g., settings-sign-out-button)."
  },
  "instructions_to_main_agent": [
    "Update global font tokens: add Space Grotesk + Inter via next/font or Google Fonts; map headings/buttons/nav to Space Grotesk.",
    "Neutralize globals.css background: remove azure radial + selection blue; replace with grayscale-only.",
    "Refactor AppSidebar user menu to use shadcn DropdownMenu (already motion-animated) and add testids.",
    "Redesign /login and /signup with a calmer auth shell, Tabs-based switch, and motion micro-interactions; add testids.",
    "Redesign /account and /account/models into Apple-like settings shell (rail + grouped cards) while preserving existing handlers and state.",
    "Update RecentActivity to monochrome chips and reference-like row styling; keep existing data fetching.",
    "Ensure no bright colors remain (including existing azure usage in RecentActivity and globals selection)."
  ]
}

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
