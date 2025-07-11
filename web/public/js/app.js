document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('statusForm');
    const resultDiv = document.getElementById('statusResult');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const host = document.getElementById('host').value.trim();
        const port = document.getElementById('port').value.trim() || '25565';

        if (!host) {
            alert('Please enter a server address');
            return;
        }

        resultDiv.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Checking server status...</p>
            </div>
        `;

        try {
            const response = await fetch('/api/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ host, port })
            });

            const contentType = response.headers.get("content-type") || "";

            if (!response.ok) {
                // Try to extract error from JSON if possible
                if (contentType.includes("application/json")) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Unknown server error");
                } else {
                    const text = await response.text();
                    throw new Error("Server returned HTML error:\n" + text.slice(0, 100));
                }
            }

            const data = await response.json();

            if (data.online) {
                resultDiv.innerHTML = `
                    <div class="server-status online">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-success">Online</span>
                            <small class="text-muted">Ping: ${data.ping}ms</small>
                        </div>

                        <div class="motd mb-3 p-2 bg-dark text-white rounded">
                            ${data.motd.html}
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="card mb-3">
                                    <div class="card-header bg-secondary text-white">
                                        Server Info
                                    </div>
                                    <div class="card-body">
                                        <ul class="list-unstyled">
                                            <li><strong>Version:</strong> ${data.version}</li>
                                            <li><strong>Protocol:</strong> ${data.protocol}</li>
                                            <li><strong>IP:</strong> ${data.ip}</li>
                                            <li><strong>Port:</strong> ${data.port}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card mb-3">
                                    <div class="card-header bg-secondary text-white">
                                        Players
                                    </div>
                                    <div class="card-body">
                                        <div class="progress mb-2">
                                            <div class="progress-bar" 
                                                 role="progressbar" 
                                                 style="width: ${(data.players.online / data.players.max) * 100}%">
                                                ${data.players.online} / ${data.players.max}
                                            </div>
                                        </div>
                                        ${data.players.sample && data.players.sample.length > 0 ? `
                                            <ul class="list-unstyled player-list">
                                                ${data.players.sample.map(player => `<li>${player.name}</li>`).join('')}
                                            </ul>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${data.favicon ? `
                            <div class="text-center mt-3">
                                <img src="${data.favicon}" alt="Server Favicon" class="img-fluid favicon">
                            </div>
                        ` : ''}

                        <a href="/status/${encodeURIComponent(host)}/${port}" class="btn btn-outline-primary mt-3">View Full Status Page</a>
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <strong>Server Offline</strong>
                        <p>${data.error || 'The server is offline or unreachable.'}</p>
                    </div>
                `;
            }
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Error</strong>
                    <p>${error.message || 'An error occurred while checking the server status.'}</p>
                </div>
            `;
        }
    });
});
