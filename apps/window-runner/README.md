# Venner Window Runner

Native-window replacement demo app for Venner.

Features:
- undecorated + transparent Tauri window
- custom GTK-like window chrome rendered by Venner
- default chrome style: `system-gtk` (debug style is opt-in)
- runtime style injection from compiled GTK contract (`get_compiled_gtk_theme`)
- runtime window controls and diagnostics
- system-follow theme tokens from GTK pipeline
