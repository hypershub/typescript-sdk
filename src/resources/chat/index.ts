import type { HypersHubClient } from '../../hypershub.js'
import { Completions } from './completions.js'

export class Chat {
  readonly completions: Completions

  constructor(client: HypersHubClient) {
    this.completions = new Completions(client)
  }
}
