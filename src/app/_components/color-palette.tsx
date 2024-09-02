export function colorPalette() {
    const BACKGROUND = "#292B2E";
    const BRIGHT = "#FFFFFF";
    const BRIGHT2 = "#D8BD8A"

    const HIGHLIGHT = "#C22F27";
    const SECONDARY = "#d8c5b2";

    const DARK1 = "#853c3899";
    const DARK2 = "#853c3833";

    const SILVER = "#C4C4C4";

    return {
        BACKGROUND,
        HIGHLIGHT,
        BRIGHT,
        BRIGHT2,
        DARK1,
        DARK2,
        SECONDARY,
        SILVER,
        getColor: (colorName: any) => {
            switch (colorName.toUpperCase()) {
                case 'BACKGROUND':
                    return BACKGROUND;
                case 'HIGHLIGHT':
                    return HIGHLIGHT;
                case 'BRIGHT':
                    return BRIGHT;
                case 'BRIGHT2':
                    return BRIGHT2;
                case 'SILVER':
                    return SILVER;
                case 'DARK1':
                    return DARK1;
                case 'DARK2':
                    return DARK2;
                case 'SECONDARY':
                    return SECONDARY;
                default:
                    console.warn(`Color "${colorName}" not found in palette. Returning SILVER as default.`);
                    return BRIGHT;
            }
        }
    };
};