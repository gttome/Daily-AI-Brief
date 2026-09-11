---
layout: default
title: Your daily calendar reminder
permalink: /calendar/
---

# Read the brief on your schedule

Choose a time and how long to receive daily reminders, add one repeating event, and let your calendar remind you to open the latest brief. No email address or phone number is collected by this site.

<section class="subscription-card" aria-label="Set your reminder">
<h3>Daily calendar reminder</h3><p>Choose when to read. Your calendar reminds you every day and links to the latest brief.</p><div class="calendar-reminder"><label for="calendar-time">Reminder time (your local time)</label> <input id="calendar-time" type="time" value="09:00" required><div class="calendar-period"><label for="calendar-quantity">Remind me for</label> <input id="calendar-quantity" type="number" min="1" max="999" step="1" value="1" required aria-label="Reminder quantity"> <label class="sr-only" for="calendar-period">Period</label><select id="calendar-period" aria-label="Reminder period"><option value="days">days</option><option value="weeks">weeks</option><option value="months" selected>months</option><option value="years">years</option></select><p>1 week = 7 days · 1 month = 30 days · 1 year = 365 days. Reminders are daily for the selected duration, then stop.</p></div><p class="calendar-actions"><a class="calendar-google" hidden target="_blank" rel="noopener noreferrer">Add to Google Calendar</a> <a class="calendar-download" data-calendar="apple" hidden download="daily-ai-brief-reminder.ics">Apple Calendar</a> <a class="calendar-download" data-calendar="outlook" hidden download="daily-ai-brief-reminder.ics">Outlook</a></p><p class="calendar-status" role="status"></p><p><a href="{{ '/calendar/' | relative_url }}">Setup help for iPhone, Android and Windows</a></p><p class="calendar-note">Starts at the next occurrence of your chosen time. Save once, then check that the event repeats daily until the final date shown in the preview and its alert is set to “At time of event” (0 minutes before). This is a reading reminder, even if publication is late. Changing this picker does not update a reminder already saved; edit that series in your calendar.</p><noscript><p>To choose a time without JavaScript, follow the <a href="{{ '/calendar/' | relative_url }}">manual calendar setup steps</a>.</p></noscript></div>
</section>

## Choose your device

<details open markdown="1">
<summary>Android phone — Google Calendar</summary>

1. Choose your time, quantity and period above, then tap **Add to Google Calendar**. Sign in to your own Google account if asked.
2. Before saving, check the time and time zone, set **Repeats daily** and **Ends after** the calculated number of reminders (or on the final date shown), and set the notification to **0 minutes before**. Mark the event **Free** so it does not block appointments.
3. Save once. Make sure that calendar is visible and synced in your phone's Google Calendar app, and that Android allows notifications for Calendar.

If the button does not open a usable event editor, use the manual steps below. Downloaded calendar files are not supported by every Android app.
</details>

<details markdown="1">
<summary>Apple iPhone — Apple Calendar</summary>

1. Choose your time and tap **Apple Calendar** in Safari.
2. If an event preview opens, add the event to your calendar. If the file only downloads, or there is no Add option, use the manual steps below. You can also import the file using Calendar on a Mac that syncs with your iPhone.
3. Open the saved event and check **Repeat: Every Day**, **End Repeat** on the final date shown in the preview, its time, and **Alert: At time of event**. Check that iPhone settings allow Calendar notifications.

The downloaded reminder uses the local time in the calendar where you import it. Review the time before saving, especially if you use calendars in different time zones.
</details>

<details markdown="1">
<summary>Windows desktop — Outlook or Google Calendar</summary>

**Outlook:** Download the file above. In Outlook on the web, choose **Calendar → Add calendar → Upload from file**, select the file and your calendar, then import. In classic Outlook, opening the file may offer an import option. Check that the saved event repeats daily, ends after the calculated number of occurrences, shows your chosen local time, and has a reminder of **0 minutes**.

**Google Calendar:** Use **Add to Google Calendar**, review the daily repeat, final date / occurrence count and notification settings, then save. Allow calendar notifications in your browser and Windows. Google Calendar must remain open in the browser for its desktop notifications.

Your calendar account can sync the reminder to your phone as well. Enable alerts only on the devices where you want them.
</details>

## Manual setup — works without a download

In your calendar, create an event called **Read the Daily AI Brief**. Choose your preferred start time (9:00 AM is the default suggestion), a five-minute duration, **Repeat every day**, and an alert **at the event time**. Set the repeat to end after the calculated number of daily occurrences, or on the preview’s final date. Weeks mean 7 days, months 30 days, and years 365 days. Mark it **Free**. Put this link in its description or URL field:

[Open the Daily AI Brief](https://gttome.github.io/Daily-AI-Brief/)

Save the event. If the chosen time has passed today, start tomorrow.

## What to expect

This creates your own editable repeating reminder, rather than a shared calendar with a fixed time. It does not check whether a new edition has published. The link always opens the latest available brief. Calendar settings, device notification permissions and Focus / Do Not Disturb settings control whether an alert appears.

To change the time, edit the saved event and apply the change to the series or all future events. To stop, delete the series. Add it only once to avoid duplicates. Changing the time on this page does not change an existing calendar event.

## Prefer a shared calendar subscription?

The optional shared calendar below uses **9:00 AM local calendar time**. It continues indefinitely until removed, is read-only, and cannot offer a separate time or duration for each subscriber. Use the personal reminder above if you want to choose or edit the time. Some apps suppress alerts for subscribed calendars.

[Subscribe with Apple Calendar](webcal://gttome.github.io/Daily-AI-Brief/calendar.ics)

For Outlook on the web use **Add calendar → Subscribe from web**. For Google Calendar, use **Other calendars → + → From URL** on a computer. Paste this address:

<input class="rss-address" aria-label="Shared calendar address" readonly value="https://gttome.github.io/Daily-AI-Brief/calendar.ics">

Subscribed calendars refresh on the app's schedule. Remove the subscription in your calendar to stop it. Choose either the shared subscription or the personal reminder to avoid duplicate events.

[Google recurring-event help](https://support.google.com/calendar/answer/37115) · [Google notification help](https://support.google.com/calendar/answer/37242) · [Outlook import and subscription help](https://support.microsoft.com/en-us/outlook/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web)
