import fs from 'node:fs';
import path from 'node:path';

export const WORKFLOW_STATIC_GUARD_VERSION='workflow-static-guard-v1';
export const ACTIVE_PRODUCTION_WORKFLOWS=Object.freeze([
  '.github/workflows/ci.yml',
  '.github/workflows/daily-delta-validation.yml',
  '.github/workflows/continuous-qualification.yml',
  '.github/workflows/post-editorial-kernel.yml',
  '.github/workflows/protected-repair-executor.yml',
  '.github/workflows/publish-candidate.yml',
  '.github/workflows/qualification-semantic-gate.yml',
  '.github/workflows/repository-task-consumer.yml',
  '.github/workflows/run-supervisor.yml',
  '.github/workflows/run-supervisor-watchdog.yml',
  '.github/workflows/startup-sentinel.yml'
]);

function logicalShellLines(text){
  const lines=String(text||'').split('\n');
  const logical=[];
  for(let i=0;i<lines.length;i++){
    let command=lines[i].trim(),start=i+1;
    while(command.endsWith('\\')&&i+1<lines.length){
      command=command.slice(0,-1).trimEnd()+' '+lines[++i].trim();
    }
    logical.push({line:start,text:command});
  }
  return logical;
}

export function scanWorkflowText({workflowPath='workflow.yml',text=''}={}){
  const errors=[];
  const lines=String(text||'').split('\n');
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(/<<-?\s*['"]?[A-Za-z_][A-Za-z0-9_]*['"]?/.test(line))
      errors.push({workflow:workflowPath,line:i+1,code:'WORKFLOW_HEREDOC_PROHIBITED',detail:line.trim()});
  }
  for(const logical of logicalShellLines(text)){
    if(/\bgh\s+workflow\s+run\b/.test(logical.text)&&!/\s--repo(?:\s|=)/.test(logical.text))
      errors.push({workflow:workflowPath,line:logical.line,code:'GH_WORKFLOW_RUN_REPOSITORY_REQUIRED',detail:logical.text});
  }
  return errors;
}

export function validateActiveProductionWorkflows(root='.'){
  const repoRoot=path.resolve(root),errors=[],checked=[];
  for(const relative of ACTIVE_PRODUCTION_WORKFLOWS){
    const file=path.join(repoRoot,relative);
    if(!fs.existsSync(file)){
      errors.push({workflow:relative,line:null,code:'ACTIVE_WORKFLOW_MISSING',detail:null});
      continue;
    }
    const text=fs.readFileSync(file,'utf8');
    checked.push(relative);
    errors.push(...scanWorkflowText({workflowPath:relative,text}));
  }
  return {
    schema_version:WORKFLOW_STATIC_GUARD_VERSION,
    result:errors.length?'FAIL':'PASS',
    checked_workflows:checked,
    errors
  };
}
