import { useMemo } from 'react'

type ClientKPIDash = {
  counts: {
    tasks: { total: number; done: number }
    media: number
    strategies: number
    brandings: number
  }
}

export function useClientKPI(dash: ClientKPIDash) {
  return useMemo(
    () => ({
      activeTasks:
        (dash?.counts.tasks.total ?? 0) - (dash?.counts.tasks.done ?? 0),
      completedTasks: dash?.counts.tasks.done ?? 0,
      media: dash?.counts.media ?? 0,
      strategies: dash?.counts.strategies ?? 0,
      brandings: dash?.counts.brandings ?? 0,
      strategiesDescription:
        (dash?.counts.strategies ?? 0) === 0
          ? 'Nenhuma estratégia cadastrada'
          : `${dash.counts.strategies} plano${dash.counts.strategies === 1 ? '' : 's'} ativo${dash.counts.strategies === 1 ? '' : 's'}`,
    }),
    [dash]
  )
}
