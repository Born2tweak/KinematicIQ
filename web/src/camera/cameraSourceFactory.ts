/**
 * Camera source factory — turns a source selection (cameraSourceSelection)
 * into a live CameraSource instance. The screen never reads query params or
 * env flags itself; policy stays in cameraSourceSelection, wiring stays here.
 */
import type { CameraSource } from './cameraSource'
import {
  defaultSelectionEnv,
  selectCameraSource,
  type CameraFixtureId,
  type CameraSourceSelectionEnv,
} from './cameraSourceSelection'
import { createRealCameraSource } from './sources/realCameraSource'
import { createPoseTapeCameraSource } from './sources/poseTapeCameraSource'
import {
  CLEAN_SQUAT_LOOP_TO_FRAME,
  buildCleanSquatPoseTape,
} from './fixtures/cleanSquatPoseTape'
import { buildMissingFeetPoseTape } from './fixtures/missingFeetPoseTape'

function createFixtureSource(fixture: CameraFixtureId): CameraSource {
  switch (fixture) {
    case 'clean-squat':
      // Wrap past the calibration preroll so reps repeat forever without
      // long standing stretches that would arm auto-finish.
      return createPoseTapeCameraSource(buildCleanSquatPoseTape(), fixture, {
        loop: true,
        loopToFrame: CLEAN_SQUAT_LOOP_TO_FRAME,
      })
    case 'missing-feet':
      return createPoseTapeCameraSource(buildMissingFeetPoseTape(), fixture, {
        loop: true,
      })
  }
}

export function createCameraSource(
  search: string,
  env: CameraSourceSelectionEnv = defaultSelectionEnv(),
): CameraSource {
  const selection = selectCameraSource(search, env)
  if (selection.kind === 'pose-tape' && selection.fixture) {
    return createFixtureSource(selection.fixture)
  }
  return createRealCameraSource()
}
