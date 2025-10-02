const BANGKOK_TIME_ZONE = 'Asia/Bangkok';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BANGKOK_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const getDateParts = (date: Date) => {
  const parts = dateFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '0');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '0');
  return { year, month, day };
};

export const formatBangkokDate = (date: Date) => dateFormatter.format(date);

export const parseBangkokDate = (date: string) => new Date(`${date}T00:00:00+07:00`);

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

export const addMonths = (date: Date, months: number) => {
  const { year, month, day } = getDateParts(date);
  const newMonthIndex = month - 1 + months;
  const newYear = year + Math.floor(newMonthIndex / 12);
  const adjustedMonth = ((newMonthIndex % 12) + 12) % 12;
  const endOfMonthDay = daysInMonth(newYear, adjustedMonth + 1);
  const newDay = Math.min(day, endOfMonthDay);
  const formattedYear = newYear.toString().padStart(4, '0');
  const formattedMonth = (adjustedMonth + 1).toString().padStart(2, '0');
  const formattedDay = newDay.toString().padStart(2, '0');
  return parseBangkokDate(`${formattedYear}-${formattedMonth}-${formattedDay}`);
};

export const addDays = (date: Date, days: number) => {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

export const calculateEndDateFromTenure = (startDate: string, tenureMonths: number) => {
  const start = parseBangkokDate(startDate);
  const termEnd = addDays(addMonths(start, tenureMonths), -1);
  return formatBangkokDate(termEnd);
};

export const getBangkokToday = () => formatBangkokDate(new Date());
