/** OCHuman annotation adapter. It never treats occlusion labels as model confidence. */

export type OCHumanVisibility = 'missing' | 'visible' | 'self-occluded' | 'other-occluded'

export interface OCHumanKeypoint {
  name: string
  x: number | null
  y: number | null
  visibility: OCHumanVisibility
}

export interface OCHumanPerson {
  maxIou: number
  keypoints: OCHumanKeypoint[]
}

export interface OCHumanImage {
  imageId: string
  fileName: string
  width: number
  height: number
  people: OCHumanPerson[]
}

export interface OCHumanAnnotationSet {
  images: OCHumanImage[]
  visibilityLabels: Record<string, number>
}

const VISIBILITY_BY_CODE: Record<number, OCHumanVisibility> = {
  0: 'missing',
  1: 'visible',
  2: 'self-occluded',
  3: 'other-occluded',
}

function finite(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${where} must be a finite number.`)
  }
  return value
}

/** Parse the native API JSON shape documented at OCHumanApi commit 958aa204. */
export function parseOCHumanAnnotations(raw: unknown): OCHumanAnnotationSet {
  if (typeof raw !== 'object' || raw === null) throw new Error('OCHuman annotations must be an object.')
  const root = raw as Record<string, unknown>
  if (!Array.isArray(root.keypoint_names) || !root.keypoint_names.every((name) => typeof name === 'string')) {
    throw new Error('OCHuman keypoint_names must be a string array.')
  }
  const names = root.keypoint_names as string[]
  if (!Array.isArray(root.images)) throw new Error('OCHuman images must be an array.')
  const visibilityLabels = (root.keypoint_visible ?? {}) as Record<string, number>
  const images = root.images.map((value, imageIndex): OCHumanImage => {
    const image = (value ?? {}) as Record<string, unknown>
    if (!Array.isArray(image.annotations)) throw new Error(`images[${imageIndex}].annotations must be an array.`)
    const people = image.annotations.flatMap((annotationValue, personIndex): OCHumanPerson[] => {
      const annotation = (annotationValue ?? {}) as Record<string, unknown>
      if (annotation.keypoints === null || annotation.keypoints === undefined) return []
      if (!Array.isArray(annotation.keypoints) || annotation.keypoints.length !== names.length * 3) {
        throw new Error(`images[${imageIndex}].annotations[${personIndex}].keypoints has the wrong length.`)
      }
      const vector = annotation.keypoints
      const keypoints = names.map((name, keypointIndex): OCHumanKeypoint => {
        const offset = keypointIndex * 3
        const code = finite(vector[offset + 2], `keypoint ${name} visibility`)
        const visibility = VISIBILITY_BY_CODE[code]
        if (!visibility) throw new Error(`Unknown OCHuman visibility code ${code}.`)
        if (visibility === 'missing') return { name, x: null, y: null, visibility }
        return {
          name,
          x: finite(vector[offset], `keypoint ${name} x`),
          y: finite(vector[offset + 1], `keypoint ${name} y`),
          visibility,
        }
      })
      return [{ maxIou: finite(annotation.max_iou, `images[${imageIndex}].annotations[${personIndex}].max_iou`), keypoints }]
    })
    return {
      imageId: String(image.image_id),
      fileName: String(image.file_name),
      width: finite(image.width, `images[${imageIndex}].width`),
      height: finite(image.height, `images[${imageIndex}].height`),
      people,
    }
  })
  return { images, visibilityLabels }
}

export function summarizeOCHuman(set: OCHumanAnnotationSet) {
  const counts: Record<OCHumanVisibility, number> = {
    missing: 0,
    visible: 0,
    'self-occluded': 0,
    'other-occluded': 0,
  }
  let people = 0
  let severeOverlapPeople = 0
  for (const image of set.images) {
    for (const person of image.people) {
      people++
      if (person.maxIou >= 0.75) severeOverlapPeople++
      for (const point of person.keypoints) counts[point.visibility]++
    }
  }
  return { images: set.images.length, people, severeOverlapPeople, keypointVisibility: counts }
}
