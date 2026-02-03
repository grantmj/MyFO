import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';

// Map Supabase column names to camelCase for frontend
const columnMap: Record<string, string> = {
  create_fsa_id: 'createFsaId',
  gather_tax_docs: 'gatherTaxDocs',
  list_schools: 'listSchools',
  submit_fafsa: 'submitFafsa',
  verification: 'verification',
  review_award: 'reviewAward',
  accept_aid: 'acceptAid',
  mark_calendar: 'markCalendar',
};

// Reverse map for updates
const reverseColumnMap: Record<string, string> = {
  createFsaId: 'create_fsa_id',
  gatherTaxDocs: 'gather_tax_docs',
  listSchools: 'list_schools',
  submitFafsa: 'submit_fafsa',
  verification: 'verification',
  reviewAward: 'review_award',
  acceptAid: 'accept_aid',
  markCalendar: 'mark_calendar',
};

/**
 * GET - Fetch FAFSA checklist
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let { data: checklist, error } = await supabase
      .from('fafsa_checklist')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Create if doesn't exist
    if (!checklist && (!error || error.code === 'PGRST116')) {
      const { data: newChecklist, error: createError } = await supabase
        .from('fafsa_checklist')
        .insert({ user_id: userId } as any)
        .select()
        .single();

      if (createError) {
        console.error('Error creating checklist:', createError);
        return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 });
      }
      checklist = newChecklist;
    } else if (error && error.code !== 'PGRST116') {
      console.error('Error fetching checklist:', error);
      return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
    }

    // Map to frontend format
    // Map to frontend format
    const list = checklist as any;
    const mapped = {
      id: list?.id,
      userId: list?.user_id,
      createFsaId: list?.create_fsa_id,
      gatherTaxDocs: list?.gather_tax_docs,
      listSchools: list?.list_schools,
      submitFafsa: list?.submit_fafsa,
      verification: list?.verification,
      reviewAward: list?.review_award,
      acceptAid: list?.accept_aid,
      markCalendar: list?.mark_calendar,
      updatedAt: list?.updated_at,
    };

    return NextResponse.json({ checklist: mapped });
  } catch (error) {
    console.error('Error fetching FAFSA checklist:', error);
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
  }
}

/**
 * PUT - Update FAFSA checklist item
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { userId, field, value } = body;

    if (!userId || !field) {
      return NextResponse.json({ error: 'User ID and field required' }, { status: 400 });
    }

    // Convert field name to snake_case
    const dbField = reverseColumnMap[field] || field;

    // Check if exists
    const { data: existing } = await supabase
      .from('fafsa_checklist')
      .select('id')
      .eq('user_id', userId)
      .single();

    let checklist;
    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('fafsa_checklist')
        .update({ [dbField]: value } as any)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      checklist = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('fafsa_checklist')
        .insert({ user_id: userId, [dbField]: value } as any)
        .select()
        .single();

      if (error) throw error;
      checklist = data;
    }

    // Map to frontend format
    // Map to frontend format
    const list = checklist as any;
    const mapped = {
      id: list?.id,
      userId: list?.user_id,
      createFsaId: list?.create_fsa_id,
      gatherTaxDocs: list?.gather_tax_docs,
      listSchools: list?.list_schools,
      submitFafsa: list?.submit_fafsa,
      verification: list?.verification,
      reviewAward: list?.review_award,
      acceptAid: list?.accept_aid,
      markCalendar: list?.mark_calendar,
      updatedAt: list?.updated_at,
    };

    return NextResponse.json({ checklist: mapped });
  } catch (error) {
    console.error('Error updating FAFSA checklist:', error);
    return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 });
  }
}
