function capitalizeFirstLetter(str) {
  if (!str) return ""; // Handle empty strings safely
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toEthiopianDate(gregDate = new Date()) {
  const gYear = gregDate.getFullYear()
  const gMonth = gregDate.getMonth() + 1
  const gDay = gregDate.getDate()

  // Ethiopian New Year falls on Sept 11 (or Sept 12 in leap years)
  const isLeapYear = (gYear % 4 === 0 && gYear % 100 !== 0) || gYear % 400 === 0
  const newYearDay = isLeapYear ? 12 : 11

  let ethYear = gYear - 8
  let ethMonth, ethDay

  // Days passed since Ethiopian New Year
  const newYear = new Date(gYear, 8, newYearDay) // September = 8
  const diff = Math.floor((gregDate - newYear) / (1000 * 60 * 60 * 24))

  if (diff >= 0) {
    ethYear = gYear - 7
    ethMonth = Math.floor(diff / 30) + 1
    ethDay = (diff % 30) + 1
  } else {
    const prevNewYear = new Date(gYear - 1, 8, isLeapYear ? 11 : 12)
    const diffPrev = Math.floor((gregDate - prevNewYear) / (1000 * 60 * 60 * 24))
    ethMonth = Math.floor(diffPrev / 30) + 1
    ethDay = (diffPrev % 30) + 1
  }

  return { year: ethYear, month: ethMonth, day: ethDay }
}

export {
    capitalizeFirstLetter,
    toEthiopianDate
}