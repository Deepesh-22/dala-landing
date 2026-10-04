import { evaluateScene } from './timeline.js';

/**
 * Centralized WebGL scene state.
 * Updated once per scroll tick from the master timeline.
 * All particle / camera systems READ from here — no scattered scroll logic.
 */
export const sceneState = evaluateScene(0);

/** Apply new page progress (0→1) into sceneState in place */
export function updateSceneFromProgress(progress) {
  const next = evaluateScene(progress);
  Object.assign(sceneState, next);
  return sceneState;
}

/** Back-compat alias used by older imports */
export const scrollStore = sceneState;
