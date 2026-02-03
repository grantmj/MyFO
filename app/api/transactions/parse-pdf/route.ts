import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { categorizeTransaction } from '@/lib/categorize';
import PDFParser from 'pdf2json';

// Configure route segment
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout

/**
 * POST - Parse PDF credit card statement and extract transactions
 */
export async function POST(request: NextRequest) {
  try {
    // Check for OpenAI API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY environment variable');
      return NextResponse.json({ 
        error: 'PDF parsing is not configured. Missing API key.' 
      }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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

    // Extract text from PDF using pdf2json
    let pdfText: string;
    try {
      console.log('📄 Starting PDF parsing with pdf2json...');
      
      pdfText = await new Promise<string>((resolve, reject) => {
        const pdfParser = new (PDFParser as any)(null, 1);
        
        pdfParser.on('pdfParser_dataError', (errData: any) => {
          reject(new Error(errData.parserError));
        });
        
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
          try {
            // Extract text from all pages
            const text = pdfData.Pages.map((page: any) => {
              return page.Texts.map((textItem: any) => {
                return decodeURIComponent(textItem.R.map((r: any) => r.T).join(''));
              }).join(' ');
            }).join('\n\n');
            
            resolve(text);
          } catch (err) {
            reject(err);
          }
        });
        
        // Parse the buffer
        pdfParser.parseBuffer(buffer);
      });
      
      console.log(`✅ Extracted ${pdfText.length} characters from PDF`);
    } catch (error: any) {
      console.error('PDF parsing error:', error);
      console.error('Error message:', error?.message);
      return NextResponse.json({ 
        error: `Failed to parse PDF: ${error?.message || 'Unknown error'}. The file might be corrupted, password-protected, or image-based. Try CSV import instead.` 
      }, { status: 400 });
    }

    if (!pdfText || pdfText.trim().length < 50) {
      return NextResponse.json({ 
        error: 'Could not extract text from PDF. The file might be scanned or empty.' 
      }, { status: 400 });
    }

    // Use OpenAI to extract structured transaction data
    const prompt = `You are parsing a credit card or bank statement. Extract transactions AND the account balance.

Return a JSON object with:
1. "transactions": array of transactions with:
   - date: ISO format (YYYY-MM-DD)
   - description: merchant/vendor name (cleaned up)
   - amount: positive number (absolute value, no dollar signs)

2. "statementBalance": the ending/new/current balance from the statement (can be negative for credit cards)

Rules for transactions:
- Only include actual purchases/charges, not payments or fees
- Convert all amounts to positive numbers
- Clean up merchant names
- Parse dates to YYYY-MM-DD format

Rules for balance:
- Look for: "New Balance", "Current Balance", "Ending Balance", "Statement Balance"
- Return as a number (negative if owed, positive if credit/funds available)
- For credit cards: if you see "$1,234.56" owed, return -1234.56
- If no balance found, return null

Input PDF text:
${pdfText.substring(0, 15000)}

Return ONLY valid JSON object with transactions array and statementBalance:`;

    let transactions: Array<{
      date: string;
      description: string;
      amount: number;
    }> = [];
    let statementBalance: number | null = null;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial data extraction assistant. Return only valid JSON objects with transactions and balance.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0].message.content || '{}';
      
      // Try to parse the response
      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
        
        // Extract transactions
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
        
        // Extract balance
        if (typeof parsed.statementBalance === 'number') {
          statementBalance = parsed.statementBalance;
          console.log('📊 Extracted statement balance:', statementBalance);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return NextResponse.json({ 
          error: 'Could not extract transactions from PDF. Please try CSV import.' 
        }, { status: 400 });
      }
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Provide more specific error messages
      if (error.status === 401) {
        return NextResponse.json({ 
          error: 'Invalid API key. PDF parsing is not configured correctly.' 
        }, { status: 500 });
      } else if (error.status === 429) {
        return NextResponse.json({ 
          error: 'API rate limit exceeded. Please try again in a moment.' 
        }, { status: 429 });
      }
      
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
      statementBalance,
    });
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json({ 
      error: 'An unexpected error occurred while processing the PDF.',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
