package expo.modules.truemetricssdk

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL
import io.truemetrics.truemetricssdk.ErrorCode
import io.truemetrics.truemetricssdk.StatusListener
import io.truemetrics.truemetricssdk.TruemetricsSDK
import io.truemetrics.truemetricssdk.config.Config
import io.truemetrics.truemetricssdk.engine.state.State
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import android.content.Context
import expo.modules.kotlin.functions.Queues

class ExpoTruemetricsSdkModule : Module() {

  val context: Context
    get() = appContext.reactContext ?: throw CodedException("React context lost")

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoTruemetricsSdk')` in JavaScript.
    Name("ExpoTruemetricsSdk")

    // Defines event names that the module can send to JavaScript.
    Events("onSdkStateChanged", "onSdkError", "onSdkPermissionNeeded")

    // Initialize SDK
    AsyncFunction("initialize") { config: Map<String, Any>, promise: Promise ->
        println("initialize konj")
        TruemetricsSDK.setStatusListener(object : StatusListener {
            override fun onStateChange(status: State) {
                sendEvent("onSdkStateChanged", mapOf(
                  "value" to status
                ))
            }

            override fun onError(errorCode: ErrorCode, message: String?) {
                sendEvent("onSdkError", mapOf(
                  "value" to "$errorCode: $message"
                ))
            }

            override fun askPermissions(permissions: List<String>) {
                sendEvent("onSdkPermissionNeeded", mapOf(
                  "value" to "$permissions"
                ))
            }
        })

        try {
            // Convert the JS config map to SDK Config object
            val sdkConfig = Config(
                apiKey = config["apiKey"] as String,
                debug = config["debug"] as Boolean,
            )
            val result = TruemetricsSDK.initialize(context, sdkConfig)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject(CodedException(e.message ?: "Initialization failed"))
        }
    }.runOnQueue(Queues.MAIN)

    // Check if SDK is initialized
    Function("isInitialized") {
        TruemetricsSDK.isInitialized()
    }

    Function("isRecordingInProgress") {
       TruemetricsSDK.isRecordingInProgress()
    }

    AsyncFunction("deinitialize") { promise: Promise ->
        try {
            TruemetricsSDK.deinitialize()
            sendEvent("onSdkError", mapOf("value" to ""))
            sendEvent("onSdkPermissionNeeded", mapOf("value" to ""))
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject(CodedException(e.message ?: "Failed to deinitialize"))
        }
    }

    // Log metadata
    AsyncFunction("logMetadata") { payload: Map<String, String>, promise: Promise ->
        try {
            TruemetricsSDK.logMetadata(payload)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject(CodedException(e.message ?: "Failed to log metadata"))
        }
    }

    // Start recording
    AsyncFunction("startRecording") { promise: Promise ->
        try {
            TruemetricsSDK.startRecording()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject(CodedException(e.message ?: "Failed to start recording"))
        }
    }

    // Stop recording
    AsyncFunction("stopRecording") { promise: Promise ->
        try {
            TruemetricsSDK.stopRecording()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject(CodedException(e.message ?: "Failed to stop recording"))
        }
    }
  }
}
