/**
 * MM1-B1.1 · Azure SDK-based provider transports barrel.
 *
 * 只有本目录允许 require('microsoft-cognitiveservices-speech-sdk')。
 */
export * from './sdkLoader';
export * from './azureSpeechSdkSttTransport';
export * from './azureSpeechSdkTtsTransport';
export * from './azureVoiceCatalogProvider';
