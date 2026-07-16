import { createHash } from 'node:crypto'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import { compareFrozenLabelSets, createAdjudication, createEventLabelDraft, frameToTimestampMs, freezeEventLabelSet, parseEventLabelSet, setEventMark, verifyFrozenLabelSetChecksum, type ForwardLungeEvent } from '../src/eval/eventLabels'

const [command, ...args] = process.argv.slice(2)
const read = async (file: string) => verifyFrozenLabelSetChecksum(parseEventLabelSet(readFileSync(file, 'utf8')))
const atomicWrite = (file: string, value: unknown) => { const temp = `${file}.recovery`; writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`); renameSync(temp, file) }
const shaFile = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')

async function main(): Promise<void> {
  if (command === 'init') {
    const [media, output, id, raterKey, fpsText, frameCountText] = args
    if (!media || !output || existsSync(output)) throw new Error('init requires MEDIA OUTPUT ID RATER FPS FRAME_COUNT; OUTPUT must not exist.')
    atomicWrite(output, createEventLabelDraft({ id, raterKey, source: { mediaFile: basename(media), sha256: shaFile(media), fps: Number(fpsText), frameCount: Number(frameCountText) } }))
  } else if (command === 'set') {
    const [file, event, frameText, missingReason] = args
    const labelSet = await read(file)
    atomicWrite(file, setEventMark(labelSet, event as ForwardLungeEvent, frameText === 'null' ? null : Number(frameText), missingReason))
  } else if (command === 'freeze') {
    const file = args[0]
    const labelSet = await read(file)
    if (labelSet.status !== 'draft') throw new Error('Only drafts can freeze; frozen records are never overwritten.')
    atomicWrite(file, await freezeEventLabelSet(labelSet))
  } else if (command === 'compare') {
    console.log(JSON.stringify(compareFrozenLabelSets(await read(args[0]), await read(args[1])), null, 2))
  } else if (command === 'time') {
    const labelSet = await read(args[0])
    console.log(JSON.stringify({ frameIndex: Number(args[1]), timestampMs: frameToTimestampMs(labelSet.source, Number(args[1])), sourceFps: labelSet.source.fps }))
  } else if (command === 'adjudicate') {
    const [left, right, output, id, raterKey] = args
    if (existsSync(output)) throw new Error('Adjudication output already exists; records are never overwritten.')
    atomicWrite(output, await createAdjudication(await read(left), await read(right), id, raterKey))
  } else throw new Error('usage: eventLabelTool <init|time|set|freeze|compare|adjudicate> ... (all navigation/actions are keyboard-only terminal commands)')
}

main().then(() => command !== 'compare' && console.log(`${command}: saved with atomic .recovery handoff`)).catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
