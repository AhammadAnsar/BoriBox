/**
 * Tauri IPC Bridge with Browser Fallback
 * Connects React UI to native Rust commands (print_bengali_receipt, sqlite queries)
 * when running inside Tauri desktop app, and falls back gracefully in web browsers.
 */

export interface PrintReceiptPayload {
  imageBase64: string;
  is80mm: boolean;
  transportType: 'usb' | 'network';
  targetEndpoint: string;
}

export interface PrintReceiptResult {
  success: boolean;
  bytesWritten: number;
  message: string;
}

/**
 * Checks if the app is currently running inside the Tauri native desktop wrapper
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

/**
 * Invokes the native Rust thermal printer rasterizer via Tauri IPC
 */
export async function invokeNativeThermalPrint(
  payload: PrintReceiptPayload
): Promise<PrintReceiptResult> {
  if (isTauriEnvironment()) {
    try {
      const tauriGlobal = (window as any).__TAURI__ || (window as any).__TAURI_INTERNALS__;
      const invokeFn = tauriGlobal?.core?.invoke || tauriGlobal?.invoke;
      if (typeof invokeFn === 'function') {
        const response = await invokeFn('print_bengali_receipt', {
          request: {
            image_base64: payload.imageBase64,
            is_80mm: payload.is80mm,
            transport_type: payload.transportType,
            target_endpoint: payload.targetEndpoint,
          },
        });
        return response as PrintReceiptResult;
      }
    } catch (err: any) {
      console.warn('Native Tauri print error, falling back to simulation:', err);
      return {
        success: false,
        bytesWritten: 0,
        message: `প্রিন্টার ত্রুটি: ${err.message || String(err)}`,
      };
    }
  }

  // Browser Mode fallback
  return {
    success: true,
    bytesWritten: payload.is80mm ? 4820 : 3240,
    message: 'ব্রাউজার সিমুলেশন: থার্মাল প্রিন্টারে সিগন্যাল পাঠানো হয়েছে।',
  };
}
