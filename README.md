# GUML — VS Code Extension

Language support for **GUML** — a declarative UI markup language for Godot .NET.

## Features

- **Syntax highlighting** — TextMate grammar for `.guml` files plus semantic token coloring
- **Code completion** — components, properties, events, global references, enum values
- **Hover information** — type details, property constraints, event signatures
- **Go to Definition** — navigate to imported files and parameter declarations
- **Formatting** — full-document and range formatting
- **Diagnostics** — real-time syntax and semantic error reporting
- **Document highlight** — highlight all occurrences of a symbol

## Requirements

- **.NET 10 SDK** (or later) — required to install and run the analyzer
- **guml-analyzer** — the GUML language analysis backend (a .NET global tool)

Install the analyzer:

```bash
dotnet tool install -g guml-analyzer
```

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `guml.analyzerPath` | `""` | Custom path to the `guml-analyzer` executable. Leave empty to use the globally installed tool. |
| `guml.trace.server` | `"off"` | Traces communication between VS Code and the analyzer (`off` / `messages` / `verbose`). |

## Commands

| Command | Description |
|---------|-------------|
| `GUML: Restart Analyzer` | Restart the guml-analyzer backend |
| `GUML: Show Output` | Show the GUML Analyzer output channel |

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
