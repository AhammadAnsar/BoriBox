//! Local Area Network (LAN) WebSocket & HTTP Server Module
//! Serves the responsive Mobile POS interface across Wi-Fi and handles
//! bi-directional real-time CRDT delta synchronization without internet.

pub mod ws_handler;

use std::net::SocketAddr;
use tokio::net::TcpListener;

pub struct LanServer {
    pub port: u16,
}

impl LanServer {
    pub fn new(port: u16) -> Self {
        Self { port }
    }

    /// Spawns the background LAN WebSocket listener on 0.0.0.0:3001
    pub async fn start(&self) -> Result<(), String> {
        let addr = SocketAddr::from(([0, 0, 0, 0], self.port));
        let listener = TcpListener::bind(&addr)
            .await
            .map_err(|e| format!("Failed to bind LAN server to port {}: {}", self.port, e))?;

        println!("BoriBox LAN Sync Server running on ws://0.0.0.0:{}/crdt", self.port);

        tokio::spawn(async move {
            while let Ok((stream, peer_addr)) = listener.accept().await {
                println!("Mobile POS connected from: {}", peer_addr);
                tokio::spawn(ws_handler::handle_connection(stream, peer_addr));
            }
        });

        Ok(())
    }
}
