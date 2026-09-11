const homepage = 'https://gttome.github.io/Daily-AI-Brief/?dab_source=calendar_personal';
const pad = n => String(n).padStart(2, '0');
const localStamp = d => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
export function reminderDuration(quantity=1,period='months') {
 const factors={days:1,weeks:7,months:30,years:365};
 if(!Number.isInteger(quantity)||quantity<1||quantity>999||!Object.hasOwn(factors,period))throw new Error('Choose a whole number from 1 to 999 and a period.');
 return quantity*factors[period];
}
export function reminder(time = '09:00', now = new Date(), quantity=1, period='months') {
  const days=reminderDuration(quantity,period);
  const recurrence=`RRULE:FREQ=DAILY;COUNT=${days}`;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Choose a valid reminder time.');
  const [hour, minute] = time.split(':').map(Number);
  const start = new Date(now); start.setHours(hour, minute, 0, 0);
  if (start <= now) start.setDate(start.getDate()+1);
  const last = new Date(start);last.setDate(last.getDate()+days-1);
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const description = `Daily reminders for ${days} days, then stop. Open the latest available brief: ${homepage} This reminder also appears if publication is delayed. Edit or delete the series in your calendar to change or stop it.`;
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Daily AI Brief//Reading reminder//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:daily-reading-${time.replace(':','')}-${days}@gttome.github.io`,`DTSTAMP:${stamp}`,`DTSTART:${localStamp(start)}`,'DURATION:PT5M',recurrence,'SUMMARY:Read the Daily AI Brief',`DESCRIPTION:${description.replaceAll(',', '\\,')}`,`URL:${homepage}`,'TRANSP:TRANSPARENT','STATUS:CONFIRMED','BEGIN:VALARM','TRIGGER:PT0S','ACTION:DISPLAY','DESCRIPTION:Read the Daily AI Brief','END:VALARM','END:VEVENT','END:VCALENDAR'];
  // All text is ASCII; fold content lines to the iCalendar 75-octet limit.
  const ics = lines.map(line => line.match(/.{1,74}/g).join('\r\n ')).join('\r\n')+'\r\n';
  const end = new Date(start.getTime()+5*60000);
  const params = new URLSearchParams({action:'TEMPLATE',text:'Read the Daily AI Brief',dates:`${localStamp(start)}/${localStamp(end)}`,recur:recurrence,details:description});
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (zone) params.set('ctz',zone);
  return {ics, google:`https://calendar.google.com/calendar/render?${params}`,start,last,days};
}
if (typeof document !== 'undefined') {
  document.querySelectorAll('.calendar-reminder').forEach(root => {
    const input=root.querySelector('input[type=time]'), google=root.querySelector('.calendar-google'), downloads=[...root.querySelectorAll('.calendar-download')], status=root.querySelector('.calendar-status');
    let objectURL;
    function update(){
      if(objectURL) URL.revokeObjectURL(objectURL);
      try {
        const data=reminder(input.value,new Date(),Number(root.querySelector('#calendar-quantity').value),root.querySelector('#calendar-period').value);
        objectURL=URL.createObjectURL(new Blob([data.ics],{type:'text/calendar;charset=utf-8'}));
        downloads.forEach(download=>{download.href=objectURL;download.hidden=false;}); google.href=data.google; google.hidden=false;
        status.textContent=`Remind me daily at ${data.start.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})} for ${data.days} ${data.days===1?'day':'days'}, then stop. First: ${data.start.toLocaleDateString(undefined,{dateStyle:'medium'})}. Final: ${data.last.toLocaleDateString(undefined,{dateStyle:'medium'})}. Review and save in your calendar to finish.`;
      } catch {downloads.forEach(download=>download.hidden=true);google.hidden=true;window.dabTrack?.('calendar_generation_error',{result:'invalid'});status.textContent='Choose a valid time, a whole number from 1 to 999, and a period to continue.';}
    }
    input.addEventListener('input',update);root.querySelector('#calendar-quantity').addEventListener('input',update);root.querySelector('#calendar-period').addEventListener('change',update); update();
  });
}
