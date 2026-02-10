import { createMachine } from "@zag-js/core";

/**
 * Button machine - headless state machine for button component
 * 
 * Handles: hover, focus, active, disabled states
 * Framework-agnostic - can be used with Solid, React, Vue, etc.
 */

export interface ButtonContext {
  pressed: boolean;
  checked: boolean;
  disabled: boolean;
  focused: boolean;
  hovered: boolean;
  size: "sm" | "md" | "lg";
  variant: "primary" | "secondary" | "ghost" | "link";
}

export const buttonMachine = createMachine({
  id: "button",
  initial: "idle",

  context: {
    pressed: false,
    checked: false,
    disabled: false,
    focused: false,
    hovered: false,
    size: "md",
    variant: "primary",
  } as ButtonContext,

  states: {
    idle: {
      on: {
        POINTER_ENTER: { target: "hover", actions: ["setHovered"] },
        POINTER_LEAVE: { actions: ["clearHovered"] },
        FOCUS: { target: "focused", actions: ["setFocused"] },
        BLUR: { actions: ["clearFocused"] },
        KEY_DOWN: {
          guard: "isEnterOrSpace",
          actions: ["setPressed"],
        },
      },
    },

    hover: {
      on: {
        POINTER_LEAVE: { target: "idle", actions: ["clearHovered"] },
        POINTER_DOWN: { target: "active", actions: ["setPressed"] },
        BLUR: { target: "idle", actions: ["clearFocused"] },
      },
    },

    focused: {
      on: {
        BLUR: { target: "idle", actions: ["clearFocused"] },
        POINTER_ENTER: { target: "focusedHover", actions: ["setHovered"] },
        KEY_DOWN: {
          guard: "isEnterOrSpace",
          target: "active",
          actions: ["setPressed"],
        },
      },
    },

    focusedHover: {
      on: {
        POINTER_LEAVE: { target: "focused", actions: ["clearHovered"] },
        POINTER_DOWN: { target: "active", actions: ["setPressed"] },
      },
    },

    active: {
      entry: ["setPressed"],
      on: {
        POINTER_UP: {
          target: "hover",
          actions: ["dispatchClick", "clearPressed"],
        },
        KEY_UP: {
          guard: "isEnterOrSpace",
          target: "focused",
          actions: ["dispatchClick", "clearPressed"],
        },
        POINTER_LEAVE: {
          target: "focused",
          actions: ["clearPressed", "clearHovered"],
        },
      },
    },

    disabled: {
      on: {
        // No interactions in disabled state
      },
    },
  },

  actions: {
    setHovered: (ctx) => ({ ...ctx, hovered: true }),
    clearHovered: (ctx) => ({ ...ctx, hovered: false }),
    setFocused: (ctx) => ({ ...ctx, focused: true }),
    clearFocused: (ctx) => ({ ...ctx, focused: false }),
    setPressed: (ctx) => ({ ...ctx, pressed: true }),
    clearPressed: (ctx) => ({ ...ctx, pressed: false }),
    dispatchClick: () => {
      // Dispatch to Venner Store
    },
  },

  guards: {
    isEnterOrSpace: (_ctx, event) =>
      event.key === "Enter" || event.key === " ",
  },
});
