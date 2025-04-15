"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ApiCheck() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const checkApi = async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/memories");
      const text = await response.text();

      if (response.ok) {
        try {
          // Try to parse as JSON to make sure it's valid
          JSON.parse(text);
          setStatus("success");
          setMessage("API endpoint is working correctly");
        } catch (e) {
          setStatus("error");
          setMessage(`API returned invalid JSON: ${text.substring(0, 100)}${text.length > 100 ? "..." : ""}`);
        }
      } else {
        setStatus("error");
        setMessage(`API returned status ${response.status}: ${text.substring(0, 100)}${text.length > 100 ? "..." : ""}`);
      }
    } catch (error) {
      setStatus("error");
      setMessage(`Failed to connect to API: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    checkApi();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 text-zinc-300">
      {status === "loading" ? (
        <Alert className="bg-yellow-900/20 border-yellow-800">
          <AlertTitle>Checking API...</AlertTitle>
          <AlertDescription>Verifying connection to the memories API</AlertDescription>
        </Alert>
      ) : status === "success" ? (
        <Alert className="bg-green-900/20 border-green-800">
          <AlertTitle>API Connected</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-red-900/20 border-red-800">
          <AlertTitle>API Error</AlertTitle>
          <AlertDescription className="text-xs">{message}</AlertDescription>
          <Button size="sm" onClick={checkApi} className="mt-2">
            Retry
          </Button>
        </Alert>
      )}
    </div>
  );
}
