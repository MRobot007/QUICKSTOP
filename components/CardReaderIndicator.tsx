'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Power, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CardReaderIndicatorProps {
    onConnectionChange?: (connected: boolean) => void
}

export default function CardReaderIndicator({ onConnectionChange }: CardReaderIndicatorProps) {
    const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
    const [error, setError] = useState<string | null>(null)

    const checkConnection = useCallback(async () => {
        if (typeof window === 'undefined') return

        try {
            // Check HID devices
            if ('hid' in navigator) {
                const devices = await (navigator as any).hid.getDevices()
                if (devices.length > 0) {
                    setStatus('connected')
                    onConnectionChange?.(true)
                    return true
                }
            }

            // Check Serial devices
            if ('serial' in navigator) {
                const ports = await (navigator as any).serial.getPorts()
                if (ports.length > 0) {
                    setStatus('connected')
                    onConnectionChange?.(true)
                    return true
                }
            }

            setStatus('disconnected')
            onConnectionChange?.(false)
            return false
        } catch (err) {
            console.error('Error checking hardware connection:', err)
            return false
        }
    }, [onConnectionChange])

    useEffect(() => {
        checkConnection()

        // Listen for connection events
        const handleConnect = () => {
            console.log('Hardware connected')
            setStatus('connected')
            onConnectionChange?.(true)
        }

        const handleDisconnect = () => {
            console.log('Hardware disconnected')
            setStatus('disconnected')
            onConnectionChange?.(false)
        }

        if ('hid' in navigator) {
            (navigator as any).hid.addEventListener('connect', handleConnect);
            (navigator as any).hid.addEventListener('disconnect', handleDisconnect);
        }

        if ('serial' in navigator) {
            (navigator as any).serial.addEventListener('connect', handleConnect);
            (navigator as any).serial.addEventListener('disconnect', handleDisconnect);
        }

        return () => {
            if ('hid' in navigator) {
                (navigator as any).hid.removeEventListener('connect', handleConnect);
                (navigator as any).hid.removeEventListener('disconnect', handleDisconnect);
            }
            if ('serial' in navigator) {
                (navigator as any).serial.removeEventListener('connect', handleConnect);
                (navigator as any).serial.removeEventListener('disconnect', handleDisconnect);
            }
        }
    }, [checkConnection, onConnectionChange])

    const requestPermission = async () => {
        setStatus('connecting')
        setError(null)
        try {
            let granted = false

            // Try HID first (common for standard card readers)
            if ('hid' in navigator) {
                try {
                    const devices = await (navigator as any).hid.requestDevice({ filters: [] })
                    if (devices && devices.length > 0) granted = true
                } catch (e) {
                    console.log('HID request cancelled or failed')
                }
            }

            // Try Serial if HID didn't work or isn't available
            if (!granted && 'serial' in navigator) {
                try {
                    const port = await (navigator as any).serial.requestPort()
                    if (port) granted = true
                } catch (e) {
                    console.log('Serial request cancelled or failed')
                }
            }

            if (granted) {
                setStatus('connected')
                onConnectionChange?.(true)
            } else {
                setStatus('disconnected')
                onConnectionChange?.(false)
            }
        } catch (err: any) {
            console.error('Hardare permission request failed:', err)
            setError(err.message || 'Connection failed')
            setStatus('disconnected')
            onConnectionChange?.(false)
        }
    }

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-brand-100 shadow-sm">
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                status === 'connected' ? "bg-green-50 text-green-600" :
                    status === 'connecting' ? "bg-amber-50 text-amber-600" :
                        "bg-red-50 text-red-600"
            )}>
                {status === 'connecting' ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
            </div>

            <div className="flex flex-col">
                <span className="text-label font-black uppercase tracking-widest text-brand-400 leading-none mb-1">
                    Card Reader
                </span>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-sm font-bold",
                        status === 'connected' ? "text-green-700" :
                            status === 'connecting' ? "text-amber-700" :
                                "text-red-700"
                    )}>
                        {status === 'connected' ? 'Connected' :
                            status === 'connecting' ? 'Connecting...' :
                                'Disconnected'}
                    </span>
                    {status === 'connected' ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                    ) : status === 'disconnected' ? (
                        <button
                            onClick={requestPermission}
                            className="flex items-center gap-1 text-label font-black uppercase bg-primary text-white px-2 py-0.5 rounded-md hover:bg-primary/90 transition-colors"
                        >
                            <Power size={10} />
                            Connect
                        </button>
                    ) : null}
                </div>
            </div>

            {error && (
                <div className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-label font-bold rounded">
                    {error}
                </div>
            )}
        </div>
    )
}
