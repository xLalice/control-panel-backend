import { companyInfo } from "config/companyInfo";
import { env } from "config/env";
import { compileTemplate } from "modules/quotations/quotation.utils";
import { Resend } from "resend";

export class EmailService {
    private resend: Resend

    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);
    }

    async sendQuotation(
        to: string,
        customerName: string,
        quotationNumber: string,
        pdfBuffer: Buffer,
        publicUrl?: string
    ) {

        const isDev = env.NODE_ENV !== 'production';
        const recipient = isDev ? env.DEFAULT_EMAIL : to;

        if (isDev) {
            console.log(`⚠️ DEV MODE: Redirecting email from ${to} to ${recipient}`);
        }


        const htmlContent = await compileTemplate('quotationEmail.hbs', {
            customerName,
            quotationNumber,
            link: publicUrl
        });

        const { data, error } = await this.resend.emails.send({
            from: `${companyInfo.name} <onboarding@resend.dev>`,
            to: [recipient],
            subject: `Your Quotation ${quotationNumber} from ${companyInfo.name}`,
            html: htmlContent,
            attachments: [
                {
                    filename: `${quotationNumber}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        if (error) {
            console.error("Email failed:", error);
            throw new Error("Failed to send email");
        }

        return data;
    }
}