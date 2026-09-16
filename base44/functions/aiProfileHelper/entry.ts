import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const EQUIPMENT_LABELS = {
  sound_system: 'Sound system',
  lighting: 'Lighting',
  microphones: 'Microphones',
  back_lights: 'Back lights',
  fog_machine: 'Fog machine',
  stage: 'Stage',
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const kind = body.kind || 'bio';
    const context = [
      `Stage name: ${body.stage_name || 'not set'}`,
      `Talent category: ${body.category_label || 'not set'}`,
      `Years of experience: ${body.experience_years || 'not set'}`,
      `Based in: ${body.location_city || 'not set'}`,
      `Hourly rate: £${body.hourly_rate || 'not set'}`,
      body.specialties?.length ? `Current specialties: ${body.specialties.join(', ')}` : '',
      body.equipment?.length ? `Equipment provided: ${body.equipment.map(e => EQUIPMENT_LABELS[e] || e).join(', ')}` : '',
    ].filter(Boolean).join('\n');

    if (kind === 'specialties') {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a performer set up their profile on Grab Talent, a UK platform where event organisers (weddings, corporate events, clubs, birthdays, festivals) browse and book live performers.\n\nPerformer details:\n${context}\n\nSuggest 6 short specialties (skills, styles or signature offerings) tailored to their category. Each 1-4 words, specific and bookable (e.g. "Wedding first-dance sets", "80s disco sets", "Crowd hyping"). Do not repeat any current specialties.`,
        response_json_schema: {
          type: 'object',
          properties: { specialties: { type: 'array', items: { type: 'string' } } },
          required: ['specialties'],
        },
      });
      return Response.json({ specialties: (res.specialties || []).slice(0, 6) });
    }

    const styleNote = body.current_bio
      ? `They already wrote a draft bio but want it punchier — improve on it while keeping any real facts:\n"""\n${body.current_bio}\n"""`
      : '';
    const bio = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert profile writer for Grab Talent, a UK platform where event organisers (weddings, corporate events, clubs, birthdays, festivals) browse and book live performers.\n\nPerformer details:\n${context}\n${styleNote}\n\nWrite a first-person bio that catches the eye of event organisers: confident, warm, charismatic and memorable — no clichés like "passionate about music". 60-90 words, plain text only (no emojis, no headings, no surrounding quotes). Mention their experience and city, and make the reader imagine their event with this performer. Do not invent specific venues, awards, celebrity names or statistics.`,
    });
    return Response.json({ bio: String(bio).trim() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}