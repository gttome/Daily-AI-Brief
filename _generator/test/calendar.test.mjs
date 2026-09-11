import test from 'node:test';
import assert from 'node:assert/strict';
import {reminder} from '../../assets/js/calendar-reminder.js';
test('chosen local time recurs daily with an at-time alert and no busy block',()=>{
 const r=reminder('16:45',new Date(2026,8,11,8));
 assert.equal(r.start.getHours(),16);assert.equal(r.start.getMinutes(),45);
 const ics=r.ics.replace(/\r\n /g,'');
 for(const value of ['DTSTART:20260911T164500','RRULE:FREQ=DAILY','TRIGGER:PT0S','TRANSP:TRANSPARENT','URL:https://gttome.github.io/Daily-AI-Brief/'])assert.ok(ics.includes(value));
 assert.ok(r.ics.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
 const url=new URL(r.google);assert.equal(url.searchParams.get('recur'),'RRULE:FREQ=DAILY');assert.equal(url.searchParams.get('dates'),'20260911T164500/20260911T165000');
});
test('past time moves to next day and midnight duration rolls dates correctly',()=>{
 assert.equal(reminder('09:00',new Date(2026,11,31,10)).start.getFullYear(),2027);
 assert.equal(new URL(reminder('23:59',new Date(2026,11,31,10)).google).searchParams.get('dates'),'20261231T235900/20270101T000400');
 assert.throws(()=>reminder('24:00'));assert.throws(()=>reminder(''));assert.throws(()=>reminder('09:60'));
});
