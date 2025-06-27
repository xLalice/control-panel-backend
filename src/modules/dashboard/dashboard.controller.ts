import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, subDays, subMonths, } from 'date-fns';

const prisma = new PrismaClient();

interface TimeRangeFilter {
  startDate: Date;
  endDate: Date;
}

export class DashboardController {
  
  private convertBigIntToNumber = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'bigint') {
      return Number(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertBigIntToNumber(item));
    }
    
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = this.convertBigIntToNumber(value);
      }
      return converted;
    }
    
    return obj;
  }

  private getDateRange = (timeRange: string): TimeRangeFilter => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 7);
    }
    
    return {
      startDate: startOfDay(startDate),
      endDate: endOfDay(now)
    };
  }

  getKeyMetrics = async (req: Request, res: Response) => {
    try {
      const timeRange = req.query.timeRange as string || '7d';
      const { startDate, endDate } = this.getDateRange(timeRange);
      
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = subDays(startDate, periodDays);
      const prevEndDate = subDays(endDate, periodDays);

      const [currentRevenue, previousRevenue] = await Promise.all([
        prisma.quotation.aggregate({
          where: {
            status: 'Accepted',
            createdAt: { gte: startDate, lte: endDate }
          },
          _sum: { total: true }
        }),
        prisma.quotation.aggregate({
          where: {
            status: 'Accepted',
            createdAt: { gte: prevStartDate, lte: prevEndDate }
          },
          _sum: { total: true }
        })
      ]);

      const [currentLeads, previousLeads] = await Promise.all([
        prisma.lead.count({
          where: {
            isActive: true,
            status: { in: ['New', 'Contacted', 'Qualified', 'ProposalSent', 'Negotiation'] },
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        prisma.lead.count({
          where: {
            isActive: true,
            status: { in: ['New', 'Contacted', 'Qualified', 'ProposalSent', 'Negotiation'] },
            createdAt: { gte: prevStartDate, lte: prevEndDate }
          }
        })
      ]);

      // Total Clients
      const [currentClients, previousClients] = await Promise.all([
        prisma.client.count({
          where: {
            isActive: true,
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        prisma.client.count({
          where: {
            isActive: true,
            createdAt: { gte: prevStartDate, lte: prevEndDate }
          }
        })
      ]);

      // Pending Quotations
      const [currentQuotations, previousQuotations] = await Promise.all([
        prisma.quotation.count({
          where: {
            status: { in: ['Draft', 'Sent'] },
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        prisma.quotation.count({
          where: {
            status: { in: ['Draft', 'Sent'] },
            createdAt: { gte: prevStartDate, lte: prevEndDate }
          }
        })
      ]);

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number): string => {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const change = ((current - previous) / previous) * 100;
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
      };

      const metrics = [
        {
          title: 'Total Revenue',
          value: `₱${(currentRevenue._sum.total || 0).toLocaleString()}`,
          change: calculateChange(Number(currentRevenue._sum.total || 0), Number(previousRevenue._sum.total || 0)),
          trend: (currentRevenue._sum.total || 0) >= (previousRevenue._sum.total || 0) ? 'up' : 'down',
          icon: 'DollarSign',
          color: 'text-green-600'
        },
        {
          title: 'Active Leads',
          value: currentLeads.toString(),
          change: calculateChange(currentLeads, previousLeads),
          trend: currentLeads >= previousLeads ? 'up' : 'down',
          icon: 'Target',
          color: 'text-blue-600'
        },
        {
          title: 'Total Clients',
          value: currentClients.toString(),
          change: calculateChange(currentClients, previousClients),
          trend: currentClients >= previousClients ? 'up' : 'down',
          icon: 'Users',
          color: 'text-purple-600'
        },
        {
          title: 'Pending Quotations',
          value: currentQuotations.toString(),
          change: calculateChange(currentQuotations, previousQuotations),
          trend: currentQuotations >= previousQuotations ? 'up' : 'down',
          icon: 'FileText',
          color: 'text-orange-600'
        }
      ];

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching key metrics:', error);
      res.status(500).json({ error: 'Failed to fetch key metrics' });
    }
  }

  // Get revenue trend data
  getRevenueData = async (req: Request, res: Response) => {
    try {
      const timeRange = req.query.timeRange as string || '7d';
      const { startDate, endDate } = this.getDateRange(timeRange);

      // Get monthly revenue data for the past 6 months
      const monthlyRevenue = await prisma.$queryRaw`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(*) as leads
        FROM "Quotation"
        WHERE "status" = 'Accepted'
          AND "createdAt" >= ${subMonths(endDate, 6)}
          AND "createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt")
      ` as Array<{ month: string; revenue: number; leads: number }>;

      // Add target (could be from SystemSettings or hardcoded)
      const revenueData = monthlyRevenue.map(item => ({
        ...item,
        target: 280000 // This could come from SystemSettings
      }));

      res.json(this.convertBigIntToNumber(revenueData));
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
  }

  // Get sales pipeline data
  getSalesPipeline = async (req: Request, res: Response) => {
    try {
      const pipelineData = await prisma.lead.groupBy({
        by: ['status'],
        where: {
          isActive: true
        },
        _count: {
          id: true
        },
        _sum: {
          estimatedValue: true
        }
      });

      const salesPipeline = pipelineData.map(item => ({
        status: item.status,
        count: item._count.id,
        value: Number(item._sum.estimatedValue || 0)
      }));

      res.json(this.convertBigIntToNumber(salesPipeline));
    } catch (error) {
      console.error('Error fetching sales pipeline:', error);
      res.status(500).json({ error: 'Failed to fetch sales pipeline data' });
    }
  }

  // Get inquiry sources
  getInquirySources = async (req: Request, res: Response) => {
    try {
      const timeRange = req.query.timeRange as string || '7d';
      const { startDate, endDate } = this.getDateRange(timeRange);

      const inquirySources = await prisma.inquiry.groupBy({
        by: ['referenceSource'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: {
          id: true
        }
      });

      const colorMap: Record<string, string> = {
        Facebook: '#3b82f6',
        Instagram: '#ef4444',
        TikTok: '#f59e0b',
        Referral: '#10b981',
        Flyers: '#8b5cf6',
        Other: '#6b7280'
      };

      const sourceData = inquirySources.map(item => ({
        source: item.referenceSource,
        count: item._count.id,
        color: colorMap[item.referenceSource] || '#6b7280'
      }));

      res.json(this.convertBigIntToNumber(sourceData));
    } catch (error) {
      console.error('Error fetching inquiry sources:', error);
      res.status(500).json({ error: 'Failed to fetch inquiry sources' });
    }
  }

  // Get product performance
  getProductPerformance = async (req: Request, res: Response) => {
    try {
      const timeRange = req.query.timeRange as string || '7d';
      const { startDate, endDate } = this.getDateRange(timeRange);

      const productPerformance = await prisma.$queryRaw`
        SELECT 
          p.category,
          COUNT(DISTINCT ii.id) as inquiries,
          COUNT(DISTINCT qi.id) as quotations,
          COALESCE(SUM(qi."lineTotal"), 0) as revenue
        FROM "Product" p
        LEFT JOIN "InquiryItem" ii ON p.id = ii."productId"
        LEFT JOIN "Inquiry" i ON ii."inquiryId" = i.id AND i."createdAt" >= ${startDate} AND i."createdAt" <= ${endDate}
        LEFT JOIN "QuotationItem" qi ON p.id = qi."productId"
        LEFT JOIN "Quotation" q ON qi."quotationId" = q.id AND q."createdAt" >= ${startDate} AND q."createdAt" <= ${endDate}
        WHERE p."isActive" = true
        GROUP BY p.category
        ORDER BY revenue DESC
      ` as Array<{
        category: string;
        inquiries: number;
        quotations: number;
        revenue: number;
      }>;

      res.json(this.convertBigIntToNumber(productPerformance));
    } catch (error) {
      console.error('Error fetching product performance:', error);
      res.status(500).json({ error: 'Failed to fetch product performance' });
    }
  }

  // Get attendance data
  getAttendanceData = async (req: Request, res: Response) => {
    try {
      const timeRange = req.query.timeRange as string || '7d';
      const { startDate, endDate } = this.getDateRange(timeRange);

      const attendanceData = await prisma.$queryRaw`
        SELECT 
          TO_CHAR(date, 'Dy') as day,
          COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present,
          COUNT(CASE WHEN status = 'LATE' THEN 1 END) as late,
          COUNT(CASE WHEN status NOT IN ('PRESENT', 'LATE') THEN 1 END) as absent
        FROM "Attendance"
        WHERE date >= ${startDate} AND date <= ${endDate}
        GROUP BY DATE_TRUNC('day', date), TO_CHAR(date, 'Dy')
        ORDER BY DATE_TRUNC('day', date)
      ` as Array<{
        day: string;
        present: number;
        late: number;
        absent: number;
      }>;

      res.json(this.convertBigIntToNumber(attendanceData));
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      res.status(500).json({ error: 'Failed to fetch attendance data' });
    }
  }

  // Get recent activity
  getRecentActivity = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;

      const recentActivities = await prisma.activityLog.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              name: true
            }
          },
          lead: {
            select: {
              name: true
            }
          },
          client: {
            select: {
              clientName: true
            }
          },
          inquiry: {
            select: {
              clientName: true
            }
          }
        }
      });

      const activities = recentActivities.map(activity => {
        const timeAgo = this.getTimeAgo(activity.createdAt);
        let detail = activity.description;
        
        if (activity.lead) {
          detail += ` - ${activity.lead.name}`;
        }
        if (activity.client) {
          detail += ` - ${activity.client.clientName}`;
        }
        if (activity.inquiry) {
          detail += ` - ${activity.inquiry.clientName}`;
        }

        return {
          id: activity.id,
          type: this.getActivityType(activity.action),
          action: activity.action,
          detail,
          time: timeAgo,
          icon: this.getActivityIcon(activity.action)
        };
      });

      res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
  }

  getDashboardData = async (req: Request, res: Response) => {
    try {
      const timeRange = req.query.timeRange as string || '7d';

      const createReq = (query: any) => ({ query }) as Request;
      const createRes = () => {
        let jsonData: any;
        return {
          json: (data: any) => { jsonData = data; },
          getData: () => jsonData,
          status: () => ({ json: () => {} })
        } as any;
      };

      const [
        metricsRes,
        revenueRes,
        pipelineRes,
        sourcesRes,
        performanceRes,
        attendanceRes,
        activityRes
      ] = await Promise.all([
        (async () => {
          const resObj = createRes();
          await this.getKeyMetrics(createReq({ timeRange }), resObj);
          return resObj;
        })(),
        (async () => {
          const resObj = createRes();
          await this.getRevenueData(createReq({ timeRange }), resObj);
          return resObj;
        })(),
        (async () => {
          const resObj = createRes();
          await this.getSalesPipeline(createReq({}), resObj);
          return resObj;
        })(),
        (async () => {
          const resObj = createRes();
          await this.getInquirySources(createReq({ timeRange }), resObj);
          return resObj;
        })(),
        (async () => {
          const resObj = createRes();
          await this.getProductPerformance(createReq({ timeRange }), resObj);
          return resObj;
        })(),
        (async () => {
          const resObj = createRes();
          await this.getAttendanceData(createReq({ timeRange }), resObj);
          return resObj;
        })(),
        (async () => {
          const resObj = createRes();
          await this.getRecentActivity(createReq({ limit: '5' }), resObj);
          return resObj;
        })()
      ]);

      const dashboardData = {
        metrics: metricsRes.getData(),
        revenueData: revenueRes.getData(),
        salesPipeline: pipelineRes.getData(),
        inquirySources: sourcesRes.getData(),
        productPerformance: performanceRes.getData(),
        attendance: attendanceRes.getData(),
        recentActivity: activityRes.getData()
      };

      res.json(this.convertBigIntToNumber(dashboardData));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  private getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }

  private getActivityType = (action: string): string => {
    if (action.toLowerCase().includes('lead')) return 'lead';
    if (action.toLowerCase().includes('quotation')) return 'quotation';
    if (action.toLowerCase().includes('inquiry')) return 'inquiry';
    if (action.toLowerCase().includes('client')) return 'client';
    if (action.toLowerCase().includes('report')) return 'report';
    return 'general';
  }

  private getActivityIcon = (action: string): string => {
    if (action.toLowerCase().includes('lead')) return 'Target';
    if (action.toLowerCase().includes('quotation')) return 'FileText';
    if (action.toLowerCase().includes('inquiry')) return 'Mail';
    if (action.toLowerCase().includes('client')) return 'Users';
    if (action.toLowerCase().includes('report')) return 'FileText';
    return 'Calendar';
  }
}