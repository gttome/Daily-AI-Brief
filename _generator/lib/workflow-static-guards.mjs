import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

// Deliberately dependency-free: realize the literal run scalars used by this
// repository. Unsupported scalar forms fail closed instead of escaping checks.
export function workflowRunBlocks(yaml,key='run') {
  const lines=yaml.split(/\r?\n/), blocks=[];
  for(let i=0;i<lines.length;i++) {
    const m=new RegExp('^(\\s*)(?:-\\s+)?'+key+':\\s*(.*)$').exec(lines[i]);
    if(!m)continue;
    const indent=m[1].length+(lines[i].trimStart().startsWith('- ')?2:0);
    if(/^[|>]/.test(m[2])) {
      if(!/^\|[-+]?\s*(?:#.*)?$/.test(m[2]))throw Error(`unsupported_run_scalar:${i+1}`);
      const body=[];let j=i+1;
      while(j<lines.length&&(!lines[j].trim()||/^ */.exec(lines[j])[0].length>indent))body.push(lines[j++]);
      const base=body.find(l=>l.trim())?.match(/^ */)[0].length;
      if(base===undefined)throw Error(`empty_run_scalar:${i+1}`);
      if(body.some(l=>l.trim()&&l.match(/^ */)[0].length<base))throw Error(`invalid_run_indent:${i+1}`);
      blocks.push({line:i+1,script:body.map(l=>l.slice(base)).join('\n')});i=j-1;
    } else {
      if(!m[2]||/^["']/.test(m[2]))throw Error(`unsupported_run_scalar:${i+1}`);
      blocks.push({line:i+1,script:m[2]});
    }
  }
  return blocks;
}

const repoValue=String.raw`(?:"\$(?:GITHUB_REPOSITORY|\{GITHUB_REPOSITORY\})"|'gttome/Daily-AI-Brief'|"gttome/Daily-AI-Brief"|gttome/Daily-AI-Brief|\$\{\{\s*github\.repository\s*\}\})`;
const explicitRepo=new RegExp(String.raw`(?:--repo(?:=|\s+)|-R\s*)${repoValue}(?=\s|$|[;&|])`);

export function checkShell(script) {
  const errors=[],lines=script.split('\n');
  // bash -n parses only. No commands, substitutions, or JavaScript execute.
  const syntax=spawnSync('bash',['-n'],{input:script.replace(/\$\{\{[\s\S]*?\}\}/g,'EXPRESSION'),encoding:'utf8'});
  if(syntax.error||syntax.status!==0||/here-document.*delimited by end-of-file/.test(syntax.stderr||''))errors.push('bash_syntax:'+String(syntax.error||syntax.stderr).trim());
  const shellLines=[];
  for(let i=0;i<lines.length;i++) {
    const line=lines[i];shellLines.push(line);
    if(/^\s*#/.test(line))continue;
    const open=/(?<!<)<<(-?)(?!<)\s*(?:'([A-Za-z_][\w]*)'|"([A-Za-z_][\w]*)"|([A-Za-z_][\w]*))/.exec(line);
    if(!open)continue;
    const label=open[2]||open[3]||open[4],body=[];let closed=false;
    for(i++;i<lines.length;i++) {
      const candidate=open[1]?lines[i].replace(/^\t+/,''):lines[i];
      if(candidate===label){closed=true;break;}
      if(candidate.trim()===label)errors.push('indented_heredoc:'+label);
      body.push(open[1]?lines[i].replace(/^\t+/,''):lines[i]);
    }
    if(!closed){errors.push('missing_heredoc:'+label);break;}
    if(/\bnode\b/.test(line.slice(0,open.index))) {
      const source=body.join('\n').replace(/\$\{\{[\s\S]*?\}\}/g,'EXPRESSION');
      try {
        if(/--input-type(?:=|\s+)module/.test(line)) {
          const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:source,encoding:'utf8'});
          if(result.error||result.status!==0)throw Error(String(result.error||result.stderr));
        } else new vm.Script(source);
      } catch(error){errors.push('node_syntax:'+error.message);}
    }
  }
  const commands=shellLines.join('\n').replace(/\\\n\s*/g,' ').split('\n');
  for(const command of commands) {
    if(/^\s*#/.test(command))continue;
    // Split shell control operators, so a flag on a later command cannot
    // accidentally authorize an earlier implicit dispatch.
    for(const part of command.split(/\s*(?:&&|\|\||;)\s*/)) {
      if(/\bgh\s+(?:--repo\s+\S+\s+|-R\s+\S+\s+)?workflow\s+run\b/.test(part)&&!explicitRepo.test(part))errors.push('implicit_workflow_dispatch:'+part.trim());
      if(/\b(?:gh\s+api|curl)\b/.test(part)&&/\/dispatches\b/.test(part)&&!/(?:repos\/\$\{GITHUB_REPOSITORY\}|repos\/\$GITHUB_REPOSITORY|repos\/gttome\/Daily-AI-Brief)\//.test(part))errors.push('implicit_repository_dispatch:'+part.trim());
      if(/\b(?:createDispatchEvent|createWorkflowDispatch)\b/.test(part))errors.push('unreviewed_programmatic_dispatch:'+part.trim());
    }
  }
  return errors;
}

export function checkWorkflow(yaml) {
  const errors=[];
  try {for(const block of workflowRunBlocks(yaml))errors.push(...checkShell(block.script).map(e=>`line_${block.line}:${e}`));}
  catch(error){errors.push(error.message);}
  try {
    for(const block of workflowRunBlocks(yaml,'script')) {
      try {new vm.Script('(async function(){\n'+block.script.replace(/\$\{\{[\s\S]*?\}\}/g,'EXPRESSION')+'\n})');}
      catch(error){errors.push('action_script_syntax:'+error.message);}
      const calls=block.script.match(/[^\n]*(?:createDispatchEvent|createWorkflowDispatch)[^\n]*/g)||[];
      for(const call of calls) {
        // Accept context.repo directly or the corpus's immutable local alias.
        // Reject owner/repo overrides and additional spreads in the argument.
        const alias=/\bconst\s+repo\s*=\s*(?:context\.repo|\{\s*\.\.\.context\.repo\s*\})\s*;/.test(block.script)&&!/(?:repo\.(?:owner|repo)\s*=|repo\s*\[|Object\.assign\(repo)/.test(block.script);
        const args=/\b(?:createDispatchEvent|createWorkflowDispatch)\(\{\s*\.\.\.(context\.repo|repo)\s*,(.*)\}\)/.exec(call);
        if(!args||(args[1]==='repo'&&!alias)||/(?:\b(?:owner|repo)\s*:|\.\.\.)/.test(args?.[2]||''))errors.push('implicit_programmatic_dispatch:'+call.trim());
      }
      for(const line of block.script.split('\n'))if(/\/dispatches/.test(line))errors.push('unreviewed_raw_programmatic_dispatch:'+line.trim());
    }
  } catch(error){errors.push(error.message);}
  // Third-party dispatch actions must receive a separate reviewed guard before
  // introduction. Event listeners named repository_dispatch are not launches.
  if(/uses:.*(?:repository-dispatch|workflow-dispatch)/i.test(yaml))errors.push('unreviewed_dispatch_action');
  return errors;
}

export function scanWorkflows(root) {
  const dir=path.join(root,'.github/workflows');
  return fs.readdirSync(dir).filter(name=>/\.ya?ml$/.test(name)).sort().map(name=>({path:'.github/workflows/'+name,errors:checkWorkflow(fs.readFileSync(path.join(dir,name),'utf8'))}));
}
