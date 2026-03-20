"use client";

import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { PayFlow } from "@/components/PayFlow";
import { useAppKitWallet } from '@reown/appkit-wallet-button/react'



export default function Home() {
  const { isConnected, address } = useAppKitAccount();
  const [showPay, setShowPay] = useState(false);
  const { data, error, isPending, isSuccess, isError, connect } = useAppKitWallet({
    namespace: 'eip155', // Use 'solana' or 'bip122' for other chains
    onError: err => {
      console.error('Connection error:', err)
    },
    onSuccess: data => {
      console.log('Connected successfully:', data)
    }
  })

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="flex flex-col items-center gap-3">
        <svg width="97" height="30" viewBox="0 0 97 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto opacity-90">
          <path d="M44.418 23.6988V0.0433501H54.9417C59.4184 0.0433501 62.6591 2.9158 62.6591 7.57931C62.6591 12.1752 59.4184 15.0815 54.9417 15.0815H48.4604V23.6988H44.418ZM48.4604 11.7021H54.2401C56.8794 11.7021 58.483 10.08 58.483 7.57931C58.483 5.011 56.8794 3.42271 54.2401 3.42271H48.4604V11.7021Z" fill="white"/>
          <path d="M68.7783 24.1381C65.4709 24.1381 63.3327 22.1781 63.3327 19.2043C63.3327 15.2167 66.7404 14.2704 69.5801 13.7973L72.8207 13.3242C74.0569 13.1215 74.3576 12.4794 74.3576 11.7021C74.3576 10.3166 73.4221 9.2014 71.3508 9.2014C69.3463 9.2014 68.0433 10.1476 67.8095 12.0063H63.9341C64.4018 8.22139 67.3751 6.22757 71.3842 6.22757C75.9277 6.22757 78.1995 8.42415 78.1995 12.547V19.8464C78.1995 20.3195 78.5336 20.6236 79.0013 20.6236H79.9034V23.6988H77.4311C75.7273 23.6988 74.6582 22.854 74.6582 21.536V21.1643C73.1882 23.3271 70.9833 24.1381 68.7783 24.1381ZM67.2749 18.7988C67.2749 20.3195 68.3774 21.1643 70.0478 21.1643C72.7205 21.1643 74.3576 18.9339 74.3576 16.1291V15.2167C73.8564 15.487 73.3887 15.5884 72.8207 15.7236L70.3151 16.1629C68.2104 16.5346 67.2749 17.3456 67.2749 18.7988Z" fill="white"/>
          <path d="M80.9847 29.3086V26.3009H84.1251C85.094 26.3009 85.5951 26.0982 85.9626 25.1858L86.6308 23.3609L79.7486 6.66689H83.8244L88.4682 18.596L92.7111 6.66689H96.7536L89.27 26.4361C88.3346 28.903 86.8312 29.3086 84.8601 29.3086H80.9847Z" fill="white"/>
          <path d="M28.001 9.09766L31.3634 5.72206C23.764 -1.90735 14.3213 -1.90735 6.72194 5.72206L10.0843 9.09766C15.8639 3.29523 22.2253 3.29523 28.0049 9.09766H28.001Z" fill="#3b82f6"/>
          <path d="M26.883 16.9626L19.0414 9.09015L11.1999 16.9626L3.35842 9.09015L0 12.4618L11.1999 23.7099L19.0414 15.8374L26.883 23.7099L38.0829 12.4618L34.7245 9.09015L26.883 16.9626Z" fill="#3b82f6"/>
        </svg>
        <p className="text-sm text-gray-500 tracking-wide uppercase">Powered by AppKit</p>
      </div>
      {!isConnected && (
        <>
      <button
        onClick={() => connect('google')}
        className="flex items-center gap-3 px-6 py-3 bg-white text-gray-700 rounded-lg font-medium text-lg shadow-md hover:shadow-lg hover:bg-gray-50 transition-all border border-gray-200"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
      </>
      )}

      {isConnected && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <p className="text-sm text-gray-400">
          <appkit-button  />
          </p>

          {!showPay ? (
            <button
              onClick={() => setShowPay(true)}
              className="inline-flex items-center justify-center w-full h-12 px-6 bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white rounded-xl font-medium text-base transition-colors"
            >
              <svg width="97" height="30" viewBox="0 0 97 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-auto">
                <path d="M44.418 23.6988V0.0433501H54.9417C59.4184 0.0433501 62.6591 2.9158 62.6591 7.57931C62.6591 12.1752 59.4184 15.0815 54.9417 15.0815H48.4604V23.6988H44.418ZM48.4604 11.7021H54.2401C56.8794 11.7021 58.483 10.08 58.483 7.57931C58.483 5.011 56.8794 3.42271 54.2401 3.42271H48.4604V11.7021Z" fill="currentColor"/>
                <path d="M68.7783 24.1381C65.4709 24.1381 63.3327 22.1781 63.3327 19.2043C63.3327 15.2167 66.7404 14.2704 69.5801 13.7973L72.8207 13.3242C74.0569 13.1215 74.3576 12.4794 74.3576 11.7021C74.3576 10.3166 73.4221 9.2014 71.3508 9.2014C69.3463 9.2014 68.0433 10.1476 67.8095 12.0063H63.9341C64.4018 8.22139 67.3751 6.22757 71.3842 6.22757C75.9277 6.22757 78.1995 8.42415 78.1995 12.547V19.8464C78.1995 20.3195 78.5336 20.6236 79.0013 20.6236H79.9034V23.6988H77.4311C75.7273 23.6988 74.6582 22.854 74.6582 21.536V21.1643C73.1882 23.3271 70.9833 24.1381 68.7783 24.1381ZM67.2749 18.7988C67.2749 20.3195 68.3774 21.1643 70.0478 21.1643C72.7205 21.1643 74.3576 18.9339 74.3576 16.1291V15.2167C73.8564 15.487 73.3887 15.5884 72.8207 15.7236L70.3151 16.1629C68.2104 16.5346 67.2749 17.3456 67.2749 18.7988Z" fill="currentColor"/>
                <path d="M80.9847 29.3086V26.3009H84.1251C85.094 26.3009 85.5951 26.0982 85.9626 25.1858L86.6308 23.3609L79.7486 6.66689H83.8244L88.4682 18.596L92.7111 6.66689H96.7536L89.27 26.4361C88.3346 28.903 86.8312 29.3086 84.8601 29.3086H80.9847Z" fill="currentColor"/>
                <path d="M28.001 9.09766L31.3634 5.72206C23.764 -1.90735 14.3213 -1.90735 6.72194 5.72206L10.0843 9.09766C15.8639 3.29523 22.2253 3.29523 28.0049 9.09766H28.001Z" fill="currentColor"/>
                <path d="M26.883 16.9626L19.0414 9.09015L11.1999 16.9626L3.35842 9.09015L0 12.4618L11.1999 23.7099L19.0414 15.8374L26.883 23.7099L38.0829 12.4618L34.7245 9.09015L26.883 16.9626Z" fill="currentColor"/>
              </svg>
            </button>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Pay</h2>
                <button
                  onClick={() => setShowPay(false)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
              <PayFlow />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
