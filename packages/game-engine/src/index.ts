export {
  getGameInfo,
  type GameInfo,
} from "./games/get-game-info.js";

export {
  startPlaythrough,
  type StartedPlaythrough,
} from "./playthroughs/start-playthrough.js";

export {
  getCurrentEntityState,
} from "./entities/get-current-entity-state.js";

export {
  getCurrentPlacement,
  type CurrentPlacement,
} from "./entities/get-current-placement.js";

export {
  getSituation,
  type Situation,
} from "./playthroughs/get-situation.js";

export {
  getVisibleRoomContents,
  type VisibleRoomEntity,
} from "./playthroughs/get-visible-room-contents.js";

export {
  isCurrentRoomLit,
} from "./playthroughs/is-current-room-lit.js";