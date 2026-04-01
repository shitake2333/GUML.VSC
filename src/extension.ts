import * as vscode from "vscode";
import { GumlLanguageClient } from "./client";
import { StatusBarManager } from "./statusBar";

let client: GumlLanguageClient | undefined;
let statusBar: StatusBarManager | undefined;
let outputChannel: vscode.OutputChannel | undefined;

/**
 * Called by VS Code when the extension is activated.
 * Activation is triggered when a .guml file is opened or the workspace
 * contains .guml files.
 */
export async function activate(
    context: vscode.ExtensionContext
): Promise<void> {
    outputChannel = vscode.window.createOutputChannel("GUML Analyzer");
    statusBar = new StatusBarManager();
    client = new GumlLanguageClient(outputChannel, statusBar);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand("guml.quickActions", async () => {
            const items: vscode.QuickPickItem[] = [
                {
                    label: "$(refresh) Rebuild API Cache",
                    description: "Re-scan C# project and rebuild type information",
                },
                {
                    label: "$(debug-restart) Restart Analyzer",
                    description: "Stop and restart the GUML analyzer process",
                },
                {
                    label: "$(stop) Stop Analyzer",
                    description: "Stop the GUML analyzer process",
                },
                {
                    label: "$(output) Show Output",
                    description: "Open the GUML Analyzer output channel",
                },
            ];

            const picked = await vscode.window.showQuickPick(items, {
                placeHolder: "GUML Analyzer Actions",
            });

            if (!picked) return;

            if (picked.label.includes("Rebuild API Cache")) {
                await vscode.commands.executeCommand("guml.rebuildCache");
            } else if (picked.label.includes("Restart Analyzer")) {
                await vscode.commands.executeCommand("guml.restartServer");
            } else if (picked.label.includes("Stop Analyzer")) {
                await vscode.commands.executeCommand("guml.stopServer");
            } else if (picked.label.includes("Show Output")) {
                await vscode.commands.executeCommand("guml.showOutput");
            }
        }),
        vscode.commands.registerCommand("guml.rebuildCache", async () => {
            try {
                outputChannel?.appendLine("[GUML] Requesting API cache rebuild...");
                statusBar?.setAnalyzing("Rebuilding API cache...");
                await client?.sendRequest("guml/rebuildCache");
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : String(err);
                vscode.window.showErrorMessage(
                    `GUML: Failed to rebuild cache — ${msg}`
                );
                statusBar?.setError("Rebuild failed");
            }
        }),
        vscode.commands.registerCommand("guml.restartServer", async () => {
            outputChannel?.appendLine("[GUML] Restarting analyzer...");
            statusBar?.setStarting();
            try {
                await client?.restart();
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : String(err);
                vscode.window.showErrorMessage(
                    `GUML: Failed to restart analyzer — ${msg}`
                );
                statusBar?.setError("Restart failed");
            }
        }),
        vscode.commands.registerCommand("guml.stopServer", async () => {
            outputChannel?.appendLine("[GUML] Stopping analyzer...");
            try {
                await client?.stop();
                statusBar?.setError("Stopped");
                outputChannel?.appendLine("[GUML] Analyzer stopped.");
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : String(err);
                vscode.window.showErrorMessage(
                    `GUML: Failed to stop analyzer — ${msg}`
                );
            }
        }),
        vscode.commands.registerCommand("guml.showOutput", () => {
            outputChannel?.show(true);
        }),
        statusBar,
        { dispose: () => client?.dispose() }
    );

    // Start the language client
    try {
        await client.start();
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        outputChannel.appendLine(`[GUML] Activation error: ${msg}`);
        vscode.window.showErrorMessage(
            `GUML: Could not start analyzer — ${msg}`
        );
        statusBar.setError("Not started");
    }
}

/**
 * Called by VS Code when the extension is deactivated.
 */
export async function deactivate(): Promise<void> {
    await client?.stop();
}
