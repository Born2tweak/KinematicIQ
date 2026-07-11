import { describe, expect, it } from 'vitest'
import { parseOCHumanAnnotations, summarizeOCHuman } from './ochumanAdapter'

const fixture = {
  keypoint_names: ['nose', 'left_hip'],
  keypoint_visible: { missing: 0, vis: 1, self_occluded: 2, others_occluded: 3 },
  images: [{
    image_id: 'img-1',
    file_name: 'one.jpg',
    width: 640,
    height: 480,
    annotations: [
      { max_iou: 0.8, keypoints: [10, 20, 1, 30, 40, 3] },
      { max_iou: 0.6, keypoints: null },
    ],
  }],
}

describe('OCHuman adapter', () => {
  it('preserves visible and occluded annotation states without inventing confidence', () => {
    const set = parseOCHumanAnnotations(fixture)
    expect(set.images[0].people[0].keypoints).toEqual([
      { name: 'nose', x: 10, y: 20, visibility: 'visible' },
      { name: 'left_hip', x: 30, y: 40, visibility: 'other-occluded' },
    ])
  })

  it('summarizes only people with keypoint annotations', () => {
    expect(summarizeOCHuman(parseOCHumanAnnotations(fixture))).toEqual({
      images: 1,
      people: 1,
      severeOverlapPeople: 1,
      keypointVisibility: { missing: 0, visible: 1, 'self-occluded': 0, 'other-occluded': 1 },
    })
  })

  it('rejects malformed keypoint vectors and unknown visibility codes', () => {
    const malformed = structuredClone(fixture)
    malformed.images[0].annotations[0].keypoints = [1, 2, 1]
    expect(() => parseOCHumanAnnotations(malformed)).toThrow(/wrong length/)
    const unknown = structuredClone(fixture)
    unknown.images[0].annotations[0].keypoints = [10, 20, 9, 30, 40, 3]
    expect(() => parseOCHumanAnnotations(unknown)).toThrow(/Unknown/)
  })
})

