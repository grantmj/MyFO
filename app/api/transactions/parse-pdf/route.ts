import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { categorizeTransaction } from '@/lib/categorize';

// Dynamic import for pdf-parse (CommonJS module)
const pdfParse = require('pdf-parse');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST - Parse PDF credit card statement and extract transactions
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    let pdfText: string;
    try {
      const pdfData = await pdfParse(buffer);
      pdfText = pdfData.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      return NextResponse.json({ 
        error: 'Failed to parse PDF. Try CSV import instead.' 
      }, { status: 400 });
    }

    if (!pdfText || pdfText.trim().length < 50) {
      return NextResponse.json({ 
        error: 'Could not extract text from PDF. The file might be scanned or empty.' 
      }, { status: 400 });
    }

    // Use OpenAI to extract structured transaction data
    const prompt = `You are parsing a credit card statement. Extract all transactions as a JSON array.

For each transaction, extract:
- date: ISO format (YYYY-MM-DD)
- description: merchant/vendor name (cleaned up, remove extra characters and codes)
- amount: positive number (absolute value, no dollar signs)

Rules:
- Only include actual transactions (purchases, charges), not payments, fees, or summary lines
- If you see a negative amount (like -50.00), convert it to positive (50.00)
- Clean up merchant names to be readable
- Parse dates from any format (MM/DD/YYYY, DD/MM/YYYY, etc.) to YYYY-MM-DD
- Ignore: payment lines, balance lines, "previous balance", "new balance", interest charges, fees
- Only return valid JSON array, no other text

Input PDF text:
${pdfText.substring(0, 15000)}

Return ONLY valid JSON array:`;

    let transactions: Array<{
      date: string;
      description: string;
      amount: number;
    }> = [];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial data extraction assistant. Return only valid JSON arrays.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0].message.content || '[]';
      
      // Try to parse the response - it might be wrapped in an object
      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
        // If it's an object with a transactions key, use that
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          transactions = parsed.transactions;
        } else if (Array.isArray(parsed)) {
          transactions = parsed;
        } else {
          // If it's an object, try to find an array property
          const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
          if (arrayKey) {
            transactions = parsed[arrayKey];
          }
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return NextResponse.json({ 
          error: 'Could not extract transactions from PDF. Please try CSV import.' 
        }, { status: 400 });
      }
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      return NextResponse.json({ 
        error: 'Failed to process PDF with AI. Please try again or use CSV import.' 
      }, { status: 500 });
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ 
        error: 'No transactions found in this PDF. Please try a different file or use CSV import.' 
      }, { status: 400 });
    }

    // Validate and categorize transactions
    const processedTransactions = transactions
      .filter(t => {
        // Validate required fields
        return t.date && t.description && typeof t.amount === 'number' && !isNaN(t.amount);
      })
      .map(t => {
        // Auto-categorize using existing engine
        const category = categorizeTransaction(t.description);
        
        // Extract merchant name (first 50 chars of description)
        const merchantGuess = t.description.substring(0, 50).trim();

        return {
          date: t.date,
          description: t.description,
          amount: Math.abs(t.amount), // Ensure positive
          category,
          suggestedMerchant: merchantGuess,
        };
      });

    if (processedTransactions.length === 0) {
      return NextResponse.json({ 
        error: 'No valid transactions found in PDF. Please check the file format.' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transactions: processedTransactions,
      count: processedTransactions.length,
    });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred while processing the PDF.' 
    }, { status: 500 });
  }
}
