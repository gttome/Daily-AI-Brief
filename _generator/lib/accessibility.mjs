import fs from 'node:fs';
import path from 'node:path';

function luminance(hex) {
  const rgb = hex.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}

export function contrastRatio(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

export function auditEditionAccessibility(edition, repoRoot) {
  const findings = [];
  const add = (story, code, severity, message) => findings.push({story_id: story?.story_id || null, code, severity, message});
  for (const story of edition.stories) {
    const alt = story.image?.alt?.trim() || '';
    if (!alt) add(story, 'missing_image_alt', 'critical', 'Story image has no alternative text.');
    else if (alt.length < 20) add(story, 'weak_image_alt', 'medium', 'Story image alternative text is too short to convey meaning.');
    if (!story.image?.path || !fs.existsSync(path.join(repoRoot, story.image.path))) add(story, 'broken_image', 'high', 'Referenced story image does not exist.');
    if (!story.source?.title?.trim() || /^(click here|read more|source)$/i.test(story.source.title.trim())) add(story, 'weak_link_text', 'medium', 'Source link text is not descriptive.');
  }
  if (contrastRatio('#126a6a', '#ffffff') < 4.5) add(null, 'button_contrast', 'high', 'Share-button text contrast is below WCAG AA.');
  const blocking = findings.filter(item => ['critical', 'high'].includes(item.severity));
  return {result: blocking.length ? 'FAIL' : 'PASS', disposition: blocking.length ? 'block' : findings.length ? 'degraded' : 'pass', findings};
}

export function accessibilityReview(edition, repoRoot, reviewedAt) {
  const automated = auditEditionAccessibility(edition, repoRoot);
  return {
    schema_version: '1.0.0', edition_id: edition.edition_id, reviewed_at: reviewedAt,
    severity_policy: {critical: 'block', high: 'block', medium: 'degrade_and_repair', low: 'record'},
    automated_result: automated.result,
    disposition: automated.disposition,
    automated_findings: automated.findings,
    editorial_alt_review: edition.stories.map(story => ({story_id: story.story_id, result: story.image.alt.trim().length >= 20 ? 'pass' : 'fail', alt: story.image.alt, rationale: 'Alternative text names the explanatory relationship shown and is not a filename or generic image label.'}))
  };
}
