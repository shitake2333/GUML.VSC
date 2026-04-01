import * as vscode from "vscode";
import {
    LanguageClient,
    LanguageClientOptions,
    StreamInfo,
} from "vscode-languageclient/node";
import { StatusBarManager } from "./statusBar";
import { ChildProcess, spawn } from "child_process";

/**
 * Wraps the vscode-languageclient LanguageClient and manages the guml-analyzer
 * child process lifecycle and custom notification handling.
 */
export class GumlLanguageClient implements vscode.Disposable {
    private client: LanguageClient | undefined;
    private serverProcess: ChildProcess | undefined;
    private readonly outputChannel: vscode.OutputChannel;
    private readonly statusBar: StatusBarManager;
    private pendingProjectSelection:
        | ((value: string | undefined) => void)
        | undefined;

    constructor(
        outputChannel: vscode.OutputChannel,
        statusBar: StatusBarManager
    ) {
        this.outputChannel = outputChannel;
        this.statusBar = statusBar;
    }

    /**
     * Starts the language client by spawning guml-analyzer and connecting via
     * stdin/stdout JSON-RPC.
     */
    async start(): Promise<void> {
        const analyzerPath = this.resolveAnalyzerPath();
        this.statusBar.setStarting();

        const serverOptions = (): Promise<StreamInfo> => {
            return new Promise((resolve, reject) => {
                const proc = spawn(analyzerPath, [], {
                    stdio: ["pipe", "pipe", "pipe"],
                });

                this.serverProcess = proc;

                proc.stderr?.on("data", (data: Buffer) => {
                    this.outputChannel.append(data.toString());
                });

                proc.on("error", (err) => {
                    this.statusBar.setError("Failed to start analyzer");
                    reject(
                        new Error(
                            `Failed to start guml-analyzer: ${err.message}. ` +
                            `Make sure it is installed via: dotnet tool install -g guml-analyzer`
                        )
                    );
                });

                proc.on("exit", (code) => {
                    if (code !== 0 && code !== null) {
                        this.outputChannel.appendLine(
                            `guml-analyzer exited with code ${code}`
                        );
                    }
                });

                // Give the process a moment to fail fast (e.g. missing binary)
                setTimeout(() => {
                    if (proc.exitCode !== null) {
                        reject(
                            new Error(
                                `guml-analyzer exited immediately with code ${proc.exitCode}`
                            )
                        );
                        return;
                    }
                    resolve({
                        writer: proc.stdin!,
                        reader: proc.stdout!,
                    });
                }, 200);
            });
        };

        const config = vscode.workspace.getConfiguration("guml");
        const incrementalParsing = config.get<boolean>("incrementalParsing", true);

        const clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: "file", language: "guml" }],
            outputChannel: this.outputChannel,
            traceOutputChannel: this.outputChannel,
            initializationOptions: {
                workspaceRoot: this.getWorkspaceRoot(),
                incrementalParsing,
            },
        };

        this.client = new LanguageClient(
            "guml",
            "GUML Analyzer",
            serverOptions,
            clientOptions
        );

        this.registerCustomNotifications();

        await this.client.start();
    }

    /** Stops the language client and the analyzer process. */
    async stop(): Promise<void> {
        if (this.client) {
            try {
                await this.client.stop(2000);
            } catch {
                // Force-kill if graceful shutdown fails
                this.serverProcess?.kill("SIGKILL");
            }
        }
        this.client = undefined;
        this.serverProcess = undefined;
    }

    /** Restarts the language client by stopping and starting again. */
    async restart(): Promise<void> {
        await this.stop();
        await this.start();
    }

    /** Returns the underlying LanguageClient (if started). */
    getClient(): LanguageClient | undefined {
        return this.client;
    }

    /** Sends a JSON-RPC request to the analyzer server. */
    async sendRequest<T>(method: string, params?: unknown): Promise<T> {
        if (!this.client) {
            throw new Error("Language client is not started");
        }
        return this.client.sendRequest(method, params);
    }

    dispose(): void {
        this.stop();
    }

    // ── Private helpers ──

    private resolveAnalyzerPath(): string {
        const config = vscode.workspace.getConfiguration("guml");
        const customPath = config.get<string>("analyzerPath", "");
        return customPath || "guml-analyzer";
    }

    private getWorkspaceRoot(): string {
        const folders = vscode.workspace.workspaceFolders;
        return folders?.[0]?.uri.fsPath ?? "";
    }

    /**
     * Registers handlers for custom server→client notifications that are
     * specific to the GUML analyzer protocol.
     */
    private registerCustomNotifications(): void {
        if (!this.client) return;

        // serverStatus: update status bar
        this.client.onNotification(
            "serverStatus",
            (params: { status: string; message?: string }) => {
                switch (params.status) {
                    case "ready":
                        this.statusBar.setReady();
                        break;
                    case "analyzing":
                        this.statusBar.setAnalyzing(params.message);
                        break;
                    default:
                        this.statusBar.setReady();
                        break;
                }
            }
        );

        // apiCacheUpdated: log changes
        this.client.onNotification(
            "apiCacheUpdated",
            (params: {
                fullRebuild: boolean;
                updatedTypes?: string[];
                removedTypes?: string[];
                updatedControllers?: string[];
                removedControllers?: string[];
            }) => {
                if (params.fullRebuild) {
                    this.outputChannel.appendLine(
                        "[GUML] API cache fully rebuilt by analyzer"
                    );
                } else {
                    const parts: string[] = [];
                    if (params.updatedTypes?.length) {
                        parts.push(
                            `updated types: ${params.updatedTypes.join(", ")}`
                        );
                    }
                    if (params.removedTypes?.length) {
                        parts.push(
                            `removed types: ${params.removedTypes.join(", ")}`
                        );
                    }
                    if (params.updatedControllers?.length) {
                        parts.push(
                            `updated controllers: ${params.updatedControllers.length}`
                        );
                    }
                    if (params.removedControllers?.length) {
                        parts.push(
                            `removed controllers: ${params.removedControllers.length}`
                        );
                    }
                    this.outputChannel.appendLine(
                        `[GUML] API cache incremental update: ${parts.join("; ") || "no changes"}`
                    );
                }
            }
        );

        // projectCandidates: show QuickPick for user to choose
        this.client.onNotification(
            "projectCandidates",
            async (params: {
                candidates: { path: string; score: number }[];
            }) => {
                const items = params.candidates.map((c) => ({
                    label: c.path,
                    description: `score: ${c.score}`,
                }));

                const picked = await vscode.window.showQuickPick(items, {
                    placeHolder: "Select a Godot project for GUML analysis",
                    ignoreFocusOut: true,
                });

                // Send the selection back via the selectProject request
                if (this.client) {
                    this.client.sendRequest("selectProject", {
                        projectPath: picked?.label ?? null,
                    });
                }

                this.pendingProjectSelection?.(picked?.label);
            }
        );
    }
}
