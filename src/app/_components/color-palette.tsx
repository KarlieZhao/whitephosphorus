export function colorPalette() {
    const BACKGROUND = "#292B2E";
    const BRIGHT = "#FFFFFF";
    const HIGHLIGHT = "#C22F27";
    const SECONDARY = "#D6CEC6";

    return {
        BACKGROUND,
        HIGHLIGHT,
        BRIGHT,
        SECONDARY,
        getColor: (colorName: any) => {
            switch (colorName.toUpperCase()) {
                case 'BACKGROUND':
                    return BACKGROUND;
                case 'HIGHLIGHT':
                    return HIGHLIGHT;
                case 'BRIGHT':
                    return BRIGHT;
                case 'SECONDARY':
                    return SECONDARY;
                default:
                    console.warn(`Color "${colorName}" not found in palette. Returning SILVER as default.`);
                    return BRIGHT;
            }
        }
    };
};