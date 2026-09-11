const homepage = 'https://gttome.github.io/Daily-AI-Brief/';
const pad = n => String(n).padStart(2, '0');
const localStamp = d => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
export function reminder(time = '09:00', now = new Date()) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Choose a valid reminder time.');
  const [hour, minute] = time.split(':').map(Number);
  const start = new Date(now); start.setHours(hour, minute, 0, 0);
  if (start <= now) start.setDate(start.getDate()+1);
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const description = `A daily reading reminder. Open the latest available brief: ${homepage} This reminder also appears if publication is delayed. Edit or delete the series in your calendar to change or stop it.`;
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Daily AI Brief//Reading reminder//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:daily-reading-${time.replace(':','')}@gttome.github.io`,`DTSTAMP:${stamp}`,`DTSTART:${localStamp(start)}`,'DURATION:PT5M','RRULE:FREQ=DAILY','SUMMARY:Read the Daily AI Brief',`DESCRIPTION:${description}`,`URL:${homepage}`,'TRANSP:TRANSPARENT','STATUS:CONFIRMED','BEGIN:VALARM','TRIGGER:PT0S','ACTION:DISPLAY','DESCRIPTION:Read the Daily AI Brief','END:VALARM','END:VEVENT','END:VCALENDAR'];
  // All text is ASCII; fold content lines to the iCalendar 75-octet limit.
  const ics = lines.map(line => line.match(/.{1,74}/g).join('\r\n ')).join('\r\n')+'\r\n';
  const end = new Date(start.getTime()+5*60000);
  const params = new URLSearchParams({action:'TEMPLATE',text:'Read the Daily AI Brief',dates:`${localStamp(start)}/${localStamp(end)}`,recur:'RRULE:FREQ=DAILY',details:description});
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (zone) params.set('ctz',zone);
  return {ics, google:`https://calendar.google.com/calendar/render?${params}`,start};
}
if (typeof document !== 'undefined') {
  document.querySelectorAll('.calendar-reminder').forEach(root => {
    const input=root.querySelector('input[type=time]'), google=root.querySelector('.calendar-google'), download=root.querySelector('.calendar-download'), status=root.querySelector('.calendar-status');
    let objectURL;
    function update(){
      if(objectURL) URL.revokeObjectURL(objectURL);
      try {
        const data=reminder(input.value);
        objectURL=URL.createObjectURL(new Blob([data.ics],{type:'text/calendar;charset=utf-8'}));
        download.href=objectURL; google.href=data.google; download.hidden=false; google.hidden=false;
        status.textContent=`First reminder: ${data.start.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}. Review and save in your calendar to finish.`;
      } catch {download.hidden=true;google.hidden=true;status.textContent='Choose a valid reminder time to continue.';}
    }
    input.addEventListener('input',update); update();
  });
}
