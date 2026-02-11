import { useMachine } from "@zag-js/solid";
import { buttonMachine } from "@venner/primitives";
import "@venner/ui/styles/button.css";

interface ButtonProps {
  children?: string;
  variant?: "primary" | "secondary" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
}

export function Button(props: ButtonProps) {
  const [state, send] = useMachine(buttonMachine, {
    context: {
      disabled: props.disabled ?? false,
      variant: props.variant ?? "primary",
      size: props.size ?? "md",
      onClick: props.onClick,
    },
  });

  const api = state.context;

  return (
    <button
      type="button"
      class="venner-button"
      role="button"
      aria-pressed={api.pressed}
      aria-disabled={api.disabled}
      data-variant={props.variant}
      data-size={props.size}
      data-disabled={api.disabled}
      data-hovered={api.hovered}
      data-pressed={api.pressed}
      data-focused={api.focused}
      disabled={api.disabled}
      onMouseEnter={() => send("POINTER_ENTER")}
      onMouseLeave={() => send("POINTER_LEAVE")}
      onMouseDown={() => send("POINTER_DOWN")}
      onMouseUp={() => send("POINTER_UP")}
      onFocus={() => send("FOCUS")}
      onBlur={() => send("BLUR")}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === " " || e.key === "Enter") e.preventDefault();
        send({ type: "KEY_DOWN", key: e.key });
      }}
      onKeyUp={(e: KeyboardEvent) => send({ type: "KEY_UP", key: e.key })}
    >
      {props.children}
    </button>
  );
}
