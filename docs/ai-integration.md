# Build it with an AI assistant

You don't have to read the SDK yourself. If you build games with an AI coding assistant (Claude, Cursor, VS Code, ChatGPT and the like), you can let it do the integration: it checks your runtime, picks the motions, writes and validates your action map, and tells you how to get a licence.

There are two pieces. Use either or both.

## The MCP server (works in any MCP assistant)

An **MCP server** is a small program your assistant connects to so it can act on the Motion Controller for you. It is read-only: it holds no secret, writes nothing, and cannot issue a licence.

1. Get the server: download the **`AI-Tools`** zip from the [latest release](https://github.com/atiqbitstream/motion-controller/releases/latest) and unzip it, or copy the `tools/mcp` folder from this repository.
2. Add it to your assistant (Node 18+ required, nothing to install). For Claude Code:

   ```sh
   claude mcp add motion-controller -- node /full/path/to/tools/mcp/motion-controller-mcp.mjs
   ```

   For Claude Desktop, Cursor and VS Code, add the same `command`/`args` to your client's MCP config. Full steps are in the server's own `README.md`.
3. Ask away: *"Is my Motion Controller runtime running?"*, *"Make an action map for my shooter: aim with the hand, fire with the trigger, reload with two hands"*, *"Check this action map."*

What it can do: check the runtime, list and describe the motions, create an action map, validate one, and explain licensing.

## The Skill (for Claude)

A **Skill** teaches Claude the whole integration workflow for your engine, from choosing motions to wiring the bridge and getting a licence. Download the **`AI-Tools`** zip (or copy `skills/motion-controller` from this repository) and install it where your Claude client loads skills. Then just say what your game should do, for example *"Add webcam motion control to my Unity shooter so the player aims with their hand and fires with their finger,"* and it walks the steps.

The Skill and the MCP server work best together: the Skill knows the workflow, and the server does the live checks and writes the action map.

## Still prefer to do it yourself?

The plain guides are right here: [Quick start: Unity](quick-start-unity.md) and [Quick start: C](quick-start-c.md).
