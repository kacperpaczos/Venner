//! IPC - Inter-Process Communication
//!
//! Zero-copy channels dla komunikacji Rust ↔ JS

use tauri::ipc::Channel;

/// Binary channel dla dużych payloadów
pub type BinaryChannel = Channel<Vec<u8>>;

/// Text channel dla JSON/command messages
pub type JsonChannel = Channel<String>;

// TODO: Implementacja zero-copy IPC
