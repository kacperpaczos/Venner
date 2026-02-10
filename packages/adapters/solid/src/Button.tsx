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
    },
  });

  const api = state.context;

  return (
    <button
      class="venner-button"
      data-variant={props.variant}
      data-size={props.size}
      data-disabled={api.disabled}
      data-hovered={api.hovered}
      data-pressed={api.pressed}
      data-focused={api.focused}
      disabled={api.disabled}
      onClick={() => {
        props.onClick?.();
        send("CLICK");
      }}
      onMouseEnter={() => send("POINTER_ENTER")}
      onMouseLeave={() => send("POINTER_LEAVE")}
      onMouseDown={() => send("POINTER_DOWN")}
      onMouseUp={() => send("POINTER_UP")}
      onFocus={() => send("FOCUS")}
      onBlur={() => send("BLUR")}
    >
      {props.children}
    </button>
  );
}
