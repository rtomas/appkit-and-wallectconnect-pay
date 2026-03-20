"use client";

import { useState, useRef, useCallback } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { parsePaymentLink } from "@/lib/parseLink";
import { QRScanner } from "@/components/QRScanner";

type Step = "input" | "collect" | "signing" | "done";
type InputMode = "paste" | "scan";

interface CollectField {
  type: string;
  id: string;
  name: string;
  required: boolean;
}

function decodeHexAction(hex: string) {
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
  );
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

export function PayFlow() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [step, setStep] = useState<Step>("input");
  const [inputMode, setInputMode] = useState<InputMode>("scan");
  const [linkInput, setLinkInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{
    merchant: string;
    amount: string;
    unit: string;
  } | null>(null);

  // Collect data state
  const [collectFields, setCollectFields] = useState<CollectField[]>([]);
  const [collectValues, setCollectValues] = useState<Record<string, string>>(
    {}
  );
  const pendingPayRef = useRef<{
    paymentId: string;
    optionId: string;
    actions: any[];
    collectData: any;
  } | null>(null);

  const processPaymentLink = useCallback(
    async (input: string) => {
      setError(null);
      const parsed = parsePaymentLink(input);
      if (!parsed) {
        setError("Invalid payment link or ID");
        return;
      }

      const paymentId = parsed.paymentId;
      setLoading(true);
      setStep("signing");

      try {
        if (!address) throw new Error("No wallet connected");

        const chainIds = [1, 8453, 10, 137, 42161];
        const accounts = chainIds.map((id) => `eip155:${id}:${address}`);

        // Fetch payment options
        const optionsRes = await fetch("/api/pay/options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, accounts }),
        });
        const optionsData = await optionsRes.json();
        if (!optionsRes.ok)
          throw new Error(optionsData.error || "Failed to get options");

        if (optionsData.info) {
          setPaymentInfo({
            merchant: optionsData.info.merchant?.name || "Unknown",
            amount: optionsData.info.amount?.value || "",
            unit: optionsData.info.amount?.unit || "",
          });
        }

        const option = optionsData.options?.[0];
        if (!option) throw new Error("No payment options available");

        // Decode actions from hex
        const resolvedActions = option.actions.map((action: any) => {
          if (action.type === "build" && action.data?.data) {
            return decodeHexAction(action.data.data);
          }
          if (action.type === "walletRpc" && action.data) {
            return typeof action.data === "string"
              ? decodeHexAction(action.data)
              : action.data;
          }
          return action;
        });

        // Check if collectData is required
        if (option.collectData?.fields?.length) {
          pendingPayRef.current = {
            paymentId,
            optionId: option.id,
            actions: resolvedActions,
            collectData: option.collectData,
          };
          setCollectFields(option.collectData.fields);
          setCollectValues({});
          setStep("collect");
          setLoading(false);
          return;
        }

        await signAndConfirm(paymentId, option.id, resolvedActions, null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Payment failed");
        setStep("input");
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [address]
  );

  function handleSubmitLink() {
    processPaymentLink(linkInput);
  }

  function handleScan(data: string) {
    processPaymentLink(data);
  }

  async function signAndConfirm(
    paymentId: string,
    optionId: string,
    actions: any[],
    collectedData: Record<string, any> | null
  ) {
    setStep("signing");
    setLoading(true);
    setError(null);

    try {
      const results: Array<{ type: "walletRpc"; data: string[] }> = [];

      for (const action of actions) {
        const paramsRaw = action.params;
        if (!paramsRaw) throw new Error("Action missing params");

        const params =
          typeof paramsRaw === "string" ? JSON.parse(paramsRaw) : paramsRaw;
        const typedData =
          typeof params[1] === "string" ? JSON.parse(params[1]) : params[1];

        // Use wagmi's signTypedData via AppKit's wallet
        const signature = await signTypedDataAsync({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        });

        results.push({ type: "walletRpc", data: [signature] });
      }

      // Confirm payment
      const confirmRes = await fetch("/api/pay/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, optionId, results, collectedData }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error);

      // Poll until final
      let current = confirmData;
      while (!current.isFinal) {
        await new Promise((r) => setTimeout(r, current.pollInMs || 2000));
        const pollRes = await fetch("/api/pay/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, optionId, results, collectedData }),
        });
        current = await pollRes.json();
        if (!pollRes.ok) throw new Error(current.error);
      }

      setStatus(current.status);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setStep("input");
    } finally {
      setLoading(false);
    }
  }

  async function handleCollectSubmit() {
    if (!pendingPayRef.current) return;
    const { paymentId, optionId, actions, collectData } =
      pendingPayRef.current;

    const fields = collectData.fields.map((f: any) => ({
      ...f,
      value: collectValues[f.id] || "",
    }));
    fields.push({
      type: "boolean",
      id: "tosConfirmed",
      name: "Terms of Service",
      required: true,
      value: "true",
    });

    await signAndConfirm(paymentId, optionId, actions, {
      ...collectData,
      fields,
    });
  }

  function reset() {
    setStep("input");
    setInputMode("scan");
    setLinkInput("");
    setStatus(null);
    setError(null);
    setPaymentInfo(null);
    setCollectFields([]);
    setCollectValues({});
    pendingPayRef.current = null;
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {step === "input" && (
        <div className="space-y-3">
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            <button
              onClick={() => setInputMode("scan")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                inputMode === "scan"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Scan QR
            </button>
            <button
              onClick={() => setInputMode("paste")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                inputMode === "paste"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Paste Link
            </button>
          </div>

          {inputMode === "scan" ? (
            <div className="space-y-2">
              <QRScanner
                onScan={handleScan}
                onError={(err) => setError(err)}
              />
              <p className="text-xs text-gray-500 text-center">
                Point camera at a WalletConnect Pay QR code
              </p>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Paste WalletConnect Pay link or payment ID"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitLink()}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSubmitLink}
                disabled={!linkInput.trim() || loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {loading ? "Processing..." : "Pay"}
              </button>
            </>
          )}
        </div>
      )}

      {step === "collect" && (
        <div className="space-y-3 bg-gray-800 rounded-lg p-4">
          <p className="font-medium">Verification required</p>
          {collectFields.map((field) => (
            <div key={field.id}>
              <label className="text-sm text-gray-400">
                {field.name} {field.required && "*"}
              </label>
              <input
                type={field.type === "date" ? "date" : "text"}
                value={collectValues[field.id] || ""}
                onChange={(e) =>
                  setCollectValues((v) => ({
                    ...v,
                    [field.id]: e.target.value,
                  }))
                }
                className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button
            onClick={handleCollectSubmit}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {step === "signing" && (
        <div className="flex flex-col items-center py-8 space-y-3">
          <div className="h-8 w-8 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
          <p className="text-gray-400">Processing payment...</p>
          {paymentInfo && (
            <p className="text-sm text-gray-500">
              {paymentInfo.amount} {paymentInfo.unit} to {paymentInfo.merchant}
            </p>
          )}
        </div>
      )}

      {step === "done" && (
        <div className="text-center space-y-3">
          <p className="text-lg font-medium text-green-400">
            {status === "succeeded" ? "Payment Complete!" : `Payment ${status}`}
          </p>
          {paymentInfo && (
            <p className="text-sm text-gray-400">
              {paymentInfo.amount} {paymentInfo.unit} to {paymentInfo.merchant}
            </p>
          )}
          <button
            onClick={reset}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            New Payment
          </button>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
