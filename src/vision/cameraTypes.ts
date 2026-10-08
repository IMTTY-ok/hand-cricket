export type CameraStatus = 'idle' | 'starting' | 'ready' | 'error'
export type CameraErrorCode =
  | 'unsupported'
  | 'denied'
  | 'notfound'
  | 'inuse'
  | 'disconnected'
  | 'unknown'

export interface CameraError {
  code: CameraErrorCode
  title: string
  message: string
}

export type DetectStatus = 'standby' | 'loading' | 'tracking' | 'error'
