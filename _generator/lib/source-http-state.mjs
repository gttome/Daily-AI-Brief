const transientStatuses=new Set([408,425,429,500,502,503,504]);
const accessControlledStatuses=new Set([401,403]);

export function classifySourceHttpState(results){
  const failed=(results||[]).filter(x=>!x?.ok);
  if(!failed.length){
    return {result:'pass',severity:'high',evidence:`${(results||[]).length} selected source URLs returned successful HTTP responses.`};
  }
  const transient=failed.filter(x=>x?.status===null||transientStatuses.has(Number(x?.status)));
  const accessControlled=failed.filter(x=>accessControlledStatuses.has(Number(x?.status)));
  const hard=failed.filter(x=>!transient.includes(x)&&!accessControlled.includes(x));
  if(hard.length){
    return {
      result:'fail',
      severity:'high',
      evidence:JSON.stringify({hard_failures:hard,transient_failures:transient,access_controlled_failures:accessControlled})
    };
  }
  return {
    result:'warn',
    severity:'medium',
    evidence:JSON.stringify({
      transient_source_probe_failures:transient,
      access_controlled_source_probe_failures:accessControlled,
      classification:accessControlled.length?'publisher_access_controlled':'nonblocking_postpublication_reachability_warning',
      reason:'Canonical source records remain present; only transient HTTP/network or publisher access-control responses were observed during post-deployment reachability recheck. Prepublication source verification remains a hard gate.'
    })
  };
}
