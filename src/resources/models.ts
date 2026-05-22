import type { HypersHubClient } from '../hypershub.js'
import type { Model, ModelList } from '../types/models.js'

export class Models {
  constructor(private readonly client: HypersHubClient) {}

  async list(signal?: AbortSignal): Promise<ModelList> {
    const response = await this.client._request({
      method: 'GET',
      path: '/v1/models',
      signal,
    })
    return response.json() as Promise<ModelList>
  }

  async retrieve(model: string, signal?: AbortSignal): Promise<Model> {
    const response = await this.client._request({
      method: 'GET',
      path: `/v1/models/${encodeURIComponent(model)}`,
      signal,
    })
    return response.json() as Promise<Model>
  }
}
