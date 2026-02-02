import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET emergency fund for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        let emergencyFund = await prisma.emergencyFund.findUnique({
            where: { userId },
        });

        // Create default if doesn't exist
        if (!emergencyFund) {
            emergencyFund = await prisma.emergencyFund.create({
                data: {
                    userId,
                    targetAmount: 500,
                    currentAmount: 0,
                    weeklyContribution: 0,
                },
            });
        }

        const percentComplete = emergencyFund.targetAmount > 0
            ? Math.min(100, (emergencyFund.currentAmount / emergencyFund.targetAmount) * 100)
            : 0;

        return NextResponse.json({
            emergencyFund: {
                ...emergencyFund,
                percentComplete,
            }
        });
    } catch (error) {
        console.error('Error fetching emergency fund:', error);
        return NextResponse.json({ error: 'Failed to fetch emergency fund' }, { status: 500 });
    }
}

// PUT update emergency fund
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, targetAmount, currentAmount, weeklyContribution } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const emergencyFund = await prisma.emergencyFund.upsert({
            where: { userId },
            update: {
                targetAmount: targetAmount !== undefined ? parseFloat(targetAmount) : undefined,
                currentAmount: currentAmount !== undefined ? parseFloat(currentAmount) : undefined,
                weeklyContribution: weeklyContribution !== undefined ? parseFloat(weeklyContribution) : undefined,
            },
            create: {
                userId,
                targetAmount: targetAmount ? parseFloat(targetAmount) : 500,
                currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
                weeklyContribution: weeklyContribution ? parseFloat(weeklyContribution) : 0,
            },
        });

        const percentComplete = emergencyFund.targetAmount > 0
            ? Math.min(100, (emergencyFund.currentAmount / emergencyFund.targetAmount) * 100)
            : 0;

        return NextResponse.json({
            emergencyFund: {
                ...emergencyFund,
                percentComplete,
            }
        });
    } catch (error) {
        console.error('Error updating emergency fund:', error);
        return NextResponse.json({ error: 'Failed to update emergency fund' }, { status: 500 });
    }
}

// POST add to emergency fund (convenience endpoint)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, depositAmount } = body;

        if (!userId || depositAmount === undefined) {
            return NextResponse.json({ error: 'userId and depositAmount required' }, { status: 400 });
        }

        const existing = await prisma.emergencyFund.findUnique({
            where: { userId },
        });

        const newAmount = (existing?.currentAmount || 0) + parseFloat(depositAmount);

        const emergencyFund = await prisma.emergencyFund.upsert({
            where: { userId },
            update: {
                currentAmount: newAmount,
            },
            create: {
                userId,
                targetAmount: 500,
                currentAmount: parseFloat(depositAmount),
                weeklyContribution: 0,
            },
        });

        const percentComplete = emergencyFund.targetAmount > 0
            ? Math.min(100, (emergencyFund.currentAmount / emergencyFund.targetAmount) * 100)
            : 0;

        return NextResponse.json({
            emergencyFund: {
                ...emergencyFund,
                percentComplete,
            }
        });
    } catch (error) {
        console.error('Error depositing to emergency fund:', error);
        return NextResponse.json({ error: 'Failed to deposit' }, { status: 500 });
    }
}
