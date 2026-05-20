import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { PoseFrame, NormalizedLandmark, WorldLandmark, CRITICAL_LANDMARKS } from './types'

class PoseEngine {
  private poseLandmarker: PoseLandmarker | null = null
  private isInitializing: boolean = false
  private isLoaded: boolean = false

  async initialize(): Promise<void> {
    if (this.isLoaded) return
    if (this.isInitializing) return
    
    this.isInitializing = true

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      )

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      })

      this.isLoaded = true
    } catch (error) {
      console.error('Failed to initialize PoseLandmarker:', error)
      this.isInitializing = false
      throw error
    } finally {
      this.isInitializing = false
    }
  }

  getReadyState(): boolean {
    return this.isLoaded
  }

  detect(videoElement: HTMLVideoElement, timestamp: number, frameIndex: number): PoseFrame | null {
    if (!this.poseLandmarker || !this.isLoaded) {
      return null
    }

    try {
      const results = this.poseLandmarker.detectForVideo(videoElement, timestamp)
      
      if (!results.landmarks || results.landmarks.length === 0) {
        return null
      }

      const rawLandmarks = results.landmarks[0]
      const rawWorldLandmarks = results.worldLandmarks[0]

      // Format landmarks to NormalizedLandmark[]
      const landmarks: NormalizedLandmark[] = rawLandmarks.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility ?? 0,
      }))

      // Format world landmarks to WorldLandmark[]
      const worldLandmarks: WorldLandmark[] = rawWorldLandmarks.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility ?? 0,
      }))

      // Calculate confidence as the average visibility of critical landmarks
      let criticalVisibilitySum = 0
      CRITICAL_LANDMARKS.forEach((index) => {
        if (landmarks[index]) {
          criticalVisibilitySum += landmarks[index].visibility
        }
      })
      const poseConfidence = criticalVisibilitySum / CRITICAL_LANDMARKS.length

      return {
        timestamp,
        frameIndex,
        landmarks,
        worldLandmarks,
        poseConfidence,
      }
    } catch (error) {
      console.error('Error running pose landmarker on video frame:', error)
      return null
    }
  }
}

export const poseEngine = new PoseEngine()
