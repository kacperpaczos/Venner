//! Venner Core – parsowanie motywów GTK, stan, IPC.

pub mod ipc;
pub mod state;
pub mod theme;

// Re-eksporty dla zewnętrznych crate'ów
pub use state::{
    Action, AppState, ImportResult, PersistedAppState, ThemeTokens, ValidationReport, VennerStore,
    WidgetState, WindowState,
};

// Kompatybilność wsteczna: venner_core::commands, venner_core::theme_monitor, venner_core::app_state
pub mod app_state {
    pub use super::state::app_state::*;
}

pub mod commands {
    pub use super::ipc::commands::*;
}

pub mod theme_monitor {
    pub use super::theme::monitor::*;
}
