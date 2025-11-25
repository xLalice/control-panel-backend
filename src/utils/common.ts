import * as fs from 'fs/promises';
import * as path from 'path';

export const getBase64Logo = async (): Promise<string> => {
    try {
        const filePath = path.join(process.cwd(), 'src', 'assets', 'logo.png');
        
        const bitmap = await fs.readFile(filePath);
        return bitmap.toString('base64');
    } catch (err) {
        console.error("Error loading logo:", err);
        return "";
    }
};