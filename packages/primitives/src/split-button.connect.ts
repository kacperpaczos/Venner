export function splitButtonConnect(service: any) {
	const menuOpen = Boolean(service.context.get("menuOpen"));
	return {
		state: { menuOpen },
		primaryProps: { type: "button" as const, onClick: () => service.send({ type: "PRIMARY" }) },
		menuProps: { type: "button" as const, "aria-expanded": menuOpen, onClick: () => service.send({ type: "MENU" }) },
	};
}
