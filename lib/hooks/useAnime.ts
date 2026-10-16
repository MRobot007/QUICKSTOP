'use client'

import { useEffect, useRef } from 'react'
import { animate, type AnimationParams } from 'animejs'

export const useAnime = (config: AnimationParams) => {
    const elementRef = useRef<any>(null)

    useEffect(() => {
        if (elementRef.current) {
            animate(elementRef.current, config)
        }
    }, [config])

    return elementRef
}

export const staggerAnimate = (selector: string, config: AnimationParams = {}) => {
    // In animejs v4, stagger is often used directly in values or as a utility
    // But for a simple stagger entry, we can just use the animate function
    animate(selector, {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: (el: any, i: number) => i * 100,
        ease: 'outExpo',
        duration: 800,
        ...config,
    })
}
