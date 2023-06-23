use tauri::App;

#[cfg(mobile)]
mod mobile;

#[cfg(mobile)]
pub use mobile::*;

pub type SetupHook = Box<dyn FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send>;

#[derive(Default)]
pub struct AppBuilder {
    setup: Option<SetupHook>,
}


use std::collections::HashMap;
use serde::Serialize;
use midir::{Ignore, MidiInput, MidiInputConnection};
use std::sync::{Arc, Mutex};
use tauri::{Manager, Window, Wry};



#[derive(Default)]
pub struct MidiState {
    pub input: Mutex<Option<MidiInputConnection<()>>>,
}

#[derive(Clone, Serialize)]
struct MidiMessage {
    message: Vec<u8>,
}


#[tauri::command]
fn list_midi_connections() -> HashMap<usize, String> {
    let midi_in = MidiInput::new("piano-trainer-input");
    match midi_in {
        Ok(midi_in) => {
            let mut midi_connections = HashMap::new();
            for (i, p) in midi_in.ports().iter().enumerate() {
                let port_name = midi_in.port_name(p);
                match port_name {
                    Ok(port_name) => {
                        midi_connections.insert(i, port_name);
                    }
                    Err(e) => {
                        println!("Error getting port name: {}", e);
                    }
                }
            }
            midi_connections
        }
        Err(_) => HashMap::new(),
    }
}

#[tauri::command]
fn open_midi_connection(
    midi_state: tauri::State<'_, MidiState>,
    window: Window<Wry>,
    input_idx: usize,
) {
    let handle = Arc::new(window).clone();
    let midi_in = MidiInput::new("piano-trainer-input");
    match midi_in {
        Ok(mut midi_in) => {
            midi_in.ignore(Ignore::None);
            let midi_in_ports = midi_in.ports();
            let port = midi_in_ports.get(input_idx);
            match port {
                Some(port) => {
                    let midi_in_conn = midi_in.connect(
                        port,
                        "midir",
                        move |_, message, _| {
                            handle
                                .emit_all(
                                    "midi_message",
                                    MidiMessage {
                                        message: message.to_vec(),
                                    },
                                )
                                .map_err(|e| {
                                    println!("Error sending midi message: {}", e);
                                })
                                .ok();
                        },
                        (),
                    );
                    match midi_in_conn {
                        Ok(midi_in_conn) => {
                            midi_state.input.lock().unwrap().replace(midi_in_conn);
                        }
                        Err(e) => {
                            println!("Error: {}", e);
                        }
                    }
                }
                None => {
                    println!("No port found at index {}", input_idx);
                }
            }
        }
        Err(e) => println!("Error: {}", e),
    }
}

impl AppBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn setup<F>(mut self, setup: F) -> Self
        where
            F: FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send + 'static,
    {
        self.setup.replace(Box::new(setup));
        self
    }

    pub fn run(self) {
        let setup = self.setup;
        let context = tauri::generate_context!();
        tauri::Builder::default()
            .manage(MidiState {
                ..Default::default()
            })
            .invoke_handler(tauri::generate_handler![
                open_midi_connection,
                list_midi_connections
              ])
            .menu(if cfg!(target_os = "macos") {
                tauri::Menu::os_default(&context.package_info().name)
            } else {
                tauri::Menu::default()
            })
            .setup(move |app| {
                if let Some(setup) = setup {
                    (setup)(app)?;
                }
                Ok(())
            })
            .run(context)
            .expect("error while running tauri application");
    }
}
