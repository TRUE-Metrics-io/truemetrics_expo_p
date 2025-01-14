import type { EmitterSubscription } from 'react-native';
import { requireNativeModule } from 'expo';

interface ExpoTruemetricsSdkInterface {
  deinitialize(): void;
  initialize(arg0: { apiKey: string; debug: boolean; }): void;
  stopRecording(): void;
  startRecording(): void;
  isRecordingInProgress(): boolean;
  isInitialized(): boolean;
  logMetadata(arg0: Record<string, string>): void;
  addListener(eventName: string, listener: (event: any) => void): EmitterSubscription;
  removeAllListeners(eventName: string): void;
}

class ExpoTruemetricsSdkClass {
  private nativeModule: ExpoTruemetricsSdkInterface;

  constructor() {
    this.nativeModule = requireNativeModule<ExpoTruemetricsSdkInterface>('ExpoTruemetricsSdk');
  }

  addListener(eventName: string, listener: (event: any) => void): EmitterSubscription {
    return this.nativeModule.addListener(eventName, listener);
  }

  removeAllListeners(eventName: string): void {
    this.nativeModule.removeAllListeners(eventName);
  }

  deinitialize(): void {
    return this.nativeModule.deinitialize();
  }

  initialize(config: { apiKey: string; debug: boolean; }): void {
    return this.nativeModule.initialize(config);
  }

  stopRecording(): void {
    return this.nativeModule.stopRecording();
  }

  startRecording(): void {
    return this.nativeModule.startRecording();
  }

  isRecordingInProgress(): boolean {
    return this.nativeModule.isRecordingInProgress();
  }

  isInitialized(): boolean {
    return this.nativeModule.isInitialized();
  }

  logMetadata(metadata: Record<string, string>): void {
    return this.nativeModule.logMetadata(metadata);
  }
}

export const ExpoTruemetricsSdk = new ExpoTruemetricsSdkClass();