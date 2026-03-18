export interface ButtonServiceLike {
	state: {
		matches: (...values: string[]) => boolean;
	};
	send: (event: { type: string; key?: string }) => void;
	context: {
		get: (key: string) => unknown;
	};
	prop: (key: string) => unknown;
}

export interface ButtonApi {
	state: {
		pressed: boolean;
		hovered: boolean;
		focused: boolean;
		disabled: boolean;
	};
	rootProps: {
		type: "button";
		"aria-pressed": boolean;
		"aria-disabled": boolean;
		"data-disabled": boolean;
		"data-hovered": boolean;
		"data-pressed": boolean;
		"data-focused": boolean;
		"data-variant": string;
		"data-size": string;
		disabled: boolean;
		touchAction: "manipulation";
		onMouseEnter: () => void;
		onMouseLeave: () => void;
		onMouseDown: () => void;
		onMouseUp: () => void;
		onTouchStart: () => void;
		onTouchEnd: () => void;
		onTouchCancel: () => void;
		onFocus: () => void;
		onBlur: () => void;
		onKeyDown: (event: KeyboardEvent) => void;
		onKeyUp: (event: KeyboardEvent) => void;
	};
	labelProps: Record<string, never>;
}

export function buttonConnect(service: ButtonServiceLike): ButtonApi {
	const pressed = Boolean(service.context.get("pressed"));
	const hovered = Boolean(service.context.get("hovered"));
	const focused = Boolean(service.context.get("focused"));
	const disabled = Boolean(service.prop("disabled"));
	const variant = String(service.prop("variant") ?? "primary");
	const size = String(service.prop("size") ?? "md");

	return {
		state: {
			pressed,
			hovered,
			focused,
			disabled,
		},
		rootProps: {
			type: "button",
			"aria-pressed": pressed,
			"aria-disabled": disabled,
			"data-disabled": disabled,
			"data-hovered": hovered,
			"data-pressed": pressed,
			"data-focused": focused,
			"data-variant": variant,
			"data-size": size,
			disabled,
			touchAction: "manipulation",
			onMouseEnter: () => service.send({ type: "POINTER_ENTER" }),
			onMouseLeave: () => service.send({ type: "POINTER_LEAVE" }),
			onMouseDown: () => service.send({ type: "POINTER_DOWN" }),
			onMouseUp: () => service.send({ type: "POINTER_UP" }),
			onTouchStart: () => service.send({ type: "TOUCH_START" }),
			onTouchEnd: () => service.send({ type: "TOUCH_END" }),
			onTouchCancel: () => service.send({ type: "POINTER_CANCEL" }),
			onFocus: () => service.send({ type: "FOCUS" }),
			onBlur: () => service.send({ type: "BLUR" }),
			onKeyDown: (event: KeyboardEvent) => {
				if (event.key === " " || event.key === "Enter") event.preventDefault();
				service.send({ type: "KEY_DOWN", key: event.key });
			},
			onKeyUp: (event: KeyboardEvent) => {
				service.send({ type: "KEY_UP", key: event.key });
			},
		},
		labelProps: {},
	};
}
