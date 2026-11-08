const fs = require('fs')
const path = require('path')
const html = fs.readFileSync(path.join(process.env.TEMP, 'ifts-site.html'), 'utf8')
const urls = new Set()

function clean(u) {
  return u
    .replace(/\\u003d/g, '=')
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\\"/g, '')
    .replace(/["'\\)>]+$/g, '')
}

for (const re of [
  /https?:\/\/lh\d\.googleusercontent\.com\/[^"'\\\s>]+/gi,
  /https?:\/\/[^"'\\\s>]*googleusercontent\.com\/[^"'\\\s>]+/gi,
  /https?:\/\/[^"'\\\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s>]*)?/gi,
]) {
  let m
  while ((m = re.exec(html))) urls.add(clean(m[0]))
}

const list = [...urls].filter((u) => /googleusercontent|ggpht|\.jpe?g|\.png|\.webp/i.test(u))
console.log('count', list.length)
list.slice(0, 50).forEach((u) => console.log(u))
fs.writeFileSync(path.join(process.env.TEMP, 'ifts-imgs.json'), JSON.stringify(list, null, 2))
