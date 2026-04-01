# GUML — VS Code Extension

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/shitake233.guml)](https://marketplace.visualstudio.com/items?itemName=shitake233.guml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Language support for **GUML** — a declarative UI markup language for Godot .NET.

## Features

- **Syntax highlighting** — TextMate grammar + semantic token coloring for `.guml` files
- **Code completion** — components, properties, events, global references, enum values
- **Hover information** — type details, property constraints, event signatures
- **Go to Definition** — navigate to imported files and parameter declarations
- **Formatting** — full-document and range formatting
- **Diagnostics** — real-time syntax and semantic error reporting
- **Document highlight** — highlight all occurrences of a symbol
- **Snippets** — built-in snippets for common patterns (`comp`, `prop`, `map`, `param`, `each`, `import` …)

## Requirements

- [**.NET 10 SDK**](https://dotnet.microsoft.com/download) (or later)
- **guml-analyzer** — the language analysis backend (a .NET global tool)

```bash
dotnet tool install -g guml-analyzer
```

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `guml.analyzerPath` | `""` | Custom path to the `guml-analyzer` executable. Leave empty to use the globally installed tool. |
| `guml.incrementalParsing` | `true` | Enable incremental parsing. Disable if you experience incorrect diagnostics after editing. |
| `guml.trace.server` | `"off"` | Traces communication between VS Code and the analyzer (`off` / `messages` / `verbose`). |

## Commands

| Command | Description |
|---------|-------------|
| `GUML: Quick Actions` | Open quick-pick menu for common analyzer actions |
| `GUML: Rebuild API Cache` | Re-scan C# project and rebuild type information |
| `GUML: Restart Analyzer` | Restart the guml-analyzer backend |
| `GUML: Stop Analyzer` | Stop the running analyzer process |
| `GUML: Show Output` | Show the GUML Analyzer output channel |

## License

[MIT](LICENSE)
