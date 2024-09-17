import { useState, useEffect, useCallback } from 'react';
import { throttle } from './throttle';

export function useScrollPosition() {
    const [scrollPosition, setScrollPosition] = useState(0);

    // Use useCallback to memoize the handleScroll function
    const handleScroll = useCallback(throttle(() => {
        setScrollPosition(window.scrollY);
    }, 100), []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return scrollPosition;
}