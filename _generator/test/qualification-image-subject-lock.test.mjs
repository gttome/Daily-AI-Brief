import test from 'node:test';
import assert from 'node:assert/strict';
import {buildQualificationImageSubjectLock,validateQualificationImageSubjectLock} from '../lib/qualification-image-artifact.mjs';

test('subject lock binds one target story',()=>{
  const packet={
    story_id:'story-m02',
    candidate_id:'m02',
    headline:'GitHub Security Lab Taskflow Agent fuzzing workflow',
    source_url:'https://github.blog/security/application-security/ai-powered-fuzzing-with-the-github-security-lab-taskflow-agent/',
    packet_sha256:'d'.repeat(64)
  };
  const lock=buildQualificationImageSubjectLock(packet);
  assert.deepEqual(validateQualificationImageSubjectLock(lock,{
    storyId:packet.story_id,candidateId:packet.candidate_id,headline:packet.headline,sourceUrl:packet.source_url,packetSha256:packet.packet_sha256
  }),[]);
  assert.equal(lock.alternate_subjects_allowed,false);
  assert.ok(lock.generation_instruction.includes('TARGET CANDIDATE: m02'));
  assert.ok(lock.generation_instruction.includes('ONLY SUBJECT: GitHub Security Lab Taskflow Agent fuzzing workflow'));
});

test('subject lock rejects mismatched binding',()=>{
  const packet={
    story_id:'story-m02',candidate_id:'m02',
    headline:'GitHub Security Lab Taskflow Agent fuzzing workflow',
    source_url:'https://github.blog/security/application-security/ai-powered-fuzzing-with-the-github-security-lab-taskflow-agent/',
    packet_sha256:'e'.repeat(64)
  };
  const lock=buildQualificationImageSubjectLock(packet);
  lock.target_headline='mismatch';
  lock.alternate_subjects_allowed=true;
  const errors=validateQualificationImageSubjectLock(lock,{
    storyId:packet.story_id,candidateId:packet.candidate_id,headline:packet.headline,sourceUrl:packet.source_url,packetSha256:packet.packet_sha256
  });
  assert.ok(errors.includes('subject_lock_headline_mismatch'));
  assert.ok(errors.includes('alternate_subjects_must_be_false'));
});
