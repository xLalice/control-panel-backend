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
        const htmlContent = await compileTemplate('quotationEmail.hbs', {
            customerName,
            quotationNumber,
            link: publicUrl
        });

        const { data, error } = await this.resend.emails.send({
            from: 'Acme Sales <onboarding@resend.dev>',
            to: [to],
            subject: `Your Quotation ${quotationNumber} from Acme Corp`,
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