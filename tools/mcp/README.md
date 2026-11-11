# Motion Controller MCP server

Let an AI coding assistant help you add webcam motion control to your game. This is an **MCP server**: a small program your assistant (Claude, Cursor, VS Code, ChatGPT, and others) connects to, so it can check your runtime, list the motions it can recognise, write and check an action map, and tell you how to get a licence.

It is **read-only and compute-only**. It holds no secret, writes nothing to your disk, and cannot issue a licence. A real licence still comes from the free [request form](https://github.com/atiqbitstream/motion-controller/issues/new?template=licence-request.yml).

## What it can do

| Tool | What you ask it for |
|---|---|
| `check_runtime` | Is the Motion Controller Runtime installed and running on this machine? Could a game connect now? |
| `list_capabilities` | What motions can it recognise? (aim, trigger, punch, kick, flight, climb, and more) |
| `describe_capability` | The full detail of one motion: its outputs, how to bind them, framing, calibration. |
| `create_action_map` | Write a valid action map from your game's actions. |
| `validate_action_map` | Check an action map you already have, and explain every problem. |
| `licensing_help` | How to get the free licence your game needs, with the request link. |

## Requirements

Node 18 or newer. Nothing to install: the server is one file and speaks the MCP protocol itself.

## Add it to your assistant

Whatever the client, you are pointing it at `motion-controller-mcp.mjs` in this folder, run by `node`. **Use the full path** to the file (for example `/Users/you/motion-controller/tools/mcp/motion-controller-mcp.mjs`, or on Windows `C:\\Users\\you\\motion-controller\\tools\\mcp\\motion-controller-mcp.mjs`). It works the same on every client; only where you put the setting differs.

### Claude Code (terminal)

```sh
claude mcp add motion-controller -- node /full/path/to/motion-controller-mcp.mjs
```

### OpenAI Codex CLI

```sh
codex mcp add motion-controller -- node /full/path/to/motion-controller-mcp.mjs
```

Or add it to `~/.codex/config.toml` by hand (the table name must be `mcp_servers`, with the underscore):

```toml
[mcp_servers.motion-controller]
command = "node"
args = ["/full/path/to/motion-controller-mcp.mjs"]
```

### GitHub Copilot (VS Code)

Create `.vscode/mcp.json` in your project (note the top-level key is `servers`), then click **Start** above the entry, or reload the window:

```json
{
  "servers": {
    "motion-controller": {
      "command": "node",
      "args": ["/full/path/to/motion-controller-mcp.mjs"]
    }
  }
}
```

### Claude Desktop

Edit the config file (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`; Windows: `%APPDATA%\Claude\claude_desktop_config.json`), then fully quit and reopen Claude:

```json
{
  "mcpServers": {
    "motion-controller": {
      "command": "node",
      "args": ["/full/path/to/motion-controller-mcp.mjs"]
    }
  }
}
```

### Cursor, Windsurf, Cline and other MCP clients

These use the same `mcpServers` block as Claude Desktop above. Put it in the file your client reads: Cursor uses `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` for every project); Windsurf and Cline have their own MCP settings panel. Check your client's docs for the file location; the `command` and `args` are always the same.

> Tip: the config formats differ in just one word — Claude, Cursor, Windsurf and Cline use `mcpServers`, VS Code/Copilot uses `servers`, and Codex uses a `[mcp_servers.<name>]` TOML table. The `command: node` and `args: [path]` are identical everywhere.

## Try it

Once it is connected, ask your assistant things like:

- "Is my Motion Controller runtime running?"
- "What motions can the Motion Controller recognise for a shooting game?"
- "Make me an action map for a game called `com.mystudio.duckhunt`: aim with the hand, fire by pulling the trigger, reload with two hands."
- "Check this action map and tell me what's wrong."
- "How do I get a licence for my game?"

## Keeping it current

`data/capabilities.json` is generated from a runtime build, and `data/actionmap.schema.json` is the action map schema. To teach the server motions added by a newer runtime, replace those two files from that build. The server reads them at startup.
