// add to calendar
function generateGoogleCalendarLink(event) {
    let startTime = formatTime(event.starts_on);
    let endTime = calculateEndTime(event);

    let href = encodeURI([
        'https://www.google.com/calendar/render',
        '?action=TEMPLATE',
        '&text=' + (event.subject || ''),
        '&dates=' + (startTime || ''),
        '/' + (endTime || ''),
        '&details=' + (event.description || ''),
        '&location=' + (event.event_location || ''),
        '&sprop=&sprop=name:'
    ].join(''));
    return href;
    
}

function formatTime(date) {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
};

function calculateEndTime(event) {
    var MS_IN_MINUTES = 60 * 1000;

    return event.ends_on ?
      formatTime(event.ends_on) :
      formatTime(new Date(event.starts_on.getTime() + (event.duration * MS_IN_MINUTES)));
};

// download .ics
function createICSLink(event) {
    let startTime = formatTime(event.starts_on);
    let endTime = calculateEndTime(event);
    return makeIcsFile(startTime, endTime, event.subject, event.description);
};

function makeIcsFile(start, end, title, description) {
  let test =
    "BEGIN:VCALENDAR\n" +
    "CALSCALE:GREGORIAN\n" +
    "METHOD:PUBLISH\n" +
    "PRODID:-//Test Cal//EN\n" +
    "VERSION:2.0\n" +
    "BEGIN:VEVENT\n" +
    "UID:test-1\n" +
    "DTSTART;VALUE=DATE:" +
    start +
    "\n" +
    "DTEND;VALUE=DATE:" +
    end +
    "\n" +
    "SUMMARY:" +
    title +
    "\n" +
    "DESCRIPTION:" +
    description +
    "\n" +
    "END:VEVENT\n" +
    "END:VCALENDAR";
  
  
  let data = new File([test], { type: "text/plain" });

  return window.URL.createObjectURL(data);
}

function test() {
    console.log('Outside the template')
}