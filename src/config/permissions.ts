export const permissions = [
    // User Management
    { name: 'read:users', module: 'User Management' },
    { name: 'manage:users', module: 'User Management' },

    // Role & Permission Management
    { name: 'read:roles', module: 'Role Management' },
    { name: 'manage:roles', module: 'Role Management' }, 
    // Lead Management
    { name: 'create:lead', module: 'Lead Management' },
    { name: 'read:own_leads', module: 'Lead Management' },
    { name: 'read:assigned_leads', module: 'Lead Management' },
    { name: 'read:all_leads', module: 'Lead Management' },
    { name: 'update:own_leads', module: 'Lead Management' },
    { name: 'update:assigned_leads', module: 'Lead Management' },
    { name: 'update:all_leads', module: 'Lead Management' },
    { name: 'delete:all_leads', module: 'Lead Management' },
    { name: 'assign:leads', module: 'Lead Management' },

    // Inquiry Management
    { name: 'create:inquiry', module: 'Inquiry Management' },
    { name: 'read:own_inquiries', module: 'Inquiry Management' },
    { name: 'read:assigned_inquiries', module: 'Inquiry Management' },
    { name: 'read:all_inquiries', module: 'Inquiry Management' },
    { name: 'update:own_inquiries', module: 'Inquiry Management' },
    { name: 'update:assigned_inquiries', module: 'Inquiry Management' },
    { name: 'update:all_inquiries', module: 'Inquiry Management' },
    { name: 'delete:all_inquiries', module: 'Inquiry Management' },
    { name: 'assign:inquiries', module: 'Inquiry Management' },
    { name: 'quote:inquiry', module: 'Inquiry Management' },

    // Report Management
    { name: 'create:report', module: 'Report Management' },
    { name: 'read:own_reports', module: 'Report Management' },
    { name: 'read:all_reports', module: 'Report Management' },
    { name: 'update:own_reports', module: 'Report Management' },
    { name: 'update:all_reports', module: 'Report Management' },
    { name: 'delete:all_reports', module: 'Report Management' },

    // Product Management
    { name: 'read:products', module: 'Product Management' },
    { name: 'manage:products', module: 'Product Management' },

    // Document Management
    { name: 'upload:document', module: 'Document Management' },
    { name: 'read:documents', module: 'Document Management' },
    { name: 'manage:documents', module: 'Document Management' },

    { name: 'create:quotation', module: 'Quotation Management' },
    { name: 'read:own_quotations', module: 'Quotation Management' },
    { name: 'read:assigned_quotations', module: 'Quotation Management' },
    { name: 'read:all_quotations', module: 'Quotation Management' },
    { name: 'update:own_quotations', module: 'Quotation Management' },
    { name: 'update:assigned_quotations', module: 'Quotation Management' },
    { name: 'update:all_quotations', module: 'Quotation Management' },
    { name: 'delete:all_quotations', module: 'Quotation Management' },
    { name: 'approve:quotation', module: 'Quotation Management' },
    { name: 'send:quotation', module: 'Quotation Management' },
    { name: 'convert:quotation_to_order', module: 'Quotation Management' },

    // Attendance & DTR
    { name: 'log:attendance', module: 'Attendance Management' }, 
    { name: 'read:own_attendance', module: 'Attendance Management' },
    { name: 'read:all_attendance', module: 'Attendance Management' },
    { name: 'manage:attendance', module: 'Attendance Management' },
    { name: 'manage:dtr_settings', module: 'Attendance Management' },
    { name: 'manage:allowed_ips', module: 'Attendance Management' },

    // System Settings
    { name: 'manage:system_settings', module: 'System Settings' },

    // Company Management
    { name: 'read:companies', module: 'Company Management' },
    { name: 'manage:companies', module: 'Company Management' },
];