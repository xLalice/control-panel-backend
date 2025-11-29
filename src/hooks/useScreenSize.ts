import { useEffect, useState } from "react";

export const useScreenSize = () => {
    const [screenSize, setScreenSize] = useState("L");

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setScreenSize("S");
            } else if (window.innerWidth < 1024) {
                setScreenSize("M");
            } else {
                setScreenSize("L");
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return screenSize;
};