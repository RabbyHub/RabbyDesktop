import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

export function formatSeconds (seconds: number | void = undefined, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!seconds) return '';

  return dayjs(seconds * 1e3).local().format(format)
}
