import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLearningJsonl,reconcileImprovementKanban} from '../lib/improvement-kanban.mjs';

test('improvement board reconciliation never drops unresolved learning and never silently moves lanes',()=>{
  const board={cards:[{id:'A',lane:'wip',sources:['DAB-OPS-20261003-001']}]};
  const events=parseLearningJsonl([
    JSON.stringify({problem_id:'DAB-OPS-20261003-001',recorded_at:'2026-10-03T10:00:00Z',status:'permanently_fixed',summary:'fixed'}),
    JSON.stringify({problem_id:'DAB-OPS-20261003-999',recorded_at:'2026-10-03T11:00:00Z',status:'open',summary:'still open'})
  ].join('\n'));
  const result=reconcileImprovementKanban(board,events);
  assert.equal(result.cards[0].lane,'wip');
  assert.equal(result.cards[0].reconciliation.resolved_by_learning_ledger,true);
  assert.equal(result.reconciliation.lane_moves_automatic,false);
  assert.deepEqual(result.reconciliation.unrepresented_unresolved_problems,[{problem_id:'DAB-OPS-20261003-999',status:'open',summary:'still open'}]);
});
