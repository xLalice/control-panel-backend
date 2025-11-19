import { createClient, SupabaseClient } from "@supabase/supabase-js";

export class StorageService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL ?? "",
            process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
        )
    }

    async uploadQuotationPdf(fileName: string, fileBuffer: Buffer): Promise<string> {
        const bucket = 'quotations';
        const filePath = `pdfs/${fileName}`;

        const {  error } = await this.supabase.storage
            .from(bucket)
            .upload(filePath, fileBuffer, {
                contentType: 'application/pdf',
                upsert: true 
            });

        if (error) {
            console.error("Supabase Upload Error:", error);
            throw new Error("Failed to upload PDF to storage");
        }

        const { data: publicUrlData } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    }
}