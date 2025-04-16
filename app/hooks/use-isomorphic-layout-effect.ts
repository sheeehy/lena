"use client"

import { useEffect, useLayoutEffect } from "react"

// Use useLayoutEffect in the browser, useEffect on the server
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect
