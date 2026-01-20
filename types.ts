
export interface CameraParams {
  azimuth: number;
  elevation: number;
  distance: number;
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  resultUrl: string | null;
}

export enum CameraAction {
  AZIMUTH = 'azimuth',
  ELEVATION = 'elevation',
  DISTANCE = 'distance'
}
