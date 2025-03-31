const Handlebars = require('handlebars');
const persianDate = require('persian-date');

Handlebars.registerHelper('json', function (context) {
  return JSON.stringify(context);
});

Handlebars.registerHelper('sort', function (array, key) {
  if (!Array.isArray(array)) return [];
  return array.slice().sort((a, b) => {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
    return 0;
  });
});

// Register the convertToShamsi helper
Handlebars.registerHelper('convertToShamsi', function (gregorianDate) {
  if (!gregorianDate) return '---'; // Return a placeholder if the date is missing
  try {
    return new persianDate(new Date(gregorianDate)).format('YYYY-MM-DD');
  } catch (error) {
    console.error('Error converting date:', error);
    return 'Invalid Date'; // Return a fallback value on error
  }
});

// Define a custom Handlebars helper to filter appointments for today or future dates
Handlebars.registerHelper('filterTodayOrFuture', function (appointments) {
  const today = new Date().setHours(0, 0, 0, 0);
  return appointments.filter(appointment => {
    const visitDate = new Date(appointment.VisitDate).setHours(0, 0, 0, 0);
    return visitDate >= today;
  });
});

// Define a custom Handlebars helper to filter appointments for past dates
Handlebars.registerHelper('filterPast', function (appointments) {
  const today = new Date().setHours(0, 0, 0, 0);
  return appointments.filter(appointment => {
    const visitDate = new Date(appointment.VisitDate).setHours(0, 0, 0, 0);
    return visitDate < today;
  });
});

Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

module.exports = Handlebars;
