import * as vscode from "vscode";

const STATUS_ID = "guml.serverStatus";

/**
 * Manages the GUML analyzer status bar item.
 */
export class StatusBarManager implements vscode.Disposable {
    private readonly item: vscode.StatusBarItem;

    constructor() {
        this.item = vscode.window.createStatusBarItem(
            STATUS_ID,
            vscode.StatusBarAlignment.Left,
            0
        );
        this.item.command = "guml.quickActions";
        this.setReady();
    }

    /** Show the "ready" state. */
    setReady(): void {
        this.item.text = "$(check) GUML";
        this.item.tooltip = "GUML Analyzer: Ready";
        this.item.backgroundColor = undefined;
        this.item.show();
    }

    /** Show the "analyzing" state with an optional message. */
    setAnalyzing(message?: string): void {
        this.item.text = "$(sync~spin) GUML";
        this.item.tooltip = message
            ? `GUML Analyzer: ${message}`
            : "GUML Analyzer: Analyzing...";
        this.item.backgroundColor = new vscode.ThemeColor(
            "statusBarItem.warningBackground"
        );
        this.item.show();
    }

    /** Show the "error" state. */
    setError(message?: string): void {
        this.item.text = "$(error) GUML";
        this.item.tooltip = message
            ? `GUML Analyzer: ${message}`
            : "GUML Analyzer: Error";
        this.item.backgroundColor = new vscode.ThemeColor(
            "statusBarItem.errorBackground"
        );
        this.item.show();
    }

    /** Show the "starting" state. */
    setStarting(): void {
        this.item.text = "$(loading~spin) GUML";
        this.item.tooltip = "GUML Analyzer: Starting...";
        this.item.backgroundColor = undefined;
        this.item.show();
    }

    /** Hide the status bar item. */
    hide(): void {
        this.item.hide();
    }

    dispose(): void {
        this.item.dispose();
    }
}
