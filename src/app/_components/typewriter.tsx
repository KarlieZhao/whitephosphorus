
import { useRef, useState, useCallback, useEffect } from 'react';

interface TypewriterProps {
    textLines: string[];
    period: number;
    speed: number;
    onFinish: () => void;
    forceStopped?: boolean;
}

const Typewriter: React.FC<TypewriterProps> = ({ textLines, period, speed, onFinish, forceStopped = false }) => {
    const [p1, setp1] = useState<string>("");
    const [p2, setp2] = useState<string>("");
    const [p3, setp3] = useState<string>("");
    const [currentLine, setCurrentLine] = useState(0);
    const [currentChar, setCurrentChar] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getRandomSpeed = useCallback(() => Math.random() * speed + 10, [speed]);

    useEffect(() => {
        setHasMounted(true);
        if (sessionStorage.getItem('visited') === "true") {
            setIsFinished(true);
            onFinish();
        }
        else if (isFinished) {
            sessionStorage.setItem('visited', "true");
        }
        return () => { };
    }, [isFinished, onFinish]);

    useEffect(() => {
        if (!hasMounted || isFinished || forceStopped) return;

        const typeNextCharacter = () => {
            if (currentLine >= textLines.length) {
                setIsFinished(true);                
                return;
            }

            const currentText = textLines[currentLine];
            if (currentChar < currentText.length) {
                const newChar = currentText.substring(0, currentChar + 1);

                // Update the appropriate paragraph state
                if (currentLine === 0) {
                    setp1(newChar);
                } else if (currentLine === 1) {
                    setp2(newChar);
                } else if (currentLine === 2) {
                    setp3(newChar);
                }

                setCurrentChar(prev => prev + 1);

                const nextSpeed = getRandomSpeed();
                timeoutRef.current = setTimeout(typeNextCharacter, nextSpeed);
            } else {
                // Move to next line after period delay
                timeoutRef.current = setTimeout(() => {
                    setCurrentLine(prev => prev + 1);
                    setCurrentChar(0);
                }, period);
            }
        };

        // Start typing after initial delay
        timeoutRef.current = setTimeout(typeNextCharacter, speed);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [hasMounted, isFinished, forceStopped, currentLine, currentChar, textLines, period, getRandomSpeed, onFinish]);

    useEffect(() => {
        if (forceStopped) {
            setp1("");
            setp2("");
            setp3("");
            setCurrentLine(0);
            setCurrentChar(0);
            setIsFinished(true);
            onFinish();
        }
    }, [forceStopped, onFinish]);

    if (!hasMounted) {
        return null;
    }

    return (
        <div className="typewrite">
            <p className="wrap">{p1}</p>
            <p className="wrap">{p2}</p>
            <p className="wrap text-sm text-gray-400">{p3}</p>
        </div>
    );
};

export default Typewriter;