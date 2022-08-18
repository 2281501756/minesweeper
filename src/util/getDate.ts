export const getDate = (time: any) => {
  let t = new Date(time)
  let year: number | string = t.getFullYear()
  let month: number | string = t.getMonth() + 1
  let day: number | string = t.getDate()
  if (month < 10) month = '0' + month
  if (day < 10) day = '0' + day
  return `${year}/${month}/${day}`
}

export const YYYYMMDDHMS = (time: any) => {
  let t = new Date(time)
  let hours: number | string = t.getHours()
  let minutes: number | string = t.getMinutes()
  let seconds: number | string = t.getSeconds()
  if (hours < 10) hours = '0' + hours
  if (minutes < 10) minutes = '0' + minutes
  if (seconds < 10) seconds = '0' + seconds
  return `${hours}:${minutes}:${seconds}`
}
