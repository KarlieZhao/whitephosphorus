"use strict";
exports.__esModule = true;
var react_1 = require("react");
var Typewriter = function (_a) {
    var textLines = _a.textLines, period = _a.period, speed = _a.speed, onFinish = _a.onFinish;
    var _b = react_1.useState(''), text = _b[0], setText = _b[1];
    var _c = react_1.useState(false), isDeleting = _c[0], setIsDeleting = _c[1];
    var _d = react_1.useState(40), typingSpeed = _d[0], setTypingSpeed = _d[1];
    var _e = react_1.useState(0), lineNum = _e[0], setLineNum = _e[1];
    var _f = react_1.useState(false), isFinished = _f[0], setIsFinished = _f[1];
    var _g = react_1.useState(false), hasMounted = _g[0], setHasMounted = _g[1];
    var getRandomSpeed = react_1.useCallback(function () { return Math.random() * speed + 10; }, [speed]);
    react_1.useEffect(function () {
        setHasMounted(true);
        if (sessionStorage.getItem('visited') === "true") {
            setIsFinished(true);
            onFinish();
        }
        else if (isFinished) {
            sessionStorage.setItem('visited', "true");
        }
        return function () { };
    }, [isFinished]);
    react_1.useEffect(function () {
        if (!hasMounted || isFinished)
            return;
        var handleTyping = function () {
            var fullTxt = textLines[lineNum];
            setText(fullTxt.substring(0, isDeleting ? (text.length - 1) : (text.length + 1)));
            var delta = isDeleting ? speed / 3 : getRandomSpeed(); // Faster deleting speed
            if (!isDeleting && lineNum === textLines.length - 1 && text === fullTxt) {
                delta = period; // Pause before deleting
                setIsDeleting(true);
            }
            else if (isDeleting && text === '') { // if not yet finish typing all the lines
                if (lineNum + 1 < textLines.length) {
                    setIsDeleting(false);
                    setLineNum(lineNum + 1);
                    delta = 500; // Pause before starting the next word
                }
                else {
                    setIsFinished(true); // End typing once all words are done
                    onFinish(); // will run this function when typing is finished
                }
            }
            setTypingSpeed(delta);
        };
        var typingTimeout = setTimeout(function () {
            handleTyping();
        }, typingSpeed);
        return function () { return clearTimeout(typingTimeout); };
    }, [text, isDeleting, lineNum, typingSpeed, textLines, period, speed, isFinished, hasMounted]);
    if (!hasMounted) {
        return null;
    }
    return (React.createElement("div", { className: "typewrite" },
        React.createElement("span", { className: "wrap" }, text)));
};
exports["default"] = Typewriter;
