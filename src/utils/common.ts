import * as fs from 'fs/promises';
import * as path from 'path';

export const getBase64Logo = async (): Promise<string> => {
    try {
        const filePath = path.join(process.cwd(), 'src', 'assets', 'logo.png');
        
        try {
            await fs.access(filePath);
        } catch {
            console.error(`❌ Logo file not found at: ${filePath}`);
            return "";
        }

        const bitmap = await fs.readFile(filePath);
        return bitmap.toString('base64');
    } catch (err) {
        console.error("Error loading logo:", err);
        return "";
    }
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
    }).format(amount);
};