const transientStatuses=new Set([408,425,429,500,502,503,504]);

export function classifySourceHttpState(results){
  const failed=(results||[]).filter(x=>!x?.ok);
  if(!failed.length){
    return {result:'pass',severity:'high',evidence:`${(results||[]).length} selected source URLs returned successful HTTP responses.`};
  }
  const transient=failed.filter(x=>x?.status===null||transientStatuses.has(Number(x?.status)));
  const hard=failed.filter(x=>!transient.includes(x));
  if(hard.length){
    return {
      result:'fail',
      severity:'high',
      evidence:JSON.stringify({hard_failures:hard,transient_failures:transient})
    };
  }
  return {
    result:'warn',
    severity:'medium',
    evidence:JSON.stringify({
      transient_source_probe_failures:transient,
      classification:'nonblocking_postpublication_reachability_warning',
      reason:'Canonical source records remain present; only transient HTTP/network responses were observed during post-deployment reachability recheck. Prepublication source verification remains a hard gate.'
    })
  };
}
