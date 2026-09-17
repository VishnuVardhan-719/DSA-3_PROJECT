import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

export interface ResourceState<T> {
  data?: T
  loading: boolean
  error?: Error
  retry: () => void
  reload: () => Promise<T | undefined>
  setData: React.Dispatch<React.SetStateAction<T | undefined>>
}

export function useResource<T>(loader: (signal: AbortSignal) => Promise<T>, dependencies: DependencyList = []): ResourceState<T> {
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error>()
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(async () => {
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)
    try {
      const result = await loaderRef.current(controller.signal)
      setData(result)
      return result
    } catch (reason) {
      if ((reason as Error).name !== 'AbortError') setError(reason instanceof Error ? reason : new Error('Unable to load data'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)
    loaderRef.current(controller.signal).then(setData).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason : new Error('Unable to load data'))
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  // The caller controls reload boundaries through the explicit dependency list.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, attempt])

  return { data, loading, error, retry: () => setAttempt((value) => value + 1), reload, setData }
}
