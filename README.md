# MCP Adventure

An npm-workspaces monorepo for an LLM-driven text adventure. 

I grew up playing text-adventure games and writing my own. There are two main parts to such projects: the game engine that models and manipulates the world, and what we now called a chatbot, so that the user can issue commands and get feedback in conversational text. 

That second part used to mean complex text parsing (e.g. building in grammar), especially if you wanted to accept input like "Use the broad sword to attack the small dragon and then exit through the west door" and not just "kill dragon."

Now, LLM's can handle the chatbot functionality. This project has a game-engine that models a world inside a postgres database. There's then a repository layer that connected to it, a game-engine layer that uses the repository, and an mcp that can call game functions. Currently, it's set up for local testing with Ollama models calling the MCP.

The client UI is very simple right now, but there's a lot going on behind it.

![look around](images/look-around.png)

![take key](images/take-key.png)

![take chest](images/take-chest.png)

![chest can't be taken](images/no-chest.png)


## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop (or Docker Engine with Compose)
- Optional: DBeaver, TablePlus, pgAdmin, or another PostgreSQL client

## ## Run the demo locally

### Prerequisites

Install the following before starting:

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop
- [Ollama](https://ollama.com/)

### 1. Install the project dependencies

From the project root:

```bash
npm install
```

### 2. Configure the environment

Copy the example environment file:

```bash
cp .env.example .env
```

Make sure `.env` contains:

```dotenv
POSTGRES_USER=mcp_adventure
POSTGRES_PASSWORD=mcp_adventure
POSTGRES_DB=mcp_adventure
POSTGRES_PORT=5432

DATABASE_URL=postgresql://mcp_adventure:mcp_adventure@localhost:5432/mcp_adventure

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b

PORT=3000
```

You can use a different Ollama model, but it must support tool calling. Set `OLLAMA_MODEL` to the exact model name shown by:

```bash
ollama list
```

### 3. Start and seed PostgreSQL

Start PostgreSQL in Docker:

```bash
npm run db:up
```

Run the database migrations and load the demo game:

```bash
npm run db:init
```

This creates the database schema and seeds the `forgotten-keep` demo world.

To rerun only the seed:

```bash
npm run db:seed
```

### 4. Start Ollama

If you do not already have a tool-capable model installed, pull one. For example:

```bash
ollama pull qwen3:8b
```

Make sure the model name matches `OLLAMA_MODEL` in `.env`.

On macOS, opening the Ollama application normally starts the local service. You can also start it from the terminal:

```bash
ollama serve
```

If Ollama is already running, you do not need to run `ollama serve` again.

You can verify that the service is available with:

```bash
curl http://localhost:11434/api/tags
```

### 5. Start the application

From the project root:

```bash
npm run dev --workspace @mcp-adventure/client
```

The client server automatically launches the local MCP server as a child process. You do not need to start the MCP server separately.

Open:

```text
http://localhost:3000
```

Click **Ask about The Forgotten Keep**. The request travels through the complete prototype:

```text
Browser
  → client server
  → Ollama
  → MCP client
  → MCP server
  → game engine
  → PostgreSQL
  → Ollama
  → browser
```

### Stopping the demo

Stop the client server with `Ctrl+C`.

To stop PostgreSQL while preserving its data:

```bash
npm run db:down
```

To stop PostgreSQL and delete its Docker volume:

```bash
npm run db:destroy
```

`db:destroy` permanently removes the local database data.

## Database commands

| Command | Purpose |
| --- | --- |
| `npm run db:up` | Start PostgreSQL in Docker |
| `npm run db:init` | Wait, migrate, and seed |
| `npm run db:migrate` | Apply pending SQL migrations |
| `npm run db:status` | Show applied and pending migrations |
| `npm run db:seed` | Reload the demo game |
| `npm run db:psql` | Open `psql` in the container |
| `npm run db:logs` | Follow PostgreSQL logs |
| `npm run db:down` | Stop containers; keep database data |
| `npm run db:reset` | Drop the public schema, migrate, and seed again |
| `npm run db:destroy` | Stop containers and delete the Docker volume |

`db:reset` and `db:destroy` are destructive. The migration runner records filenames and checksums in `schema_migrations`; it refuses to continue if an already-applied migration file has been edited.


