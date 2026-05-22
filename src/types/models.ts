export interface Model {
  id: string
  object: 'model'
  created?: number
  owned_by?: string
}

export interface ModelList {
  object: 'list'
  data: Model[]
}
