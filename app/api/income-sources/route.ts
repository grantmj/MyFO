import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all income sources for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const incomeSources = await prisma.incomeSource.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ incomeSources });
    } catch (error) {
        console.error('Error fetching income sources:', error);
        return NextResponse.json({ error: 'Failed to fetch income sources' }, { status: 500 });
    }
}

// POST create new income source
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, type, name, amount, frequency, startDate, endDate, isLoan, interestRate, notes } = body;

        if (!userId || !type || !name || amount === undefined || !frequency) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const incomeSource = await prisma.incomeSource.create({
            data: {
                userId,
                type,
                name,
                amount: parseFloat(amount),
                frequency,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                isLoan: isLoan || false,
                interestRate: interestRate ? parseFloat(interestRate) : null,
                notes: notes || null,
            },
        });

        return NextResponse.json({ incomeSource });
    } catch (error) {
        console.error('Error creating income source:', error);
        return NextResponse.json({ error: 'Failed to create income source' }, { status: 500 });
    }
}

// PUT update income source
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, type, name, amount, frequency, startDate, endDate, isLoan, interestRate, notes } = body;

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const incomeSource = await prisma.incomeSource.update({
            where: { id },
            data: {
                type,
                name,
                amount: amount !== undefined ? parseFloat(amount) : undefined,
                frequency,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                isLoan,
                interestRate: interestRate ? parseFloat(interestRate) : null,
                notes,
            },
        });

        return NextResponse.json({ incomeSource });
    } catch (error) {
        console.error('Error updating income source:', error);
        return NextResponse.json({ error: 'Failed to update income source' }, { status: 500 });
    }
}

// DELETE income source
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        await prisma.incomeSource.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting income source:', error);
        return NextResponse.json({ error: 'Failed to delete income source' }, { status: 500 });
    }
}
