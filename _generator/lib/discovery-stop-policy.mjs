export function discoveryStopDecision({qualification=false,scanned,minSources,freshMetadata,freshMetadataTarget,focusCoverage,normalChars,normalBudget,absoluteBudget,requiredTopicReady=true,productionFocusMinimum=3,qualificationFocusMinimum=5}){
  const focusMinimum=qualification?qualificationFocusMinimum:productionFocusMinimum;
  const coverageReady=Object.values(focusCoverage||{}).every(n=>Number(n)>=focusMinimum);
  const mandatoryReady=coverageReady&&requiredTopicReady===true;
  if(scanned>=minSources&&freshMetadata>=freshMetadataTarget&&mandatoryReady)return {stop:true,reason:'fresh_metadata_and_focus_sufficiency',focus_minimum:focusMinimum};
  if(qualification){
    if(normalChars>=absoluteBudget)return {stop:true,reason:'qualification_absolute_acquisition_budget',focus_minimum:focusMinimum};
    return {stop:false,reason:null,focus_minimum:focusMinimum};
  }
  if(normalChars>=absoluteBudget)return {stop:true,reason:'production_absolute_acquisition_budget',focus_minimum:focusMinimum};
  if(normalChars>=normalBudget&&mandatoryReady)return {stop:true,reason:'normal_acquisition_budget',focus_minimum:focusMinimum};
  return {stop:false,reason:null,focus_minimum:focusMinimum};
}
