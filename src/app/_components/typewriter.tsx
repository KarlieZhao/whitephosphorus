
import React, { useState, useEffect } from 'react';

interface TypewriterProps {
    textLines: string[];
    period: number;
    speed: number; // Typing speed
}

const Typewriter: React.FC<TypewriterProps> = ({ textLines, period, speed }) => {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(Math.random() * speed + 30);
    const [lineNum, setLineNum] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (!hasMounted || isFinished) return;

        const handleTyping = () => {
            const fullTxt = textLines[lineNum];

            if (isDeleting) {
                setText(fullTxt.substring(0, text.length - 1));
            } else {
                setText(fullTxt.substring(0, text.length + 1));
            }

            let delta = typingSpeed;

            if (isDeleting) {
                delta = speed / 2; // Faster deleting speed
            }

            // if finish typing all the lines, and
            //    isDeleting => false
            if (!isDeleting && lineNum === textLines.length - 1 && text === fullTxt) {
                delta = period; // Pause before deleting
                setIsDeleting(true);
            } else if (isDeleting && text === '') { //else, if not yet finish typing all the lines
                if (lineNum + 1 < textLines.length) {
                    setIsDeleting(false);
                    setLineNum(lineNum + 1);
                    delta = 500; // Pause before starting the next word
                } else {
                    setIsFinished(true); // End typing once all words are done
                }
            }
            setTypingSpeed(delta);
        };


        const typingTimeout = setTimeout(() => {
            handleTyping();
        }, typingSpeed);

        return () => clearTimeout(typingTimeout);
    }, [text, isDeleting, lineNum, typingSpeed, textLines, period, speed, isFinished, hasMounted]);

    if (!hasMounted) {
        return null; // Prevent rendering on the server side
    }

    return (
        <span className="typewrite">
            <span className="wrap">{text}</span>
        </span>
    );
};

export default Typewriter;