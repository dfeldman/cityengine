/**
 * The words a contestant sees: the frozen system prompt (prompt/system-v<N>.md) and one user turn per building.
 *
 * The version is part of every result, because the earlier experiment found the brief worth about as much as the
 * model (MODELING_IMPROVEMENT_1.md, conclusion 5) — a change to the prompt is a new benchmark, not a fix. Change
 * a prompt by adding system-v2.md, never by editing v1.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { HERE, type Building } from './buildings.ts'
import type { Plan } from './plan.ts'

export const PROMPT_VERSION = 'v1'

export function systemPrompt(version = PROMPT_VERSION): string {
  // the build prompts are system-v<N>.md; other prompts (plan-v1.md) are named outright
  return readFileSync(resolve(HERE, 'prompt', version.startsWith('v') ? `system-${version}.md` : `${version}.md`), 'utf8')
}

/** the text of the user turn; the photographs go before it, captioned in the same order */
export function userText(b: Building, plan: Plan, photoCount: number, textOnly: boolean): string {
  const lines = [
    `Building: ${b.name}, ${b.city} (${b.type}).`,
    `The front (−z) is ${b.frontIs}.`,
    `Footprint: ${plan.size[0]} m along x by ${plan.size[1]} m along z, centred on the origin.`,
    `Outline${b.rect ? ' (a measured rectangle)' : plan.hull ? ' (approximate: the hull of its OpenStreetMap parts)' : ' (from OpenStreetMap)'}, [x, z] in metres, going round:`,
    JSON.stringify(plan.outline),
    `Height: the highest point is ${b.height} m above the ground.`,
  ]
  if (b.scope) lines.push(b.scope)
  if (textOnly) lines.push('', 'No photographs are attached: model it from what you know of the building, or bail out if you do not know it.')
  else {
    lines.push('', `${photoCount} photograph${photoCount === 1 ? '' : 's'} attached, in order:`)
    b.photos.slice(0, photoCount).forEach((p, i) => lines.push(`  ${i + 1}. ${p.view}`))
  }
  lines.push('', 'Reply with the JSON object only.')
  return lines.join('\n')
}

/**
 * The feedback round: the model's first valid answer rendered from the judging views. Versioned with the prompt
 * family: a change here is a new benchmark too.
 */
export function feedbackText(): string {
  return [
    'Above is your answer as the program builds it: from the front-right, from the back-left, and from straight above (the red line is the footprint; the front is at the bottom of that view). The renders are plain coloured blocks with no texture.',
    'Compare them with the photographs, which come first in this conversation. In "notes", list the three biggest differences from the real building: a signature feature missing or too small to see, wrong proportions (a tower too short, a dome too small), something in the wrong place, a court filled in, windows on walls that have none, wrong colours.',
    'Then reply with the whole corrected JSON object, fixing those differences. Keep what is already right. Reply with the JSON object only.',
  ].join('\n\n')
}

/** the planning call's decisions, handed to the build call: build these, with these parts, first */
export function planText(plan: unknown): string {
  return [
    'A first look at the photographs produced this PLAN. Build it: every component must appear, made with the part it names, at its position and size, with its settings (the fields map straight onto the part\'s fields). Add smaller detail only after every component is there, and fix a component only if the photographs clearly contradict it.',
    JSON.stringify(plan, null, 1),
  ].join('\n')
}

/** the message that sends a broken answer back, for runs allowed more than one attempt */
export function repairText(errors: string[]): string {
  const shown = errors.slice(0, 25)
  return [
    'The program could not build your answer. Fix these problems and reply with the whole corrected JSON object:',
    ...shown.map((e) => `- ${e}`),
    errors.length > shown.length ? `- … and ${errors.length - shown.length} more` : '',
  ].filter(Boolean).join('\n')
}
