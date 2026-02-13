export function textViewConnect(service: any) {
	const value = String(service.context.get("value") ?? "");
	return {
		state: { value },
		rootProps: {
			value,
			onInput: (event: InputEvent) => {
				const target = event.currentTarget as HTMLTextAreaElement;
				service.send({ type: "INPUT", value: target.value });
			},
		},
	};
}
