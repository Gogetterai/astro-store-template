// node scripts/enrich-products.mjs
import fs from 'fs';
import path from 'path';

const SITE = path.resolve('data/site.json');
const site = JSON.parse(fs.readFileSync(SITE, 'utf8'));

async function enrich(prod) {
  const missing = [];
  if (!prod.blurb) missing.push('short blurb (max 24 words)');
  if (!prod.outcomes?.length) missing.push('3 outcomes (bullet list)');
  if (!prod.syllabus?.length) missing.push('4 syllabus bullets');
  if (!missing.length) return prod;

  const prompt = `You are a concise conversion copywriter.
Return JSON with keys present only if missing: blurb, outcomes[], syllabus[].
Product title: ${prod.title}
Audience: beginners and hustlers
Tone: practical, calm, zero hype.`;

  const apiKey = process.env.OPENAI_API_KEY;
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    })
  });
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content ?? '{}';
  const add = JSON.parse(text);

  return { ...prod, ...add };
}

const updated = [];
for (const p of site.products) updated.push(await enrich(p));
site.products = updated;

fs.writeFileSync(SITE, JSON.stringify(site, null, 2));
console.log('Enriched site.json ✔');
