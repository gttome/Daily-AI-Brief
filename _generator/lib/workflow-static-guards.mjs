import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const WORKFLOW_STATIC_GUARD_VERSION='workflow-static-guard-v2';
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

function heredocOpener(line){
  const match=String(line||'').match(/^(\s*).*?<<(-)?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\3(?:\s*)$/);
  if(!match)return null;
  return {indent:match[1],stripTabs:Boolean(match[2]),delimiter:match[4],command:String(line).trim()};
}

function yamlRunBlockIndent(lines,index,fallback){
  for(let i=index-1;i>=0;i--){
    const match=lines[i].match(/^(\s*)run:\s*\|[-+0-9]*\s*$/);
    if(match)return match[1]+'  ';
  }
  return fallback;
}

function deindentBody(lines,indent){
  return lines.map(line=>line.startsWith(indent)?line.slice(indent.length):line).join('\n');
}

export function scanWorkflowText({workflowPath='workflow.yml',text=''}={}){
  const errors=[];
  const lines=String(text||'').split('\n');

  for(let i=0;i<lines.length;i++){
    const opener=heredocOpener(lines[i]);
    if(!opener)continue;

    let close=-1;
    for(let j=i+1;j<lines.length;j++){
      if(lines[j].trim()===opener.delimiter){close=j;break;}
    }
    if(close<0){
      errors.push({workflow:workflowPath,line:i+1,code:'WORKFLOW_HEREDOC_UNCLOSED',detail:opener.command});
      continue;
    }

    const blockIndent=yamlRunBlockIndent(lines,i,opener.indent);
    const closerIndent=lines[close].slice(0,lines[close].length-lines[close].trimStart().length);
    const closerOk=opener.stripTabs
      ? closerIndent.startsWith(blockIndent)&&/^\t*$/.test(closerIndent.slice(blockIndent.length))
      : closerIndent===blockIndent;
    if(!closerOk){
      errors.push({
        workflow:workflowPath,line:close+1,code:'WORKFLOW_HEREDOC_CLOSER_INDENT_MISMATCH',
        detail:`opener_line=${i+1}; expected_yaml_block_indent=${blockIndent.length}; actual_indent=${closerIndent.length}`
      });
    }

    if(/\bnode(?:\s|$)/.test(opener.command)&&/^(?:NODE|JS|JAVASCRIPT)$/.test(opener.delimiter)){
      const body=deindentBody(lines.slice(i+1,close),blockIndent);
      try{new vm.Script(body,{filename:`${workflowPath}:${i+2}`});}
      catch(error){
        errors.push({
          workflow:workflowPath,line:i+1,code:'NODE_HEREDOC_SYNTAX_INVALID',
          detail:String(error?.message||error).split('\n')[0]
        });
      }
    }
    i=close;
  }

  for(const logical of logicalShellLines(text)){
    if(/\bgh\s+workflow\s+run\b/.test(logical.text)&&
       !/\s(?:--repo|-R)(?:\s|=)/.test(logical.text)){
      errors.push({
        workflow:workflowPath,line:logical.line,code:'GH_WORKFLOW_RUN_REPOSITORY_REQUIRED',
        detail:logical.text
      });
    }
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
