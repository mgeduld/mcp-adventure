import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../db.js";
import { createPlaythrough } from "./playthroughs.js";
import { getEntityStateOverride } from "./entity-state.js";

const gameId = "10000000-0000-0000-0000-000000000001";
const throneRoomId = "20000000-0000-0000-0000-000000000001";
const chestId = "30000000-0000-0000-0000-000000000002";
const lanternId = "30000000-0000-0000-0000-000000000003";

describe("getEntityStateOverride integration", () => {
  afterAll(async () => {
    await db.end();
  });

  it("returns null when no override exists", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const playthrough = await createPlaythrough(
        {
          gameId,
          currentRoomId: throneRoomId,
          resumeTokenHash: "entity-state-no-override-test",
        },
        client,
      );

      const state = await getEntityStateOverride(
        playthrough.id,
        chestId,
        client,
      );

      expect(state).toBeNull();
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("reads only the requested playthrough and entity override", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const first = await createPlaythrough(
        {
          gameId,
          currentRoomId: throneRoomId,
          resumeTokenHash: "entity-state-first-test",
        },
        client,
      );

      const second = await createPlaythrough(
        {
          gameId,
          currentRoomId: throneRoomId,
          resumeTokenHash: "entity-state-second-test",
        },
        client,
      );

      await client.query(
        `
          insert into entity_state (
            game_id,
            playthrough_id,
            entity_id,
            state
          )
          values
            ($1, $2, $3, $4::jsonb),
            ($1, $5, $3, $6::jsonb),
            ($1, $2, $7, $8::jsonb)
        `,
        [
          gameId,
          first.id,
          chestId,
          JSON.stringify({ open: true }),
          second.id,
          JSON.stringify({ open: false, locked: true }),
          lanternId,
          JSON.stringify({ on: true }),
        ],
      );

      expect(
        await getEntityStateOverride(first.id, chestId, client),
      ).toEqual({ open: true });

      expect(
        await getEntityStateOverride(second.id, chestId, client),
      ).toEqual({ open: false, locked: true });

      expect(
        await getEntityStateOverride(first.id, lanternId, client),
      ).toEqual({ on: true });

      expect(
        await getEntityStateOverride(second.id, lanternId, client),
      ).toBeNull();
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("returns an empty object when the override row is empty", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const playthrough = await createPlaythrough(
        {
          gameId,
          currentRoomId: throneRoomId,
          resumeTokenHash: "entity-state-empty-test",
        },
        client,
      );

      await client.query(
        `
          insert into entity_state (
            game_id,
            playthrough_id,
            entity_id,
            state
          )
          values ($1, $2, $3, $4::jsonb)
        `,
        [gameId, playthrough.id, chestId, JSON.stringify({})],
      );

      expect(
        await getEntityStateOverride(
          playthrough.id,
          chestId,
          client,
        ),
      ).toEqual({});
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});